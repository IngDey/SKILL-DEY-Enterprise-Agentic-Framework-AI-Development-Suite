// SKILL_DEY — OBSERVABILIDAD / TRACING (gratis, local, 0 tokens del modelo). Responde a la debilidad "no hay panel
// de telemetría tipo LangSmith": registra cada turno (modelo, tokens, costo, tiempo, herramientas) en
// .skill_dey/TRACE.jsonl y dibuja un PANEL.html con tendencias (barras SVG, sin dependencias). Esencia intacta: local y ligero.
import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const F = (cwd: string) => join(cwd, ".skill_dey", "TRACE.jsonl")

export type Traza = { ts: number; modelo: string; tokens: number; costo: number; dur: number; herramientas: number; tier?: string }

/** Agrega una traza por turno (lo llama el guardián al cerrar). Mantiene el archivo acotado. */
export function registrarTraza(cwd: string, t: Traza) {
  try {
    mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
    appendFileSync(F(cwd), JSON.stringify(t) + "\n")
    // poda: deja las últimas 500 líneas
    const ls = readFileSync(F(cwd), "utf8").split("\n").filter(Boolean)
    if (ls.length > 500) writeFileSync(F(cwd), ls.slice(-500).join("\n") + "\n")
  } catch {}
}

function leer(cwd: string): Traza[] {
  try { return readFileSync(F(cwd), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) } catch { return [] }
}

const k = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n)))

/** Dibuja el panel de observabilidad en .skill_dey/PANEL.html (tendencias de tokens, costo y tiempo). */
export function panel(cwd: string): { ok: boolean; lineas: string[] } {
  const t = leer(cwd)
  if (!t.length) return { ok: true, lineas: ["⏭ panel: aún no hay trazas (aparecen al terminar cada respuesta)."] }
  const ult = t.slice(-40)
  const totTok = t.reduce((a, x) => a + (x.tokens || 0), 0), totCost = t.reduce((a, x) => a + (x.costo || 0), 0)
  const maxTok = Math.max(1, ...ult.map((x) => x.tokens || 0)), maxDur = Math.max(1, ...ult.map((x) => x.dur || 0))
  const barras = (vals: number[], max: number, color: string) => ult.map((_, i) => `<rect x="${i * 14}" y="${60 - Math.round((vals[i] / max) * 56)}" width="11" height="${Math.max(1, Math.round((vals[i] / max) * 56))}" fill="${color}"><title>${vals[i]}</title></rect>`).join("")
  const w = ult.length * 14
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Panel · SKILL_DEY</title>
<style>:root{color-scheme:light dark}body{font-family:system-ui;margin:0;padding:20px;background:#0f1115;color:#e8eaed}
@media(prefers-color-scheme:light){body{background:#f7f8fa;color:#1a1d21}}
.kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}.card{background:#171a1f22;border:1px solid #8884;border-radius:12px;padding:14px 18px}
.card strong{font-size:1.5rem;display:block}.card span{opacity:.7;font-size:.85rem}svg{max-width:100%}.g{margin:18px 0}</style></head><body>
<h2>📊 Panel de observabilidad — SKILL_DEY</h2>
<div class="kpis">
<div class="card"><span>Consultas</span><strong>${t.length}</strong></div>
<div class="card"><span>Tokens totales</span><strong>${k(totTok)}</strong></div>
<div class="card"><span>Costo total</span><strong>${totCost > 0 ? "US$" + totCost.toFixed(2) : "gratis"}</strong></div>
<div class="card"><span>Prom. tokens/consulta</span><strong>${k(totTok / t.length)}</strong></div>
<div class="card"><span>Modelo más usado</span><strong>${(Object.entries(t.reduce((a: any, x) => (a[x.modelo] = (a[x.modelo] || 0) + 1, a), {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "—").split("/").pop()}</strong></div>
</div>
<div class="g"><b>Tokens por consulta</b> (últimas ${ult.length})<br><svg width="${w}" height="64">${barras(ult.map((x) => x.tokens || 0), maxTok, "#2d6cdf")}</svg></div>
<div class="g"><b>Tiempo por consulta (ms)</b><br><svg width="${w}" height="64">${barras(ult.map((x) => x.dur || 0), maxDur, "#16a34a")}</svg></div>
<p style="opacity:.6">Local y gratis. Datos crudos en .skill_dey/TRACE.jsonl</p></body></html>`
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(join(cwd, ".skill_dey", "PANEL.html"), html)
  return { ok: true, lineas: [`📊 Panel de observabilidad → .skill_dey/PANEL.html · ${t.length} consultas · ${k(totTok)} tokens${totCost > 0 ? " · US$" + totCost.toFixed(2) : ""}. Ábrelo en el navegador.`] }
}
