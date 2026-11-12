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
    // por la dirección remota vacía (0.0.0.0:0 / [::]:0) y no por la palabra LISTENING: Windows en español dice "ESCUCHANDO"; incluye IPv6
    for (const l of sh("netstat -ano").split(/\r?\n/)) { const m = l.match(/^\s*TCP\s+\S+:(\d+)\s+(0\.0\.0\.0:0|\[::\]:0|\*:\*)\s+\S+\s+(\d+)\s*$/i); if (m) out.push({ puerto: Number(m[1]), pid: Number(m[3]), cmd: tareas.get(Number(m[3])) ?? "" }) }
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
  // Segundo intento SOLO sobre procesos de desarrollo que ESCUCHAN ese puerto (nunca clientes conectados ni puertos parecidos)
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300) } catch {}
  for (const p of escuchando().filter((x) => x.puerto === puerto && esDeDesarrollo(x))) matarArbol(p.pid)
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
/** URL que de verdad responde en ese puerto: 127.0.0.1, ::1 (Vite en Node 17+ suele escuchar solo ahí) o localhost. */
export async function urlQueResponde(puerto: number | string): Promise<string | null> {
  for (const h of ["127.0.0.1", "[::1]", "localhost"]) { const u = `http://${h}:${puerto}`; if (await responde(u)) return u }
  return null
}
const PROCS = (cwd: string) => join(cwd, ".skill_dey", "procesos.json")
const nuestros = (cwd: string): any[] => { try { const j = JSON.parse(readFileSync(PROCS(cwd), "utf8")); return Array.isArray(j) ? j : [] } catch { return [] } }
const anotar = (cwd: string, x: any) => { try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(PROCS(cwd), JSON.stringify([...nuestros(cwd).filter((y) => y.servicio !== x.servicio), x], null, 1)) } catch {} }
/** Grupo de procesos (POSIX). skill_dey arranca cada servidor en su propio grupo = su PID. */
function pgidDe(pid: number): number { if (WIN) return 0; const m = sh(`ps -o pgid= -p ${Number(pid)}`, 4_000).trim(); return Number(m) || 0 }
/** ¿Ese PID sigue siendo el servidor que arrancó skill_dey? (no un proceso nuevo que reutilizó el número) */
function sigueSiendoNuestro(pid: number, cmd = ""): boolean {
  if (!pid || pid === process.pid) return false
  const clave = (cmd.match(/[\w.-]+/g) ?? []).filter((w) => w.length > 2).slice(0, 3) // ej. "npm run dev" → npm, run, dev
  const coincide = (linea: string) => (clave.length ? clave.every((w) => linea.includes(w)) : DEV.test(linea)) && !SISTEMA.test(linea)
  if (WIN) { const t = sh(`wmic process where ProcessId=${Number(pid)} get CommandLine /format:list`, 6_000) || sh(`tasklist /fi "PID eq ${Number(pid)}" /fo csv /nh`, 6_000); return /\S/.test(t) && !/INFO:|No hay tareas|No tasks/i.test(t) && (clave.length ? clave.some((w) => t.includes(w)) : DEV.test(t)) && !SISTEMA.test(t) }
  const l = sh(`ps -o pgid=,command= -p ${Number(pid)}`, 4_000).trim(); const m = l.match(/^(\d+)\s+(.*)$/)
  return !!m && Number(m[1]) === pid && coincide(m[2]) // su propio grupo (lo arrancamos así) + el MISMO comando → no es un PID reciclado
}
/** Detiene SOLO los procesos que arrancó skill_dey (anotados en procesos.json) y que siguen siendo esos. Nunca toca tu propio "npm run dev". */
export function detenerNuestros(cwd: string): string[] {
  const r: string[] = []
  for (const x of nuestros(cwd)) if (x.pid && !x.ajeno && sigueSiendoNuestro(Number(x.pid), String(x.cmd ?? ""))) { matarArbol(Number(x.pid)); r.push(`detenido ${x.servicio} (PID ${x.pid})`) }
  return r
}

export type Arrancado = { s: Servicio; url: string; ok: boolean; errores: string[]; detener: () => void; pid?: number; salida?: string }
/** Baja lo que ocupe los puertos, sube el backend y luego el frontend, y reporta errores de arranque de cada uno. */
export async function arranqueLimpio(cwd: string, espera = Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22_000, solo?: Servicio[]): Promise<{ lista: Arrancado[]; notas: string[] }> {
  const topeTotal = Date.now() + Math.min(espera * 3 + 10_000, 90_000) // deadline duro: nunca más de ~90s en total
  const notas: string[] = [], lista: Arrancado[] = []
  for (const s of solo ?? servicios(cwd)) {
    // ¿El puerto ya está ocupado? Si es un proceso que dejó skill_dey antes → se reinicia. Si es TUYO y responde → se usa tal cual (no se mata).
    const ocupan = escuchando().filter((x) => x.puerto === s.puerto)
    if (ocupan.length) {
      const previos = new Set(nuestros(cwd).filter((x) => !x.ajeno).map((x) => Number(x.pid)))
      const nuestro = ocupan.every((x) => previos.has(x.pid) || previos.has(pgidDe(x.pid))) // el que escucha suele ser HIJO del que arrancamos: se reconoce por su grupo
      const u = await urlQueResponde(s.puerto)
      if (nuestro) { for (const x of ocupan) matarArbol(x.pid) }
      else if (u) { lista.push({ s, url: u, ok: true, errores: [], detener: () => {} }); anotar(cwd, { servicio: s.nombre, tipo: s.tipo, url: u, ok: true, puerto: s.puerto, ajeno: true }); notas.push(`${s.nombre}: uso el servidor que ya tienes corriendo en ${u} (no lo detengo)`); continue }
      else { lista.push({ s, url: `http://127.0.0.1:${s.puerto}`, ok: false, errores: [`el puerto ${s.puerto} lo ocupa "${ocupan[0].cmd.slice(0, 50)}" y no responde: no lo toco`], detener: () => {} }); continue }
    }
    const log: string[] = []
    const p = spawn(s.cmd, { cwd: s.dir, shell: true, detached: !WIN, env: { ...process.env, BROWSER: "none", CI: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"] })
    const tomar = (b: Buffer) => { log.push(b.toString()); if (log.length > 400) log.shift() }
    anotar(cwd, { servicio: s.nombre, tipo: s.tipo, pid: p.pid, puerto: s.puerto, ok: false, cmd: s.cmd }) // anotado YA: si algo corta la espera, se puede detener igual
    p.stdout?.on("data", tomar); p.stderr?.on("data", tomar)
    let url = `http://127.0.0.1:${s.puerto}`, ok = false
    const fin = Math.min(Date.now() + espera, topeTotal)
    while (Date.now() < fin) {
      const m = log.join("").match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/)
      if (/EADDRINUSE|address already in use|port .* (is )?(already )?in use/i.test(log.join(""))) { notas.push(`${s.nombre}: su puerto está ocupado por otro programa; no lo detengo (cámbialo o ciérralo tú)`); break }
      const u = await urlQueResponde(m?.[1] ?? s.puerto); if (u) { url = u; ok = true; break }
      if (p.exitCode !== null) break
      await esperar(200)
    }
    await esperar(500) // errores que aparecen justo después de arrancar
    const errores = [...new Set(log.join("").split(/\r?\n/).filter((l) => ERR.test(l) && !RUIDO.test(l)).map((l) => l.trim().replace(cwd, "").slice(0, 200)))].slice(0, 8)
    const detener = () => { try { if (p.pid) matarArbol(p.pid) } catch {} }
    const salida = log.join("").split(/\r?\n/).filter((l) => l.trim()).slice(-12).join("\n").slice(-1500)
    lista.push({ s, url, ok, pid: p.pid, salida, errores: ok ? errores : [...errores, p.exitCode !== null ? `el proceso terminó (código ${p.exitCode})` : "no respondió a tiempo"].slice(0, 8), detener })
    if (!ok && s.tipo === "backend") notas.push(`backend "${s.nombre}" no subió: el frontend dependerá de él`)
  }
  for (const a of lista) if (a.pid) anotar(cwd, { servicio: a.s.nombre, tipo: a.s.tipo, url: a.url, ok: a.ok, pid: a.pid, puerto: a.s.puerto, cmd: a.s.cmd })
  return { lista, notas }
}

/** Detiene lo que skill_dey dejó corriendo y libera los puertos de los servicios del proyecto. */
export function detenerTodo(cwd: string): string {
  const r: string[] = []
  r.push(...detenerNuestros(cwd))
  const ocupados = servicios(cwd).flatMap((s) => escuchando().filter((x) => x.puerto === s.puerto).map((x) => `${s.puerto} (${x.cmd.slice(0, 40)})`))
  return (r.length ? r.join("\n") : "No había procesos de skill_dey corriendo.") + (ocupados.length ? `\nPuertos del proyecto usados por OTROS programas (no los toco): ${ocupados.join(", ")}. Si quieres liberarlos: skill_dey_procesos(accion: liberar, puerto: N)` : "")
}
