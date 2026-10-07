// SKILL_DEY — buenas prácticas revisadas POR CÓDIGO (0 tokens del modelo) solo en las líneas NUEVAS de cada cambio.
// Graves (bloquean el verde): código peligroso. Avisos: malas prácticas que conviene corregir.
// Solo líneas agregadas: no molesta con el código viejo que nadie tocó (cambios quirúrgicos).
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { vacunas } from "./reglas.ts"

type Regla = { re: RegExp; ext: RegExp; texto: string; excluir?: RegExp }
const JS = /\.(m?[jt]sx?|cjs|vue|svelte)$/i, PHP = /\.php$/i, PY = /\.py$/i, WEB = /\.(html|php|vue|[jt]sx|blade\.php|twig|svelte)$/i, TODO_COD = /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/i
const PRUEBA = /(^|[\\/])(tests?|__tests__|spec)[\\/]|\.(test|spec)\.|_test\.|test_[^\\/]+\.py$|Test\.php$/i

const GRAVES: Regla[] = [
  { re: /\beval\s*\(|new\s+Function\s*\(/, ext: JS, texto: "eval/new Function (ejecución de código arbitrario)" },
  { re: /\.innerHTML\s*\+?=\s*(?!\s*(["'])[^"']*\1\s*;?\s*$)(?!\s*`[^`$]*`\s*;?\s*$)/, ext: JS, texto: "innerHTML con datos variables (XSS): usa textContent o escapa", excluir: /DOMPurify|sanitize|escape/i },
  { re: /document\.write\s*\(/, ext: JS, texto: "document.write" },
  { re: /(query|execute|mysqli_query|pg_query)\s*\([^;]*\$_(GET|POST|REQUEST|COOKIE)/i, ext: PHP, texto: "entrada del usuario directo en SQL (inyección): consulta preparada" },
  { re: /\b(eval|assert)\s*\(\s*\$|extract\s*\(\s*\$_(GET|POST|REQUEST)/i, ext: PHP, texto: "eval/extract con datos del usuario" },
  { re: /(echo|print|<\?=)\s*[^;]*\$_(GET|POST|REQUEST|COOKIE)/i, ext: PHP, texto: "imprime entrada del usuario sin escapar (XSS)", excluir: /htmlspecialchars|htmlentities|intval|\(int\)|filter_var|json_encode/i },
  { re: /\b(eval|exec)\s*\(|pickle\.loads?\s*\(|subprocess\.[a-z_]+\([^)]*shell\s*=\s*True/, ext: PY, texto: "eval/exec/pickle/shell=True (ejecución arbitraria)" },
  { re: /execute\s*\(\s*f["']|execute\s*\([^)]*%\s*\(?[\w]/, ext: PY, texto: "SQL armado con texto (inyección): usa parámetros" },
]
const AVISOS: Regla[] = [
  { re: /console\.(log|debug)\s*\(|\bdebugger\s*;/, ext: JS, texto: "console.log/debugger olvidado" },
  { re: /\b(var_dump|print_r|dd|dump)\s*\(/, ext: PHP, texto: "var_dump/print_r/dd olvidado" },
  { re: /^\s*print\s*\(/, ext: PY, texto: "print de depuración" },
  { re: /catch\s*(\([^)]*\))?\s*\{\s*\}|except\s*(\w+\s*)?:\s*pass/, ext: TODO_COD, texto: "error tragado (catch/except vacío)" },
  { re: /SELECT\s+\*\s+FROM/i, ext: TODO_COD, texto: "SELECT * (trae columnas de más; lista las necesarias)" },
  { re: /["'`]https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, ext: TODO_COD, texto: "URL local escrita en el código (llévala a .env/config)", excluir: /process\.env|import\.meta\.env|getenv|env\(|os\.environ|\?\?|\|\|/ },
  { re: /<img\b(?![^>]*\balt=)[^>]*>/i, ext: WEB, texto: "imagen sin alt (accesibilidad)" },
  { re: /:\s*any\b|as\s+any\b/, ext: /\.tsx?$/i, texto: "tipo any (pierde el tipado)" },
  { re: /parseFloat\([^)]*(precio|valor|total|monto|saldo|costo)/i, ext: JS, texto: "dinero con float (usa enteros/centavos o decimal)" },
  { re: /\b(TODO|FIXME|HACK)\b/, ext: TODO_COD, texto: "TODO/FIXME nuevo" },
]

/** Líneas agregadas por archivo (git diff) o el archivo completo si es nuevo. */
function lineasNuevas(cwd: string, f: string): { n: number; l: string }[] {
  const d = spawnSync("git", ["diff", "-U0", "HEAD", "--", f], { cwd, encoding: "utf8", timeout: 15_000 })
  if (d.status === 0 && d.stdout.trim()) {
    const out: { n: number; l: string }[] = []; let n = 0
    for (const l of d.stdout.split("\n")) { const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/); if (h) { n = Number(h[1]); continue } if (l.startsWith("+") && !l.startsWith("+++")) out.push({ n: n++, l: l.slice(1) }) }
    return out
  }
  try { return readFileSync(join(cwd, f), "utf8").split(/\r?\n/).map((l, i) => ({ n: i + 1, l })) } catch { return [] }
}

/** Revisa buenas prácticas en lo cambiado. Devuelve graves (fallan) y avisos (no fallan). */
export function revisarPracticas(cwd: string, archivos: string[]): { graves: string[]; avisos: string[] } {
  const graves: string[] = [], avisos: string[] = []
  // VACUNAS: errores reales ya corregidos alguna vez (en cualquier app) → bloqueados para siempre
  const vac: Regla[] = vacunas().flatMap((v) => { try { return [{ re: new RegExp(v.patron), ext: new RegExp(`\\.(${v.ext})$`, "i"), texto: `🛡 vacuna: ${v.texto}` }] } catch { return [] } })
  for (const f of archivos) {
    if (PRUEBA.test(f) || /\.min\.|vendor[\\/]|node_modules/.test(f)) continue
    const nuevas = lineasNuevas(cwd, f)
    for (const { n, l } of nuevas) {
      if (l.length > 2000) continue
      for (const r of [...GRAVES, ...vac]) if (r.ext.test(f) && r.re.test(l) && !(r.excluir && r.excluir.test(l))) graves.push(`${f}:${n} ${r.texto}`)
      for (const r of AVISOS) if (r.ext.test(f) && r.re.test(l) && !(r.excluir && r.excluir.test(l))) avisos.push(`${f}:${n} ${r.texto}`)
    }
  }
  return { graves: graves.slice(0, 10), avisos: avisos.slice(0, 8) }
}
