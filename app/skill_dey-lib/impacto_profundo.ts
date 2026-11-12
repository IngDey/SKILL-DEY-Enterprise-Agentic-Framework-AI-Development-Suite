// SKILL_DEY — IMPACTO PROFUNDO (por código, 0 tokens del modelo).
// Construye el grafo de dependencias de TODO el proyecto (quién importa a quién, aunque no se vea),
// cruza front↔back↔BD, y da un plan de cambio EN CALIENTE seguro con advertencias y mitigación.
// Pensado para apps grandes en producción (PHP/JS/TS/Python…). Sin dependencias externas.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, extname, dirname, resolve } from "node:path"

const IG_DIR = /^(node_modules|vendor|dist|build|out|\.git|\.skill_dey|coverage|\.next|\.nuxt|__pycache__|venv|\.venv|env|storage|cache|\.cache|tmp|temp|logs?|backups?|respaldos?|dumps?|exports?|export|uploads?|media|imagenes|img|data|datos)$/i
const JUNK = /\.(min|lock)\.|-lock\.|\.map$/i
const CODIGO = /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb|astro)$/i
const MAX_ARCH = 6000, MAX_BYTES = 900_000
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

function listar(cwd: string): string[] {
  const out: string[] = []; const t0 = Date.now(); let vistos = 0
  const corta = () => out.length >= MAX_ARCH || vistos > 120000 || Date.now() - t0 > 8000
  const walk = (d: string) => {
    if (corta()) return
    let es: string[] = []; try { es = readdirSync(d) } catch { return }
    for (const e of es) {
      if (corta()) return
      vistos++
      if (JUNK.test(e)) continue
      const p = join(d, e)
      let st: any; try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) { if (!IG_DIR.test(e)) walk(p) }
      else if (CODIGO.test(e) && st.size < MAX_BYTES) out.push(p)
    }
  }
  walk(cwd); return out
}

function importsDe(ruta: string, txt: string): string[] {
  const e = extname(ruta).toLowerCase(); const t: string[] = []
  if (/\.(m?[jt]sx?|cjs|vue|svelte|astro)$/.test(e)) {
    for (const m of txt.matchAll(/\bimport\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g)) t.push(m[1])
    for (const m of txt.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) t.push(m[1])
    for (const m of txt.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) t.push(m[1])
  } else if (e === ".php") {
    for (const m of txt.matchAll(/\b(?:require|include)(?:_once)?\s*\(?\s*["']([^"']+)["']/g)) t.push(m[1])
  } else if (e === ".py") {
    for (const m of txt.matchAll(/^\s*from\s+(\.[.\w]*)\s+import/gm)) t.push(m[1])
  }
  return t
}

function resolver(desde: string, spec: string, setArch: Set<string>): string | null {
  if (!spec.startsWith(".")) return null // externo (paquete) o absoluto: no es del proyecto
  const base = resolve(dirname(desde), spec.replace(/\\/g, "/"))
  const cand = [base, base + ".ts", base + ".tsx", base + ".js", base + ".jsx", base + ".mjs", base + ".cjs", base + ".vue", base + ".svelte", base + ".php", base + ".py",
    join(base, "index.ts"), join(base, "index.js"), join(base, "index.php"), join(base, "__init__.py")]
  for (const c of cand) if (setArch.has(c)) return c
  return null
}

export type Grafo = { arch: string[]; deps: Map<string, Set<string>>; rev: Map<string, Set<string>> }
export function grafo(cwd: string): Grafo {
  const arch = listar(cwd), setArch = new Set(arch)
  const deps = new Map<string, Set<string>>(), rev = new Map<string, Set<string>>()
  for (const f of arch) {
    const outs = new Set<string>()
    for (const spec of importsDe(f, leer(f))) { const r = resolver(f, spec, setArch); if (r && r !== f) outs.add(r) }
    deps.set(f, outs)
    for (const o of outs) { if (!rev.has(o)) rev.set(o, new Set()); rev.get(o)!.add(f) }
  }
  return { arch, deps, rev }
}

/** Transitivo: todos los archivos que, directa o indirectamente, dependen de `target`. */
export function dependientes(rev: Map<string, Set<string>>, target: string): Map<string, number> {
  const vista = new Map<string, number>(); const cola: [string, number][] = [[target, 0]]
  while (cola.length) {
    const [f, d] = cola.shift()!
    for (const dep of rev.get(f) ?? []) if (!vista.has(dep)) { vista.set(dep, d + 1); cola.push([dep, d + 1]) }
  }
  return vista
}

// --- cruces de capa (heurístico, barato) ---
function rutasApi(_cwd: string, arch: string[]): string[] {
  const def = new Set<string>(), uso = new Set<string>()
  for (const f of arch) {
    const t = leer(f)
    for (const m of t.matchAll(/(?:Route::(?:get|post|put|patch|delete)|app\.(?:get|post|put|patch|delete)|router\.(?:get|post|put|patch|delete))\(\s*["'`]([^"'`]+)["'`]/g)) def.add(m[1].split("?")[0])
    for (const m of t.matchAll(/(?:fetch|axios(?:\.(?:get|post|put|delete))?|\$\.(?:get|post|ajax)|http\.(?:get|post))\(\s*["'`]([^"'`]+)["'`]/g)) { const u = m[1]; if (u.startsWith("/") || u.includes("/api")) uso.add(u.split("?")[0].replace(/^https?:\/\/[^/]+/, "")) }
  }
  const huerfanas = [...uso].filter((u) => u.startsWith("/") && ![...def].some((d) => d.replace(/\{[^}]+\}|:\w+/g, "") === u.replace(/\d+/g, "").replace(/\/+$/,"") || u.startsWith(d.split("{")[0].split(":")[0])))
  return [`rutas definidas (back): ${def.size} · llamadas (front): ${uso.size}`, huerfanas.length ? `⚠ llamadas del front sin ruta clara en el back (revisar): ${huerfanas.slice(0, 8).join(", ")}` : ""].filter(Boolean)
}
function tablasBd(_cwd: string, arch: string[]): string[] {
  const tablas = new Set<string>()
  for (const f of arch) { const t = leer(f); for (const m of t.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+[`"']?(\w+)[`"']?/gi)) tablas.add(m[1]); for (const m of t.matchAll(/Schema::create\(\s*["'`](\w+)["'`]/g)) tablas.add(m[1]) }
  if (!tablas.size) return []
  const usos = new Map<string, number>()
  for (const f of arch) { const t = leer(f).toLowerCase(); for (const tb of tablas) if (t.includes(tb.toLowerCase())) usos.set(tb, (usos.get(tb) ?? 0) + 1) }
  const orden = [...usos].sort((a, b) => b[1] - a[1]).slice(0, 10)
  return [`tablas detectadas: ${tablas.size} · más usadas (cambiarlas = alto riesgo): ${orden.map(([t, n]) => `${t}(${n})`).join(", ")}`]
}
function motorJs(cwd: string): string[] {
  const pkg = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))) } catch { return null } })()
  if (!pkg) return []
  const out: string[] = []
  if (pkg.engines?.node) out.push(`engines.node = ${pkg.engines.node} (respeta este rango al cambiar versiones)`)
  out.push(`módulos: ${pkg.type === "module" ? "ESM (import)" : "CommonJS (require)"} — no mezcles los dos estilos`)
  return out
}

/** Revisión de producción: grafo completo o foco en un archivo/término. Devuelve líneas listas para mostrar. */
export function revisionProduccion(cwd: string, objetivo = ""): { lineas: string[] } {
  const g = grafo(cwd)
  if (!g.arch.length) return { lineas: ["SKILL_DEY impacto-profundo: no encontré archivos de código en este proyecto."] }
  const rel = (p: string) => relative(cwd, p)
  const L: string[] = []

  // foco en un archivo concreto si el objetivo coincide
  const foco = objetivo ? g.arch.find((f) => rel(f) === objetivo || f.endsWith("/" + objetivo) || rel(f).endsWith(objetivo)) : null
  if (foco) {
    const dep = dependientes(g.rev, foco)
    const directos = [...dep].filter(([, d]) => d === 1).map(([f]) => rel(f))
    const ocultos = [...dep].filter(([, d]) => d > 1).map(([f, d]) => `${rel(f)} (nivel ${d})`)
    L.push(`SKILL_DEY impacto-profundo de \`${rel(foco)}\``,
      `Si lo cambias, pueden romperse ${dep.size} archivo(s):`,
      directos.length ? `  • dependen directo: ${directos.slice(0, 20).join(", ")}${directos.length > 20 ? ` (+${directos.length - 20})` : ""}` : "  • nadie lo importa directo",
      ocultos.length ? `  ⚠ dependen OCULTO (en cadena, no se ve a simple vista): ${ocultos.slice(0, 20).join(", ")}${ocultos.length > 20 ? ` (+${ocultos.length - 20})` : ""}` : "",
      dep.size === 0 ? "  ✅ no parece tener dependientes: cambio de bajo riesgo (igual verifica)." : "  → actualiza TODOS sus usos en la misma iteración y verifica; si es contrato compartido, hazlo detrás de bandera/rollback.")
    return { lineas: L.filter(Boolean) }
  }

  // panorama de todo el proyecto
  const hubs = g.arch.map((f) => [f, (g.rev.get(f)?.size ?? 0)] as [string, number]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const huerfanos = g.arch.filter((f) => !(g.rev.get(f)?.size) && !(g.deps.get(f)?.size)).length
  L.push(`SKILL_DEY impacto-profundo · ${g.arch.length} archivos de código · ${huerfanos} sueltos (nadie los importa ni importan nada)`,
    "",
    "PUNTOS CRÍTICOS (muchos dependen de ellos → cambiarlos rompe más):",
    ...hubs.map(([f, n]) => `  • ${rel(f)} ← ${n} archivo(s) dependen de él`),
    hubs.length ? "" : "  (no detecté imports internos; puede ser PHP con autoload o rutas absolutas)",
    ...rutasApi(cwd, g.arch),
    ...tablasBd(cwd, g.arch),
    ...motorJs(cwd),
    "",
    "CAMBIO EN CALIENTE (producción) — protocolo seguro:",
    "  1) Respaldo + checkpoint antes de tocar (skill_dey hace copia; BD: respaldo y migra sobre copia primero).",
    "  2) Enfoca con `/skill_dey revisar <archivo>` para ver quién depende antes de editar.",
    "  3) Cambios reversibles y pequeños; detrás de bandera si es contrato compartido; ten listo el rollback.",
    "  4) Verifica tras CADA paso (skill_dey_verificar + sitio); si algo queda rojo, deshaz.",
    "  ⚠ Nada garantiza 0 fallos en vivo: esto los minimiza y deja todo reversible.")
  return { lineas: L.filter(Boolean) }
}
