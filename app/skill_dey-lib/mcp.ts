// SKILL_DEY — servidor MCP (gratis, sin dependencias): los chequeos y el deshacer de SKILL_DEY como herramientas MCP
// para Claude Code, Gemini CLI, Antigravity, Cursor, Windsurf, Claude Desktop, Cline, Zed y cualquier cliente MCP.
// Transporte stdio con JSON-RPC 2.0 delimitado por líneas. Negocia la versión del protocolo (2024-11-05 … 2025-11-25).
import { createInterface } from "node:readline"
import { resolve, join } from "node:path"
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from "node:fs"
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
import { deshacer, rehacer, historial } from "./respaldo.ts"
import { instalarMultiIA } from "./multiia.ts"

declare const SKILL_DEY_VERSION: string
const VERSION = typeof SKILL_DEY_VERSION === "string" ? SKILL_DEY_VERSION : "dev"
const PROTOCOLOS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]

// stdout es SOLO para el protocolo: cualquier console.log de una revisión va a stderr (si no, rompe la conexión)
console.log = console.info = console.warn = console.debug = (...a: any[]) => process.stderr.write(a.map(String).join(" ") + "\n")

const argCarpeta = (() => { const i = process.argv.indexOf("--carpeta"); return i > 0 ? process.argv[i + 1] : "" })()
const PLANTILLA = /\$\{[^}]+\}/ // variable que el host no reemplazó
const carpetaPorDefecto = () => [argCarpeta, process.env.CLAUDE_PROJECT_DIR, process.env.GEMINI_PROJECT_DIR, process.env.WORKSPACE_PATH, process.cwd()].find((x) => x && !PLANTILLA.test(x)) as string
const dir = (a: any) => resolve(a?.carpeta && !PLANTILLA.test(a.carpeta) ? a.carpeta : carpetaPorDefecto())

type Def = { titulo: string; desc: string; run: (a: any) => Promise<string> | string; soloLectura?: boolean; destructiva?: boolean; extra?: Record<string, any>; requeridos?: string[] }
const T: Record<string, Def> = {
  skill_dey_verificar: {
    titulo: "Verificar (cero errores)", soloLectura: false,
    desc: "Revisa TODO el proyecto (sintaxis, tipos, lint, arranque, seguridad básica). Úsala para cerrar cualquier cambio: debe salir ✅. Deja constancia para el guardián.",
    run: (a) => { const c = dir(a); const r = revisarTodo(c); try { mkdirSync(join(c, ".skill_dey"), { recursive: true }); writeFileSync(join(c, ".skill_dey", ".ultimo-verificar.json"), JSON.stringify({ ok: r.ok, ts: Date.now(), errores: r.errores, origen: "mcp" })) } catch {} ; return [...r.lineas, r.ok ? "✅ todo verde" : `❌ ${r.errores} problema(s): corrige y vuelve a verificar`].join("\n") },
  },
  skill_dey_deshacer: {
    titulo: "Deshacer", destructiva: true,
    desc: "Devuelve el proyecto a como estaba antes del último cambio de la IA (o de N cambios). No toca .env. Se puede rehacer.",
    extra: { pasos: { type: "integer", minimum: 1, maximum: 60, description: "cuántos cambios deshacer (defecto 1)" } },
    run: (a) => deshacer(dir(a), Number(a?.pasos) || 1),
  },
  skill_dey_rehacer: { titulo: "Rehacer", destructiva: true, desc: "Revierte el último deshacer.", run: (a) => rehacer(dir(a)) },
  skill_dey_historial: { titulo: "Historial de cambios", soloLectura: true, desc: "Lista los cambios que se pueden deshacer (1 = el último).", run: (a) => historial(dir(a)) },
  skill_dey_congelar: {
    titulo: "Congelar ruta", soloLectura: false, requeridos: ["ruta"],
    desc: "Marca una carpeta o archivo como intocable (el guardián bloquea cambios ahí). Solo si el usuario lo pide.",
    extra: { ruta: { type: "string", description: "ruta relativa al proyecto, ej. pagos/" } },
    run: (a) => { const c = dir(a); const f = join(c, ".skill_dey", "CONGELADO.txt"); mkdirSync(join(c, ".skill_dey"), { recursive: true }); appendFileSync(f, (existsSync(f) ? "" : "# rutas que no se tocan sin permiso\n") + String(a.ruta).trim() + "\n"); return "🧊 congelado: " + a.ruta },
  },
  skill_dey_revisar: { titulo: "Revisar", soloLectura: true, desc: "Revisa errores de código, arranque y sitio. Solo informa.", run: (a) => revisarTodo(dir(a)).lineas.join("\n") },
  skill_dey_seguridad: { titulo: "Seguridad", soloLectura: true, desc: "Huecos de seguridad + auditoría de dependencias (npm/composer) + semgrep si está.", run: (a) => { const c = dir(a); return [...resumenSeguridad(c).lineas, ...auditarDependencias(c), semgrep(c)].filter(Boolean).join("\n") } },
  skill_dey_pruebas: { titulo: "Pruebas profesionales", desc: "Suite E2E + prueba en vivo + accesibilidad + carga + cobertura + CI. Solo cuando el usuario lo pida.", run: async (a) => (await pruebasProfesionales(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_capacitar: { titulo: "Video de capacitación", desc: "Graba un video subtitulado de capacitación (docs/capacitacion). Solo cuando el usuario lo pida.", run: async (a) => (await capacitar(dir(a), a?.url)).lineas.join("\n") },
  skill_dey_organizar: { titulo: "Organizar proyecto", desc: "Ordena el proyecto: formato, estructura, duplicados, capas.", run: (a) => organizar(dir(a)) },
  skill_dey_documentar: { titulo: "Documentar", desc: "Manual de usuario/técnico, diccionario de datos y script de BD + PDF.", run: (a) => { const c = dir(a); const d = documentar(c); let p = ""; try { p = documentosPdf(c) } catch {} ; return d + "\n" + p } },
  skill_dey_validar: { titulo: "Validación en servidor", soloLectura: true, desc: "Campos obligatorios sin validar en servidor + código sugerido.", run: (a) => validacionServidor(dir(a)) },
  skill_dey_produccion: { titulo: "Errores de producción", soloLectura: true, desc: "Errores del log del servidor agrupados + estado de Sentry.", run: (a) => { const c = dir(a); return [erroresProduccion(c), sentryCheck(c)].filter(Boolean).join("\n") } },
  skill_dey_movil: { titulo: "App móvil", soloLectura: true, desc: "App Flutter/React Native: analizador y pruebas del stack.", run: (a) => revisarMovil(dir(a)).lineas.join("\n") },
  skill_dey_multi_ia: { titulo: "Reglas para todas las IAs", desc: "Escribe las reglas de SKILL_DEY en AGENTS.md, CLAUDE.md, GEMINI.md, Cursor, Copilot… sin pisar lo existente.", run: (a) => instalarMultiIA(dir(a)).lineas.join("\n") },
}

const toolDefs = Object.entries(T).map(([name, t]) => ({
  name, title: t.titulo, description: t.desc,
  inputSchema: {
    type: "object",
    properties: { carpeta: { type: "string", description: "ruta absoluta del proyecto (opcional; por defecto la carpeta abierta)" }, url: { type: "string", description: "url si la app ya corre (opcional)" }, ...(t.extra ?? {}) },
    ...(t.requeridos ? { required: t.requeridos } : {}),
  },
  annotations: { title: t.titulo, readOnlyHint: !!t.soloLectura, destructiveHint: !!t.destructiva, idempotentHint: !!t.soloLectura, openWorldHint: false },
}))

const enviar = (msg: any): void => { process.stdout.write(JSON.stringify(msg) + "\n") }
const ok = (id: any, result: any): void => enviar({ jsonrpc: "2.0", id, result })
const err = (id: any, code: number, message: string): void => enviar({ jsonrpc: "2.0", id, error: { code, message } })

export async function atender(m: any): Promise<void> {
  const { id, method, params } = m ?? {}
  const responde = typeof id !== "undefined" && id !== null
  try {
    if (method === "initialize") {
      const pedida = params?.protocolVersion
      return ok(id, { protocolVersion: PROTOCOLOS.includes(pedida) ? pedida : PROTOCOLOS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "skill_dey", title: "SKILL DEY", version: VERSION }, instructions: "Chequeos deterministas de SKILL DEY (0 tokens). Cierra cada cambio con skill_dey_verificar en verde; si el usuario dice 'deshaz', usa skill_dey_deshacer." })
    }
    if (typeof method === "string" && method.startsWith("notifications/")) return
    if (method === "ping") return ok(id, {})
    if (method === "tools/list") return ok(id, { tools: toolDefs })
    if (method === "tools/call") {
      const t = T[params?.name]
      if (!t) return err(id, -32602, "herramienta desconocida: " + params?.name)
      try {
        const texto = await t.run(params?.arguments ?? {})
        return ok(id, { content: [{ type: "text", text: String(texto) }] })
      } catch (e: any) {
        return ok(id, { content: [{ type: "text", text: `❌ ${params?.name}: ${String(e?.message ?? e)}` }], isError: true })
      }
    }
    if (responde) return err(id, -32601, "método no soportado: " + method)
  } catch (e: any) { if (responde) err(id, -32603, String(e?.message ?? e)) }
}

export function iniciar() {
  const rl = createInterface({ input: process.stdin })
  rl.on("line", (linea) => {
    if (!linea.trim()) return
    let m: any
    try { m = JSON.parse(linea) } catch { return err(null, -32700, "JSON inválido") }
    if (Array.isArray(m)) { for (const x of m) atender(x); return }
    atender(m)
  })
}

if (process.argv[1] && /skill_dey-mcp\.(mjs|ts|js)$/.test(process.argv[1])) iniciar()
