// SKILL_DEY — revisión de sintaxis JavaScript confiable.
// Ojo: en Node 22 `node --check archivo.js` da OK aunque haya errores si el archivo usa import/export (detección de módulo).
// Por eso un .js con import/export se revisa como módulo (.mjs temporal). Los .js con JSX (React) no los entiende Node:
// esos los valida el build/eslint/tsc, para no dar falsos errores.
import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, rmSync } from "node:fs"
import { join, basename, isAbsolute } from "node:path"
import { tmpdir } from "node:os"

/** Devuelve el error de sintaxis de un archivo .js/.mjs/.cjs, o "" si está bien (o no se puede revisar). */
export function errorJs(cwd: string, archivo: string): string {
  const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo)
  let src = ""; try { src = readFileSync(abs, "utf8") } catch { return "" }
  if (/\.js$/i.test(abs) && /<[A-Za-z][\w.]*[\s>\/]/.test(src) && /(\/>|<\/[A-Za-z])/.test(src)) return "" // JSX
  const esm = /\.js$/i.test(abs) && /^\s*(import\s|import\{|export\s|export\{)/m.test(src)
  const tmp = esm ? join(tmpdir(), `skill_dey-chk-${process.pid}-${Date.now()}-${basename(abs)}.mjs`) : ""
  if (tmp) writeFileSync(tmp, src)
  const r = spawnSync("node", ["--check", tmp || abs], { cwd, encoding: "utf8", timeout: 20_000 })
  if (tmp) try { rmSync(tmp) } catch {}
  if (r.error || r.status === 0) return "" // sin node instalado o sin errores
  return `${r.stdout ?? ""}${r.stderr ?? ""}`.split(tmp || "\u0000").join(archivo).split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join("\n")
}
