// SKILL_DEY — MEMORIA OBLIGATORIA (por código, 0 tokens del modelo).
// Estándar de la skill: TODO proyecto que se cree, revise o use debe tener .skill_dey/memoria.md
// y los .md de contexto (negocio, estado+stack, decisiones, lecciones, bitácora, aprendizaje).
// Se crean solos si faltan (idempotente, nunca sobreescribe) para facilitar contexto y aprendizaje.
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs"
import { ocDir } from "./rutas.ts"
import { join } from "node:path"
import { homedir } from "node:os"
import { resolve } from "node:path"

const PLANTILLAS = ocDir("skills", "skill-dey", "assets", "plantillas-memoria")
const BASE: Record<string, string> = {
  "NEGOCIO.md": "# NEGOCIO — qué es la app, usuarios, flujos y reglas (una idea por línea)\nQué es: …\nUsuarios y roles: …\nFlujos principales: …\nReglas de negocio: …\n",
  "ESTADO.md": "# ESTADO\nEstado: EN_CURSO     Iteración: i1\n\n## Stack\nback: …\nfront: …\nbd: …\nadicionales: …\n",
  "DECISIONES.md": "# DECISIONES (qué se eligió y por qué)\n",
  "LECCIONES.md": "# LECCIONES (✅ repetir · ❌ no repetir) — una línea con [etiquetas]\n",
  "BITACORA.md": "# BITÁCORA\niter | fecha | cambio | commit | resultado\n",
  "APRENDIZAJE.md": "# APRENDIZAJE (qué funcionó y qué falló, por corrida)\n",
}
const plantilla = (n: string) => { try { return readFileSync(join(PLANTILLAS, n), "utf8") } catch { return BASE[n] ?? `# ${n.replace(".md", "")}\n` } }

/** ¿La carpeta parece un proyecto (no el home ni la raíz)? Evita crear memoria en sitios sin sentido. */
function esCarpetaProyecto(cwd: string): boolean {
  const r = resolve(cwd)
  if (r === resolve(homedir()) || r === resolve("/") || /^[A-Za-z]:\\?$/.test(r)) return false
  if (existsSync(join(cwd, ".skill_dey"))) return true
  const marcas = [".git", "package.json", "composer.json", "requirements.txt", "pyproject.toml", "pom.xml", "go.mod", "artisan", "src", "app", "index.php", "index.html", "manage.py"]
  return marcas.some((m) => existsSync(join(cwd, m)))
}

/** Crea (si faltan) .skill_dey/memoria.md + los .md estándar. Devuelve lo que creó. */
export function asegurarMemoria(cwd: string): string[] {
  if (!esCarpetaProyecto(cwd)) return []
  const dir = join(cwd, ".skill_dey")
  try { mkdirSync(dir, { recursive: true }) } catch { return [] }
  const creados: string[] = []
  for (const f of Object.keys(BASE)) {
    const p = join(dir, f)
    if (!existsSync(p)) { try { writeFileSync(p, plantilla(f)); creados.push(f) } catch {} }
  }
  const idx = join(dir, "memoria.md")
  if (!existsSync(idx)) {
    const cont = [
      "# MEMORIA del proyecto — índice (contexto y aprendizaje de skill_dey)",
      "",
      "Carpeta de contexto para que la IA entienda el proyecto sin releer todo. Se crea y mantiene sola. No borrar.",
      "",
      "| Archivo | Para qué |",
      "|---|---|",
      "| NEGOCIO.md | qué es la app, usuarios, flujos, reglas de negocio |",
      "| ESTADO.md | estado, iteración y **stack** (back / front / BD / adicionales) |",
      "| DECISIONES.md | decisiones técnicas y por qué |",
      "| LECCIONES.md | qué repetir y qué no (errores aprendidos) |",
      "| BITACORA.md | historial de cambios por iteración |",
      "| APRENDIZAJE.md | resultados de pruebas y verificaciones |",
      "",
      "> Stack del proyecto → ver ESTADO.md (## Stack).",
      "",
    ].join("\n")
    try { writeFileSync(idx, cont); creados.push("memoria.md") } catch {}
  }
  return creados
}

/** TIEMPO REAL: registra en la memoria los archivos que se tocaron (bitácora + sello de estado). Bounded, idempotente. */
export function registrarCambio(cwd: string, archivos: string[], pedido = "", resultado = ""): void {
  if (!archivos.length) return
  const dir = join(cwd, ".skill_dey"); if (!existsSync(dir)) return
  const fecha = new Date().toISOString().slice(0, 16).replace("T", " ")
  const lista = archivos.slice(0, 6).join(", ") + (archivos.length > 6 ? ` (+${archivos.length - 6})` : "")
  const bit = join(dir, "BITACORA.md")
  try {
    let t = existsSync(bit) ? readFileSync(bit, "utf8") : "# BITÁCORA\niter | fecha | cambio | commit | resultado\n"
    const ped = pedido ? `"${pedido.replace(/\s+/g, " ").replace(/"/g, "'").slice(0, 110)}" · ` : ""
    if (!t.includes(`${fecha} · ${ped}${lista}`)) t += `- ${fecha} · ${ped}${lista}${resultado ? " · " + resultado : ""}\n`
    const ls = t.split("\n")
    if (ls.length > 230) { const cab = ls.filter((l) => l.startsWith("#") || l.includes("iter | fecha")).slice(0, 2); t = [...cab, ...ls.filter((l) => l.startsWith("- ")).slice(-200)].join("\n") + "\n" }
    writeFileSync(bit, t)
  } catch {}
  try {
    const est = join(dir, "ESTADO.md")
    if (existsSync(est)) {
      let e = readFileSync(est, "utf8")
      const sello = `Último cambio: ${fecha} (${archivos.length} archivo(s))`
      e = /^Último cambio:.*$/m.test(e) ? e.replace(/^Último cambio:.*$/m, sello) : e.replace(/^(# ESTADO.*)$/m, `$1\n${sello}`)
      writeFileSync(est, e)
    }
  } catch {}
}

/** "¿Dónde quedamos?": los últimos pedidos del proyecto (de TODAS las sesiones), leídos por código. */
export function dondeQuedamos(cwd: string, n = 6): string[] {
  try { return readFileSync(join(cwd, ".skill_dey", "BITACORA.md"), "utf8").split("\n").filter((l) => l.startsWith("- ")).slice(-n).map((l) => l.slice(2)) } catch { return [] }
}

/** Cuenta archivos hasta un límite (se detiene al llegar: en proyectos enormes NO recorre todo). Ignora carpetas pesadas. */
export function contarArchivos(cwd: string, limite = 3000): number {
  const IG = /^(node_modules|vendor|dist|build|out|\.git|\.skill_dey|coverage|\.next|\.nuxt|__pycache__|venv|\.venv|env|storage|cache|\.cache|tmp|temp|logs?|backups?|respaldos?|dumps?|exports?|export|uploads?|media|imagenes|img|data|datos)$/i
  let n = 0
  const walk = (d: string, prof: number) => {
    if (n >= limite || prof > 9) return
    let es: string[] = []; try { es = readdirSync(d) } catch { return }
    for (const e of es) {
      if (n >= limite) return
      const p = join(d, e)
      let st: any; try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) { if (!IG.test(e)) walk(p, prof + 1) } else n++
    }
  }
  try { walk(cwd, 0) } catch {}
  return n
}

/** En un proyecto grande, sugiere las subcarpetas que parecen "raíz de código" (para abrir OpenCode ahí y que vuele). */
export function sugerirSubcarpetas(cwd: string, max = 3): string[] {
  const MARCA = ["package.json", "composer.json", "requirements.txt", "pyproject.toml", "go.mod", "pom.xml", "artisan", "manage.py", "server.js", "index.php", "src", "app", "pubspec.yaml", ".csproj"]
  const IG = /^(node_modules|vendor|dist|build|out|\.git|\.skill_dey|coverage|\.next|\.nuxt|__pycache__|venv|\.venv|env|storage|cache|\.cache|tmp|temp|logs?|backups?|respaldos?|dumps?|exports?|export|uploads?|media|imagenes|img|data|datos)$/i
  const cands: { dir: string; score: number }[] = []
  let tops: string[] = []; try { tops = readdirSync(cwd) } catch { return [] }
  for (const e of tops) {
    if (IG.test(e) || e.startsWith(".")) continue
    const p = join(cwd, e)
    let st: any; try { st = statSync(p) } catch { continue }
    if (!st.isDirectory()) continue
    let kids: string[] = []; try { kids = readdirSync(p) } catch {}
    const score = MARCA.filter((m) => kids.includes(m) || kids.some((k) => k.endsWith(m))).length
    if (score > 0) cands.push({ dir: e, score })
  }
  return cands.sort((a, b) => b.score - a.score).slice(0, max).map((c) => c.dir)
}
