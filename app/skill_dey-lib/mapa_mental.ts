// SKILL_DEY — MAPA MENTAL (gratis, 0 tokens del modelo): ordena la información antes de construir. Dibuja un
// mapa mental (Mermaid) con lo PEDIDO (requisitos) + la ARQUITECTURA (carpetas/capas) en .skill_dey/MAPA.md (lo
// renderiza GitHub/VS Code solo) y un MAPA.html para abrir en el navegador. Ayuda a no olvidar partes.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { listarArchivos } from "./listar.ts"

const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|docs)([\\/]|$)|\.min\.|\.lock$/i
const limpio = (s: string) => s.replace(/[()\[\]{}:;#"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 48) || "-"

/** Lee los requisitos del plan (REQUISITOS.md) si existe. */
function requisitos(cwd: string): string[] {
  try {
    const t = readFileSync(join(cwd, ".skill_dey", "REQUISITOS.md"), "utf8")
    return t.split(/\r?\n/).filter((l) => /^\s*-\s*\[[ xX]\]/.test(l)).map((l) => l.replace(/^\s*-\s*\[[ xX]\]\s*/, "")).slice(0, 12)
  } catch { return [] }
}

/** Agrupa el proyecto por carpeta de primer nivel (la "arquitectura" a grandes rasgos). */
function arquitectura(cwd: string): { grupo: string; ejemplos: string[] }[] {
  const files = listarArchivos(cwd).filter((f) => !IGN.test(f))
  const por: Record<string, string[]> = {}
  for (const f of files) { const g = f.includes("/") ? f.split("/")[0] : "(raíz)"; (por[g] ||= []).push(f) }
  return Object.entries(por).sort((a, b) => b[1].length - a[1].length).slice(0, 8)
    .map(([grupo, fs]) => ({ grupo: `${grupo} (${fs.length})`, ejemplos: fs.slice(0, 3).map((x) => x.split("/").pop() || x) }))
}

/** Construye el mapa mental (Mermaid) y lo guarda. tarea opcional; si no, usa el nombre del proyecto. */
export function mapaMental(cwd: string, tarea = ""): { ok: boolean; lineas: string[]; mermaid: string } {
  const raiz = limpio(tarea || cwd.split(/[\\/]/).pop() || "Proyecto")
  const reqs = requisitos(cwd)
  const arq = arquitectura(cwd)
  const L = ["mindmap", `  root((${raiz}))`]
  if (reqs.length) { L.push("    Requisitos"); for (const r of reqs) L.push("      " + limpio(r)) }
  if (arq.length) {
    L.push("    Arquitectura")
    for (const a of arq) { L.push("      " + limpio(a.grupo)); for (const e of a.ejemplos) L.push("        " + limpio(e)) }
  }
  if (!reqs.length && !arq.length) L.push("    (sin plan ni archivos aún)")
  const mermaid = L.join("\n")
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  const md = `# Mapa mental — ${raiz}\n_Se dibuja solo en GitHub/VS Code. Para el navegador abre MAPA.html._\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`
  writeFileSync(join(cwd, ".skill_dey", "MAPA.md"), md)
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mapa mental · ${raiz}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script></head>
<body style="font-family:system-ui;margin:0;padding:16px">
<h3>🧠 Mapa mental — ${raiz}</h3>
<pre class="mermaid">${mermaid}</pre>
<script>mermaid.initialize({startOnLoad:true});</script></body></html>`
  writeFileSync(join(cwd, ".skill_dey", "MAPA.html"), html)
  return { ok: true, lineas: [`🧠 Mapa mental guardado en .skill_dey/MAPA.md (requisitos: ${reqs.length}, grupos: ${arq.length}). Ábrelo en VS Code/GitHub o MAPA.html en el navegador.`, "```mermaid", mermaid, "```"], mermaid }
}
