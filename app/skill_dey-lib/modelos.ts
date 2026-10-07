// SKILL_DEY — capacidades de modelos y lectura de diseños sin visión (Excel / OCR).
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs"
import { join, extname, isAbsolute } from "node:path"
import { homedir } from "node:os"
import { inflateRawSync } from "node:zlib"
import { spawnSync } from "node:child_process"

export const CATALOGO = join(homedir(), ".config", "opencode", "skill_dey", "MODELOS.json")
export type Cap = { imagen: boolean; tools: boolean; ctx: number }

/** Capacidades del modelo: primero lo que diga OpenCode en vivo, si no el catálogo que guardó el instalador. */
export async function capacidades(client: any, modelo: string): Promise<Cap | null> {
  const [prov, ...r] = modelo.split("/"), id = r.join("/")
  try {
    const pr = await client?.config?.providers?.()
    const provs: any[] = pr?.data?.providers ?? pr?.providers ?? []
    const m = provs.find((p) => p.id === prov)?.models?.[id]
    if (m) return { imagen: !!(m.capabilities?.input?.image ?? m.modalities?.input?.includes?.("image") ?? m.attachment), tools: !!(m.capabilities?.toolcall ?? m.tool_call ?? true), ctx: m.limit?.context ?? 0 }
  } catch {}
  try { const c = JSON.parse(readFileSync(CATALOGO, "utf8")); return c.modelos?.[modelo] ?? null } catch { return null }
}
export function agenteVision(): string | null {
  try { return JSON.parse(readFileSync(CATALOGO, "utf8")).vision ?? null } catch { return null }
}

// ---------- Excel (.xlsx) → grilla de texto, sin dependencias ----------
function unzip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>()
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) return out
  let p = buf.readUInt32LE(eocd + 16), n = buf.readUInt16LE(eocd + 10)
  for (let i = 0; i < n; i++) {
    const metodo = buf.readUInt16LE(p + 10), comp = buf.readUInt32LE(p + 20), ln = buf.readUInt16LE(p + 28), le = buf.readUInt16LE(p + 30), lc = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42)
    const nombre = buf.toString("utf8", p + 46, p + 46 + ln)
    const lnL = buf.readUInt16LE(off + 26), leL = buf.readUInt16LE(off + 28), ini = off + 30 + lnL + leL
    const datos = buf.subarray(ini, ini + comp)
    try { out.set(nombre, metodo === 8 ? inflateRawSync(datos) : datos) } catch {}
    p += 46 + ln + le + lc
  }
  return out
}
const desc = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")

export function leerExcel(ruta: string, maxFilas = 60): string {
  const z = unzip(readFileSync(ruta))
  const shared = [...(z.get("xl/sharedStrings.xml")?.toString("utf8") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => desc([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")))
  const libro = z.get("xl/workbook.xml")?.toString("utf8") ?? ""
  const hojas = [...libro.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => desc(m[1]))
  // colores de relleno por estilo (para detectar zonas)
  const estilos = z.get("xl/styles.xml")?.toString("utf8") ?? ""
  const fills = [...(estilos.match(/<fills[\s\S]*?<\/fills>/)?.[0] ?? "").matchAll(/<fill>([\s\S]*?)<\/fill>/g)].map((m) => m[1].match(/fgColor rgb="(\w+)"/)?.[1]?.slice(-6) ?? "")
  const xfs = [...(estilos.match(/<cellXfs[\s\S]*?<\/cellXfs>/)?.[0] ?? "").matchAll(/<xf [^>]*>/g)].map((m) => Number(m[0].match(/fillId="(\d+)"/)?.[1] ?? 0))
  const partes: string[] = []
  const archivos = [...z.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
  archivos.forEach((k, i) => {
    const x = z.get(k)!.toString("utf8")
    const celdas: string[] = [], colores = new Map<string, string[]>()
    for (const m of x.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, ref, attrs, cuerpo = ""] = m
      const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? cuerpo.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1]
      const s = Number(attrs.match(/ s="(\d+)"/)?.[1] ?? 0), color = fills[xfs[s] ?? 0]
      if (color && color !== "FFFFFF" && color !== "000000") { if (!colores.has(color)) colores.set(color, []); colores.get(color)!.push(ref) }
      if (v === undefined) continue
      const texto = / t="s"/.test(attrs) ? shared[Number(v)] : desc(v)
      if (String(texto).trim()) celdas.push(`${ref}: ${String(texto).trim().slice(0, 80)}`)
    }
    const merges = [...x.matchAll(/<mergeCell ref="([^"]+)"/g)].map((m) => m[1])
    const anchos = [...x.matchAll(/<col [^>]*>/g)].map((m) => { const g = (k: string) => m[0].match(new RegExp(` ${k}="([\\d.]+)"`))?.[1]; const a = g("min"), b = g("max"), w = g("width"); return a && w ? `col${a}${b && b !== a ? "-" + b : ""}=${Math.round(Number(w))}` : "" }).filter(Boolean)
    partes.push(`## Hoja "${hojas[i] ?? i + 1}"`, ...celdas.slice(0, maxFilas * 4),
      merges.length ? `Celdas combinadas (= bloques/áreas): ${merges.slice(0, 40).join(", ")}` : "",
      colores.size ? "Zonas por color: " + [...colores].slice(0, 12).map(([c, r]) => `#${c} → ${r[0]}…${r[r.length - 1]} (${r.length} celdas)`).join(" · ") : "",
      anchos.length ? `Anchos de columna: ${anchos.slice(0, 20).join(" ")}` : "")
  })
  return partes.filter(Boolean).join("\n")
}

/** Lee un diseño sin visión: Excel exacto; imagen con OCR (tesseract) si está instalado. */
export function leerDisenoSinVision(cwd: string, ruta: string): string {
  const f = isAbsolute(ruta) ? ruta : join(cwd, ruta)
  if (!existsSync(f)) return `No existe ${ruta}.`
  const e = extname(f).toLowerCase()
  if (e === ".xlsx" || e === ".xlsm") return `Diseño en Excel (leído exacto, sin visión):\n${leerExcel(f)}`
  if (statSync(f).size > 25_000_000) return "Imagen demasiado grande."
  const t = spawnSync("tesseract", [f, "-", "-l", "spa+eng", "--psm", "11"], { encoding: "utf8", timeout: 60_000 })
  if (t.status === 0 && t.stdout.trim()) return `Textos detectados en la imagen (OCR, aproximado; sin la distribución visual):\n${t.stdout.split(/\r?\n/).filter((l) => l.trim()).slice(0, 80).join("\n")}`
  return "No hay modelo con visión disponible ni OCR instalado. Instala tesseract (Windows: winget install UB-Mannheim.TesseractOCR · macOS: brew install tesseract · Linux: sudo apt install tesseract-ocr tesseract-ocr-spa) o elige en /models uno que vea imágenes."
}

// ---------- límites de uso: elegir con qué modelo seguir ----------
const DIR = join(homedir(), ".config", "opencode", "skill_dey")
const LIMITES = join(DIR, "LIMITES.json"), RANKING = join(DIR, "RANKING.json")
const leerJ = (f: string, d: any) => { try { return JSON.parse(readFileSync(f, "utf8")) } catch { return d } }
// Límite de uso, cupo agotado, sin créditos, sobrecarga o contexto lleno: en todos conviene seguir con otro modelo
export const esErrorDeLimite = (e: any) => /\b(429|402|529)\b|rate.?limit|quota|limit (exceeded|reached)|exceeded (your|the)|too many requests|usage limit|free.*(limit|tier|usage)|daily limit|insufficient.*(quota|credit|balance|funds)|out of credits|no credits|payment required|resource.?exhausted|overloaded|capacity|context.?(length|window)|maximum context|prompt is too long|too many tokens|token limit/i.test(JSON.stringify(e ?? ""))
export function marcarLimitado(modelo: string) {
  const l = leerJ(LIMITES, {}); l[modelo] = Date.now(); mkdirSync(DIR, { recursive: true }); writeFileSync(LIMITES, JSON.stringify(l, null, 1))
}
/** Siguiente modelo: ranking del comparador si existe; si no, gratuitos con herramientas del mismo proveedor (buenos para código primero). Salta los limitados en la última hora. */
export function siguienteModelo(actual: string, necesitaImagen = false): { id: string; nombre: string } | null {
  const cat = leerJ(CATALOGO, {}).modelos ?? {}
  const lim = leerJ(LIMITES, {}), ahora = Date.now()
  const libre = (id: string) => id !== actual && !(lim[id] && ahora - lim[id] < 3_600_000)
  const ok = (id: string) => { const m = cat[id]; return m && m.tools !== false && (!necesitaImagen || m.imagen) }
  const rank: string[] = leerJ(RANKING, {}).orden ?? []
  const prov = actual.split("/")[0]
  const pref = (id: string) => (/big-pickle|nemotron-3-ultra|ling|muse|mimo|qwen|deepseek|kimi|glm|minimax|gpt|claude|gemini/i.test(id) ? 1 : 0)
  const resto = Object.keys(cat).filter((id) => cat[id].gratis === (cat[actual]?.gratis ?? true) && !cat[id].preview)
    .sort((a, b) => Number(b.startsWith(prov + "/")) - Number(a.startsWith(prov + "/")) || pref(b) - pref(a) || (cat[b].ctx ?? 0) - (cat[a].ctx ?? 0))
  const id = [...rank, ...resto].find((x) => libre(x) && ok(x))
  return id ? { id, nombre: cat[id]?.nombre ?? id } : null
}
/** ¿Ese modelo llegó a su límite en la última hora? */
export const estaLimitado = (id: string) => { const t = leerJ(LIMITES, {})[id]; return !!t && Date.now() - t < 3_600_000 }
/** Resumen para "/skill_dey modelos": gratis con herramientas, cuáles están en límite y cuál sigue. */
export function resumenModelos(actual = ""): string {
  const cat = leerJ(CATALOGO, {}).modelos ?? {}, lim = leerJ(LIMITES, {}), ahora = Date.now()
  const ids = Object.keys(cat).filter((id) => cat[id].gratis && cat[id].tools !== false && !cat[id].preview)
  const L = ids.slice(0, 30).map((id) => { const t = lim[id] && ahora - lim[id] < 3_600_000 ? Math.ceil((3_600_000 - (ahora - lim[id])) / 60_000) : 0; return `| ${cat[id].nombre ?? id} | \`${id}\` | ${t ? `⛔ en límite (libre en ~${t} min)` : "✅ disponible"} | ${cat[id].imagen ? "sí" : "no"} |` })
  const sig = actual ? siguienteModelo(actual) : null
  return [`**Modelos gratis** (${ids.length})${actual ? ` · actual: \`${actual}\`` : ""}${sig ? ` · si se agota sigue: **${sig.nombre}**` : ""}`, "", "| Modelo | Id | Estado | Ve imágenes |", "|---|---|---|---|", ...L,
    "", "Cuando uno llega al límite, skill_dey sigue la tarea con el siguiente y usa ese en tus próximos mensajes durante 1 hora."].join("\n")
}
export function guardarRanking(orden: string[]) { mkdirSync(DIR, { recursive: true }); writeFileSync(RANKING, JSON.stringify({ actualizado: new Date().toISOString(), orden }, null, 1)) }
