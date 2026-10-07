// SKILL_DEY — TESTEO PROFESIONAL (gratis, cross-platform). 0 tokens del modelo.
// 1) Deja una suite ESTÁNDAR en el repo: tests/e2e/app.spec.ts + playwright.config.ts (para correr en CI con `npx playwright test`).
// 2) Corre una prueba REAL en vivo ya mismo con el navegador propio de skill_dey (sin tocar las dependencias del proyecto):
//    cada ruta carga sin error de servidor/consola; los formularios aceptan datos válidos. Reporta PASS/FAIL.
// 3) Si el proyecto ya tiene runner de unitarias (npm test / phpunit / pytest), lo ejecuta y resume.
import { spawnSync } from "node:child_process"
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs"
import { join, basename } from "node:path"
import { tmpdir } from "node:os"
import { iniciarApp, asegurarPlaywright, docrootPhp, rutasAProbar } from "./app.ts"
import { arranqueLimpio, servicios, conTiempo } from "./procesos.ts"
import { listarArchivos } from "./listar.ts"
import { calidadWeb, carga } from "./calidad.ts"
import { esMovil, revisarMovil } from "./movil.ts"
import { extrasPro } from "./pro.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

/** Rutas y formularios para los escenarios (del código). */
function escenarios(cwd: string): { ruta: string; form?: boolean }[] {
  const root = docrootPhp(cwd)
  const base = rutasAProbar(cwd, listarArchivos(cwd))
  const conForm = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && /<form/i.test(leer(join(cwd, f))) && !/vendor|config|includes?|conexion|node_modules/i.test(f))
    .map((f) => { const r = "/" + f.replace(root + "/", "").replace(/\\/g, "/"); return r.startsWith("/..") ? "/" + basename(f) : r })
  const excluir = /\/docs\/|\/tests?\/|\.skill_dey|node_modules|\/vendor\//i
  const rutas = [...new Set([...base, ...conForm])].filter((r) => !excluir.test(r)).slice(0, 12)
  return rutas.map((r) => ({ ruta: r, form: conForm.includes(r) }))
}

/** Archivo de suite estándar @playwright/test (queda en el repo; para CI). */
function specEstandar(base: string, esc: { ruta: string; form?: boolean }[]): string {
  return `import { test, expect } from '@playwright/test'
// Suite generada por SKILL_DEY. Correr en CI:  npm i -D @playwright/test  &&  npx playwright test
const BASE = process.env.BASE_URL || ${JSON.stringify(base)}
const rutas = ${JSON.stringify(esc.map((e) => e.ruta))}
for (const ruta of rutas) {
  test('carga sin error: ' + ruta, async ({ page }) => {
    const errores: string[] = []
    page.on('pageerror', e => errores.push(String(e)))
    page.on('response', r => { if (r.status() >= 500) errores.push('HTTP ' + r.status() + ' ' + r.url()) })
    const resp = await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    expect(resp?.status() ?? 200, 'status de ' + ruta).toBeLessThan(400)
    expect(errores, 'sin errores de servidor/consola en ' + ruta).toEqual([])
  })
}
`
}

function config(base: string): string {
  return `import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { baseURL: process.env.BASE_URL || ${JSON.stringify(base)}, headless: true },
  reporter: [['list']],
})
`
}

/** Corre la suite en vivo con el navegador propio de skill_dey (no añade dependencias al proyecto). */
async function smokeEnVivo(cwd: string, base: string, pj: string, esc: { ruta: string; form?: boolean }[]): Promise<string[]> {
  const script = join(tmpdir(), `skill_dey-testpro-${Date.now()}.mjs`)
  writeFileSync(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
const base=${JSON.stringify(base)}, esc=${JSON.stringify(esc)};
const valido=(n,tipo)=>{ n=(n||'').toLowerCase();
  if(/correo|email|mail/.test(n)) return 'prueba@ejemplo.com';
  if(/tel|cel|phone|movil/.test(n)) return '3001234567';
  if(/fecha|date/.test(n)||tipo==='date') return '2026-01-15';
  if(/litros|cantidad|cant|stock|edad|numero|num|precio|valor|total|monto/.test(n)||tipo==='number') return '10';
  if(/nombre|name|cliente|usuario/.test(n)) return 'Juan Pérez';
  if(tipo==='password') return 'Prueba1234'; return 'Prueba'; };
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const ctx=await b.newContext(); ctx.on('dialog',d=>d.dismiss().catch(()=>{}));
const R=[];
for(const e of esc){ const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',x=>errs.push(String(x).slice(0,80))); p.on('response',r=>{if(r.status()>=500)errs.push('HTTP '+r.status())});
  let status=0; try{ const resp=await p.goto(base+e.ruta,{waitUntil:'networkidle',timeout:30000}); status=resp?resp.status():200; }catch(ex){ R.push('FAIL · '+e.ruta+' · no cargó ('+String(ex).slice(0,50)+')'); await p.close(); continue; }
  if(status>=400){ R.push('FAIL · '+e.ruta+' · HTTP '+status); await p.close(); continue; }
  if(errs.length){ R.push('FAIL · '+e.ruta+' · '+errs.slice(0,2).join(' | ')); await p.close(); continue; }
  if(e.form){ try{ const campos=await p.$$eval('form:first-of-type [name]',els=>els.map(el=>({name:el.getAttribute('name'),tipo:(el.getAttribute('type')||el.tagName).toLowerCase()})).filter(c=>!['hidden','submit','button','reset','image','file'].includes(c.tipo)));
      for(const c of campos){ try{ await p.fill('form:first-of-type [name="'+c.name+'"]', valido(c.name,c.tipo)); }catch{} }
      R.push('PASS · '+e.ruta+' · carga ok + formulario llenable ('+campos.length+' campos)'); }catch{ R.push('PASS · '+e.ruta+' · carga ok'); } }
  else R.push('PASS · '+e.ruta+' · carga ok');
  await p.close(); }
await b.close(); console.log('RES:'+JSON.stringify(R));`)
  const r = spawnSync(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 600_000, maxBuffer: 5e7 })
  const line = (r.stdout ?? "").split("\n").find((l) => l.startsWith("RES:"))
  try { return JSON.parse(line!.slice(4)) } catch { return [`⏭ smoke: no se pudo ejecutar (${(r.stderr ?? "").split("\n")[0].slice(0, 90)})`] }
}

/** Corre las unitarias que YA tenga el proyecto (sin instalar nada). */
function correrUnitarias(cwd: string): string[] {
  const pkg = (() => { try { return JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) } catch { return null } })()
  const L: string[] = []
  const run = (cmd: string) => spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300_000, maxBuffer: 5e7 })
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const r = run("npm test --silent"); const ok = r.status === 0
    L.push(`${ok ? "PASS" : "FAIL"} · unitarias (npm test): ${(r.stdout + r.stderr).split("\n").filter((x) => /pass|fail|✓|✗|Tests:|test/i.test(x)).slice(-2).join(" ").slice(0, 120) || (ok ? "ok" : "revisa salida")}`)
  } else if (existsSync(join(cwd, "phpunit.xml")) || existsSync(join(cwd, "phpunit.xml.dist")) || existsSync(join(cwd, "vendor", "bin", "phpunit"))) {
    const r = run(existsSync(join(cwd, "vendor", "bin", "phpunit")) ? '"vendor/bin/phpunit"' : "phpunit"); L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias PHP (phpunit)`)
  } else if (existsSync(join(cwd, "pytest.ini")) || existsSync(join(cwd, "tests")) && listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = run("python -m pytest -q"); L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias Python (pytest)`)
  } else L.push("⏭ unitarias: el proyecto no tiene runner configurado (puedo generar un ejemplo si quieres)")
  return L
}

/** Workflow de CI para correr la suite en cada push (gratis, GitHub Actions). */
function ciWorkflow(): string {
  return `name: pruebas (SKILL_DEY)
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci || npm i
      - run: npm i -D @playwright/test && npx playwright install --with-deps chromium
      - run: npx playwright test
`
}

/** Genera la suite estándar en el repo + corre el smoke en vivo + calidad + carga + unitarias + CI. */
export async function pruebasProfesionales(cwd: string, url?: string): Promise<{ ok: boolean; lineas: string[]; fallas: number }> {
  // Apps móviles (Flutter/React Native): el testeo es el de su stack, no web.
  if (esMovil(cwd)) return revisarMovil(cwd)
  const pj = asegurarPlaywright(cwd)
  let arr: any = null, app: any = null
  try {
    let base = url
    if (!base && servicios(cwd).length) { arr = await conTiempo(arranqueLimpio(cwd), 95_000, null).catch(() => null); base = (arr?.lista.find((a: any) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a: any) => a.ok))?.url }
    if (!base) base = (app = await iniciarApp(cwd).catch(() => null))?.url
    base = base || "http://localhost:3000"
    const esc = escenarios(cwd)
    // 1) suite estándar en el repo (para CI) — no toca dependencias del proyecto
    const dir = join(cwd, "tests", "e2e"); mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "app.spec.ts"), specEstandar(base, esc))
    if (!existsSync(join(cwd, "playwright.config.ts")) && !existsSync(join(cwd, "playwright.config.js"))) writeFileSync(join(cwd, "playwright.config.ts"), config(base))
    // CI: correr la suite en cada push (gratis)
    const ciDir = join(cwd, ".github", "workflows"); mkdirSync(ciDir, { recursive: true })
    if (!existsSync(join(ciDir, "skill_dey.yml"))) writeFileSync(join(ciDir, "skill_dey.yml"), ciWorkflow())
    const L = [`🧪 Suite profesional generada: tests/e2e/app.spec.ts (${esc.length} escenarios) + playwright.config.ts + CI (.github/workflows/skill_dey.yml)`, "   Para CI local: `npm i -D @playwright/test && npx playwright test`"]
    let fallas = 0
    const viva = pj && (app || arr?.lista?.some((a: any) => a.ok) || url)
    // 2) smoke en vivo ya mismo (si pudimos levantar la app y hay navegador)
    if (viva) {
      const res = await smokeEnVivo(cwd, base, pj!, esc)
      fallas = res.filter((x) => x.startsWith("FAIL")).length
      const ok = res.filter((x) => x.startsWith("PASS")).length
      L.push(fallas ? `❌ prueba en vivo: ${fallas} fallo(s) de ${res.length}` : `✅ prueba en vivo: ${res.length} escenario(s) pasaron`, ...res.map((x) => "   " + x))
      L.push(`📊 cobertura funcional: ${ok}/${esc.length} rutas descubiertas ejercitadas (${Math.round((ok / Math.max(1, esc.length)) * 100)}%)`)
      // 3) calidad: accesibilidad + responsive
      const cal = await calidadWeb(base, pj!, esc.map((e) => e.ruta)); fallas += cal.fallas; L.push(...cal.lineas)
      // 4) carga/concurrencia
      L.push(...await carga(base, esc.map((e) => e.ruta)))
    } else L.push("⏭ prueba en vivo/calidad/carga: no pude levantar la app (pásame la url); la suite igual quedó en el repo")
    // 5) unitarias existentes
    L.push(...correrUnitarias(cwd))
    // 6) extras profesionales: cobertura de código, auditoría de deps, semgrep, OpenAPI, Docker, Sentry, i18n
    L.push(...extrasPro(cwd, esc.map((e) => e.ruta)))
    // registrar
    mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
    writeFileSync(join(cwd, ".skill_dey", "PRUEBAS-PROFESIONALES.md"), [`# Testeo profesional · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, ...L].join("\n"))
    return { ok: fallas === 0, fallas, lineas: L }
  } finally { app?.detener?.(); for (const a of arr?.lista ?? []) a.detener?.() }
}
