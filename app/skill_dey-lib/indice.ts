// SKILL_DEY — RAG LIGERO (gratis, sin servidor ni embeddings, 0 tokens del modelo). Responde a la debilidad
// "memoria en archivos planos no escala": trocea la memoria (lecciones, decisiones, negocio, bitácora) y devuelve
// SOLO los trozos relevantes a una consulta (ranking BM25 léxico). Así, en proyectos grandes, no se satura el prompt.
// Esencia intacta: local, portable, inspeccionable. (No es vectorial a propósito: cero infraestructura.)
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { memoriaGlobal } from "./rutas.ts"
import { join } from "node:path"


const FUENTES = ["LECCIONES.md", "DECISIONES.md", "NEGOCIO.md", "BITACORA.md", "ESTADO.md", "APRENDIZAJE.md", "PRINCIPIOS.md"]
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2)

type Trozo = { fuente: string; texto: string; toks: string[] }

/** Trozos de la memoria del proyecto (una línea/ítem = un trozo). */
function trozos(cwd: string): Trozo[] {
  const dir = join(cwd, ".skill_dey"); const out: Trozo[] = []
  const archivos = existsSync(dir) ? readdirSync(dir).filter((f) => FUENTES.includes(f)) : []
  for (const f of archivos) {
    const t = (() => { try { return readFileSync(join(dir, f), "utf8") } catch { return "" } })()
    for (const linea of t.split(/\r?\n/)) {
      const l = linea.trim().replace(/^[-*#>\s]+/, "")
      if (l.length < 8 || l.startsWith("name:") || l.startsWith("description:")) continue
      out.push({ fuente: f, texto: l.slice(0, 220), toks: norm(l) })
    }
  }
  // LECCIONES GLOBALES (aplican a todos los proyectos) — alimentan la reflexión/reinyección entre apps
  try {
    const g = readFileSync(memoriaGlobal("LECCIONES-GLOBALES.md"), "utf8")
    for (const linea of g.split(/\r?\n/)) {
      const l = linea.trim().replace(/^[-*#>\s]+/, "")
      if (l.length < 8 || l.startsWith("name:") || l.startsWith("description:")) continue
      out.push({ fuente: "GLOBAL.md", texto: l.slice(0, 220), toks: norm(l) })
    }
  } catch {}
  return out
}

/** Busca en la memoria con ranking BM25 y devuelve los top-K trozos relevantes (no todo el archivo). */
export function buscarMemoria(cwd: string, consulta: string, k = 6): string[] {
  const docs = trozos(cwd)
  if (!docs.length) return []
  const q = [...new Set(norm(consulta))]
  if (!q.length) return []
  const N = docs.length, avgdl = docs.reduce((a, d) => a + d.toks.length, 0) / N
  const df: Record<string, number> = {}
  for (const term of q) df[term] = docs.filter((d) => d.toks.includes(term)).length || 0
  const idf = (term: string) => Math.log(1 + (N - (df[term] || 0) + 0.5) / ((df[term] || 0) + 0.5))
  const k1 = 1.5, b = 0.75
  const puntuar = (d: Trozo) => q.reduce((s, term) => {
    const tf = d.toks.filter((x) => x === term).length
    if (!tf) return s
    return s + idf(term) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (d.toks.length / avgdl)))
  }, 0)
  return docs.map((d) => ({ d, s: puntuar(d) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k)
    .map((x) => `[${x.d.fuente.replace(".md", "")}] ${x.d.texto}`)
}
