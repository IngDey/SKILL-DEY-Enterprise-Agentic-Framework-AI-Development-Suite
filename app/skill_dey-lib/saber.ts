// SKILL_DEY — conocimiento del proyecto, por código (0 tokens): PRINCIPIOS fijos de la app, CATÁLOGO de soluciones
// reutilizables y NOTAS DE VERSIÓN. Se leen/escriben sin gastar tokens del modelo; el modelo solo recibe lo justo.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

/** PRINCIPIOS: reglas fijas de esta app (stack, seguridad, estilo) que se respetan siempre sin repetirlas en cada pedido. */
export function principios(cwd: string): string {
  const p = join(cwd, ".skill_dey", "PRINCIPIOS.md"); const t = leer(p)
  return t.trim() ? t : ""
}
export function asegurarPrincipios(cwd: string): string {
  const p = join(cwd, ".skill_dey", "PRINCIPIOS.md"); if (existsSync(p)) return leer(p)
  const pkg = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))) } catch { return null } })()
  const comp = existsSync(join(cwd, "composer.json"))
  const stack = [pkg && "Node", comp && "PHP", pkg?.dependencies?.react && "React", pkg?.dependencies?.vue && "Vue", comp && existsSync(join(cwd, "artisan")) && "Laravel"].filter(Boolean).join(" · ") || "(detectar)"
  const txt = `# PRINCIPIOS de la app (reglas fijas; skill_dey las respeta siempre)
- Stack: ${stack}
- Idioma de la interfaz: español
- Seguridad: validar en el servidor; contraseñas con hash; secretos solo en .env; CSRF en formularios
- Estilo: seguir el del proyecto; archivos ≤400 líneas; nombres claros
- Nunca: romper lo existente, borrar datos sin confirmar, subir .env
(Edita este archivo con las reglas propias de esta app: convenciones, carpetas, lo que NO se toca.)
`
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(p, txt); return txt
}

type Solucion = { etiqueta: string; problema: string; solucion: string; fecha: string }
const catFile = (cwd: string) => join(cwd, ".skill_dey", "SOLUCIONES.md")
/** Guarda "cómo se resolvió X" para reutilizarlo. Reutilizable en la misma app. */
export function guardarSolucion(cwd: string, etiqueta: string, problema: string, solucion: string): string {
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  const f = catFile(cwd); if (!existsSync(f)) writeFileSync(f, "# SOLUCIONES reutilizables (problema → cómo se resolvió)\n")
  if (leer(f).includes(solucion.trim())) return "ya estaba en el catálogo"
  appendFileSync(f, `\n## ${etiqueta} (${new Date().toISOString().slice(0, 10)})\n- Problema: ${problema}\n- Solución: ${solucion}\n`)
  return "💡 solución guardada en el catálogo (.skill_dey/SOLUCIONES.md)"
}
/** Busca soluciones previas que apliquen a un tema (para no resolver dos veces lo mismo). */
export function buscarSoluciones(cwd: string, tema: string): string {
  const t = leer(catFile(cwd)); if (!t.trim()) return ""
  const claves = tema.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const bloques = t.split(/\n## /).slice(1).filter((b) => claves.some((k) => b.toLowerCase().includes(k)))
  return bloques.length ? "Soluciones previas que podrían servir:\n## " + bloques.slice(0, 3).join("\n## ") : ""
}

/** NOTAS DE VERSIÓN en lenguaje de usuario, a partir de los commits desde la última etiqueta/fecha. */
export function notasVersion(cwd: string): string {
  const log = spawnSync("git", ["log", "--date=short", "--pretty=format:%s", "-40"], { cwd, encoding: "utf8" }).stdout?.trim() ?? ""
  if (!log) return "Sin historial de git para generar notas."
  const cambios = log.split("\n").filter((l) => l && !/^(wip|merge|checkpoint|skill_dey:|fixup)/i.test(l))
  const cat = (re: RegExp) => cambios.filter((c) => re.test(c)).map((c) => "- " + c.replace(/^(\w+)(\([^)]*\))?:\s*/, "")).slice(0, 15)
  const nuevo = cat(/^(feat|add|nuev|agrega|crea)/i), arreglo = cat(/^(fix|corrig|arregl|bug)/i)
  const otros = cambios.filter((c) => !/^(feat|add|nuev|agrega|crea|fix|corrig|arregl|bug)/i.test(c)).map((c) => "- " + c).slice(0, 10)
  const doc = [`# Novedades — ${new Date().toISOString().slice(0, 10)}`, "",
    ...(nuevo.length ? ["## Nuevo", ...nuevo, ""] : []), ...(arreglo.length ? ["## Correcciones", ...arreglo, ""] : []), ...(otros.length ? ["## Otros cambios", ...otros] : [])].join("\n")
  mkdirSync(join(cwd, "docs"), { recursive: true }); writeFileSync(join(cwd, "docs", "NOVEDADES.md"), doc)
  return "✅ Notas de versión en docs/NOVEDADES.md:\n\n" + doc
}
