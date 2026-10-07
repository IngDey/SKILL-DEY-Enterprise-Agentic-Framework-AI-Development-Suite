// SKILL_DEY — procesos: liberar puertos ocupados, detener servidores colgados y arrancar back+front limpios.
// Seguridad: solo toca procesos de desarrollo (node, php, python, java, dotnet, ruby, bun, deno, go…), nunca procesos del sistema.
import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import { routerPhp } from "./app.ts"

const WIN = process.platform === "win32"
const DEV = /\b(node|nodemon|tsx|ts-node|vite|next|nuxt|npm|npx|pnpm|yarn|bun|deno|php|php-cgi|artisan|python\d*|uvicorn|gunicorn|flask|java|dotnet|ruby|rails|go|air|webpack|esbuild)\b/i
const SISTEMA = /\b(systemd|launchd|explorer|svchost|wininit|lsass|csrss|winlogon|services\.exe|kernel|WindowServer|loginwindow|sshd|postgres|mysqld|mariadbd|redis-server|mongod|docker|com\.docker|opencode)\b/i

type Proc = { pid: number; puerto?: number; cmd: string }
function sh(c: string, t = 8_000) { const r = spawnSync(c, { shell: true, encoding: "utf8", timeout: t }); return r.status === 0 ? r.stdout : "" }

/** Procesos escuchando en puertos TCP (con su comando). */
export function escuchando(): Proc[] {
  const out: Proc[] = []
  if (WIN) {
    const tareas = new Map<number, string>()
    for (const l of sh("tasklist /fo csv /nh").split(/\r?\n/)) { const m = l.match(/^"([^"]+)","(\d+)"/); if (m) tareas.set(Number(m[2]), m[1]) }
    for (const l of sh("netstat -ano -p tcp").split(/\r?\n/)) { const m = l.match(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i); if (m) out.push({ puerto: Number(m[1]), pid: Number(m[2]), cmd: tareas.get(Number(m[2])) ?? "" }) }
  } else {
    for (const l of sh("lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null").split("\n").slice(1)) {
      const c = l.trim().split(/\s+/); const pid = Number(c[1]); const port = Number(l.match(/:(\d+) \(LISTEN\)/)?.[1]); if (!pid || !port) continue
      out.push({ pid, puerto: port, cmd: c[0] })
    }
    if (!out.length) for (const l of sh("ss -ltnp 2>/dev/null").split("\n")) { const m = l.match(/:(\d+)\s.*pid=(\d+)/); if (m) out.push({ puerto: Number(m[1]), pid: Number(m[2]), cmd: "" }) }
    // comando completo de TODOS los procesos en UNA sola llamada a ps (antes era una por proceso: lento)
    const pids = [...new Set(out.map((p) => p.pid))]
    if (pids.length) for (const l of sh(`ps -o pid=,command= -p ${pids.join(",")}`).split("\n")) { const m = l.trim().match(/^(\d+)\s+(.*)$/); if (m) for (const p of out) if (p.pid === Number(m[1])) p.cmd = m[2] }
  }
  const vistos = new Set<string>(); return out.filter((p) => { const k = p.pid + ":" + p.puerto; if (vistos.has(k)) return false; vistos.add(k); return true })
}
export const esDeDesarrollo = (p: Proc) => p.pid > 1 && p.pid !== process.pid && p.pid !== process.ppid && DEV.test(p.cmd) && !SISTEMA.test(p.cmd)

export function matarArbol(pid: number) {
  try {
    if (WIN) { spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { timeout: 8_000 }); return }
    try { process.kill(-pid, "SIGKILL") } catch {} // mata todo el grupo de una vez (sin esperar); detached lo hace grupo
    try { process.kill(pid, "SIGKILL") } catch {}
  } catch {}
}

/** Libera un puerto si lo ocupa un proceso de desarrollo. Nunca mata procesos del sistema ni bases de datos. */
export function liberarPuerto(puerto: number): string {
  const ps = escuchando().filter((p) => p.puerto === puerto)
  if (!ps.length) return `puerto ${puerto} libre`
  const r: string[] = []
  for (const p of ps) {
    if (esDeDesarrollo(p)) { matarArbol(p.pid); r.push(`detenido PID ${p.pid} (${p.cmd.slice(0, 60)}) que ocupaba ${puerto}`) }
    else r.push(`⚠ ${puerto} lo usa "${p.cmd.slice(0, 50)}" (no es de desarrollo o es del sistema/BD): no lo toco, avisa al usuario`)
  }
  // Segundo intento: si tras matar el puerto sigue ocupado por un proceso de desarrollo (quedó un hijo), fuerza por fuser/lsof
  const quedan = escuchando().filter((p) => p.puerto === puerto && esDeDesarrollo(p))
  if (quedan.length) { for (const p of quedan) matarArbol(p.pid)
    if (WIN) { for (const l of sh(`netstat -ano -p tcp | findstr :${puerto}`, 5_000).split(/\r?\n/)) { const m = l.match(/LISTENING\s+(\d+)/i); if (m) spawnSync("taskkill", ["/pid", m[1], "/T", "/F"], { timeout: 8_000 }) } }
    else sh(`fuser -k ${puerto}/tcp 2>/dev/null; lsof -ti tcp:${puerto} 2>/dev/null | xargs -r kill -9 2>/dev/null`, 5_000) }
  return r.join("\n")
}

// ---------- servicios del proyecto (backend / frontend) ----------
export type Servicio = { nombre: string; dir: string; tipo: "backend" | "frontend" | "app"; cmd: string; puerto: number }
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
function puertoEnv(dir: string): number | undefined {
  const env = leer(join(dir, ".env")) + "\n" + leer(join(dir, ".env.example"))
  const m = env.match(/^\s*(?:APP_)?PORT\s*=\s*(\d{2,5})/m) ?? env.match(/^\s*(?:SERVER|API|BACKEND)_PORT\s*=\s*(\d{2,5})/m); return m ? Number(m[1]) : undefined
}
function detectar(dir: string, nombre: string): Servicio | null {
  const pkg = (() => { try { return JSON.parse(leer(join(dir, "package.json"))) } catch { return null } })()
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }
  const front = !!(deps.vite || deps.react || deps.vue || deps.next || deps.nuxt || deps["@angular/core"] || deps.svelte) && !deps.express && !deps.fastify && !deps["@nestjs/core"]
  const tipo: Servicio["tipo"] = /front|client|web|ui/i.test(nombre) || front ? "frontend" : /back|server|api/i.test(nombre) || deps.express || deps.fastify || deps["@nestjs/core"] ? "backend" : "app"
  if (pkg?.scripts?.dev || pkg?.scripts?.start) {
    const puerto = puertoEnv(dir) ?? (deps.vite ? 5173 : deps.next ? 3000 : deps["@angular/core"] ? 4200 : deps.nuxt ? 3000 : 3000)
    return { nombre, dir, tipo, cmd: pkg.scripts.dev ? "npm run dev" : "npm start", puerto }
  }
  if (existsSync(join(dir, "artisan"))) return { nombre, dir, tipo: "backend", cmd: "php artisan serve --port=" + (puertoEnv(dir) ?? 8000), puerto: puertoEnv(dir) ?? 8000 }
  if (existsSync(join(dir, "manage.py"))) return { nombre, dir, tipo: "backend", cmd: `${WIN ? "python" : "python3"} manage.py runserver ${puertoEnv(dir) ?? 8000}`, puerto: puertoEnv(dir) ?? 8000 }
  const docroot = ["public", "public_html", "www", "htdocs"].map((d) => join(dir, d)).find(existsSync) ?? dir
  const hayPhp = (() => { try { return readdirSync(docroot).some((f: string) => f.endsWith(".php")) } catch { return false } })()
  if (existsSync(join(docroot, "index.php")) || existsSync(join(dir, "composer.json")) || hayPhp) { const p = puertoEnv(dir) ?? 8000; return { nombre, dir, tipo: "app", cmd: `php -d display_errors=1 -d error_reporting=E_ALL -S 127.0.0.1:${p} -t "${docroot}" "${routerPhp()}"`, puerto: p } }
  return null
}
/** Servicios del proyecto: raíz y subcarpetas típicas; el backend primero. */
export function servicios(cwd: string): Servicio[] {
  const s: Servicio[] = []
  // Si la raíz ya es una app PHP, sus subcarpetas con .php (api/, app/…) son parte de ELLA, no servicios aparte
  const raizPhp = (() => { try { return existsSync(join(cwd, "composer.json")) || readdirSync(cwd).some((f: string) => f.endsWith(".php")) } catch { return false } })()
  for (const d of ["backend", "server", "api", "back", "servidor", "frontend", "client", "web", "front", "cliente", "app"]) {
    const x = existsSync(join(cwd, d)) ? detectar(join(cwd, d), d) : null
    if (x && !(raizPhp && x.cmd.includes(" -S ") && !existsSync(join(cwd, d, "composer.json")))) s.push(x)
  }
  if (!s.length) { const r = detectar(cwd, basename(cwd)); if (r) s.push(r) }
  return s.sort((a, b) => (a.tipo === "backend" ? 0 : a.tipo === "app" ? 1 : 2) - (b.tipo === "backend" ? 0 : b.tipo === "app" ? 1 : 2))
}

const ERR = /(\bError\b|Exception|Traceback|EADDRINUSE|ECONNREFUSED|ERR!|Unhandled|Fatal error|Parse error|PHP Warning|PHP Notice|Deprecated:|Cannot find module|Module not found|failed to compile|SyntaxError|TypeError|ReferenceError|SQLSTATE|password authentication failed|ER_ACCESS_DENIED|Segmentation fault)/i
const RUIDO = /(DeprecationWarning: The `punycode`|ExperimentalWarning|Browserslist: caniuse-lite is outdated|0 errors?\b|without errors)/i
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** Corre una promesa con tope duro: si se pasa del tiempo, resuelve con `fallback` en vez de quedarse pegada. */
export function conTiempo<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((res) => { let listo = false; const t = setTimeout(() => { if (!listo) { listo = true; res(fallback) } }, ms); (t as any).unref?.(); p.then((v) => { if (!listo) { listo = true; clearTimeout(t); res(v) } }).catch(() => { if (!listo) { listo = true; clearTimeout(t); res(fallback) } }) })
}
async function responde(url: string) { try { await fetch(url, { signal: AbortSignal.timeout(2500) }); return true } catch { return false } }

export type Arrancado = { s: Servicio; url: string; ok: boolean; errores: string[]; detener: () => void; pid?: number }
/** Baja lo que ocupe los puertos, sube el backend y luego el frontend, y reporta errores de arranque de cada uno. */
export async function arranqueLimpio(cwd: string, espera = Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22_000): Promise<{ lista: Arrancado[]; notas: string[] }> {
  const topeTotal = Date.now() + Math.min(espera * 3 + 10_000, 90_000) // deadline duro: nunca más de ~90s en total
  const notas: string[] = [], lista: Arrancado[] = []
  for (const s of servicios(cwd)) {
    const lib = liberarPuerto(s.puerto); if (!/libre/.test(lib)) notas.push(lib)
    const log: string[] = []
    const p = spawn(s.cmd, { cwd: s.dir, shell: true, detached: !WIN, env: { ...process.env, BROWSER: "none", CI: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"] })
    const tomar = (b: Buffer) => { log.push(b.toString()); if (log.length > 400) log.shift() }
    p.stdout?.on("data", tomar); p.stderr?.on("data", tomar)
    let url = `http://127.0.0.1:${s.puerto}`, ok = false
    const fin = Math.min(Date.now() + espera, topeTotal)
    while (Date.now() < fin) {
      const m = log.join("").match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/); if (m) url = `http://127.0.0.1:${m[1]}`
      if (/EADDRINUSE|address already in use|port .* (is )?(already )?in use/i.test(log.join(""))) { const pt = Number(log.join("").match(/(?:EADDRINUSE[^\d]*|port\s+)(\d{2,5})/i)?.[1] ?? s.puerto); notas.push(liberarPuerto(pt)); break }
      if (await responde(url)) { ok = true; break }
      if (p.exitCode !== null) break
      await esperar(200)
    }
    await esperar(500) // errores que aparecen justo después de arrancar
    const errores = [...new Set(log.join("").split(/\r?\n/).filter((l) => ERR.test(l) && !RUIDO.test(l)).map((l) => l.trim().replace(cwd, "").slice(0, 200)))].slice(0, 8)
    const detener = () => { try { if (p.pid) matarArbol(p.pid) } catch {} ; try { const q = escuchando().filter((x) => x.puerto === s.puerto && esDeDesarrollo(x)); for (const x of q) matarArbol(x.pid) } catch {} }
    lista.push({ s, url, ok, pid: p.pid, errores: ok ? errores : [...errores, p.exitCode !== null ? `el proceso terminó (código ${p.exitCode})` : "no respondió a tiempo"].slice(0, 8), detener })
    if (!ok && s.tipo === "backend") notas.push(`backend "${s.nombre}" no subió: el frontend dependerá de él`)
  }
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  writeFileSync(join(cwd, ".skill_dey", "procesos.json"), JSON.stringify(lista.map((a) => ({ servicio: a.s.nombre, tipo: a.s.tipo, url: a.url, ok: a.ok, pid: a.pid, puerto: a.s.puerto })), null, 1))
  return { lista, notas }
}

/** Detiene lo que skill_dey dejó corriendo y libera los puertos de los servicios del proyecto. */
export function detenerTodo(cwd: string): string {
  const r: string[] = []
  try { for (const x of JSON.parse(readFileSync(join(cwd, ".skill_dey", "procesos.json"), "utf8"))) if (x.pid) { matarArbol(x.pid); r.push(`detenido ${x.servicio} (PID ${x.pid})`) } } catch {}
  for (const s of servicios(cwd)) { const l = liberarPuerto(s.puerto); if (!/libre/.test(l)) r.push(l) }
  return (r.length ? r.join("\n") : "No había procesos del proyecto corriendo.") + "\n(todos los puertos del proyecto quedaron libres)"
}
