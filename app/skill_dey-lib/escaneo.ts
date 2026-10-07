// SKILL_DEY — revisión de TODO el proyecto: ningún archivo con errores de sintaxis, tipos o lint (no solo lo cambiado).
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { errorJs } from "./sintaxis.ts"
import { listarArchivos } from "./listar.ts"

const WIN = process.platform === "win32"
const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/
const sh = (c: string, cwd: string, t = 300_000) => { const r = spawnSync(c, { cwd, shell: true, encoding: "utf8", timeout: t, maxBuffer: 100_000_000, env: { ...process.env, CI: "1", NO_COLOR: "1" } }); return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` } }
const hay = (c: string, cwd: string) => sh(WIN ? `where ${c}` : `command -v ${c}`, cwd, 10_000).code === 0

export function revisarTodo(cwd: string): { ok: boolean; lineas: string[]; errores: number } {
  const files = listarArchivos(cwd).filter((f) => !IGN.test(f) && existsSync(join(cwd, f)) && statSync(join(cwd, f)).size < 2_000_000)
  const L: string[] = []; let errores = 0
  const falla = (titulo: string, det: string[]) => { errores += det.length || 1; L.push(`❌ ${titulo}`, ...det.slice(0, 10).map((d) => "   " + d.replace(cwd, "").slice(0, 200)), ...(det.length > 10 ? [`   … y ${det.length - 10} más`] : [])) }

  // 1) Sintaxis archivo por archivo
  const php = files.filter((f) => f.endsWith(".php"))
  if (php.length && hay("php", cwd)) {
    const malos: string[] = []
    for (let i = 0; i < php.length; i += 40) { const lote = php.slice(i, i + 40); const r = sh(lote.map((f) => `php -l "${f}"`).join(WIN ? " & " : " ; "), cwd, 120_000); for (const l of r.out.split(/\r?\n/)) if (/(Parse error|Fatal error|Errors parsing)/i.test(l) && !/No syntax errors/i.test(l)) malos.push(l.trim()) }
    malos.length ? falla(`PHP: ${malos.length} archivo(s) con error de sintaxis (de ${php.length})`, malos) : L.push(`✅ PHP: ${php.length} archivos sin errores de sintaxis`)
  }
  const js = files.filter((f) => /\.(m?js|cjs)$/.test(f))
  if (js.length) {
    const malos: string[] = []
    for (const f of js) { const x = errorJs(cwd, f); if (x) malos.push(`${f}: ${(x.split(/\r?\n/).find((l) => /Error/.test(l)) ?? "error").trim()}`) }
    malos.length ? falla(`JavaScript: ${malos.length} archivo(s) con error (de ${js.length})`, malos) : L.push(`✅ JavaScript: ${js.length} archivos sin errores de sintaxis`)
  }
  const py = files.filter((f) => f.endsWith(".py"))
  const pyCmd = ["python3", "python", "py"].find((c) => sh(`${c} --version`, cwd, 10_000).code === 0)
  if (py.length && pyCmd) {
    const r = sh(`${pyCmd} -m py_compile ${py.map((f) => `"${f}"`).join(" ")}`, cwd, 300_000)
    r.code !== 0 ? falla("Python: errores de sintaxis", r.out.split(/\r?\n/).filter((l) => /Error|File "/.test(l))) : L.push(`✅ Python: ${py.length} archivos sin errores de sintaxis`)
  }
  const json = files.filter((f) => f.endsWith(".json") && !/lock/.test(f) && !/tsconfig|jsconfig|\.vscode/.test(f))
  const jmalos = json.filter((f) => { try { JSON.parse(readFileSync(join(cwd, f), "utf8")); return false } catch { return true } })
  if (json.length) jmalos.length ? falla(`JSON inválido`, jmalos) : L.push(`✅ JSON: ${json.length} archivos válidos`)

  // 2) Tipos y lint de TODO el proyecto (si el proyecto los tiene configurados)
  if (existsSync(join(cwd, "tsconfig.json")) && existsSync(join(cwd, "node_modules", "typescript"))) {
    const r = sh("npx --no-install tsc --noEmit -p .", cwd, 600_000)
    r.code !== 0 ? falla("TypeScript: errores de tipos", r.out.split(/\r?\n/).filter((l) => /error TS\d+/.test(l))) : L.push("✅ TypeScript: 0 errores de tipos")
  }
  const eslintCfg = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.cjs"].some((f) => existsSync(join(cwd, f)))
  if (eslintCfg && existsSync(join(cwd, "node_modules", "eslint"))) {
    const r = sh("npx --no-install eslint . --quiet --format unix", cwd, 600_000)
    r.code !== 0 ? falla("ESLint: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:\d+:/.test(l))) : L.push("✅ ESLint: 0 errores")
  }
  if (existsSync(join(cwd, "vendor", "bin", "phpstan"))) {
    const r = sh("php vendor/bin/phpstan analyse --no-progress --error-format=raw", cwd, 600_000)
    r.code !== 0 ? falla("PHPStan: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:/.test(l))) : L.push("✅ PHPStan: 0 errores")
  }
  if (py.length && hay("ruff", cwd)) { const r = sh("ruff check . --quiet", cwd); r.code !== 0 ? falla("Ruff: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:\d+:/.test(l))) : L.push("✅ Ruff: 0 errores") }

  // 3) Conflictos de merge olvidados y restos peligrosos en cualquier archivo de texto
  const texto = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb|html|css|scss|sql|json|ya?ml|env\.example)$/.test(f))
  const conflictos = texto.filter((f) => /^(<{7}|={7}|>{7})( |$)/m.test(readFileSync(join(cwd, f), "utf8")))
  if (conflictos.length) falla("Marcas de conflicto de git sin resolver", conflictos)
  const depuracion = texto.filter((f) => !/test|spec/i.test(f) && /\b(debugger;|var_dump\(|dd\(|print_r\(\$|console\.log\(['"]DEBUG)/.test(readFileSync(join(cwd, f), "utf8")))
  if (depuracion.length) L.push(`⚠ restos de depuración (debugger/var_dump/dd): ${depuracion.slice(0, 6).join(", ")}`)

  L.unshift(`Revisión completa: ${files.length} archivos`)
  return { ok: errores === 0, lineas: L, errores }
}
