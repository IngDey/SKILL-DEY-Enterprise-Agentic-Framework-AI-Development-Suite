// SKILL_DEY — rastreo del sitio completo: recorre TODAS las páginas internas y reporta cualquier error.
// Detecta: páginas 4xx/5xx, errores y warnings de consola, excepciones JS, peticiones fallidas (API, CSS, JS, imágenes),
// imágenes rotas, enlaces internos rotos, errores PHP/SQL impresos en la página, contenido mixto y scroll horizontal.
// Seguridad: nunca sigue enlaces destructivos (salir, borrar, eliminar…) ni descargas; no envía formularios (salvo login de prueba).
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { ABRIR_NAVEGADOR, correrNodo, correrProceso, esLocal, perfilChrome } from "./navegador.ts"

export const DESTRUCTIVO = /(logout|log-out|signout|salir|cerrar[-_]?(sesion|caja)|delete|elimin|borr|destroy|remove|quitar|anular|\bbaja|reset|truncate|drop|vaciar|\bdel(\.php|\b))/i
// En sitios REMOTOS (producción) además se evitan enlaces que cambian algo aunque sean GET (aprobar, pagar, enviar…)
const SOLO_LECTURA = /(aprob|approve|rechaz|reject|confirm|activar|desactivar|enable|disable|cancel|anular|pagar|pay|checkout|enviar|send|toggle|publicar|publish|archivar|archive|restaurar|restore|importar|sync|ejecutar|execute|run|cron|install|setup|migrat|seed|backup|respald|export)/i
const DESCARGA = /\.(pdf|zip|rar|7z|xlsx?|csv|docx?|pptx?|mp4|mp3|png|jpe?g|gif|webp|svg|ico|exe|dmg|apk)(\?|$)/i
const ERROR_TEXTO = /(Fatal error|Parse error|Warning:|Notice:|Deprecated:|Uncaught |Stack trace:|SQLSTATE\[|Traceback \(most recent|Exception in |Undefined (index|variable|array key|offset)|mysqli_|You have an error in your SQL syntax|NaN|undefined(?![\w-]))/

export type ErrorSitio = { pagina: string; tipo: string; detalle: string }
export type Rastreo = { ok: boolean; paginas: number; errores: ErrorSitio[]; lineas: string[]; conNavegador: boolean; capturas: string[] }
export type OpcNavegador = { visible?: boolean; cdp?: string | null; senal?: AbortSignal }

/** Credenciales de un usuario de PRUEBA del .env del proyecto (opcionales) para revisar páginas tras el login. */
function loginPrueba(cwd: string) {
  const env = (() => { try { return readFileSync(join(cwd, ".env"), "utf8") } catch { return "" } })()
  const v = (k: string) => env.match(new RegExp(`^\\s*${k}\\s*=\\s*"?([^"\\r\\n]*)"?`, "m"))?.[1]
  const u = v("SKILL_DEY_TEST_USER"), p = v("SKILL_DEY_TEST_PASS")
  return u && p ? { u, p } : null
}

/** Resumen corto y agrupado (ahorra tokens: mismo error en muchas páginas = una línea). */
function resumir(errores: ErrorSitio[], paginas: number, conNavegador: boolean): string[] {
  if (!errores.length) return [`✅ sitio completo: ${paginas} página(s) recorridas sin errores${conNavegador ? " (servidor, consola, red, imágenes y enlaces)" : " (servidor y enlaces; sin navegador)"}`]
  const grupos = new Map<string, string[]>()
  for (const e of errores) { const k = `${e.tipo}: ${e.detalle}`; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k)!.push(e.pagina) }
  const n = (re: RegExp) => errores.filter((e) => re.test(e.tipo)).length
  const cats = [["consola", n(/^consola error/)], ["avisos consola", n(/^consola warning/)], ["JS", n(/excepción JS/)], ["red", n(/petición fallida|sin respuesta/)], ["HTTP", n(/^(HTTP|recurso|document|xhr|fetch|script|stylesheet|image|font) ?\d/)], ["página", n(/error (visible|impreso)/)]].filter(([, c]) => c).map(([k, c]) => `${k} ${c}`).join(" · ")
  const L = [`❌ sitio: ${errores.length} error(es) en ${new Set(errores.map((e) => e.pagina)).size} de ${paginas} página(s)${cats ? " — " + cats : ""}`]
  for (const [k, ps] of [...grupos].slice(0, 20)) L.push(`   ${k.slice(0, 200)} ← ${[...new Set(ps)].slice(0, 3).join(", ")}${ps.length > 3 ? ` (+${ps.length - 3})` : ""}`)
  if (grupos.size > 20) L.push(`   … y ${grupos.size - 20} tipos más (ver .skill_dey/ERRORES-SITIO.md)`)
  return L
}

/** Rastreo sin navegador: estado HTTP, errores impresos en el HTML, enlaces y recursos rotos. */
async function rastrearFetch(cwd: string, base: string, max: number, DESTR: RegExp = DESTRUCTIVO): Promise<{ errores: ErrorSitio[]; paginas: number }> {
  const origen = new URL(base).origin, cola = [new URL(base).pathname || "/"], vistas = new Set<string>(), recursos = new Map<string, string>()
  const errores: ErrorSitio[] = []
  while (cola.length && vistas.size < max) {
    const ruta = cola.shift()!; if (vistas.has(ruta)) continue; vistas.add(ruta)
    try {
      const r = await fetch(origen + ruta, { redirect: "follow", signal: AbortSignal.timeout(15000) })
      const html = /html|text/.test(r.headers.get("content-type") ?? "") ? await r.text() : ""
      if (r.status >= 400) errores.push({ pagina: ruta, tipo: `HTTP ${r.status}`, detalle: "la página responde con error" })
      const m = html.replace(/<script[\s\S]*?<\/script>/gi, "").match(ERROR_TEXTO)
      if (m && m[0] !== "NaN" && !/^undefined/.test(m[0])) { const i = html.indexOf(m[0]); errores.push({ pagina: ruta, tipo: "error impreso en la página", detalle: html.slice(i, i + 150).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").split(cwd + "/").join("") }) }
      for (const x of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
        try { const u = new URL(x[1], origen + ruta); if (u.origin === origen && !DESTR.test(u.pathname + u.search) && !DESCARGA.test(u.pathname)) { const p = u.pathname + u.search; if (!vistas.has(p)) cola.push(p) } } catch {}
      }
      for (const x of html.matchAll(/<(?:script|img|link|source)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
        try { const u = new URL(x[1], origen + ruta); if (u.origin === origen && !recursos.has(u.href)) recursos.set(u.href, ruta) } catch {}
      }
    } catch { errores.push({ pagina: ruta, tipo: "sin respuesta", detalle: "la página no respondió en 15 s" }) }
  }
  for (const [u, pagina] of [...recursos].slice(0, 200)) {
    try { const r = await fetch(u, { method: "GET", signal: AbortSignal.timeout(10000) }); if (r.status >= 400) errores.push({ pagina, tipo: `recurso ${r.status}`, detalle: u.replace(origen, "") }) } catch { errores.push({ pagina, tipo: "recurso sin respuesta", detalle: u.replace(origen, "") }) }
  }
  return { errores, paginas: vistas.size }
}

/**
 * Recorre el sitio desde `base` (máx. `max` páginas internas) y devuelve todos los errores encontrados.
 * @param pj package.json donde está instalado Playwright (null = rastreo sin navegador)
 */
export async function rastrearSitio(cwd: string, base: string, pj: string | null, max = 40, opc: OpcNavegador = {}): Promise<Rastreo> {
  let errores: ErrorSitio[] = [], paginas = 0, conNavegador = false, nota = "", capturas: string[] = []
  const local = esLocal(base), DESTR = local ? DESTRUCTIVO : new RegExp(DESTRUCTIVO.source + "|" + SOLO_LECTURA.source, "i")
  if (!local) max = Math.min(max, 15) // producción: pocas páginas y solo lectura
  const SHOTS = join(cwd, ".skill_dey", "shots", "sitio")
  try { rmSync(SHOTS, { recursive: true, force: true }); mkdirSync(SHOTS, { recursive: true }) } catch {}
  if (pj) {
    const script = join(tmpdir(), `skill_dey-sitio-${Date.now()}.mjs`)
    writeFileSync(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
const base = ${JSON.stringify(base)}, origen = new URL(base).origin, max = ${max}, login = ${JSON.stringify(loginPrueba(cwd))};
const DESTR = ${DESTR}, DESC = ${DESCARGA}, TXT = ${ERROR_TEXTO}, SHOTS = ${JSON.stringify(SHOTS)}, CAPT = [], LOCAL = ${local};
${ABRIR_NAVEGADOR}
ctx.on('dialog', d => d.dismiss().catch(() => {}));
const cola = [new URL(base).pathname || '/'], vistas = new Set(), E = []; let logueado = false;
const RAIZ = ${JSON.stringify(cwd)};
const add = (pagina, tipo, detalle) => E.push({ pagina, tipo, detalle: String(detalle).split(origen).join('').split(RAIZ + '/').join('').split(RAIZ + '\\\\').join('').slice(0, 180) });
async function visitar(ruta) {
  // (ruta ya marcada como vista por el trabajador)
  const p = await ctx.newPage(); p.on('dialog', d => d.dismiss().catch(() => {}));
  p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/DevTools|favicon|Download the React DevTools|\\[vite\\] connect|Failed to load resource/.test(m.text())) add(ruta, 'consola ' + m.type(), m.text()) });
  p.on('pageerror', e => add(ruta, 'excepción JS', e.message));
  p.on('requestfailed', r => { const f = r.failure()?.errorText || ''; if (!/ERR_ABORTED|favicon/.test(f + r.url())) add(ruta, 'petición fallida', r.method() + ' ' + r.url() + ' ' + f) });
  p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) add(ruta, (r.request().resourceType() === 'document' ? 'HTTP ' : r.request().resourceType() + ' ') + r.status(), r.url()) });
  try { await p.goto(origen + ruta, { waitUntil: 'networkidle', timeout: 30000 }) } catch (e) { add(ruta, 'no cargó', e.message.split('\\n')[0]) }
  if (login && !logueado && LOCAL && /login|ingres|acceso|signin|sign-in|auth|entrar|iniciar/i.test(ruta + ' ' + p.url()) && (await p.$$('input[type=password]')).length === 1) {
    try { await p.fill('input[type=email], input[name*=user i], input[name*=correo i], input[name*=email i], input[type=text]', login.u); await p.fill('input[type=password]', login.p);
      await Promise.all([p.waitForLoadState('networkidle').catch(() => {}), p.press('input[type=password]', 'Enter')]); logueado = true; if (!vistas.has(new URL(p.url()).pathname)) cola.unshift(new URL(p.url()).pathname) } catch (e) { add(ruta, 'login de prueba falló', e.message.split('\\n')[0]) }
  }
  const info = await p.evaluate(() => ({
    texto: (document.body?.innerText || '').slice(0, 200000),
    rotas: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src).slice(0, 5),
    mixto: location.protocol === 'https:' ? [...document.querySelectorAll('[src^="http:"],link[href^="http:"]')].length : 0,
    hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    enlaces: [...document.querySelectorAll('a[href]')].map(a => a.href),
  })).catch(() => null);
  if (CAPT.length < 6 && E.some(e => e.pagina === ruta)) { const f = SHOTS + '/' + (ruta.replace(/^\\/+/, '').replace(/[^\\w-]+/g, '_').slice(0, 60) || 'inicio') + '.png'; try { await p.screenshot({ path: f }); CAPT.push(f) } catch {} }
  if (info) {
    let k = 0, fin = -1; for (const m of info.texto.matchAll(new RegExp(TXT.source, 'g'))) { const i = m.index; if (i < fin) continue; if (k++ >= 3) break; fin = i + 140; add(ruta, 'error visible en la página', info.texto.slice(Math.max(0, i - 20), i + 140).replace(/\\s+/g, ' ')) }
    for (const s of info.rotas) add(ruta, 'imagen rota', s);
    if (info.mixto) add(ruta, 'contenido mixto', info.mixto + ' recurso(s) http en página https');
    if (info.hscroll) add(ruta, 'diseño', 'scroll horizontal (algo se sale del ancho)');
    for (const h of info.enlaces) { try { const u = new URL(h); if (u.origin === origen && !DESTR.test(u.pathname + u.search) && !DESC.test(u.pathname)) { const r = u.pathname + u.search; if (!vistas.has(r) && !cola.includes(r)) cola.push(r) } } catch {} }
  }
  await p.close();
}
// 4 páginas a la vez (antes 1): mismo resultado, mucho menos tiempo en sitios grandes. La 1ª página va sola (posible login).
let activos = 0; const t0 = Date.now();
const trabajador = async () => { for (;;) {
  if (Date.now() - t0 > 150000) return; // guardia de reloj: nunca más de 150s por worker (evita cuelgues)
  if (!cola.length) { if (!activos) return; await new Promise(r => setTimeout(r, 40)); continue; }
  if (vistas.size >= max) return;
  const ruta = cola.shift(); if (vistas.has(ruta)) continue; vistas.add(ruta);
  activos++; try { await visitar(ruta) } finally { activos-- }
} };
await trabajador_inicial(); await Promise.all((_CDP || _VIS ? [1] : [1, 2, 3, 4]).map(trabajador)); // en tu Chrome / visible: 1 pestaña a la vez
async function trabajador_inicial() { const r = cola.shift(); vistas.add(r); await visitar(r) }
console.log(JSON.stringify({ errores: E, paginas: vistas.size, capturas: CAPT })); await _cerrar(); process.exit(0);`)
    const env: Record<string, string> = { SKILL_DEY_VISIBLE: opc.visible ? "1" : "0", SKILL_DEY_CDP: opc.cdp ?? "", SKILL_DEY_PERFIL: opc.visible && !opc.cdp ? perfilChrome() : "" }
    const correr = () => correrNodo(script, cwd, 170_000, env, opc.senal)
    let r = await correr()
    if (opc.senal?.aborted) { try { rmSync(script, { force: true }) } catch {} return { ok: false, paginas: 0, errores: [], lineas: ["⏹ prueba en Chrome cancelada por el usuario"], conNavegador: false, capturas: [] } }
    if (!process.env.SKILL_DEY_CHROMIUM && /Executable doesn't exist|playwright install/i.test(r.stderr)) { // sin Chrome en el equipo: bajar Chromium una vez y reintentar
      await correrProceso("npx", ["playwright", "install", "chromium"], dirname(pj), 300_000); r = await correr()
    }
    try { const j = JSON.parse(r.stdout.trim().split("\n").pop() ?? ""); errores = j.errores; paginas = j.paginas; capturas = j.capturas ?? []; conNavegador = true }
    catch { nota = r.tiempoAgotado ? "   ⚠ el navegador superó 170 s y se cortó (sin colgar OpenCode): revisé servidor y enlaces; repite con menos páginas (max)" : `   ⚠ el navegador de pruebas no arrancó (${(r.stderr.match(/\w*Error[^\n]*/)?.[0] ?? "sin detalle").slice(0, 120)}): consola y JS NO revisados, solo servidor y enlaces` }
    try { rmSync(script, { force: true }) } catch {}
  }
  if (!conNavegador) ({ errores, paginas } = await rastrearFetch(cwd, base, max, DESTR))
  const unicos = [...new Map(errores.map((e) => [`${e.pagina}|${e.tipo}|${e.detalle}`, e])).values()]
  const lineas = resumir(unicos, paginas, conNavegador)
  if (nota) lineas.push(nota)
  if (capturas.length) lineas.push(`   📸 capturas de las páginas con error: .skill_dey/shots/sitio/ (${capturas.length}) — míralas para ver el fallo`)
  if (!local) lineas.push("   🔒 sitio remoto: modo solo lectura (máx. 15 páginas, sin enlaces que cambien datos)")
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  writeFileSync(join(cwd, ".skill_dey", "ERRORES-SITIO.md"), [`# Errores del sitio · ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${paginas} páginas`, ...(unicos.length ? unicos.map((e) => `- [ ] ${e.pagina} · ${e.tipo} · ${e.detalle}`) : ["Sin errores."])].join("\n"))
  if (paginas <= 1 && !loginPrueba(cwd)) lineas.push("   ℹ solo se pudo ver 1 página: si el resto está tras el login, agrega un usuario de PRUEBA en .env (SKILL_DEY_TEST_USER / SKILL_DEY_TEST_PASS) y repite")
  return { ok: unicos.length === 0, paginas, errores: unicos, lineas, conNavegador, capturas }
}
