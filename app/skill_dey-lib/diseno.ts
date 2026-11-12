// SKILL_DEY — MOCKUP de UI desde un brief (gratis, 0 tokens del modelo). No es un Figma: genera un punto de
// partida responsive y con buen gusto (claro/oscuro) según palabras clave del brief, para que lo completes.
import { writeFileSync, mkdirSync , existsSync } from "node:fs"
import { join } from "node:path"

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))

function secciones(brief: string): string {
  const t = brief.toLowerCase(); const S: string[] = []
  if (/login|ingres|sesi[oó]n|acceso|entrar/.test(t)) S.push(`<section class="card centro"><h2>Iniciar sesión</h2><form><label>Correo<input type="email" placeholder="tu@correo.com"></label><label>Contraseña<input type="password" placeholder="••••••••"></label><button class="primario">Entrar</button><a class="link" href="#">¿Olvidaste tu contraseña?</a></form></section>`)
  if (/dashboard|tablero|panel|indicador|kpi|m[eé]trica/.test(t)) S.push(`<section><h2>Panel</h2><div class="grid">${["Ventas", "Usuarios", "Tickets", "Disponibilidad"].map((k, i) => `<div class="card kpi"><span class="etq">${k}</span><strong>${["$ 1.2M", "3,480", "27", "99.8%"][i]}</strong><span class="delta">▲ 4.2%</span></div>`).join("")}</div></section>`)
  if (/tabla|listado|registros|reporte/.test(t)) S.push(`<section class="card"><h2>Registros</h2><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead><tbody>${[1, 2, 3].map((i) => `<tr><td>2026-10-${10 + i}</td><td>Cliente ${i}</td><td><span class="chip ok">Activo</span></td><td>$ ${i}00.00</td></tr>`).join("")}</tbody></table></section>`)
  if (/formulario|registro|crear|alta|nuevo/.test(t) && !/login/.test(t)) S.push(`<section class="card"><h2>Nuevo registro</h2><form class="dos"><label>Nombre<input placeholder="Nombre"></label><label>Correo<input type="email" placeholder="correo"></label><label>Teléfono<input placeholder="300..."></label><label>Ciudad<input placeholder="Ciudad"></label><label class="full">Notas<textarea placeholder="..."></textarea></label><button class="primario">Guardar</button></form></section>`)
  if (/landing|inicio|home|p[aá]gina|portada|producto/.test(t) || !S.length) S.unshift(`<section class="hero"><h1>${esc(brief.slice(0, 60) || "Tu producto")}</h1><p>Una descripción clara y breve de lo que ofreces. Llama a la acción.</p><div><button class="primario">Empezar</button><button class="ghost">Ver más</button></div></section>`)
  return S.join("\n")
}

export function generarMockup(cwd: string, brief: string): { ok: boolean; lineas: string[] } {
  if (!brief || !brief.trim()) return { ok: false, lineas: ["di qué pantalla quieres, ej: /skill_dey mockup login con dashboard y tabla"] }
  const cuerpo = secciones(brief)
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mockup — ${esc(brief.slice(0, 40))}</title><style>
:root{--bg:#f7f8fa;--fg:#1a1d21;--card:#fff;--bor:#e5e7eb;--pri:#2d6cdf;--mut:#6b7280;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e8eaed;--card:#171a1f;--bor:#2a2e35}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,Arial,sans-serif;background:var(--bg);color:var(--fg);line-height:1.5}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--bor)}
nav a{margin-left:16px;color:var(--mut);text-decoration:none}main{max-width:1000px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:24px}
h1{font-size:2rem;margin:.2em 0}h2{margin:.2em 0 .6em}.hero{text-align:center;padding:48px 16px}
.card{background:var(--card);border:1px solid var(--bor);border-radius:12px;padding:20px}.centro{max-width:380px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.kpi{display:flex;flex-direction:column;gap:4px}
.etq{color:var(--mut);font-size:.85rem}.kpi strong{font-size:1.6rem}.delta{color:#16a34a;font-size:.85rem}
form{display:flex;flex-direction:column;gap:12px}form.dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}.full{grid-column:1/-1}
label{display:flex;flex-direction:column;gap:4px;font-size:.9rem;color:var(--mut)}input,textarea{padding:10px;border:1px solid var(--bor);border-radius:8px;background:transparent;color:var(--fg)}
button{padding:10px 16px;border-radius:8px;border:1px solid var(--bor);background:transparent;color:var(--fg);cursor:pointer;font-size:.95rem}
.primario{background:var(--pri);color:#fff;border-color:var(--pri)}.ghost{}.link{color:var(--pri);text-decoration:none;font-size:.9rem;text-align:center}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--bor)}th{color:var(--mut);font-weight:600}
.chip{padding:2px 8px;border-radius:999px;font-size:.8rem}.chip.ok{background:#16a34a22;color:#16a34a}
@media(max-width:560px){form.dos{grid-template-columns:1fr}}
</style></head><body>
<header><strong>Mi App</strong><nav><a href="#">Inicio</a><a href="#">Panel</a><a href="#">Cuenta</a></nav></header>
<main>${cuerpo}</main></body></html>`
  mkdirSync(join(cwd, "docs", "mockups"), { recursive: true })
  const base = "mockup-" + ((brief || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "pantalla")
  let f = join(cwd, "docs", "mockups", base + ".html"); for (let n = 2; existsSync(f); n++) f = join(cwd, "docs", "mockups", `${base}-${n}.html`) // nunca pisa un mockup anterior
  writeFileSync(f, html)
  return { ok: true, lineas: [`🎨 Mockup generado: docs/mockups/${f.split(/[\\/]/).pop()} (ábrelo en el navegador). Punto de partida responsive y claro/oscuro; ajústalo a tu marca.`, "   Secciones según tu brief: " + (brief.slice(0, 80))] }
}
