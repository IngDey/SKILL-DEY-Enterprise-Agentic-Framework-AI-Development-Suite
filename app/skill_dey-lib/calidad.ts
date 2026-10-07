// SKILL_DEY — CALIDAD web profesional (gratis, cross-platform): accesibilidad (axe-core), responsive (móvil/escritorio) y carga.
// 0 tokens del modelo. Usa el navegador propio de skill_dey (no toca las dependencias del proyecto).
import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

/** Accesibilidad (WCAG, axe-core) + responsive (sin scroll horizontal en móvil) sobre varias rutas, en un solo navegador. */
export async function calidadWeb(base: string, pj: string, rutas: string[]): Promise<{ lineas: string[]; fallas: number }> {
  const script = join(tmpdir(), `skill_dey-calidad-${Date.now()}.mjs`)
  writeFileSync(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
let AxeBuilder=null; try { AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright').AxeBuilder; } catch {}
const base=${JSON.stringify(base)}, rutas=${JSON.stringify(rutas)};
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const R=[];
// ACCESIBILIDAD (escritorio)
if(AxeBuilder){ const ctx=await b.newContext();
  for(const ruta of rutas){ const p=await ctx.newPage();
    try{ await p.goto(base+ruta,{waitUntil:'networkidle',timeout:30000});
      const res=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa']).analyze();
      const graves=res.violations.filter(v=>['serious','critical'].includes(v.impact));
      for(const v of graves.slice(0,4)) R.push('A11Y · '+ruta+' · '+v.id+' ('+v.impact+', '+v.nodes.length+' elem.): '+v.help.slice(0,70));
    }catch(e){ R.push('A11Y · '+ruta+' · no se pudo analizar'); } await p.close(); }
  await ctx.close();
} else R.push('A11Y · (axe-core no disponible; reinstala el navegador de skill_dey para activarlo)');
// RESPONSIVE (móvil 390x844): sin scroll horizontal
const mob=await b.newContext({viewport:{width:390,height:844},isMobile:true});
for(const ruta of rutas){ const p=await mob.newPage();
  try{ await p.goto(base+ruta,{waitUntil:'networkidle',timeout:30000});
    const over=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+5);
    if(over){ const w=await p.evaluate(()=>document.documentElement.scrollWidth); R.push('RESPONSIVE · '+ruta+' · se desborda en móvil (ancho '+w+'px > 390): revisa anchos fijos/overflow'); }
  }catch{} await p.close(); }
await mob.close(); await b.close();
console.log('CAL:'+JSON.stringify(R));`)
  const r = spawnSync(`node "${script}"`, { shell: true, encoding: "utf8", timeout: 600_000, maxBuffer: 5e7 })
  const line = (r.stdout ?? "").split("\n").find((l) => l.startsWith("CAL:"))
  let R: string[] = []
  try { R = JSON.parse(line!.slice(4)) } catch { return { lineas: [`⏭ calidad: no se pudo ejecutar (${(r.stderr ?? "").split("\n")[0].slice(0, 80)})`], fallas: 0 } }
  const a11y = R.filter((x) => x.startsWith("A11Y ·") && !x.includes("no disponible")).length
  const resp = R.filter((x) => x.startsWith("RESPONSIVE")).length
  const fallas = R.filter((x) => /critical/.test(x)).length
  const lineas = R.length ? [`🔎 calidad: ${a11y} problema(s) de accesibilidad, ${resp} de responsive`, ...R.map((x) => "   " + x)]
    : [`✅ calidad: accesibilidad (WCAG A/AA) y responsive móvil sin problemas graves en ${rutas.length} ruta(s)`]
  return { lineas, fallas }
}

/** Prueba de CARGA/concurrencia sin herramientas de pago (fetch nativo de Node): p50/p95 y % de error. */
export async function carga(base: string, rutas: string[], usuarios = 20, rondas = 3): Promise<string[]> {
  const objetivo = rutas.slice(0, 4)
  const L: string[] = []
  for (const ruta of objetivo) {
    const tiempos: number[] = []; let errores = 0
    for (let r = 0; r < rondas; r++) {
      await Promise.all(Array.from({ length: usuarios }, async () => {
        const t = Date.now()
        try { const resp = await fetch(base + ruta, { signal: AbortSignal.timeout(15000) }); if (!resp.ok) errores++; await resp.text() }
        catch { errores++ }
        tiempos.push(Date.now() - t)
      }))
    }
    tiempos.sort((a, b) => a - b)
    const p = (q: number) => tiempos[Math.min(tiempos.length - 1, Math.floor(tiempos.length * q))] ?? 0
    const total = usuarios * rondas
    const pctErr = Math.round((errores / total) * 100)
    L.push(`${pctErr > 5 ? "⚠" : "✅"} CARGA · ${ruta} · ${total} solicitudes (${usuarios} a la vez) · p50 ${p(0.5)}ms · p95 ${p(0.95)}ms · ${pctErr}% error`)
  }
  return L.length ? [`🏋 carga (concurrencia):`, ...L.map((x) => "   " + x)] : []
}
