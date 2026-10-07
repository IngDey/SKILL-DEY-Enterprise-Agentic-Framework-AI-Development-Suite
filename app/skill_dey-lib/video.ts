// SKILL_DEY — VIDEO de capacitación SUBTITULADO (gratis, cross-platform: Mac/Windows/Linux). 0 tokens del modelo.
// Graba la app en uso con Playwright (solo navega y resalta, NO envía ni borra nada), deriva el guion del código,
// y arma: tutorial.html (se abre en cualquier navegador, con subtítulos) + guion.srt + capacitacion.mp4 (si hay ffmpeg).
import { spawnSync } from "node:child_process"
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs"
import { join, basename } from "node:path"
import { tmpdir } from "node:os"
import { iniciarApp, asegurarPlaywright, docrootPhp, rutasAProbar } from "./app.ts"
import { arranqueLimpio, servicios, conTiempo } from "./procesos.ts"
import { listarArchivos } from "./listar.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const hayFfmpeg = () => { try { return spawnSync("ffmpeg", ["-version"], { encoding: "utf8", timeout: 10_000, shell: true }).status === 0 } catch { return false } }
const SEG = 5 // segundos por pantalla

type Paso = { ruta: string; titulo: string; texto: string; img?: string }

/** Guion de capacitación (pantalla + título + qué se hace) deducido del código. */
function guion(cwd: string): Paso[] {
  const root = docrootPhp(cwd)
  const archivos = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && !/vendor|config|includes?|conexion|node_modules|\/lib\/|\/docs\/|\/tests?\/|\.skill_dey/i.test(f))
  const pasos: Paso[] = []
  const vistas = new Set<string>()
  for (const f of archivos) {
    const src = leer(join(cwd, f))
    const ruta0 = "/" + f.replace(root + "/", "").replace(/\\/g, "/")
    const r = ruta0.startsWith("/..") ? "/" + basename(f) : ruta0
    if (vistas.has(r)) continue
    const h1 = src.match(/<h1[^>]*>([^<]{2,60})</i)?.[1]?.trim() || src.match(/<title[^>]*>([^<]{2,60})</i)?.[1]?.trim()
    const campos = [...src.matchAll(/<(?:input|select|textarea)\b[^>]*name\s*=\s*["']([^"']+)/gi)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)
    const tieneForm = /<form/i.test(src)
    const titulo = (h1 || basename(f).replace(/\.(php|html)$/i, "")).slice(0, 60)
    const texto = tieneForm && campos.length
      ? `Completa los campos (${campos.join(", ")}) y usa el botón para guardar.`
      : `Pantalla "${titulo}".`
    pasos.push({ ruta: r, titulo, texto })
    vistas.add(r)
    if (pasos.length >= 10) break
  }
  if (!pasos.length) for (const r of rutasAProbar(cwd, listarArchivos(cwd))) pasos.push({ ruta: r, titulo: r === "/" ? "Inicio" : r, texto: `Pantalla ${r}.` })
  if (!pasos.length) pasos.push({ ruta: "/", titulo: "Inicio", texto: "Pantalla principal de la aplicación." })
  return pasos
}

const pad = (n: number) => String(n).padStart(2, "0")
function srt(pasos: Paso[]): string {
  const t = (s: number) => `00:${pad(Math.floor(s / 60))}:${pad(s % 60)},000`
  return pasos.map((p, i) => `${i + 1}\n${t(i * SEG)} --> ${t((i + 1) * SEG)}\n${p.titulo}: ${p.texto}\n`).join("\n")
}

function htmlTutorial(pasos: Paso[], titulo: string): string {
  const datos = JSON.stringify(pasos.map((p) => ({ img: p.img, cap: `${p.titulo}: ${p.texto}` })))
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Capacitación · ${titulo}</title><style>
:root{color-scheme:light dark}body{margin:0;font-family:system-ui,Arial,sans-serif;background:#111;color:#eee;display:flex;flex-direction:column;height:100vh}
#top{padding:8px 12px;font-weight:600}#wrap{flex:1;position:relative;overflow:hidden;background:#000}
#img{width:100%;height:100%;object-fit:contain}#cap{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);color:#fff;padding:12px 16px;font-size:18px;line-height:1.4}
#bar{display:flex;gap:8px;align-items:center;padding:8px 12px;background:#1b1b1b}button{background:#2d6cdf;color:#fff;border:0;border-radius:6px;padding:8px 12px;font-size:14px;cursor:pointer}
#pos{margin-left:auto;font-size:13px;opacity:.8}</style></head><body>
<div id="top">🎓 Capacitación — ${titulo} <span style="opacity:.6;font-weight:400">(subtitulado, ${pasos.length} pantallas)</span></div>
<div id="wrap"><img id="img" alt=""><div id="cap"></div></div>
<div id="bar"><button onclick="ir(-1)">◀ Anterior</button><button id="pp" onclick="toggle()">⏸ Pausa</button><button onclick="ir(1)">Siguiente ▶</button><span id="pos"></span></div>
<script>
const P=${datos},SEG=${SEG};let i=0,play=true,t;
const img=document.getElementById('img'),cap=document.getElementById('cap'),pos=document.getElementById('pos'),pp=document.getElementById('pp');
function pinta(){img.src=P[i].img;cap.textContent=P[i].cap;pos.textContent=(i+1)+' / '+P.length}
function ir(d){i=(i+d+P.length)%P.length;pinta()}
function ciclo(){if(play){clearTimeout(t);t=setTimeout(()=>{i=(i+1)%P.length;pinta();ciclo()},SEG*1000)}}
function toggle(){play=!play;pp.textContent=play?'⏸ Pausa':'▶ Reproducir';if(play)ciclo();else clearTimeout(t)}
pinta();ciclo();
</script></body></html>`
}

/** Levanta la app (si hace falta), graba la capacitación y escribe docs/capacitacion/. */
export async function capacitar(cwd: string, url?: string): Promise<{ ok: boolean; lineas: string[] }> {
  const pj = asegurarPlaywright(cwd)
  if (!pj) return { ok: true, lineas: ["⏭ capacitar: falta el navegador de pruebas (sin red para instalarlo); se omitió"] }
  let arr: any = null, app: any = null
  try {
    let base = url
    if (!base && servicios(cwd).length) { arr = await conTiempo(arranqueLimpio(cwd), 95_000, null).catch(() => null); base = (arr?.lista.find((a: any) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a: any) => a.ok))?.url }
    if (!base) base = (app = await iniciarApp(cwd).catch(() => null))?.url
    if (!base) return { ok: true, lineas: ["⏭ capacitar: no pude levantar la app; pásame la url o levántala"] }
    const pasos = guion(cwd)
    const out = join(cwd, "docs", "capacitacion"); mkdirSync(out, { recursive: true })
    const script = join(tmpdir(), `skill_dey-video-${Date.now()}.mjs`)
    writeFileSync(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
import { join } from 'node:path';
const { chromium } = require('playwright');
const base=${JSON.stringify(base)}, pasos=${JSON.stringify(pasos)}, out=${JSON.stringify(out)};
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); ctx.on('dialog',d=>d.dismiss().catch(()=>{}));
const p=await ctx.newPage(); const hechos=[];
for(let i=0;i<pasos.length;i++){ const paso=pasos[i];
  try{ await p.goto(base+paso.ruta,{waitUntil:'networkidle',timeout:30000}); }catch{ try{ await p.goto(base+paso.ruta,{waitUntil:'domcontentloaded',timeout:15000}); }catch{ continue } }
  await p.evaluate(()=>{const f=document.querySelector('form'); if(f){ f.scrollIntoView({block:'center'}); f.style.outline='3px solid #e11'; }}).catch(()=>{});
  const nombre='paso-'+String(i+1).padStart(2,'0')+'.png';
  await p.screenshot({path:join(out,nombre),fullPage:false}).catch(()=>{});
  hechos.push({...paso,img:nombre});
}
await b.close(); console.log('PASOS:'+JSON.stringify(hechos));`)
    const r = spawnSync(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 600_000, maxBuffer: 5e7 })
    const line = (r.stdout ?? "").split("\n").find((l) => l.startsWith("PASOS:"))
    let hechos: Paso[] = []
    try { hechos = JSON.parse(line!.slice(6)) } catch { return { ok: true, lineas: [`⏭ capacitar: no pude grabar (${(r.stderr ?? "").split("\n")[0].slice(0, 90)})`] } }
    if (!hechos.length) return { ok: true, lineas: ["⏭ capacitar: no encontré pantallas para grabar"] }
    writeFileSync(join(out, "guion.srt"), srt(hechos))
    writeFileSync(join(out, "tutorial.html"), htmlTutorial(hechos, basename(cwd) || "app"))
    const L = [`✅ capacitación: ${hechos.length} pantalla(s) grabadas → docs/capacitacion/`, "   tutorial.html (se abre en cualquier navegador, con subtítulos) · guion.srt"]
    if (hayFfmpeg()) {
      const lista = join(out, "_lista.txt")
      writeFileSync(lista, hechos.map((h) => `file '${h.img}'\nduration ${SEG}`).join("\n") + `\nfile '${hechos[hechos.length - 1].img}'\n`)
      const mp4 = join(out, "capacitacion.mp4")
      const conSub = spawnSync(`ffmpeg -y -f concat -safe 0 -i "${lista}" -vf "subtitles=guion.srt:force_style='FontSize=18,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=1'" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300_000 })
      if (conSub.status === 0 && existsSync(mp4)) L.push("   capacitacion.mp4 (video con subtítulos quemados)")
      else { const r2 = spawnSync(`ffmpeg -y -f concat -safe 0 -i "${lista}" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300_000 }); if (r2.status === 0 && existsSync(mp4)) L.push("   capacitacion.mp4 (video; subtítulos en guion.srt)") }
    } else L.push("   (sin ffmpeg: usa tutorial.html; si instalas ffmpeg, genero también el .mp4)")
    try { unlinkSync(join(out, "_lista.txt")) } catch {} // limpiar el temporal de ffmpeg
    return { ok: true, lineas: L }
  } finally { app?.detener?.(); for (const a of arr?.lista ?? []) a.detener?.() }
}
