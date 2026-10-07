// SKILL_DEY — genera PDF de los manuales y el diccionario a partir de los .md (0 tokens del modelo).
// Usa el navegador de pruebas que skill_dey ya instala (Playwright/Chromium): md → HTML con marca → PDF. Sin depender de pandoc.
import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"
import { tmpdir } from "node:os"
import { asegurarPlaywright } from "./app.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

/** Markdown → HTML sencillo (encabezados, tablas, listas, negritas, código). Sin librerías. */
function mdAhtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const lineas = md.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)
  const out: string[] = []; let enTabla = false, enLista = false, enCode = false
  const cerrar = () => { if (enLista) { out.push("</ul>"); enLista = false } if (enTabla) { out.push("</tbody></table>"); enTabla = false } }
  const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
  for (const l of lineas) {
    if (/^```/.test(l)) { cerrar(); if (!enCode) { out.push("<pre><code>"); enCode = true } else { out.push("</code></pre>"); enCode = false } ; continue }
    if (enCode) { out.push(esc(l)); continue }
    const t = l.trim()
    if (!t) { cerrar(); continue }
    const h = t.match(/^(#{1,4})\s+(.*)/); if (h) { cerrar(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }
    if (/^\|(.+)\|$/.test(t)) {
      const celdas = t.slice(1, -1).split("|").map((c) => c.trim())
      if (/^\|?[\s:-]+\|?$/.test(t.replace(/[^|:\- ]/g, ""))&&celdas.every((c)=>/^:?-+:?$/.test(c)||!c)) continue
      if (!enTabla) { out.push('<table><tbody>'); enTabla = true; out.push("<tr>" + celdas.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr>"); continue }
      out.push("<tr>" + celdas.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>"); continue
    } else if (enTabla) { out.push("</tbody></table>"); enTabla = false }
    const li = t.match(/^[-*]\s+(.*)/); if (li) { if (!enLista) { out.push("<ul>"); enLista = true } out.push(`<li>${inline(li[1])}</li>`); continue }
    cerrar(); out.push(`<p>${inline(t)}</p>`)
  }
  cerrar(); if (enCode) out.push("</code></pre>")
  return out.join("\n")
}

const MARCA = process.env.SKILL_DEY_MARCA || "" // nombre a mostrar en el encabezado (opcional)

/** Convierte un .md a .pdf con portada y marca. Devuelve la ruta del PDF o "" si no se pudo. */
export function mdApdf(cwd: string, mdRel: string, titulo: string): string {
  const mdPath = join(cwd, mdRel); const md = leer(mdPath); if (!md) return ""
  const pj = asegurarPlaywright(cwd); if (!pj) return ""
  const cuerpo = mdAhtml(md)
  const fecha = new Date().toLocaleDateString("es")
  const app = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))).name } catch { return basename(cwd) } })()
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
 *{box-sizing:border-box} body{font:13px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a2b3c;margin:0;padding:0}
 .marca{background:#0f766e;color:#fff;padding:10px 28px;font-size:12px;display:flex;justify-content:space-between}
 .cont{padding:16px 28px}
 h1{color:#0f766e;border-bottom:3px solid #0f766e;padding-bottom:6px;font-size:22px} h2{color:#115e59;margin-top:22px;font-size:17px;border-bottom:1px solid #d1d5db;padding-bottom:3px} h3{font-size:14px;color:#334155}
 table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px} th{background:#0f766e;color:#fff;text-align:left;padding:6px 8px} td{border:1px solid #cbd5e1;padding:5px 8px;vertical-align:top}
 tr:nth-child(even) td{background:#f1f5f9} code{background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:ui-monospace,Menlo,monospace;font-size:11px} pre{background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px;overflow:auto} pre code{background:none;color:inherit}
 ul{margin:6px 0 6px 18px} .pie{color:#64748b;font-size:10px;text-align:center;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:6px}
</style></head><body>
 <div class="marca"><span>${MARCA || "SKILL_DEY"} · ${app}</span><span>${titulo} · ${fecha}</span></div>
 <div class="cont">${cuerpo}<div class="pie">Generado automáticamente por SKILL_DEY${MARCA ? " para " + MARCA : ""} · ${fecha}</div></div>
</body></html>`
  const htmlPath = join(tmpdir(), `skill_dey-doc-${Date.now()}.html`); writeFileSync(htmlPath, html)
  const outDir = join(cwd, "docs", "pdf"); mkdirSync(outDir, { recursive: true })
  const pdfPath = join(outDir, basename(mdRel).replace(/\.md$/i, ".pdf"))
  const script = join(tmpdir(), `skill_dey-pdf-${Date.now()}.mjs`)
  writeFileSync(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright'); const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {});
const p = await b.newPage(); await p.goto('file://' + ${JSON.stringify(htmlPath)}, { waitUntil: 'load' });
await p.pdf({ path: ${JSON.stringify(pdfPath)}, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' } });
await b.close();`)
  const r = spawnSync(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 120_000 })
  return r.status === 0 && existsSync(pdfPath) ? pdfPath : ""
}

/** Genera los PDF de los documentos vivos que existan. Devuelve el resumen. */
export function documentosPdf(cwd: string): string {
  const docs: [string, string][] = [
    ["docs/MANUAL-USUARIO.md", "Manual de usuario"],
    ["docs/MANUAL-TECNICO.md", "Manual técnico"],
    ["docs/DICCIONARIO-DATOS.md", "Diccionario de datos"],
    ["docs/EMPALME.md", "Empalme"],
  ]
  const hechos: string[] = [], faltan: string[] = []
  for (const [rel, tit] of docs) if (existsSync(join(cwd, rel))) { const p = mdApdf(cwd, rel, tit); if (p) hechos.push("docs/pdf/" + basename(p)); else faltan.push(tit) }
  if (!hechos.length && !faltan.length) return "No hay documentos .md todavía; corre documentar primero."
  return `PDF generados: ${hechos.join(" · ") || "ninguno"}${faltan.length ? ` · no se pudo: ${faltan.join(", ")} (¿sin navegador de pruebas?)` : ""}`
}
