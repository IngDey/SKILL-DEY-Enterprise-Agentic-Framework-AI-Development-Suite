// SKILL_DEY — manual de usuario generado POR CÓDIGO (0 tokens): una ficha completa por pantalla leída del propio código.
// Por pantalla: para qué sirve, cómo llegar, acceso, qué muestra, campos (tipo, obligatorio, opciones), botones, pasos y mensajes.
// La ficha va entre marcadores AUTO y se regenera sola; lo que alguien escriba fuera de ellos se conserva siempre.
import { readFileSync } from "node:fs"
import { join, basename } from "node:path"

const cache = new Map<string, string>()
const leer = (p: string) => { if (cache.has(p)) return cache.get(p)!; let t = ""; try { t = readFileSync(p, "utf8") } catch {} ; cache.set(p, t); return t }
const limpiar = (t: string) => t.replace(/<\?(php|=)[\s\S]*?\?>/g, " ").replace(/\{[^{}]*\}/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
const humano = (n: string) => n.replace(/\[\]$/, "").replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase())
const attr = (tag: string, a: string) => tag.match(new RegExp(`\\b${a}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1]

/** Título visible de la pantalla: <title>, <h1>/<h2> o el nombre del archivo. */
export function tituloPantalla(f: string, src: string): string {
  const t = limpiar(src.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || limpiar(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || limpiar(src.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "")
  return (t && t.length < 80 ? t : "") || humano(basename(f).replace(/\.(blade\.)?[^.]+$/, ""))
}

type Campo = { etiqueta: string; tipo: string; obligatorio: boolean; opciones: string }
function campos(src: string): Campo[] {
  const etiquetas = new Map<string, string>()
  for (const m of src.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)) { const id = attr(m[1], "for") ?? attr(m[1], "htmlFor"); if (id) etiquetas.set(id, limpiar(m[2])) }
  const out: Campo[] = [], vistos = new Set<string>()
  for (const m of src.matchAll(/<(input|select|textarea)\b([^>]*)>([\s\S]*?<\/select>)?/gi)) {
    const tag = m[2], tipo = m[1].toLowerCase() === "input" ? (attr(tag, "type") ?? "text").toLowerCase() : m[1].toLowerCase()
    if (["hidden", "submit", "button", "reset", "image"].includes(tipo)) continue
    const nombre = attr(tag, "name") ?? attr(tag, "id") ?? ""; if (!nombre || vistos.has(nombre)) continue; vistos.add(nombre)
    const id = attr(tag, "id") ?? ""
    const etiqueta = etiquetas.get(id) || attr(tag, "placeholder") || attr(tag, "aria-label") || humano(nombre)
    const opciones = m[3] ? [...m[3].matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)].map((o) => limpiar(o[1])).filter(Boolean) : []
    const T: Record<string, string> = { text: "texto", email: "correo", password: "contraseña", number: "número", date: "fecha", "datetime-local": "fecha y hora", time: "hora", tel: "teléfono", file: "archivo", checkbox: "casilla", radio: "opción", select: "lista", textarea: "texto largo", search: "búsqueda", url: "enlace", month: "mes", color: "color" }
    out.push({ etiqueta: etiqueta.replace(/[:*]\s*$/, "").trim(), tipo: T[tipo] ?? tipo, obligatorio: /\brequired\b/i.test(tag), opciones: opciones.slice(0, 6).join(", ") + (opciones.length > 6 ? "…" : "") })
  }
  return out.slice(0, 25)
}

function botones(src: string): string[] {
  const b = [...src.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)].map((m) => limpiar(m[1]))
  for (const m of src.matchAll(/<input\b([^>]*type\s*=\s*["'](submit|button)["'][^>]*)>/gi)) b.push(attr(m[1], "value") ?? "")
  for (const m of src.matchAll(/<a\b([^>]*class\s*=\s*["'][^"']*\bbtn\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi)) b.push(limpiar(m[2]))
  return [...new Set(b.map((x) => x.trim()).filter((x) => x && x.length < 40 && !/^[×✕x]$/i.test(x)))].slice(0, 12)
}

function mensajes(src: string): string[] {
  const m = new Set<string>()
  for (const x of src.matchAll(/(?:alert|confirm|toast(?:r)?\.\w+|Swal\.fire|mostrarMensaje|notify)\s*\(\s*(?:\{[^}]*?(?:title|text)\s*:\s*)?["'`]([^"'`$]{4,120})["'`]/g)) m.add(x[1])
  for (const x of src.matchAll(/["']([^"'\n]{6,120}(?:correctamente|exitosamente|con éxito|no se (?:encontr|pud)|inválid|obligatori|requerid|no tiene permiso|incorrect|ya existe|debe )[^"'\n]{0,80})["']/gi)) m.add(x[1])
  for (const x of src.matchAll(/class\s*=\s*["'][^"']*\balert\b[^"']*["'][^>]*>([^<]{6,140})</gi)) m.add(limpiar(x[1]))
  return [...m].map((s) => s.trim()).filter((s) => !/[{}<>;=]|\$\w/.test(s)).slice(0, 8)
}

function columnas(src: string): string[] { return [...new Set([...src.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => limpiar(m[1])).filter((x) => x && x.length < 40))].slice(0, 15) }

/** Ficha completa de una pantalla (markdown), deducida del código. */
export function fichaPantalla(cwd: string, f: string, todas: string[]): { titulo: string; cuerpo: string } {
  const src = leer(join(cwd, f)), titulo = tituloPantalla(f, src)
  const C = campos(src), B = botones(src), M = mensajes(src), TH = columnas(src)
  const login = (C.some((c) => c.tipo === "contraseña") || /<form/i.test(src)) && /login|ingres|iniciar sesi|acceso|signin/i.test(basename(f) + " " + titulo)
  const graficos = /new Chart\(|chart\.js|apexcharts|echarts|highcharts|recharts|<canvas/i.test(src)
  const exporta = [/xlsx|excel|phpspreadsheet|\.csv/i.test(src) && "Excel/CSV", /pdf|dompdf|tcpdf|fpdf|jspdf|window\.print/i.test(src) && "PDF/impresión"].filter(Boolean)
  const elimina = /eliminar|borrar|delete/i.test(B.join(" ") + src.slice(0, 50000))
  const sesion = /\$_SESSION\[|session_start\(|Auth::|middleware\(['"]auth|useAuth|requireAuth|isAuthenticated/.test(src)
  const rol = src.match(/\$_SESSION\[['"](rol|role|perfil|tipo_usuario)['"]\]\s*[!=]==?\s*['"]([^'"]+)['"]/i)?.[2]
  const nombreArchivo = basename(f)
  const desde = todas.filter((o) => o !== f).map((o) => ({ o, s: leer(join(cwd, o)) })).filter(({ s }) => new RegExp(`href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s) || new RegExp(`to\\s*=\\s*["']/${nombreArchivo.replace(/\.[^.]+$/, "")}["']`).test(s))
    .map(({ o, s }) => { const a = s.match(new RegExp(`<a\\b[^>]*href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>([\\s\\S]*?)<\\/a>`, "i")); return `${tituloPantalla(o, s)}${a && limpiar(a[1]) ? ` → "${limpiar(a[1])}"` : ""}` }).slice(0, 5)

  const proposito = login ? "Ingresar a la aplicación con usuario y contraseña."
    : C.length && TH.length ? `Registrar y consultar ${titulo.toLowerCase()}.`
    : C.length ? `Registrar o modificar ${titulo.toLowerCase()} mediante un formulario.`
    : graficos ? `Consultar los indicadores y gráficas de ${titulo.toLowerCase()}.`
    : TH.length ? `Consultar el listado de ${titulo.toLowerCase()}.` : `Ver ${titulo.toLowerCase()}.`
  const obligatorios = C.filter((c) => c.obligatorio).map((c) => c.etiqueta)
  const accion = B.find((b) => /guardar|registrar|enviar|crear|ingresar|entrar|aceptar|buscar|filtrar|consultar|actualizar/i.test(b)) ?? B[0]
  const pasos = [
    `Abre **${titulo}**${desde.length ? ` desde ${desde[0].split(" → ")[0]}${desde[0].includes("→") ? ` (enlace ${desde[0].split(" → ")[1]})` : ""}` : ""}.`,
    C.length ? `Completa los campos${obligatorios.length ? `; son obligatorios: ${obligatorios.join(", ")}` : ""}.` : TH.length ? "Revisa la información en la tabla." : graficos ? "Revisa las gráficas e indicadores." : "",
    accion ? `Pulsa **${accion}**.` : "",
    exporta.length ? `Para descargar la información usa la opción de exportar (${exporta.join(", ")}).` : "",
  ].filter(Boolean)

  const L = [`**Para qué sirve:** ${proposito}`]
  L.push(`**Dónde está:** \`${f.replace(/\\/g, "/")}\`${desde.length ? ` · se llega desde: ${desde.join(" · ")}` : ""}`)
  if (sesion || login) L.push(`**Acceso:** ${login ? "pantalla pública de ingreso" : `requiere iniciar sesión${rol ? ` (rol: ${rol})` : ""}`}`)
  if (TH.length || graficos) L.push(`**Qué muestra:** ${[TH.length && `tabla con ${TH.join(", ")}`, graficos && "gráficas"].filter(Boolean).join(" · ")}`)
  if (C.length) L.push("", "| Campo | Tipo | Obligatorio | Opciones |", "|---|---|---|---|", ...C.map((c) => `| ${c.etiqueta} | ${c.tipo} | ${c.obligatorio ? "Sí" : "No"} | ${c.opciones} |`), "")
  if (B.length) L.push(`**Botones:** ${B.join(" · ")}${elimina ? " (eliminar no se puede deshacer: confirma antes)" : ""}`)
  if (pasos.length) L.push("**Pasos:**", ...pasos.map((p, i) => `${i + 1}. ${p}`))
  if (M.length) L.push(`**Mensajes que puede mostrar:** ${M.map((m) => `"${m}"`).join(" · ")}`)
  return { titulo, cuerpo: L.join("\n") }
}

/** Actualiza docs/MANUAL-USUARIO.md con una ficha por pantalla (AUTO) sin tocar lo escrito a mano. */
export function manualUsuario(cwd: string, vistas: string[], doc: string): { doc: string; fichas: number } {
  cache.clear(); let fichas = 0
  // solo pantallas reales: archivos que muestran algo (los de conexión/funciones no son pantallas)
  vistas = vistas.filter((v) => /<(html|body|form|table|div|main|section|h1|h2|template)\b|echo\s|print\s|<\?=|return\s*\(?\s*</i.test(leer(join(cwd, v))))
  for (const v of vistas) {
    const id = v.replace(/\\/g, "/"), { titulo, cuerpo } = fichaPantalla(cwd, v, vistas)
    const bloque = `<!-- AUTO:pantalla:${id} (generado por skill_dey desde el código; lo de abajo de este bloque es tuyo) -->\n${cuerpo}\n<!-- /AUTO:pantalla:${id} -->`
    const re = new RegExp(`<!-- AUTO:pantalla:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} [\\s\\S]*?<!-- /AUTO:pantalla:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->`)
    if (re.test(doc)) doc = doc.replace(re, () => bloque)
    else if (doc.includes(`<!-- PANTALLA:${id} -->`)) doc = doc.replace(new RegExp(`(<!-- PANTALLA:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->\\n## [^\\n]*\\n)(_\\(pendiente:[^\\n]*\\n)?`), (_m, a) => `${a}${bloque}\n`)
    else doc += `\n<!-- PANTALLA:${id} -->\n## ${titulo}\n${bloque}\n`
    fichas++
  }
  // restos del esqueleto viejo (archivos que no son pantallas): se quitan si nadie escribió nada en ellos
  doc = doc.replace(/\n?<!-- PANTALLA:[^>]+ -->\n## [^\n]*\n_\(pendiente:[^\n]*\)_\n?/g, "\n")
  return { doc, fichas }
}
