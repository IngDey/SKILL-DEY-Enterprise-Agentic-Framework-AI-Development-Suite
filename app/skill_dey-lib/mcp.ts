// SKILL_DEY — servidor MCP (gratis, sin dependencias): expone los chequeos y el deshacer de skill_dey como herramientas MCP,
// para que CUALQUIER IA con MCP (Claude Code, Gemini CLI, Antigravity, Cursor, Windsurf, Claude Desktop, Cline, Zed…) los use nativamente.
// Transporte stdio con JSON-RPC 2.0 delimitado por líneas. Negocia la versión del protocolo (2024-11-05 … 2025-11-25).
import { createInterface } from "node:readline"
import { homedir } from "node:os"
import { sdDir } from "./rutas.ts"
import { resolve } from "node:path"
import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs"
import { join } from "node:path"

import { rastrearSitio } from "./sitio.ts"
import { iniciarApp, asegurarPlaywright } from "./app.ts"
import { chromeAbierto, comoAbrirChrome } from "./navegador.ts"
import { revisarTodo } from "./escaneo.ts"
import { resumenSeguridad } from "./seguridad.ts"
import { organizar } from "./organizar.ts"
import { documentar } from "./documentar.ts"
import { documentosPdf } from "./pdf.ts"
import { validacionServidor, erroresProduccion } from "./extras.ts"
import { pruebasProfesionales } from "./testpro.ts"
import { capacitar } from "./video.ts"
import { revisarMovil } from "./movil.ts"
import { auditarDependencias, semgrep, sentryCheck } from "./pro.ts"
import { deshacer, rehacer, historial, deshacerArchivo } from "./respaldo.ts"
import { instalarMultiIA } from "./multiia.ts"

// stdout es SOLO para el protocolo: cualquier console.log de una revisión va a stderr (si no, rompe la conexión con la IA)
console.log = console.info = console.warn = console.debug = (...a: any[]) => { process.stderr.write(a.map(String).join(" ") + "\n") }
const PROTOCOLOS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
const PLANTILLA = /\$\{[^}]+\}/ // variable que la IA no reemplazó
/** Carpeta indicada al arrancar el servidor (--carpeta, o la que entregan Claude Code / Gemini): la usa si la IA no pasa 'carpeta'. */
const carpetaArranque = (() => { const i = process.argv.indexOf("--carpeta"); return [i > 0 ? process.argv[i + 1] : "", process.env.CLAUDE_PROJECT_DIR, process.env.GEMINI_PROJECT_DIR].find((x) => x && !PLANTILLA.test(x)) ?? "" })()

/** Carpeta del PROYECTO: obligatoria, y nunca tu carpeta personal ni la raíz del disco (ahí formatearía/documentaría todo). */
const dir = (a: any) => {
  const pedida = a?.carpeta && !PLANTILLA.test(String(a.carpeta)) ? String(a.carpeta) : carpetaArranque
  if (!pedida) throw new Error("falta 'carpeta': pásame la ruta del proyecto (no uso la carpeta desde donde arrancó tu IA)")
  const c = resolve(pedida)
  if (c === resolve(homedir()) || c === resolve("/") || /^[A-Za-z]:\\?$/.test(c)) throw new Error("esa carpeta es tu carpeta personal o la raíz del disco: pásame la carpeta del PROYECTO")
  if (!existsSync(c)) throw new Error("no existe la carpeta " + c)
  return c
}
declare const SKILL_DEY_VERSION: string
const VERSION = typeof SKILL_DEY_VERSION === "string" ? SKILL_DEY_VERSION : (() => { try { return readFileSync(sdDir("VERSION"), "utf8").trim() } catch { return "?" } })()
async function chrome(a: any): Promise<string> {
  const c = dir(a); let url = a?.url, app: any = null
  if (!url) { app = await iniciarApp(c).catch(() => null); url = app?.url }
  if (!url) return "❌ no pude levantar la app: pásame url"
  try {
    const cdp = a?.conectar ? await chromeAbierto() : null
    if (a?.conectar && !cdp) return "❌ no encontré tu Chrome con depuración. Ábrelo así y repite:\n" + comoAbrirChrome()
    return (await rastrearSitio(c, url, asegurarPlaywright(c), a?.max ?? 40, { visible: !!a?.visible, cdp })).lineas.join("\n")
  } finally { app?.detener?.() }
}
type Def = { desc: string; run: (a: any) => Promise<string> | string; url?: boolean; lee?: boolean; borra?: boolean; oculta?: boolean; extra?: Record<string, any> }
const T: Record<string, Def> = {
  skill_dey_verificar: { desc: "Revisa todo el proyecto (sintaxis, tipos, lint, conflictos). Debe salir ✅ para cerrar o hacer commit.", run: (a) => { const c = dir(a); const r = revisarTodo(c); try { mkdirSync(join(c, ".skill_dey"), { recursive: true }); writeFileSync(join(c, ".skill_dey", ".ultimo-verificar.json"), JSON.stringify({ ok: r.ok, ts: Date.now(), errores: r.errores, origen: "mcp" })) } catch {} ; return [...r.lineas, r.ok ? "✅ todo verde" : `❌ ${r.errores} problema(s): corrige y vuelve a verificar`].join("\n") } },
  skill_dey_deshacer: { desc: "Vuelve a antes del último cambio de la IA (o N, o solo un archivo); rehacer lo anula; historial lista los puntos. No toca .env.", borra: true, extra: { accion: { enum: ["deshacer", "rehacer", "historial"] }, pasos: { type: "integer" }, archivo: { type: "string" } }, run: (a) => a?.accion === "rehacer" ? rehacer(dir(a)) : a?.accion === "historial" ? historial(dir(a)) : a?.archivo ? deshacerArchivo(dir(a), String(a.archivo)) : deshacer(dir(a), Number(a?.pasos) || 1) },
  // se pueden llamar, pero no se listan (cada herramienta listada cuesta tokens en CADA mensaje): ya están dentro de otras
  skill_dey_rehacer: { desc: "Anula el último deshacer.", borra: true, oculta: true, run: (a) => rehacer(dir(a)) },
  skill_dey_historial: { desc: "Puntos guardados (1 = el último).", lee: true, oculta: true, run: (a) => historial(dir(a)) },
  skill_dey_congelar: { desc: "Ruta intocable para la IA. Solo si el usuario lo pide.", extra: { ruta: { type: "string" } }, run: (a) => { const c = dir(a); const f = join(c, ".skill_dey", "CONGELADO.txt"); if (!a?.ruta) throw new Error("falta 'ruta'"); mkdirSync(join(c, ".skill_dey"), { recursive: true }); appendFileSync(f, (existsSync(f) ? "" : "# rutas que no se tocan sin permiso\n") + String(a.ruta).trim() + "\n"); return "🧊 congelado: " + a.ruta } },
  skill_dey_multi_ia: { desc: "Reglas de skill_dey para Cursor, Copilot, Windsurf, Codex, Cline…", oculta: true, run: (a) => instalarMultiIA(dir(a)).lineas.join("\n") },
  skill_dey_chrome: { desc: "Abre la app en Chrome, recorre páginas y lee consola, errores JS, red y HTTP (+capturas). visible / conectar a tu Chrome abierto.", url: true, lee: true, extra: { visible: { type: "boolean" }, conectar: { type: "boolean", description: "tu Chrome abierto (puerto 9222)" } }, run: chrome },
  skill_dey_revisar: { desc: "Revisa errores de código, arranque y sitio. Solo informa.", lee: true, oculta: true, run: (a) => revisarTodo(dir(a)).lineas.join("\n") },
  skill_dey_seguridad: { desc: "Huecos de seguridad + auditoría de dependencias (npm/composer) + semgrep si está.", lee: true, run: async (a) => { const c = dir(a); return [...resumenSeguridad(c).lineas, ...await auditarDependencias(c), await semgrep(c)].filter(Boolean).join("\n") } },
  skill_dey_pruebas: { desc: "Testeo profesional: suite E2E + prueba en vivo + a11y + carga + cobertura + CI.", url: true, run: async (a) => (await pruebasProfesionales(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_capacitar: { desc: "Graba un video subtitulado de capacitación (docs/capacitacion).", url: true, run: async (a) => (await capacitar(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_organizar: { desc: "Ordena el proyecto: formato, estructura, duplicados, capas.", run: (a) => organizar(dir(a)) },
  skill_dey_documentar: { desc: "Manual de usuario/técnico, diccionario y script de BD + PDF.", run: (a) => { const c = dir(a); const d = documentar(c); let p = ""; try { p = documentosPdf(c) } catch {} ; return d + "\n" + p } },
  skill_dey_validar: { desc: "Campos obligatorios sin validar en servidor + código sugerido.", lee: true, run: (a) => validacionServidor(dir(a)) },
  skill_dey_produccion: { desc: "Errores del log del servidor agrupados + estado de Sentry.", lee: true, run: (a) => { const c = dir(a); return [erroresProduccion(c), sentryCheck(c)].filter(Boolean).join("\n") } },
  skill_dey_movil: { desc: "App Flutter/React Native: analizador y pruebas del stack.", lee: true, run: (a) => revisarMovil(dir(a)).lineas.join("\n") },
}

// Menos tokens: la IA re-lee estas definiciones en CADA mensaje → descripciones cortas y "url" solo donde se usa.
const toolDefs = Object.entries(T).filter(([, t]) => !t.oculta).map(([name, t]) => ({
  name, description: t.desc,
  inputSchema: { type: "object", ...(carpetaArranque ? {} : { required: ["carpeta"] }), properties: { carpeta: { type: "string", description: "ruta absoluta del proyecto" }, ...(t.url ? { url: { type: "string", description: "si la app ya corre" } } : {}), ...(t.extra ?? {}) } },
  annotations: { readOnlyHint: !!t.lee, destructiveHint: !!t.borra, openWorldHint: false },
}))

const enviar = (msg: any) => process.stdout.write(JSON.stringify(msg) + "\n")
const ok = (id: any, result: any) => enviar({ jsonrpc: "2.0", id, result })
const err = (id: any, message: string, code = -32000) => enviar({ jsonrpc: "2.0", id, error: { code, message } })

const rl = createInterface({ input: process.stdin })
rl.on("line", async (linea) => {
  if (!linea.trim()) return
  let m: any; try { m = JSON.parse(linea) } catch { return enviar({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }) }
  const { id, method, params } = m
  try {
    if (method === "initialize") return ok(id, { protocolVersion: PROTOCOLOS.includes(params?.protocolVersion) ? params.protocolVersion : PROTOCOLOS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "skill_dey", title: "SKILL DEY", version: VERSION }, instructions: "Chequeos deterministas de SKILL DEY (0 tokens del modelo). Si el usuario dice 'deshaz', usa skill_dey_deshacer." })
    if (method === "notifications/initialized" || String(method ?? "").startsWith("notifications/")) return
    if (method === "ping") return ok(id, {})
    if (method === "tools/list") return ok(id, { tools: toolDefs })
    if (method === "tools/call") {
      const t = T[params?.name]
      if (!t) return err(id, "herramienta desconocida: " + params?.name, -32602)
      try { return ok(id, { content: [{ type: "text", text: String(await t.run(params?.arguments ?? {})) }] }) }
      catch (e: any) { return ok(id, { content: [{ type: "text", text: `❌ ${params?.name}: ${String(e?.message ?? e)}` }], isError: true }) } // error de la herramienta: la IA lo ve y puede corregir
    }
    if (typeof id !== "undefined") return err(id, "método no soportado: " + method, -32601)
  } catch (e: any) { if (typeof id !== "undefined") err(id, String(e?.message ?? e)) }
})
