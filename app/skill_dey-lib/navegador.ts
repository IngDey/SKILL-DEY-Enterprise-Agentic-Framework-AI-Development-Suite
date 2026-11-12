// SKILL_DEY — NAVEGADOR: usa el Chrome/Edge/Brave que YA tienes (sin bajar 150 MB de Chromium), corre las pruebas
// en un proceso aparte y ASÍNCRONO (OpenCode nunca se congela y puedes interrumpir), y puede conectarse a tu Chrome abierto.
import { existsSync, mkdirSync } from "node:fs"
import { sdDir } from "./rutas.ts"
import { join } from "node:path"
import { homedir } from "node:os"
import { spawn, spawnSync } from "node:child_process"

const WIN = process.platform === "win32"

/** Ruta del navegador Chromium instalado en el equipo (Chrome > Edge > Brave > Chromium). null si no hay. */
export function rutaChrome(): string | null {
  const env = process.env.SKILL_DEY_CHROMIUM
  if (env && existsSync(env)) return env
  const H = homedir(), E = process.env
  const c: string[] = process.platform === "darwin"
    ? ["Google Chrome.app/Contents/MacOS/Google Chrome", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "Brave Browser.app/Contents/MacOS/Brave Browser", "Chromium.app/Contents/MacOS/Chromium"]
        .flatMap((a) => ["/Applications/" + a, join(H, "Applications", a)])
    : WIN
      ? [E.PROGRAMFILES, E["PROGRAMFILES(X86)"], E.LOCALAPPDATA].filter(Boolean).flatMap((b) => [
          join(b!, "Google", "Chrome", "Application", "chrome.exe"),
          join(b!, "Microsoft", "Edge", "Application", "msedge.exe"),
          join(b!, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")])
      : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome", "/usr/bin/microsoft-edge", "/usr/bin/brave-browser", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"]
  return c.find((p) => { try { return existsSync(p) } catch { return false } }) ?? null
}

/** Deja el navegador del equipo como predeterminado para TODAS las pruebas (los scripts leen SKILL_DEY_CHROMIUM). */
export function usarChrome(): string | null {
  const r = rutaChrome()
  if (r) process.env.SKILL_DEY_CHROMIUM = r
  return r
}

/** Perfil propio de skill_dey para el modo visible: recuerda tu login de prueba entre corridas (no toca tu perfil personal). */
export function perfilChrome(): string {
  const d = sdDir("chrome-perfil")
  try { mkdirSync(d, { recursive: true }) } catch {}
  return d
}

/** ¿Hay un Chrome abierto con depuración remota? Devuelve la URL para conectarse o null. */
export async function chromeAbierto(puerto = 9222): Promise<string | null> {
  for (const h of ["127.0.0.1", "localhost"]) {
    try { const r = await fetch(`http://${h}:${puerto}/json/version`, { signal: AbortSignal.timeout(1500) }); if (r.ok) return `http://${h}:${puerto}` } catch {}
  }
  return null
}

/** Cómo abrir Chrome para que skill_dey se conecte (Chrome 136+ exige un perfil aparte para la depuración remota). */
export function comoAbrirChrome(puerto = 9222): string {
  const exe = rutaChrome() ?? (WIN ? "chrome.exe" : "google-chrome")
  if (WIN) return `Start-Process "${exe}" -ArgumentList '--remote-debugging-port=${puerto}','--user-data-dir="${perfilChrome()}"'` // PowerShell
  return `"${exe}" --remote-debugging-port=${puerto} --user-data-dir="${perfilChrome()}"`
}

/** Rutas o botones que borran, cambian estado o cierran sesión: NUNCA se visitan, envían ni cargan en pruebas. */
export const ACCION_PELIGROSA = /(elimin|borr|delete|remove|destroy|quitar|anular|\bbaja\b|dar[-_ ]de[-_ ]baja|vaciar|truncate|drop|reset|logout|log-out|signout|salir|cerrar[-_ ]?(sesion|sesión|caja|mes|periodo|período)|desactiv|cancel|papelera|trash|purge|limpiar|install|setup|migrat|seed|import|aprob|approve|rechaz|reject|pagar|\bpay\b|pago|checkout|comprar|\bbuy\b|factur|invoice|emitir|transfer|despach|liquidar|n[oó]mina|payroll|reembols|refund|publicar|publish|notificar|notify|enviar[-_ ]?(correo|mail|masivo|a[-_ ]todos)|send[-_ ]?(mail|email)|confirmar[-_ ]?(pedido|compra|pago|despacho|orden)|\bdel\.php\b|\/del\b)/i

/** true si la URL es de tu equipo (local); false = remota/producción → modo solo lectura. */
export function esLocal(url: string): boolean {
  try { const h = new URL(url).hostname; return /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|0\.0\.0\.0)$/.test(h) || /\.(localhost|test)$/.test(h) } catch { return false } // ".local" NO: es típico de intranets de empresa (producción)
}

/** Mata el proceso y sus hijos (el navegador) sin dejar restos, en cualquier sistema. */
function matarArbol(pid?: number) {
  if (!pid) return
  try { if (WIN) spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true, timeout: 10_000 }); else process.kill(-pid, "SIGKILL") } catch {}
  try { process.kill(pid, "SIGKILL") } catch {}
}

/** Corre un proceso en segundo plano con tope de tiempo (mata el árbol al vencer). Nunca bloquea OpenCode. */
export function correrProceso(cmd: string, args: string[], cwd: string, ms = 170_000, env: Record<string, string> = {}, senal?: AbortSignal): Promise<{ stdout: string; stderr: string; status: number | null; tiempoAgotado: boolean }> {
  return new Promise((ok) => {
    let stdout = "", stderr = "", fin = false, tiempoAgotado = false
    let hijo: ReturnType<typeof spawn>
    try { hijo = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: !WIN, windowsHide: true, shell: WIN && cmd !== "node", stdio: ["ignore", "pipe", "pipe"] }) }
    catch (e: any) { ok({ stdout: "", stderr: String(e?.message ?? e), status: 1, tiempoAgotado: false }); return }
    const cerrar = (status: number | null) => { if (fin) return; fin = true; clearTimeout(t); ok({ stdout, stderr, status, tiempoAgotado }) }
    const t = setTimeout(() => { tiempoAgotado = true; matarArbol(hijo.pid); cerrar(null) }, ms)
    if (senal) { if (senal.aborted) { matarArbol(hijo.pid); cerrar(null) } else senal.addEventListener("abort", () => { matarArbol(hijo.pid); cerrar(null) }, { once: true }) } // Esc en OpenCode → se corta YA
    hijo.stdout?.on("data", (d) => { if (stdout.length < 50_000_000) stdout += d })
    hijo.stderr?.on("data", (d) => { if (stderr.length < 200_000) stderr += d })
    hijo.on("error", (e) => { stderr += String(e?.message ?? e); cerrar(1) })
    hijo.on("close", (c) => cerrar(c))
  })
}
/** Igual que spawnSync(cmd, {shell:true}) pero sin bloquear: {code, out, timeout}. */
export async function correrShell(cmd: string, cwd: string, ms = 120_000, env: Record<string, string> = {}, senal?: AbortSignal): Promise<{ code: number; out: string; timeout: boolean }> {
  const r = await new Promise<{ stdout: string; stderr: string; status: number | null; tiempoAgotado: boolean }>((ok) => {
    let stdout = "", stderr = "", fin = false, tiempoAgotado = false
    let hijo: ReturnType<typeof spawn>
    try { hijo = spawn(cmd, { cwd, env: { ...process.env, ...env }, shell: true, detached: !WIN, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }) }
    catch (e: any) { ok({ stdout: "", stderr: String(e?.message ?? e), status: 1, tiempoAgotado: false }); return }
    const cerrar = (status: number | null) => { if (fin) return; fin = true; clearTimeout(t); ok({ stdout, stderr, status, tiempoAgotado }) }
    const t = setTimeout(() => { tiempoAgotado = true; matarArbol(hijo.pid); cerrar(null) }, ms)
    if (senal) { if (senal.aborted) { matarArbol(hijo.pid); cerrar(null) } else senal.addEventListener("abort", () => { matarArbol(hijo.pid); cerrar(null) }, { once: true }) } // Esc en OpenCode → se corta YA
    hijo.stdout?.on("data", (d) => { if (stdout.length < 50_000_000) stdout += d })
    hijo.stderr?.on("data", (d) => { if (stderr.length < 2_000_000) stderr += d })
    hijo.on("error", (e) => { stderr += String(e?.message ?? e); cerrar(1) })
    hijo.on("close", (c) => cerrar(c))
  })
  return { code: r.status ?? 1, out: `${r.stdout}${r.stderr}`.trimEnd(), timeout: r.tiempoAgotado }
}
export const correrNodo = (script: string, cwd: string, ms = 170_000, env: Record<string, string> = {}, senal?: AbortSignal) => correrProceso("node", [script], cwd, ms, env, senal)

/** Código JS (para los scripts generados) que abre el navegador según el modo: conectar a tu Chrome · visible · invisible. */
export const ABRIR_NAVEGADOR = `
const _CDP = process.env.SKILL_DEY_CDP || '', _VIS = process.env.SKILL_DEY_VISIBLE === '1', _EXE = process.env.SKILL_DEY_CHROMIUM || undefined;
let b = null, ctx = null, _propio = true;
if (_CDP) { b = await chromium.connectOverCDP(_CDP); ctx = b.contexts()[0] ?? await b.newContext(); _propio = false; }
else if (_VIS && process.env.SKILL_DEY_PERFIL) { ctx = await chromium.launchPersistentContext(process.env.SKILL_DEY_PERFIL, { executablePath: _EXE, headless: false, viewport: { width: 1366, height: 900 } }); }
else { b = await chromium.launch({ executablePath: _EXE, headless: !_VIS }); ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); }
const _cerrar = async () => { try { if (_propio) { if (b) await b.close(); else await ctx.close(); } } catch {} };`
