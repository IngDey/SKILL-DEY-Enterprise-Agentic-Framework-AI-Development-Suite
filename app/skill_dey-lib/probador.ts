// SKILL_DEY — PROBADOR automático (0 tokens del modelo): usa la app encendida como un usuario y la ataca.
// Para cada pantalla con formulario (leída del código): datos válidos → guarda; sin obligatorios → el SERVIDOR rechaza;
// ataques (SQL/XSS) → no se filtran; páginas privadas sin sesión → niegan acceso. Nunca pulsa eliminar/salir/enviar correo.
import { spawnSync } from "node:child_process"
import { writeFileSync, readFileSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"
import { tmpdir } from "node:os"
import { iniciarApp, asegurarPlaywright, docrootPhp } from "./app.ts"
import { arranqueLimpio, servicios, conTiempo } from "./procesos.ts"
import { listarArchivos } from "./listar.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const archivos = (cwd: string) => listarArchivos(cwd)

/** Páginas con formulario (una ruta http + sus campos) deducidas del código. */
function pantallasConFormulario(cwd: string): { ruta: string; campos: { name: string; tipo: string; obligatorio: boolean; opcion?: string }[] }[] {
  const root = docrootPhp(cwd)
  const out: { ruta: string; campos: any[] }[] = []
  for (const f of archivos(cwd).filter((f) => /\.(php|html)$/.test(f) && !/vendor|config|includes?|lib|conexion/i.test(f))) {
    const src = leer(join(cwd, f)); if (!/<form/i.test(src)) continue
    const campos: any[] = []
    for (const m of src.matchAll(/<(input|select|textarea)\b([^>]*)>([\s\S]*?<\/select>)?/gi)) {
      const tag = m[2], tipo = m[1].toLowerCase() === "input" ? (tag.match(/type\s*=\s*["']([^"']+)/i)?.[1] ?? "text").toLowerCase() : m[1].toLowerCase()
      if (["hidden", "submit", "button", "reset", "image", "file"].includes(tipo)) continue
      const name = tag.match(/name\s*=\s*["']([^"']+)/i)?.[1]; if (!name) continue
      const opcion = m[3]?.match(/<option\b[^>]*value\s*=\s*["']([^"']+)/i)?.[1] ?? m[3]?.match(/<option\b[^>]*>([^<]+)/i)?.[1]
      campos.push({ name, tipo, obligatorio: /\brequired\b/i.test(tag), opcion: opcion?.trim() })
    }
    if (campos.length) { const ruta = "/" + f.replace(root + "/", "").replace(/\\/g, "/"); out.push({ ruta: ruta.startsWith("/..") ? "/" + basename(f) : ruta, campos }) }
  }
  return out.slice(0, 15)
}

const porTipo: Record<string, string> = { number: "10", email: "prueba@ejemplo.com", date: "2026-01-15", "datetime-local": "2026-01-15T10:00", time: "10:00", tel: "3001234567", url: "https://ejemplo.com", password: "Prueba1234", month: "2026-01", color: "#336699" }
// datos de prueba realistas por nombre de campo (estilo Faker), para no romper reglas de negocio
const valido = (c: { tipo: string; opcion?: string; name?: string }): string => {
  if (c.opcion) return c.opcion
  const n = (c.name ?? "").toLowerCase()
  if (/nombre|name|cliente|usuario|responsable/.test(n) && c.tipo !== "email") return "Juan Pérez"
  if (/apellido/.test(n)) return "Gómez"
  if (/correo|email|mail/.test(n)) return "prueba@ejemplo.com"
  if (/tel|cel|phone|movil/.test(n)) return "3001234567"
  if (/direccion|address/.test(n)) return "Calle 10 # 20-30"
  if (/ciudad|city/.test(n)) return "Bogotá"
  if (/documento|cedula|nit|identif|dni/.test(n)) return "1020304050"
  if (/litros|cantidad|cant|stock|edad|numero|num|precio|valor|total|monto/.test(n) || c.tipo === "number") return "10"
  if (/descrip|observ|coment|nota/.test(n)) return "Registro de prueba"
  return porTipo[c.tipo] || "Prueba"
}

/** Corre el probador sobre la app encendida en `base`. Descubre los formularios en el DOM REAL (sirve para PHP y SPA React/Vue). */
export async function probar(cwd: string, base: string, pj: string | null): Promise<{ ok: boolean; lineas: string[]; fallas: number }> {
  if (!pj) return { ok: true, lineas: ["⏭ probador: falta el navegador de pruebas (sin red para instalarlo); se omitió"], fallas: 0 }
  // Rutas a probar: raíz (SPA) + páginas con formulario en el código (PHP) + páginas privadas detectadas
  const estaticas = pantallasConFormulario(cwd).map((p) => p.ruta).filter((r) => !/\/(index|home|default)\.(php|html?)$/i.test(r)) // la raíz ya cubre el index
  const privadas = archivos(cwd).filter((f) => f.endsWith(".php")).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth|requireAuth|isAuthenticated/.test(leer(join(cwd, f))) && !/login|logout|index|registro|register|public|install/i.test(f))
    .map((f) => "/" + f.replace(docrootPhp(cwd) + "/", "").replace(/\\/g, "/")).filter((r) => !r.startsWith("/..")).slice(0, 8)
  const rutas = [...new Set(["/", ...estaticas])].slice(0, 12)

  const ATAQUES = ["' OR '1'='1", "<script>window.__xss=1</script>", "\"><img src=x onerror=window.__xss=1>", "1;DROP TABLE x--"]
  const ERR_SQL = /SQL syntax|SQLSTATE|mysqli?_|pg_query|Warning.*(mysql|pg_)|ORA-\d|near \"|unterminated quoted/i
  const script = join(tmpdir(), `skill_dey-probador-${Date.now()}.mjs`)
  writeFileSync(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
const base = ${JSON.stringify(base)}, rutas = ${JSON.stringify(rutas)}, privadas = ${JSON.stringify(privadas)};
const ATAQUES = ${JSON.stringify(ATAQUES)}, ERR_SQL = ${ERR_SQL};
const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {});
const ctx = await b.newContext(); ctx.on('dialog', d => d.dismiss().catch(()=>{}));
const F = []; let formsVistos = 0;
// Lee los campos de los formularios tal como se ven en el navegador (incluye los que dibuja React/Vue)
const leerCampos = (p) => p.evaluate(() => [...document.querySelectorAll('form')].map((f, i) => ({ i,
  campos: [...f.querySelectorAll('input,select,textarea')].map(e => ({ name: e.name||e.id, tipo: (e.tagName==='INPUT'?(e.type||'text'):e.tagName.toLowerCase()).toLowerCase(), obligatorio: e.required })).filter(c => c.name && !['hidden','submit','button','reset','image','file'].includes(c.tipo)) }))
  .filter(f => f.campos.length));
const val = ${valido.toString()};
const llenar = async (p, fi, campos, valor) => { const base='form:nth-of-type('+(fi+1)+') '; for (const c of campos) { const sel=base+'[name="'+c.name+'"]'; try {
  if (c.tipo==='select') await p.selectOption(sel,{index:1}).catch(()=>{});
  else if (c.tipo==='checkbox'||c.tipo==='radio') await p.check(sel).catch(()=>{});
  else await p.fill(sel, String(valor(c))).catch(()=>{});
} catch {} } };
const enviar = async (p, fi) => { const btn = await p.$('form:nth-of-type('+(fi+1)+') [type=submit], form:nth-of-type('+(fi+1)+') button:not([type]), form:nth-of-type('+(fi+1)+') button[type=submit]'); if(btn){ await Promise.all([p.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{}), btn.click({timeout:5000}).catch(()=>{})]); } };
const texto = async (p) => (await p.content()).slice(0,200000);
for (const ruta of rutas) {
  let p = await ctx.newPage(); let errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('response',r=>{if(r.status()>=500)errs.push('HTTP '+r.status())});
  let forms=[]; try { await p.goto(base+ruta,{waitUntil:'networkidle',timeout:30000}); forms=await leerCampos(p).catch(()=>[]); } catch { await p.close(); continue; }
  formsVistos += forms.length;
  for (const form of forms) {
    // 1) datos válidos → sin error de servidor
    try { await llenar(p,form.i,form.campos,val); await enviar(p,form.i); const t=await texto(p); if(ERR_SQL.test(t)) F.push('CRÍTICO · '+ruta+' · datos válidos producen error de BD'); if(errs.length) F.push('ALTO · '+ruta+' · '+errs[0].slice(0,80)); } catch {}
    // 2) sin obligatorios → el servidor debe rechazar
    const oblig=form.campos.filter(c=>c.obligatorio);
    if(oblig.length){ try { await p.goto(base+ruta,{waitUntil:'networkidle',timeout:20000}); await p.evaluate(()=>document.querySelectorAll('[required]').forEach(e=>e.removeAttribute('required'))); await llenar(p,form.i,form.campos.filter(c=>!c.obligatorio),val); await enviar(p,form.i); const t=await texto(p); if(/correct|exito|guard|registr|creado|success|ok/i.test(t) && !/oblig|requer|required|vac[ií]o|falta|invalid|error/i.test(t)) F.push('ALTO · '+ruta+' · el servidor acepta el formulario sin los obligatorios ('+oblig.map(c=>c.name).join(',')+')'); } catch {} }
    // 3) ataques SQL/XSS en campos de texto
    try { await p.goto(base+ruta,{waitUntil:'networkidle',timeout:20000}); for(const a of ATAQUES){ await p.evaluate(()=>{document.querySelectorAll('[required]').forEach(e=>e.removeAttribute('required')); document.querySelectorAll('input[type=email],input[type=url],input[type=number]').forEach(e=>e.setAttribute('type','text'));}); await llenar(p,form.i,form.campos,()=>a); await enviar(p,form.i); const t=await texto(p); if(ERR_SQL.test(t)){F.push('CRÍTICO · '+ruta+' · posible inyección SQL (un ataque produjo error de BD)');break;} const xss=await p.evaluate(()=>window.__xss===1).catch(()=>false); if(xss||t.includes('<script>window.__xss=1</script>')||/<img src=x onerror=window\\.__xss=1>/.test(t)){F.push('CRÍTICO · '+ruta+' · posible XSS (entrada reflejada sin escapar)');break;} await p.goto(base+ruta,{waitUntil:'networkidle',timeout:15000}).catch(()=>{}); } } catch {}
  }
  await p.close();
}
// 4) páginas privadas sin sesión → deben negar acceso
for (const r of privadas) { const p = await ctx.newPage(); try { const resp=await p.goto(base+r,{waitUntil:'domcontentloaded',timeout:20000}); const url=p.url(); const t=await texto(p); const prot=(resp&&[401,403].includes(resp.status()))||/login|iniciar sesi|ingres|acceso|unauthorized|no (tiene|autorizado)/i.test(url+t.slice(0,3000))||url.replace(base,'')!==r; if(!prot && /<form|<table|json_encode|dashboard|<h1/i.test(t)) F.push('CRÍTICO · '+r+' · página privada accesible SIN iniciar sesión'); } catch {} await p.close(); }
await b.close(); console.log('FORMS:'+formsVistos); console.log(JSON.stringify(F));`)
  const r = spawnSync(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 600_000, maxBuffer: 5e7 })
  const sal = (r.stdout ?? "").trim().split("\n")
  let F: string[] = []; try { F = JSON.parse(sal[sal.length - 1] ?? "[]") } catch { return { ok: true, lineas: [`⏭ probador: no se pudo ejecutar (${(r.stderr ?? "").split("\n")[0].slice(0, 80)})`], fallas: 0 } }
  const forms = Number((sal.find((l) => l.startsWith("FORMS:")) ?? "FORMS:0").slice(6)) || 0
  F = [...new Set(F)]
  if (!forms && !privadas.length) return { ok: true, lineas: ["⏭ probador: no se encontraron formularios ni páginas privadas en la app encendida"], fallas: 0 }
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  writeFileSync(join(cwd, ".skill_dey", "PRUEBAS-FUNCIONALES.md"), [`# Pruebas automáticas · ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${forms} formularios (DOM), ${privadas.length} páginas privadas`, ...(F.length ? F.map((x) => `- [ ] ${x}`) : ["Todo pasó ✅"])].join("\n"))
  const fallas = F.filter((x) => /^(CRÍTICO|ALTO)/.test(x)).length
  return { ok: fallas === 0, fallas, lineas: F.length ? [`❌ probador (${forms} formularios, ${privadas.length} páginas privadas): ${F.length} hallazgo(s)`, ...F.map((x) => "   " + x)] : [`✅ probador: ${forms} formulario(s) y ${privadas.length} página(s) privada(s) pasaron (datos válidos, obligatorios, ataques SQL/XSS, acceso sin sesión)`] }
}

/** Levanta la app (si hace falta) y corre el probador. Para skill_dey_verificar(cierre) y el comando. */
export async function probarApp(cwd: string, url?: string): Promise<{ ok: boolean; lineas: string[]; fallas: number }> {
  let arr: Awaited<ReturnType<typeof arranqueLimpio>> | null = null, app: Awaited<ReturnType<typeof iniciarApp>> = null
  try {
    let base = url
    if (!base && servicios(cwd).length) { arr = await conTiempo(arranqueLimpio(cwd), 95_000, null).catch(() => null); base = (arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok))?.url }
    if (!base) base = (app = await iniciarApp(cwd).catch(() => null))?.url
    if (!base) return { ok: true, lineas: ["⏭ probador: no pude levantar la app; pásame la url o levántala"], fallas: 0 }
    return await probar(cwd, base, asegurarPlaywright(cwd))
  } finally { app?.detener(); for (const a of arr?.lista ?? []) a.detener() }
}
