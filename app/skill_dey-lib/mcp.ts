// SKILL_DEY — servidor MCP (gratis, sin dependencias): expone los chequeos de skill_dey como herramientas MCP,
// para que CUALQUIER IA con MCP (Cursor, Windsurf, Claude Desktop, Cline, Zed, etc.) los use nativamente.
// Transporte stdio con JSON-RPC 2.0 delimitado por líneas (estándar MCP stdio).
import { createInterface } from "node:readline"
import { resolve } from "node:path"
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

const dir = (a: any) => resolve(a?.carpeta || process.cwd())
const T: Record<string, { desc: string; run: (a: any) => Promise<string> | string }> = {
  skill_dey_revisar: { desc: "Revisa errores de código, arranque y sitio. Solo informa.", run: (a) => revisarTodo(dir(a)).lineas.join("\n") },
  skill_dey_seguridad: { desc: "Huecos de seguridad + auditoría de dependencias (npm/composer) + semgrep si está.", run: (a) => { const c = dir(a); return [...resumenSeguridad(c).lineas, ...auditarDependencias(c), semgrep(c)].filter(Boolean).join("\n") } },
  skill_dey_pruebas: { desc: "Testeo profesional: suite E2E + prueba en vivo + a11y + carga + cobertura + CI.", run: async (a) => (await pruebasProfesionales(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_capacitar: { desc: "Graba un video subtitulado de capacitación (docs/capacitacion).", run: async (a) => (await capacitar(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_organizar: { desc: "Ordena el proyecto: formato, estructura, duplicados, capas.", run: (a) => organizar(dir(a)) },
  skill_dey_documentar: { desc: "Manual de usuario/técnico, diccionario y script de BD + PDF.", run: (a) => { const c = dir(a); const d = documentar(c); let p = ""; try { p = documentosPdf(c) } catch {} ; return d + "\n" + p } },
  skill_dey_validar: { desc: "Campos obligatorios sin validar en servidor + código sugerido.", run: (a) => validacionServidor(dir(a)) },
  skill_dey_produccion: { desc: "Errores del log del servidor agrupados + estado de Sentry.", run: (a) => { const c = dir(a); return [erroresProduccion(c), sentryCheck(c)].filter(Boolean).join("\n") } },
  skill_dey_movil: { desc: "App Flutter/React Native: analizador y pruebas del stack.", run: (a) => revisarMovil(dir(a)).lineas.join("\n") },
}

const toolDefs = Object.entries(T).map(([name, t]) => ({
  name, description: t.desc,
  inputSchema: { type: "object", properties: { carpeta: { type: "string", description: "ruta del proyecto (opcional)" }, url: { type: "string", description: "url si la app ya corre (opcional)" } } },
}))

const enviar = (msg: any) => process.stdout.write(JSON.stringify(msg) + "\n")
const ok = (id: any, result: any) => enviar({ jsonrpc: "2.0", id, result })
const err = (id: any, message: string) => enviar({ jsonrpc: "2.0", id, error: { code: -32000, message } })

const rl = createInterface({ input: process.stdin })
rl.on("line", async (linea) => {
  let m: any; try { m = JSON.parse(linea) } catch { return }
  const { id, method, params } = m
  try {
    if (method === "initialize") return ok(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "skill_dey", version: "32.0.0" } })
    if (method === "notifications/initialized") return
    if (method === "tools/list") return ok(id, { tools: toolDefs })
    if (method === "tools/call") {
      const t = T[params?.name]
      if (!t) return err(id, "herramienta desconocida: " + params?.name)
      const texto = await t.run(params?.arguments ?? {})
      return ok(id, { content: [{ type: "text", text: String(texto) }] })
    }
    if (typeof id !== "undefined") return err(id, "método no soportado: " + method)
  } catch (e: any) { if (typeof id !== "undefined") err(id, String(e?.message ?? e)) }
})
