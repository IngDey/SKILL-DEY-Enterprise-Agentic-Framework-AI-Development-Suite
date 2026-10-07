// SKILL_DEY — levanta la app sola para revisar consola/capturas, y Playwright sin tocar el proyecto.
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs"
import { join, relative, dirname } from "node:path"
import { homedir, tmpdir } from "node:os"
import { createServer } from "node:net"

const WIN = process.platform === "win32"
export const PW_DIR = join(homedir(), ".config", "opencode", "skill_dey", "playwright")

const puertoLibre = () => new Promise<number>((ok) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = (s.address() as any).port; s.close(() => ok(p)) }) })
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function responde(url: string, ms = 45_000) {
  const fin = Date.now() + ms
  while (Date.now() < fin) { try { const r = await fetch(url, { signal: AbortSignal.timeout(3000) }); void r; return true } catch {} await esperar(200) }
  return false
}
function matar(p: ChildProcess) {
  if (!p.pid) return
  try { if (WIN) spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { timeout: 8_000 }); else { try { process.kill(-p.pid, "SIGKILL") } catch {} ; try { process.kill(p.pid, "SIGKILL") } catch {} } } catch { try { p.kill("SIGKILL") } catch {} }
}
/**
 * Router para `php -S`: sin él, el servidor integrado responde index.php con 200 a cualquier archivo que no existe
 * y esconde enlaces, imágenes y scripts rotos. Con él: archivo inexistente con extensión → 404 real; rutas sin
 * extensión siguen yendo a index.php (frameworks con front controller). Se escribe fuera del proyecto.
 */
export function routerPhp(): string {
  const f = join(tmpdir(), "skill_dey-router.php")
  writeFileSync(f, `<?php
$ruta = urldecode(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) ?? "/");
$archivo = $_SERVER["DOCUMENT_ROOT"] . $ruta;
if (is_file($archivo) || is_file(rtrim($archivo, "/") . "/index.php")) return false;
if (!preg_match('/\\.[A-Za-z0-9]+$/', $ruta) && is_file($_SERVER["DOCUMENT_ROOT"] . "/index.php")) return false;
http_response_code(404); echo "404 no encontrado: " . htmlspecialchars($ruta);
`)
  return f
}
export function docrootPhp(cwd: string) { return ["public", "public_html", "www", "htdocs", "web"].map((d) => join(cwd, d)).find(existsSync) ?? cwd }

/** Arranca la app (si ya hay una respondiendo en la url dada, la usa). Devuelve url base y cómo detenerla. */
export async function iniciarApp(cwd: string): Promise<{ url: string; detener: () => void; como: string; errores: () => string[] } | null> {
  const pkg = (() => { try { return JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) } catch { return null } })()
  const puerto = await puertoLibre()
  const env = { ...process.env, PORT: String(puerto), BROWSER: "none", CI: "1", NODE_ENV: "development" }
  let cmd = "", como = ""
  if (pkg?.scripts?.dev) { cmd = `npm run dev -- --port ${puerto}`; como = "npm run dev" }
  else if (pkg?.scripts?.start) { cmd = "npm start"; como = "npm start" }
  else if (existsSync(join(cwd, "artisan"))) { cmd = `php artisan serve --port=${puerto}`; como = "php artisan serve" }
  else if (existsSync(join(cwd, "manage.py"))) { cmd = `${WIN ? "python" : "python3"} manage.py runserver 127.0.0.1:${puerto}`; como = "django runserver" }
  else if (existsSync(join(cwd, "composer.json")) || existsSync(join(cwd, "index.php")) || existsSync(join(docrootPhp(cwd), "index.php")) || readdirSync(docrootPhp(cwd)).some((f: string) => f.endsWith(".php"))) { cmd = `php -d display_errors=1 -d error_reporting=E_ALL -d log_errors=1 -S 127.0.0.1:${puerto} -t "${docrootPhp(cwd)}" "${routerPhp()}"`; como = "php -S" }
  else if (existsSync(join(cwd, "index.html"))) { cmd = `${WIN ? "python" : "python3"} -m http.server ${puerto} --bind 127.0.0.1`; como = "servidor estático" }
  if (!cmd) return null
  const log: string[] = []
  const p = spawn(cmd, { cwd, shell: true, env, detached: !WIN, stdio: ["ignore", "pipe", "pipe"] })
  const captar = (b: Buffer) => { const t = b.toString(); log.push(t); if (log.length > 200) log.shift() }
  p.stdout?.on("data", captar); p.stderr?.on("data", captar)
  // el servidor puede anunciar otro puerto (vite, next…): leerlo del log
  const fin = Date.now() + (Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22_000) // deadline duro para que nunca se quede pegada
  let url = `http://127.0.0.1:${puerto}`
  while (Date.now() < fin) {
    const m = log.join("").match(/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/)
    if (m) url = `http://127.0.0.1:${m[2]}`
    const errores = () => log.join("").split(/\r?\n/).filter((l) => /(PHP )?(Fatal error|Parse error|Warning|Notice|Deprecated)|Traceback|Error:|Exception|UnhandledPromise|ERR!/i.test(l) && !/DeprecationWarning: The `punycode`/.test(l)).map((l) => l.trim().slice(0, 200))
    if (await responde(url, 1500)) return { url, detener: () => matar(p), como, errores }
    if (p.exitCode !== null) break
  }
  matar(p)
  return null
}

/** Playwright en una carpeta propia de skill_dey (no modifica tu proyecto). Se instala una sola vez. */
export function asegurarPlaywright(cwdProyecto: string): string | null {
  const local = join(cwdProyecto, "node_modules", "playwright")
  if (existsSync(local)) return join(cwdProyecto, "package.json")
  const pj = join(PW_DIR, "package.json")
  if (!existsSync(join(PW_DIR, "node_modules", "playwright"))) {
    mkdirSync(PW_DIR, { recursive: true })
    if (!existsSync(pj)) writeFileSync(pj, JSON.stringify({ name: "skill-dey-playwright", private: true }))
    const i = spawnSync("npm", ["i", "playwright", "@axe-core/playwright", "--no-audit", "--no-fund", "--silent"], { cwd: PW_DIR, shell: WIN, timeout: 300_000 })
    if (i.status !== 0) return null
    spawnSync("npx", ["playwright", "install", "chromium"], { cwd: PW_DIR, shell: WIN, timeout: 600_000 })
  }
  return pj
}

/** Páginas a revisar según los archivos cambiados (PHP: la página misma; SPA/otros: la raíz). */
export function rutasAProbar(cwd: string, archivos: string[]): string[] {
  const root = docrootPhp(cwd)
  const php = archivos.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src\/|app\/|clases?|models?|controllers?/i.test(f))
    .map((f) => "/" + relative(root, join(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."))
  const html = archivos.filter((f) => f.endsWith(".html")).map((f) => "/" + relative(root, join(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."))
  return [...new Set(["/", ...php, ...html])].slice(0, 6)
}
export const ERROR_PHP = /(Fatal error|Parse error|Warning:|Notice:|Deprecated:|Uncaught |Stack trace:|SQLSTATE\[)/
