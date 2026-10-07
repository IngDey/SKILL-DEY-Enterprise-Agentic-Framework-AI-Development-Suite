// SKILL_DEY — buscar/sugerir skill cuando no hay rutina para lo pedido. Por código (0 tokens del modelo).
// Si hay skill instalada que cubre el tema → úsala. Si no → registra el hueco y pide proponer/instalar una (nunca instala sola).
import { existsSync, readFileSync, readdirSync, appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

/** Skills instaladas (proyecto + global), con su descripción del frontmatter. */
function skillsInstaladas(cwd: string): { nombre: string; desc: string }[] {
  const dirs = [join(cwd, ".opencode", "skills"), join(homedir(), ".config", "opencode", "skills")]
  const out: { nombre: string; desc: string }[] = []
  for (const d of dirs) {
    if (!existsSync(d)) continue
    for (const n of readdirSync(d)) {
      const f = join(d, n, "SKILL.md")
      if (!existsSync(f)) continue
      let desc = ""
      try { desc = (readFileSync(f, "utf8").match(/description:\s*(.+)/i)?.[1] ?? "").trim() } catch {}
      out.push({ nombre: n, desc })
    }
  }
  return out
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2)

/** ¿Hay skill instalada para el tema? Si no, registra el hueco y sugiere buscar/instalar una (NO instala). */
export function buscarSkill(cwd: string, tema: string): string {
  const claves = norm(tema)
  if (!claves.length) return "dime el tema para buscar una skill"
  const inst = skillsInstaladas(cwd)
  const punt = inst
    .map((s) => { const w = norm(s.nombre + " " + s.desc); return { s, n: claves.filter((c) => w.some((x) => x.includes(c) || c.includes(x))).length } })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  if (punt.length) return `✅ Ya hay skill instalada para "${tema}": usa \`${punt[0].s.nombre}\`${punt[1] ? ` (o \`${punt[1].s.nombre}\`)` : ""}. Cárgala en vez de improvisar.`
  try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); appendFileSync(join(cwd, ".skill_dey", "HUECOS.md"), `- ${new Date().toISOString().slice(0, 10)} sin skill para: ${tema}\n`) } catch {}
  return `⚠ No hay skill instalada para "${tema}". Busca una skill/plugin de OpenCode que lo cubra, propónmela y espera OK para instalar — NO instales sola. Si no existe ninguna, resuélvelo con la skill \`skill-dey\` y guarda la solución con \`skill_dey_leccion\` tipo:solucion. (anotado en .skill_dey/HUECOS.md)`
}
