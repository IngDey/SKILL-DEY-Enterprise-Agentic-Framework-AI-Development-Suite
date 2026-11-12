// SKILL_DEY — RUTEO de modelos por complejidad (0 tokens del modelo): tareas simples → modelo barato/rápido;
// tareas complejas → modelo potente. Cambia antes de responder y respeta los límites (no elige uno agotado).
// Ahorra tokens y dinero sin perder calidad en lo difícil. Lo decide el CÓDIGO, no el modelo.
import { readFileSync } from "node:fs"
import { CATALOGO, estaLimitado } from "./modelos.ts"

// "mini" solo como palabra del nombre (gpt-5-mini sí; gemini o minimax NO)
const SIMPLE = /(^|[-/_.])(mini|flash|haiku|nano|lite|small|phi|gemma|instant|tiny|lightning|turbo|air|fast)(?=$|[-_.\d])|(^|[-_/])([1-9]|1[0-3])b($|[-_.])/i
const FUERTE = /ultra|(^|[-/])max($|[-])|plus|kimi|glm-?[5-9]|minimax-m[3-9]|big-pickle|opus|sonnet|gpt-?[45](?!.*(mini|nano))|(^|[-/])o[134]($|[-])|deepseek|405b|70b|72b|coder-?(14|32)|qwen.*(14|32)|large|(^|[-/])pro($|[-])|reason|(^|[-/])r1|32b/i

/** Clasifica la tarea por su texto. complejo = varias capas/BD/auth/dinero/arquitectura/refactor/app nueva/largo. */
export function clasificar(texto: string): "simple" | "complejo" {
  const t = (texto || "").toLowerCase()
  if (/\b(bd|base de datos|migrac|auth|login|sesi[oó]n|pago|dinero|arquitect|refactor|varios archivos|m[uú]ltiples|app nueva|aplicaci[oó]n nueva|integr|seguridad|despleg|desplieg|api\b|concurren|optimiz|algoritmo|dise[nñ]a|planifica|complejo|a fondo)/.test(t)) return "complejo"
  if (texto.length <= 180 && /(cambia|corrige|arregla|ajusta|color|el texto|renombra|typo|traduce|comenta|formatea|mueve|quita|agrega un (texto|campo|bot[oó]n|enlace))/.test(t)) return "simple"
  return texto.length > 420 ? "complejo" : "simple"
}

function catalogo(): Record<string, any> {
  try { return JSON.parse(readFileSync(CATALOGO, "utf8")).modelos ?? {} } catch { return {} }
}

/** Elige un modelo del tier pedido (no limitado). null si no hay uno distinto y mejor que el actual.
 *  idsOverride: lista de modelos a usar en vez del catálogo (para pruebas; no toca tu MODELOS.json). */
export function modeloPara(tier: "simple" | "complejo", actual = "", idsOverride?: string[]): { id: string; nombre: string; tier: string } | null {
  const cat = catalogo()
  const prov = actual.split("/")[0]
  // SEGURO: mismo proveedor, mismo tipo de costo (gratis↔gratis, nunca pasarte a uno de pago), con herramientas, sin preview, no agotado
  const gratisActual = cat[actual] ? !!cat[actual].gratis : /-free$|big-pickle/.test(actual) // modelo nuevo aún no catalogado: se deduce por su nombre
  const ids = idsOverride ?? Object.keys(cat).filter((id) => {
    const m = cat[id]
    return m && id.startsWith(prov + "/") && m.tools !== false && !m.preview && !!m.gratis === gratisActual && !estaLimitado(id)
  }).sort((x, y) => (cat[y].ctx ?? 0) - (cat[x].ctx ?? 0)) // a igual nivel, el de más contexto primero
  if (ids.length < 2) return null // con un solo modelo (o modelo actual desconocido) no se rutea
  const esSimple = (id: string) => SIMPLE.test(id)            // "mini/flash/haiku" mandan aunque digan gpt-4
  const esFuerte = (id: string) => FUERTE.test(id) && !esSimple(id)
  if (tier === "simple" ? esSimple(actual) : esFuerte(actual)) return null // ya está en el nivel pedido: no se toca tu elección
  const elegido = tier === "simple" ? ids.find(esSimple) : ids.find(esFuerte) // sin candidato del nivel pedido → no cambia (antes caía a cualquiera)
  if (!elegido || elegido === actual) return null
  return { id: elegido, nombre: elegido.split("/").pop() || elegido, tier }
}

/** Decisión completa: dado el texto del pedido y el modelo actual, ¿a cuál cambiar? (o null). */
/** 3 niveles: LIGERO (texto/color/estilo/typo, sin lógica) → modelo rápido · NORMAL → tu modelo · COMPLEJO → el más potente. */
export function nivel(texto: string): "ligero" | "normal" | "complejo" {
  const t = (texto || "").toLowerCase()
  if (clasificar(texto) === "complejo" && (texto.length > 420 || /\b(bd|base de datos|migrac|auth|login|sesi[oó]n|pago|dinero|arquitect|refactor|varios archivos|m[uú]ltiples|app nueva|aplicaci[oó]n nueva|integr|seguridad|despleg|desplieg|api\b|concurren|optimiz|algoritmo|dise[nñ]a|planifica|complejo|a fondo)/.test(t))) return "complejo"
  const cosmetico = /\b(color|colores|texto|t[ií]tulo|etiqueta|label|placeholder|typo|ortograf|traduc|renombra|comentario|comenta|formatea|margen|padding|espaciado|tama[nñ]o de (la )?(letra|fuente)|fuente|icono|[ií]cono|negrita|cursiva|alinea|centra|redondea|sombra|borde)/.test(t)
  const logica = /\b(error|falla|no funciona|no carga|no guarda|bug|l[oó]gica|c[aá]lculo|calcula|valida|datos|consulta|filtro|reporte|por qu[eé]|revisa|analiza|explica)/.test(t)
  return texto.length <= 200 && cosmetico && !logica ? "ligero" : "normal"
}

/** ¿Con qué modelo va ESTE pedido? Devuelve el modelo a usar, o null = tu modelo (el que elegiste). SKILL_DEY_RUTEO=0 lo apaga. */
export function rutear(texto: string, base = ""): { id: string; nombre: string; tier: string } | null {
  if (process.env.SKILL_DEY_RUTEO === "0" || !base) return null
  const n = nivel(texto)
  if (n === "normal") return null
  return modeloPara(n === "ligero" ? "simple" : "complejo", base)
}
