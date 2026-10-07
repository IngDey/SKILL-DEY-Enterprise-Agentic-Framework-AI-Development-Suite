// SKILL_DEY — /organizar: ordena el proyecto por código (0 tokens). SEGURO: lo que no rompe se aplica solo
// (indentación/formato); lo que puede romper (mover archivos, cambiar rutas) se PROPONE para que el modelo lo haga
// con skill_dey_impacto + verificar. Detecta: código duplicado (reutilizar), archivos huérfanos, estructura fuera de convención.
import { spawnSync } from "node:child_process"
import { readFileSync, statSync } from "node:fs"
import { join, basename, extname, dirname } from "node:path"
import { formatear } from "./extras.ts"
import { listarArchivos } from "./listar.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|public[\\/]build|migrations?)([\\/]|$)|\.min\.|\.lock$/i
const archivos = (cwd: string) => listarArchivos(cwd).filter((f) => !IGN.test(f))
const COD = /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/

/** Bloques de código casi iguales en archivos distintos (candidatos a reutilizar en un helper). */
function duplicados(cwd: string, files: string[]): string[] {
  const vistos = new Map<string, string[]>()
  for (const f of files.filter((f) => COD.test(f))) {
    const ls = leer(join(cwd, f)).split(/\r?\n/)
    for (let i = 0; i + 6 < ls.length; i += 6) {
      const bloque = ls.slice(i, i + 6).map((l) => l.trim()).filter(Boolean)
      if (bloque.length < 5) continue
      const norm = bloque.join("\u0001").replace(/["'`][^"'`]*["'`]/g, "S").replace(/\b\d+\b/g, "N").replace(/\s+/g, " ")
      if (norm.length < 80) continue
      const k = norm; if (!vistos.has(k)) vistos.set(k, []); vistos.get(k)!.push(`${f}:${i + 1}`)
    }
  }
  const r: string[] = []
  for (const [, locs] of vistos) { const arch = [...new Set(locs.map((l) => l.split(":")[0]))]; if (locs.length >= 2 && arch.length >= 2) r.push(`bloque repetido en ${locs.slice(0, 3).join(" ≈ ")} → extrae a una función compartida`) }
  return [...new Set(r)].slice(0, 8)
}

/** Archivos de código que nadie importa/incluye (posibles huérfanos; propone revisar, no borra). */
function huerfanos(cwd: string, files: string[]): string[] {
  const cod = files.filter((f) => COD.test(f) && !/(index|app|main|server|autoload|bootstrap|routes?|web|api)\.[a-z]+$|(^|[\\/])(pages|views|screens|app)[\\/]/i.test(f))
  const todo = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|html|blade\.php|twig)$/.test(f)).map((f) => leer(join(cwd, f))).join("\n")
  return cod.filter((f) => { const base = basename(f).replace(/\.[^.]+$/, ""); return base.length > 2 && !new RegExp(`['"\\/]${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.[a-z]+)?['"\\s)/]`).test(todo) }).slice(0, 8)
}

/** Archivos que probablemente están en la carpeta equivocada según su contenido. */
function fueraDeLugar(cwd: string, files: string[]): string[] {
  const r: string[] = []
  for (const f of files.filter((f) => COD.test(f))) {
    const d = dirname(f).toLowerCase(), t = leer(join(cwd, f)).slice(0, 4000)
    if (/(controller|controlador)/i.test(basename(f)) && !/controller|controlador|routes?|app|src/i.test(d)) r.push(`${f} parece un controlador fuera de controllers/`)
    if (/(SELECT |INSERT |new mysqli|new PDO|->query\()/i.test(t) && /(components?|views?|pages?|ui)[\\/]/.test(d)) r.push(`${f} tiene SQL dentro de la capa visual → muévelo a un modelo/servicio`)
  }
  return [...new Set(r)].slice(0, 8)
}

/** Ejecuta /organizar: aplica formato (seguro) y devuelve el informe + el plan de lo que el modelo debe mover con cuidado. */
export function organizar(cwd: string): string {
  const files = archivos(cwd)
  const fmt = formatear(cwd, false) // indentación/estilo en TODO el proyecto (seguro, no cambia la lógica)
  const dup = duplicados(cwd, files), huer = huerfanos(cwd, files), lugar = fueraDeLugar(cwd, files)
  const grandes = files.filter((f) => COD.test(f) && leer(join(cwd, f)).split("\n").length > 400).map((f) => `${f} (${leer(join(cwd, f)).split("\n").length} líneas) → dividir`)
  const L = [
    `SKILL_DEY organizar · ${files.length} archivos`,
    "1) Indentación y estilo: " + fmt.replace(/^[✅⏭]\s*/, ""),
    dup.length ? "2) Reutilizar (código repetido):\n" + dup.map((d) => "   - " + d).join("\n") : "2) Reutilizar: sin duplicados evidentes ✅",
    lugar.length ? "3) Código fuera de su capa:\n" + lugar.map((d) => "   - " + d).join("\n") : "3) Capas: todo en su lugar ✅",
    grandes.length ? "4) Archivos muy grandes:\n" + grandes.map((d) => "   - " + d).join("\n") : "4) Tamaño de archivos: ok ✅",
    huer.length ? "5) Posibles huérfanos (revisar, NO borrar sin confirmar):\n" + huer.map((d) => "   - " + d).join("\n") : "5) Huérfanos: ninguno ✅",
    "",
    "El formato ya se aplicó. Lo demás (mover archivos, extraer funciones, dividir) hazlo con skill_dey_impacto antes y skill_dey_verificar después, un cambio a la vez, para no romper rutas ni imports. Si algo cambia de ruta, actualiza TODOS sus usos en la misma vuelta.",
  ]
  return L.join("\n")
}
