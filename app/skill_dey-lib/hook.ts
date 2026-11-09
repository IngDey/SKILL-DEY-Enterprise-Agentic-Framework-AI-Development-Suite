// SKILL_DEY — GUARDIÁN EN VIVO para Claude Code, Gemini CLI y Antigravity CLI (hooks).
// Uso (lo llama el host, no la persona):  node skill_dey-hook.mjs <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>
// Lee el evento en JSON por stdin y responde en el formato de cada host. 0 tokens del modelo.
// Reglas: las mismas de OpenCode (guardia.ts). Falla ABIERTO: si algo inesperado falla, deja trabajar y lo anota en un log.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs"
import { join, resolve, isAbsolute, dirname } from "node:path"
import { homedir } from "node:os"
import { normalizar, evaluar, sintaxis, esSoloLectura, type Contexto } from "./guardia.ts"
import { foto, respaldarArchivo, asegurarRepo, deshacer, rehacer } from "./respaldo.ts"

declare const SKILL_DEY_VERSION: string
const VERSION = typeof SKILL_DEY_VERSION === "string" ? SKILL_DEY_VERSION : "dev"
type Host = "claude" | "gemini" | "antigravity"
type Evento = "inicio" | "prompt" | "antes" | "despues" | "fin"

const CFG = join(homedir(), ".config", "skill_dey")
const log = (t: string) => { try { mkdirSync(CFG, { recursive: true }); appendFileSync(join(CFG, "errores-hook.log"), `${new Date().toISOString()} ${t}\n`) } catch {} }
const activo = () => { try { return JSON.parse(readFileSync(join(CFG, "estado.json"), "utf8")).activo !== false } catch { return true } }
const fijarActivo = (v: boolean) => { try { mkdirSync(CFG, { recursive: true }); writeFileSync(join(CFG, "estado.json"), JSON.stringify({ activo: v, desde: new Date().toISOString() })) } catch {} }

// ---------- Estado por sesión (cada hook es un proceso nuevo: el estado vive en un archivo pequeño) ----------
interface Estado { sid: string; turno: number; foto: boolean; ultimaEdicion: number; editados: string[]; firmas: Record<string, number>; ediciones: number; paradas: number; prompt: string; avisos: string[]; rojo: number; git?: boolean; pidioVerificar?: boolean }
const nuevo = (sid: string): Estado => ({ sid, turno: Date.now(), foto: false, ultimaEdicion: 0, editados: [], firmas: {}, ediciones: 0, paradas: 0, prompt: "", avisos: [], rojo: 0, git: undefined, pidioVerificar: false })
function cargar(cwd: string, host: Host, sid: string): Estado {
  try { const e = JSON.parse(readFileSync(join(cwd, ".skill_dey", `.sesion-${host}.json`), "utf8")); if (e.sid === sid || !sid) return { ...nuevo(sid), ...e } } catch {}
  return nuevo(sid)
}
function guardar(cwd: string, host: Host, e: Estado) {
  try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(join(cwd, ".skill_dey", `.sesion-${host}.json`), JSON.stringify(e)) } catch {}
}

// ---------- Lectura tolerante del evento (cada host nombra los campos distinto) ----------
const primero = (o: any, claves: string[]) => { for (const k of claves) { const v = k.split(".").reduce((a: any, p) => a?.[p], o); if (v !== undefined && v !== null && v !== "") return v } return undefined }
function carpetaProyecto(ev: any): string | null {
  const c = primero(ev, ["cwd", "workspace", "workspacePath", "workspace_path", "workspaceRoot", "workspace_root", "workspaceRoots.0", "workspace_roots.0", "project_dir", "projectDir"]) ?? process.env.CLAUDE_PROJECT_DIR ?? process.env.GEMINI_PROJECT_DIR ?? process.env.WORKSPACE_PATH
  const dir = typeof c === "string" ? c.replace(/^file:\/\//, "") : process.cwd()
  // Antigravity ejecuta los hooks desde la carpeta del plugin: esa NO es tu proyecto
  if (existsSync(join(dir, "plugin.json")) && existsSync(join(dir, "scripts", "skill_dey-hook.mjs"))) return null
  if (resolve(dir) === resolve(homedir()) || resolve(dir) === resolve("/")) return null
  return dir
}

// ---------- Respuestas en el formato de cada host ----------
const NOMBRE_EV: Record<Host, Record<Evento, string>> = {
  claude: { inicio: "SessionStart", prompt: "UserPromptSubmit", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" },
  gemini: { inicio: "SessionStart", prompt: "BeforeAgent", antes: "BeforeTool", despues: "AfterTool", fin: "AfterAgent" },
  antigravity: { inicio: "SessionStart", prompt: "PreInvocation", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" },
}
type Salida = { negar?: string; contexto?: string; frenar?: string; mostrar?: string; comando?: string }
function responder(host: Host, ev: Evento, s: Salida): object {
  const nombre = NOMBRE_EV[host][ev]
  if (host === "claude") {
    if (s.negar) return { hookSpecificOutput: { hookEventName: nombre, permissionDecision: "deny", permissionDecisionReason: s.negar } }
    if (s.mostrar) return { decision: "block", reason: s.mostrar } // UserPromptSubmit: responde sin gastar un turno del modelo
    if (s.frenar) return { decision: "block", reason: s.frenar }
    if (s.contexto) return { hookSpecificOutput: { hookEventName: nombre, additionalContext: s.contexto } }
    return {}
  }
  if (host === "gemini") {
    if (s.negar) return { decision: "deny", reason: s.negar }
    if (s.comando) return { hookSpecificOutput: { hookEventName: nombre, tool_input: { command: s.comando } } }
    if (s.frenar) return { decision: "deny", reason: s.frenar }
    const ctx = [s.mostrar && `Informa al usuario exactamente esto y no hagas nada más:\n${s.mostrar}`, s.contexto].filter(Boolean).join("\n")
    if (ctx && ev !== "antes") return { hookSpecificOutput: { hookEventName: nombre, additionalContext: ctx } }
    return {}
  }
  // antigravity
  if (s.negar) return { decision: "deny", reason: s.negar }
  if (s.frenar) return { decision: "block", reason: s.frenar }
  return {}
}

const AYUDA_FONDO: Record<Host, string> = {
  claude: "Vuelve a ejecutarlo con run_in_background: true y revisa la salida con BashOutput.",
  gemini: "Vuelve a ejecutarlo en segundo plano (is_background: true) o con: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &",
  antigravity: "Ejecútalo en segundo plano con log: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 & (en Windows: Start-Process) y lee el log.",
}
const DESHAZ = /^\s*(deshaz|deshacer|deshaz (el|lo) [uú]ltimo( cambio)?|undo)\s*[.!]*\s*$/i
const REHAZ = /^\s*(rehaz|rehacer|redo)\s*[.!]*\s*$/i
const APAGAR = /\b(finalizar|apagar|desactivar|detener)\s+(la\s+)?skill[\s_-]?dey\b/i
const ENCENDER = /\b(iniciar|encender|activar)\s+(la\s+)?skill[\s_-]?dey\b/i
const MODIFICA_BASH = /sed -i|>>?|\btee\b|\bmv\b|\bcp\b|git (checkout|restore|apply|stash)|npm (i|install)|composer (require|install)|pip install|migrate/

export function procesar(host: Host, ev: Evento, entrada: any): Salida {
  const prompt = String(primero(entrada, ["prompt", "user_prompt", "userMessage", "message", "input.prompt"]) ?? "")
  if (ev === "prompt" && APAGAR.test(prompt)) { fijarActivo(false); return { mostrar: "⏸ SKILL DEY apagado. Escribe \"iniciar skill dey\" para encenderlo de nuevo." } }
  if (ev === "prompt" && ENCENDER.test(prompt)) { fijarActivo(true); return { mostrar: `▶ SKILL DEY ${VERSION} encendido: guardián, copias para deshacer y cero errores activos.` } }
  if (!activo()) return {}

  const cwd = carpetaProyecto(entrada)
  const sid = String(primero(entrada, ["session_id", "sessionId", "conversation_id", "conversationId"]) ?? "")
  const st = cwd ? cargar(cwd, host, sid) : nuevo(sid)
  const fin = (s: Salida) => { if (cwd) guardar(cwd, host, st); return s }

  if (ev === "inicio") {
    // Claude Code no tiene archivo de reglas por plugin: se entregan aquí (Gemini y Antigravity ya las cargan solos)
    let reglas = ""
    if (host === "claude") try { reglas = "\n\n" + readFileSync(join(dirname(process.argv[1] ?? ""), "..", "REGLAS.md"), "utf8") } catch {}
    return fin({ contexto: `SKILL DEY ${VERSION} activo (guardián en vivo). Antes de cada cambio se guarda una copia: si el usuario dice "deshaz", usa la herramienta skill_dey_deshacer. Para cosas de código usa la skill skill-dey. Cierra todo cambio con skill_dey_verificar en verde.${reglas}` })
  }

  if (ev === "prompt") {
    Object.assign(st, nuevo(sid), { prompt: prompt.slice(0, 2000) })
    if (cwd && DESHAZ.test(prompt)) return fin({ mostrar: deshacer(cwd, 1) })
    if (cwd && REHAZ.test(prompt)) return fin({ mostrar: rehacer(cwd) })
    return fin({})
  }

  const herramienta = String(primero(entrada, ["tool_name", "toolName", "tool", "name", "tool_call.name", "toolCall.name"]) ?? "")
  let args = primero(entrada, ["tool_input", "toolInput", "args", "arguments", "input", "tool_call.args", "toolCall.args", "parameters"]) ?? {}
  if (typeof args === "string") { try { args = JSON.parse(args) } catch { args = {} } }
  const acc = normalizar(herramienta, args)

  if (ev === "antes") {
    // Anti-vueltas: la misma acción exacta 3 veces sin cambiar nada → mismo resultado
    if (!/skill_dey_(deshacer|historial|estado)/.test(herramienta)) {
      const firma = `${herramienta}|${JSON.stringify(args).slice(0, 400)}|${st.ediciones}`
      const n = (st.firmas[firma] ?? 0) + 1
      st.firmas[firma] = n
      if (Object.keys(st.firmas).length > 300) st.firmas = { [firma]: n }
      if (n >= 3) return fin({ negar: `SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable, o usa skill_dey_deshacer y reporta.` })
      if (st.rojo >= 15 && !/skill_dey_/.test(herramienta)) { st.rojo = 0; return fin({ negar: "SKILL_DEY FRENO: 15 acciones sobre el mismo error sin quedar en verde. Para: escribe qué sabes (hechos) y tu hipótesis; prueba UNA comprobación que la refute, o deshaz y reporta 2–3 opciones al usuario." }) }
      if (st.rojo) st.rojo++
    }
    const ctx: Contexto = {
      cwd: cwd ?? process.cwd(),
      ultimaEdicion: st.ultimaEdicion,
      comoSegundoPlano: AYUDA_FONDO[host],
      puedeReescribir: host === "gemini",
      pidioDependencias: st.prompt ? (pk) => { const t = st.prompt.toLowerCase(); return /instal|dependenc|librer|paquete|package|m[oó]dulo|composer|\bpip\b|\bnpm\b/.test(t) || pk.some((p) => t.includes(p.toLowerCase().split("/").pop()!)) || /^\s*(ok|s[ií]|dale|hazlo|listo|de acuerdo|aprobado|adelante|procede)\b/.test(t) } : undefined,
    }
    // Sin carpeta de proyecto conocida solo aplican las reglas que no dependen de ella
    const d = cwd ? evaluar(acc, ctx) : evaluar({ ...acc, archivo: acc.archivo && isAbsolute(acc.archivo) ? acc.archivo : "" }, { ...ctx, cwd: "/" })
    if (d.bloquear) return fin({ negar: d.bloquear })
    // Copia antes del PRIMER cambio de cada pedido (con git: foto completa; sin git: copia de cada archivo)
    const modifica = acc.tipo === "editar" || (acc.tipo === "comando" && !!acc.comando && !esSoloLectura(acc.comando))
    if (modifica && cwd) {
      try {
        if (!st.foto) { st.foto = true; st.git = asegurarRepo(cwd); if (st.git) foto(cwd, "pasos", "cambio", acc.tipo === "comando" ? `bash: ${acc.comando}` : `${acc.herramienta} ${acc.archivo}`) }
        if (acc.archivo && !st.git) respaldarArchivo(cwd, acc.archivo, String(st.turno))
      } catch (e: any) { log(`foto: ${e?.message}`) }
    }
    return fin(d.comando ? { comando: d.comando } : {})
  }

  if (ev === "despues") {
    const resp = JSON.stringify(primero(entrada, ["tool_response", "toolResponse", "output", "result", "error"]) ?? "")
    if (/skill_dey_(verificar|revisar|sitio)/.test(herramienta)) { if (/✅ todo verde|✅ sitio sin errores|"ok":\s*true/.test(resp)) st.rojo = 0; else if (/❌/.test(resp)) st.rojo = st.rojo || 1 }
    if (acc.tipo === "comando" && MODIFICA_BASH.test(acc.comando)) { st.ediciones++; st.ultimaEdicion = Date.now() }
    if (acc.tipo !== "editar" || !acc.archivo || !cwd) return fin({})
    st.ediciones++; st.ultimaEdicion = Date.now()
    if (!st.editados.includes(acc.archivo)) st.editados.push(acc.archivo)
    const err = sintaxis(cwd, acc.archivo)
    if (!err) return fin({})
    const aviso = `⚠ SKILL_DEY sintaxis en ${acc.archivo}:\n${err}\n→ Corrígelo antes de seguir.`
    if (host === "antigravity") { st.avisos.push(aviso); return fin({}) } // Antigravity no acepta contexto aquí: se entrega al cerrar
    return fin({ contexto: aviso })
  }

  // ev === "fin": CERO ERRORES — no se cierra con archivos rotos ni sin verificación verde
  if (!cwd || !st.editados.length) return fin({})
  const errores = st.editados.map((f) => { const e = sintaxis(cwd, f); return e ? `${f}: ${e.split("\n")[0]}` : "" }).filter(Boolean)
  if (errores.length && st.paradas < 2) { st.paradas++; return fin({ frenar: `SKILL_DEY cero errores: quedan archivos con error de sintaxis:\n${errores.slice(0, 6).join("\n")}\nCorrígelos (o usa skill_dey_deshacer) antes de terminar.` }) }
  let v: any = null
  try { v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")) } catch {}
  const verde = v?.ok && v.ts >= st.ultimaEdicion
  if (!verde && !st.pidioVerificar) { st.pidioVerificar = true; return fin({ frenar: `SKILL_DEY cero errores: cambiaste ${st.editados.length} archivo(s) y no hay verificación verde después. Corre la herramienta skill_dey_verificar; si sale ❌ corrige y repite. Luego entrega el resumen.` }) }
  st.editados = []
  return fin({})
}

// ---------- Programa ----------
async function leerStdin(): Promise<string> {
  if (process.stdin.isTTY) return ""
  let t = ""
  process.stdin.setEncoding("utf8")
  for await (const c of process.stdin) t += c
  return t
}

export async function main(argv: string[]) {
  const host = (argv[0] ?? "claude") as Host
  const ev = (argv[1] ?? "antes") as Evento
  const t0 = Date.now()
  let salida: object = {}
  try {
    if (!["claude", "gemini", "antigravity"].includes(host) || !["inicio", "prompt", "antes", "despues", "fin"].includes(ev)) throw new Error(`uso: skill_dey-hook <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>`)
    const txt = await leerStdin()
    const entrada = txt.trim() ? JSON.parse(txt) : {}
    salida = responder(host, ev, procesar(host, ev, entrada))
  } catch (e: any) {
    log(`${host}/${ev}: ${String(e?.stack ?? e).slice(0, 400)}`) // falla abierto: nunca bloquea tu trabajo por un error interno
    salida = {}
  }
  const ms = Date.now() - t0
  if (ms > 3000) log(`lento ${host}/${ev} ${ms} ms`)
  process.stdout.write(JSON.stringify(salida))
}

if (process.argv[1] && /skill_dey-hook\.(mjs|ts|js)$/.test(process.argv[1])) main(process.argv.slice(2))
