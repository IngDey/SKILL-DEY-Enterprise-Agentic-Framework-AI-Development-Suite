// SKILL_DEY — extras por código (0 tokens del modelo): rendimiento, formateo, validación de servidor, errores de producción.
// Se usan en el cierre (los automáticos) y por comando. Nada de esto gasta tokens: el modelo solo recibe el resumen corto.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs"
import { join, basename } from "node:path"
import { tmpdir } from "node:os"
import { listarArchivos } from "./listar.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const sh = (c: string, cwd: string, t = 120_000) => { const r = spawnSync(c, { cwd, shell: true, encoding: "utf8", timeout: t, maxBuffer: 5e7 }); return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` } }
const hay = (c: string, cwd: string) => sh(process.platform === "win32" ? `where ${c}` : `command -v ${c}`, cwd, 8000).code === 0
const archivos = (cwd: string) => listarArchivos(cwd)

// ---------- 1) FORMATEO: deja el estilo uniforme con el formateador del proyecto (solo lo cambiado) ----------
export function formatear(cwd: string, soloCambiados = true): string {
  const files = soloCambiados ? spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd, encoding: "utf8" }).stdout.split(/\r?\n/).filter(Boolean) : []
  const existe = (...f: string[]) => f.some((x) => existsSync(join(cwd, x)))
  const r: string[] = []
  const prettier = existe(".prettierrc", ".prettierrc.json", ".prettierrc.js", "prettier.config.js") || /"prettier"/.test(leer(join(cwd, "package.json")))
  if (prettier && existsSync(join(cwd, "node_modules", ".bin", "prettier"))) { const js = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|css|scss|json|html|md)$/.test(f)); if (js.length || !soloCambiados) { const t = sh(`npx --no-install prettier --write ${soloCambiados ? js.map((f) => `"${f}"`).join(" ") : "."}`, cwd); if (t.code === 0) r.push(`prettier: ${js.length || "todos"} archivo(s)`) } }
  if (existe("vendor/bin/php-cs-fixer", ".php-cs-fixer.php", ".php-cs-fixer.dist.php")) { const t = sh("php vendor/bin/php-cs-fixer fix --quiet 2>/dev/null || vendor/bin/php-cs-fixer fix --quiet", cwd); if (t.code === 0) r.push("php-cs-fixer") }
  else if (existe(".pint.json") || existsSync(join(cwd, "vendor/bin/pint"))) { const t = sh("vendor/bin/pint --quiet", cwd); if (t.code === 0) r.push("laravel pint") }
  const py = files.filter((f) => f.endsWith(".py"))
  if ((py.length || !soloCambiados) && hay("black", cwd)) { const t = sh(`black -q ${soloCambiados ? py.map((f) => `"${f}"`).join(" ") : "."}`, cwd); if (t.code === 0) r.push("black") }
  else if ((py.length || !soloCambiados) && hay("ruff", cwd)) { sh(`ruff format ${soloCambiados ? py.map((f) => `"${f}"`).join(" ") : "."}`, cwd); r.push("ruff format") }
  return r.length ? `✅ formato aplicado (${r.join(" · ")})` : "⏭ formato: el proyecto no tiene formateador configurado (prettier/php-cs-fixer/pint/black/ruff)"
}

// ---------- 2) RENDIMIENTO: tiempos de carga por página + consultas lentas en bucle (N+1) ----------
export function consultasEnBucle(cwd: string): string[] {
  const r: string[] = []
  for (const f of archivos(cwd).filter((f) => /\.(php|m?[jt]s)$/.test(f) && !/vendor|node_modules|test/.test(f))) {
    const lineas = leer(join(cwd, f)).split(/\r?\n/); let dentro = 0
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i]
      if (/\b(for|foreach|while)\b|\.(map|forEach)\s*\(/.test(l)) dentro = 8
      else if (dentro > 0) dentro--
      if (dentro > 0 && /\b(query|execute|->get\(|->first\(|SELECT |find\(|findOne|fetchAll|mysqli_query|pg_query)\b/i.test(l)) { r.push(`${f}:${i + 1} consulta dentro de un bucle (posible N+1: saca la consulta del bucle o usa join/IN)`); dentro = 0 }
    }
  }
  return [...new Set(r)].slice(0, 8)
}
export async function rendimiento(cwd: string, base: string | undefined, rutas: string[], pj: string | null): Promise<{ lineas: string[]; lento: boolean }> {
  const nplus = consultasEnBucle(cwd)
  const L: string[] = []
  if (base && pj && rutas.length) {
    const script = join(tmpdir(), `skill_dey-perf-${Date.now()}.mjs`)
    writeFileSync(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright'); const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {});
const base=${JSON.stringify(base)}, rutas=${JSON.stringify(rutas)}, out=[];
for (const r of rutas) { const p = await b.newPage(); let bytes=0, reqs=0; p.on('response', async (resp)=>{ reqs++; try{ const h=resp.headers()['content-length']; if(h) bytes+=parseInt(h); }catch{} });
  const t=Date.now(); try{ await p.goto(base+r,{waitUntil:'load',timeout:30000}); }catch{} const ms=Date.now()-t;
  const nav = await p.evaluate(()=>{ const n=performance.getEntriesByType('navigation')[0]; return n?Math.round(n.domContentLoadedEventEnd):0; }).catch(()=>0);
  out.push({r, ms, reqs, kb: Math.round(bytes/1024), nav}); await p.close(); }
await b.close(); console.log(JSON.stringify(out));`)
    const res = sh(`node "${script}"`, cwd, 180_000)
    try { const datos = JSON.parse(res.out.trim().split("\n").pop() || "[]")
      for (const d of datos) { const lento = d.ms > 2500; L.push(`${lento ? "🐢" : "⚡"} ${d.r || "/"} · ${(d.ms / 1000).toFixed(1)}s · ${d.reqs} peticiones · ${d.kb}KB${lento ? " (lenta: >2.5s)" : ""}`) }
    } catch {}
  }
  const lento = L.some((l) => l.includes("🐢")) || nplus.length > 0
  const lineas = [L.length ? "Rendimiento por página:" : "", ...L.map((l) => "   " + l), ...(nplus.length ? ["⚠ consultas dentro de bucles (posible lentitud):", ...nplus.map((n) => "   " + n)] : [])].filter(Boolean)
  return { lineas: lineas.length ? lineas : ["✅ rendimiento: sin páginas lentas ni consultas en bucle detectadas"], lento }
}

// ---------- 3) VALIDACIÓN DE SERVIDOR: detecta campos de formulario sin validar en el backend y sugiere el código ----------
export function validacionServidor(cwd: string): string {
  const req = new Set<string>()
  for (const f of archivos(cwd).filter((f) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f)))
    for (const m of leer(join(cwd, f)).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) { const n = m[0].match(/name=["']([\w[\]]+)["']/)?.[1]; if (n) req.add(n.replace(/\[\]$/, "")) }
  if (!req.size) return "No hay campos obligatorios en formularios, o es una SPA (valida en el controlador de la API)."
  const sinValidar: string[] = []
  for (const n of req) {
    const usado = archivos(cwd).some((f) => new RegExp(`\\$_(POST|REQUEST)\\[['"]${n}['"]\\]|req\\.body\\.${n}\\b|request\\.(form|json)`).test(leer(join(cwd, f))))
    const validado = archivos(cwd).some((f) => new RegExp(`(empty|isset|filter_var|validate|trim|required)\\s*\\(?[^\\n]*${n}|["']${n}["']\\s*=>\\s*['"][^'"]*required|if\\s*\\(\\s*!\\s*(req\\.body\\.)?${n}\\b`).test(leer(join(cwd, f))))
    if (usado && !validado) sinValidar.push(n)
  }
  if (!sinValidar.length) return "✅ validación de servidor: todos los campos obligatorios se validan en el backend."
  const esLaravel = existsSync(join(cwd, "artisan")), esNode = existsSync(join(cwd, "package.json"))
  const ejemplo = esLaravel ? `$datos = $request->validate([\n${sinValidar.map((n) => `  '${n}' => 'required',`).join("\n")}\n]);`
    : esNode ? `// con zod:\nconst esquema = z.object({\n${sinValidar.map((n) => `  ${n}: z.string().min(1, "${n} es obligatorio"),`).join("\n")}\n});\nconst datos = esquema.parse(req.body);`
    : `foreach (['${sinValidar.join("','")}'] as $campo) {\n  if (empty($_POST[$campo])) { http_response_code(422); exit("Falta: $campo"); }\n}`
  return `⚠ validación de servidor: estos campos obligatorios NO se validan en el backend (el servidor los acepta vacíos): ${sinValidar.join(", ")}\nAgrega en el controlador:\n${ejemplo}`
}

// ---------- 4) ERRORES DE PRODUCCIÓN: lee el log de errores del servidor y extrae los recientes ----------
export function erroresProduccion(cwd: string): string {
  const env = leer(join(cwd, ".env"))
  const candidatos = [
    env.match(/^\s*LOG_PATH\s*=\s*["']?([^"'\r\n]+)/m)?.[1],
    "storage/logs/laravel.log", "logs/error.log", "logs/app.log", "error_log", "php_errors.log", "var/log/app.log",
  ].filter(Boolean) as string[]
  const f = candidatos.map((c) => (c.startsWith("/") ? c : join(cwd, c))).find((p) => { try { return statSync(p).isFile() } catch { return false } })
  if (!f) return "No encontré un archivo de log (define LOG_PATH en .env o dime la ruta). En producción con Sentry/Rollbar, pásame el acceso o el export."
  const txt = leer(f).split(/\r?\n/).slice(-400)
  const errs = txt.filter((l) => /(ERROR|CRITICAL|EMERGENCY|Fatal error|Uncaught|Exception|Stack trace|PHP Warning|SQLSTATE|\[error\])/i.test(l))
  const grupos = new Map<string, number>()
  for (const e of errs) { const k = e.replace(/^\[[^\]]*\]\s*/, "").replace(/\d{4}-\d{2}-\d{2}[ T][\d:.]+/g, "").replace(/0x[0-9a-f]+|#\d+|:\d+/gi, "").trim().slice(0, 140); grupos.set(k, (grupos.get(k) ?? 0) + 1) }
  if (!grupos.size) return `✅ sin errores recientes en ${basename(f)}.`
  const orden = [...grupos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  return `Errores recientes en ${basename(f)} (agrupados, más frecuentes primero):\n` + orden.map(([e, n]) => `   ×${n} ${e}`).join("\n") + "\nCorrige por causa raíz el más frecuente primero (references/depuracion.md)."
}
