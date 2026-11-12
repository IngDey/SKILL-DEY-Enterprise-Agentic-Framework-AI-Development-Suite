// SKILL_DEY — GUARDIÁN EN VIVO para Claude Code, Gemini CLI y Antigravity CLI (hooks).
// Uso (lo llama la IA, no la persona):  node skill_dey-hook.mjs <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>
// Lee el evento en JSON por stdin y responde en el formato de cada IA. 0 tokens del modelo salvo cuando hay que avisarle algo.
// Las REGLAS son las mismas del guardián de OpenCode (guardia.ts); aquí solo se traduce cada IA a ellas.
// Falla ABIERTO: si algo inesperado falla, deja trabajar y lo anota en ~/.config/skill_dey/errores-hook.log. Nunca congela tu IA.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, statSync, openSync, readSync, closeSync, unlinkSync } from "node:fs"
import { join, resolve, isAbsolute, dirname, relative } from "node:path"
import { homedir } from "node:os"
import { createHash } from "node:crypto"
import {
  SECRETO, PLACEHOLDER, PELIGROSO, borradoMasivo, sqlEjecutado, blindarGitignore, TRUNCADO, SERVIDOR, DEPENDENCIA, esSoloLectura,
  fueraDelProyecto, CODIGO, impactoDe, relNorm, ENV_REAL, LEE_ENV, MIGRACION, bdDestructivo, SQL_MODIFICA, respaldoBdReciente, sintaxis,
} from "./guardia.ts"
import { foto, respaldarArchivo, asegurarRepo, esRepo, deshacer, rehacer, historial, deshacerDesde, deshacerArchivo, buscarPaso, cambiosExactos, listarHitos } from "./respaldo.ts"
import { asegurarMemoria, registrarCambio, dondeQuedamos, contarArchivos } from "./memoria_base.ts"
import { intencion } from "./comandos.ts"
import { documentar } from "./documentar.ts"

declare const SKILL_DEY_VERSION: string
const VERSION = typeof SKILL_DEY_VERSION === "string" ? SKILL_DEY_VERSION : "dev"
export type Host = "claude" | "gemini" | "antigravity"
type Evento = "inicio" | "prompt" | "antes" | "despues" | "fin"

const CFG = () => process.env.SKILL_DEY_CONFIG_DIR || join(homedir(), ".config", "skill_dey")
const log = (t: string) => { try { mkdirSync(CFG(), { recursive: true }); appendFileSync(join(CFG(), "errores-hook.log"), `${new Date().toISOString()} ${t}\n`) } catch {} }
const activo = () => { try { return JSON.parse(readFileSync(join(CFG(), "ACTIVO.json"), "utf8")).activo !== false } catch { return true } }
const fijarActivo = (v: boolean) => { try { mkdirSync(CFG(), { recursive: true }); writeFileSync(join(CFG(), "ACTIVO.json"), JSON.stringify({ activo: v, desde: new Date().toISOString() })) } catch {} }

// ---------- Estado por sesión (cada hook es un proceso nuevo: el estado vive en un archivo pequeño del proyecto) ----------
interface Estado {
  sid: string; turno: string; inicioPedido: number; foto: boolean; git?: boolean; commitBase: string; baseVerde: boolean
  ultimaEdicion: number; editados: string[]; firmas: Record<string, number>; ediciones: number; evaluaciones: number
  enRojo: boolean; accionesEnRojo: number; prompt: string; nombrados: string[]; existentes: string[]; amplio: boolean
  entendido: boolean; avisoEntendi: boolean; autoIntentos: number; pidioVerificar: boolean; avisos: string[]; sesionVista: boolean
}
const nuevo = (sid: string): Estado => ({ sid, turno: new Date().toISOString().replace(/[:.]/g, "-"), inicioPedido: Date.now(), foto: false, commitBase: "", baseVerde: false, ultimaEdicion: 0, editados: [], firmas: {}, ediciones: 0, evaluaciones: 0, enRojo: false, accionesEnRojo: 0, prompt: "", nombrados: [], existentes: [], amplio: false, entendido: false, avisoEntendi: false, autoIntentos: 0, pidioVerificar: false, avisos: [], sesionVista: false })
const archivoEstado = (cwd: string, host: Host) => join(cwd, ".skill_dey", `.sesion-${host}.json`)
function cargar(cwd: string, host: Host, sid: string): Estado {
  try { const e = JSON.parse(readFileSync(archivoEstado(cwd, host), "utf8")); if (!sid || e.sid === sid) return { ...nuevo(sid), ...e } } catch {}
  return nuevo(sid)
}
function guardar(cwd: string, host: Host, e: Estado) {
  try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(archivoEstado(cwd, host), JSON.stringify(e)) } catch {}
}

// ---------- Lectura tolerante del evento (cada IA nombra los campos distinto) ----------
const primero = (o: any, claves: string[]) => { for (const k of claves) { const v = k.split(".").reduce((a: any, p) => a?.[p], o); if (v !== undefined && v !== null && v !== "") return v } return undefined }
function carpetaProyecto(ev: any): string | null {
  const c = primero(ev, ["cwd", "workspace", "workspacePath", "workspace_path", "workspaceRoot", "workspace_root", "workspaceRoots.0", "workspace_roots.0", "project_dir", "projectDir"]) ?? process.env.CLAUDE_PROJECT_DIR ?? process.env.GEMINI_PROJECT_DIR
  const dir = typeof c === "string" ? c.replace(/^file:\/\//, "") : ""
  if (!dir) return null
  if (existsSync(join(dir, "plugin.json")) && existsSync(join(dir, "scripts", "skill_dey-hook.mjs"))) return null // carpeta del plugin, no tu proyecto
  if (resolve(dir) === resolve(homedir()) || resolve(dir) === resolve("/") || /^[A-Za-z]:\\?$/.test(dir)) return null // nunca tu carpeta personal ni la raíz
  return dir
}

// ---------- Herramienta de cualquier IA → acción normalizada ----------
type Tipo = "leer" | "editar" | "comando" | "otra"
export interface Accion { tipo: Tipo; herramienta: string; archivos: string[]; texto: string; quita: string; comando: string; reescribe: boolean }
const ES_COMANDO = /(^|_|\b)(bash|shell|run_command|run_shell_command|terminal|exec|powershell|pwsh)($|_|\b)/i
const ES_LEER = /^(read|view|cat)$|read_file|view_file|read_many_files|^Read$/i
const ES_EDITAR = /(edit|write|replace|patch|create_file|multiedit|notebook|apply_diff|insert)/i
function campo(a: any, claves: RegExp): string { if (!a || typeof a !== "object") return ""; for (const [k, v] of Object.entries(a)) if (claves.test(k) && typeof v === "string") return v; return "" }
function textos(a: any, claves: RegExp): string {
  const partes: string[] = []
  const tomar = (o: any) => { if (!o || typeof o !== "object") return; for (const [k, v] of Object.entries(o)) { if (typeof v === "string" && claves.test(k)) partes.push(v); else if (Array.isArray(v)) v.forEach(tomar) } }
  tomar(a); return partes.join("\n")
}
const NUEVO = /^(content|new_?string|newString|code_?content|CodeContent|replacement(_?content)?|ReplacementContent|new_text|new_source)$/i
const VIEJO = /^(old_?string|oldString|TargetContent|target_?content|old_text)$/i
export function normalizar(herramienta: string, args: any): Accion {
  const h = String(herramienta ?? ""), a = args ?? {}
  const archivo = campo(a, /^(file_?path|filePath|path|absolute_path|AbsolutePath|TargetFile|target_file|notebook_path|file)$/i)
  const comando = campo(a, /^(command|CommandLine|cmd|script)$/i)
  let tipo: Tipo = "otra"
  if (/^mcp/i.test(h)) tipo = "otra"
  else if (ES_COMANDO.test(h) || (comando && !archivo)) tipo = "comando"
  else if (ES_LEER.test(h)) tipo = "leer"
  else if (ES_EDITAR.test(h)) tipo = "editar"
  const reescribe = tipo === "editar" && /^(write|write_file|write_to_file|create_file)$/i.test(h)
  return { tipo, herramienta: h, archivos: archivo ? [archivo] : [], texto: tipo === "editar" ? textos(a, NUEVO) : "", quita: tipo === "editar" ? textos(a, VIEJO) : "", comando, reescribe }
}

// ---------- Transcripción (Claude Code la da; se usa para "razonar antes de tocar" y para el "sí" del usuario) ----------
function leerCola(f: string, max = 600_000): string {
  try { const n = statSync(f).size, fd = openSync(f, "r"), b = Buffer.alloc(Math.min(n, max)); readSync(fd, b, 0, b.length, Math.max(0, n - b.length)); closeSync(fd); return b.toString("utf8") } catch { return "" }
}
/** Texto que escribió la IA desde el último mensaje REAL del usuario (null = no se pudo leer: no se exige nada). */
export function textoIADesdeUsuario(transcript: string): { desde: string; antes: string } | null {
  if (!transcript || !existsSync(transcript)) return null
  const lineas = leerCola(transcript).split("\n").filter((l) => l.trim().startsWith("{"))
  const msgs: { rol: string; txt: string }[] = []
  for (const l of lineas) {
    try {
      const j = JSON.parse(l), m = j.message ?? j, rol = String(m.role ?? j.type ?? "")
      const c = m.content ?? m.parts ?? j.content
      const partes = Array.isArray(c) ? c : [{ type: "text", text: String(c ?? "") }]
      const reales = partes.filter((p: any) => p && (p.type === "text" || p.type === "thinking" || p.type === "reasoning" || (typeof p.text === "string" && !p.type)))
      const esResultado = partes.some((p: any) => p?.type === "tool_result" || p?.functionResponse)
      if (rol === "user" && esResultado) continue
      msgs.push({ rol: rol === "model" ? "assistant" : rol, txt: reales.map((p: any) => p.text ?? p.thinking ?? "").join("\n") })
    } catch {}
  }
  if (!msgs.length) return null
  let i = msgs.length - 1; while (i >= 0 && !(msgs[i].rol === "user" && msgs[i].txt.trim() && !/^\s*\[(GUARDIAN|SKILL_DEY)/.test(msgs[i].txt))) i--
  if (i < 0) return null
  const tras = msgs.slice(i + 1).filter((m) => m.rol === "assistant").map((m) => m.txt).join("\n")
  const prev = msgs.slice(0, i).reverse().find((m) => m.rol === "assistant")?.txt ?? ""
  return { desde: tras, antes: prev }
}

// ---------- Respuestas en el formato de cada IA ----------
const NOMBRE_EV: Record<Host, Record<Evento, string>> = {
  claude: { inicio: "SessionStart", prompt: "UserPromptSubmit", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" },
  gemini: { inicio: "SessionStart", prompt: "BeforeAgent", antes: "BeforeTool", despues: "AfterTool", fin: "AfterAgent" },
  antigravity: { inicio: "SessionStart", prompt: "PreInvocation", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" },
}
export type Salida = { negar?: string; contexto?: string; frenar?: string; mostrar?: string; comando?: string }
function responder(host: Host, ev: Evento, s: Salida): object {
  const nombre = NOMBRE_EV[host][ev]
  if (host === "claude") {
    if (s.negar) return { hookSpecificOutput: { hookEventName: nombre, permissionDecision: "deny", permissionDecisionReason: s.negar } }
    if (s.mostrar) return { decision: "block", reason: s.mostrar } // UserPromptSubmit: el resultado le llega al usuario sin gastar un turno del modelo
    if (s.frenar) return { decision: "block", reason: s.frenar }
    if (s.contexto) return { hookSpecificOutput: { hookEventName: nombre, additionalContext: s.contexto } }
    return {}
  }
  if (host === "gemini") {
    if (s.negar) return { decision: "deny", reason: s.negar }
    if (s.comando) return { hookSpecificOutput: { hookEventName: nombre, tool_input: { command: s.comando } } }
    if (s.frenar) return { decision: "deny", reason: s.frenar }
    const ctx = [s.mostrar && `[SKILL_DEY] Resultado ya ejecutado por código. Muéstralo al usuario tal cual, sin ejecutar nada:\n${s.mostrar}`, s.contexto].filter(Boolean).join("\n")
    if (ctx && ev !== "antes") return { hookSpecificOutput: { hookEventName: nombre, additionalContext: ctx } }
    return {}
  }
  if (s.negar) return { decision: "deny", reason: s.negar }
  if (s.frenar) return { decision: "block", reason: s.frenar }
  return {}
}

const FONDO: Record<Host, string> = {
  claude: "Vuelve a ejecutarlo con run_in_background: true y revisa la salida después.",
  gemini: "Vuelve a ejecutarlo en segundo plano con log: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &",
  antigravity: "Ejecútalo en segundo plano con log (nohup <comando> > .skill_dey/logs/servidor.log 2>&1 & · en Windows: Start-Process sin -Redirect) y lee el log.",
}
const SI = /^\s*(s[ií]|si señor|ok|okay|dale|hazlo|h[aá]gale|listo|de acuerdo|autorizo|autorizado|adelante|procede|correcto|est[aá] bien|perfecto|aprobado)(?![\wáéíóúñ])/i
const INICIAR = /\b(iniciar|inicia|activar|activa|encender|enciende|empezar)\s+(la\s+)?skill[\s_-]*dey\b/i
const FINALIZAR = /\b(finalizar|finaliza|desactivar|desactiva|apagar|apaga|terminar|termina|detener|salir\s+de)\s+(la\s+)?skill[\s_-]*dey\b/i
const AMPLIO = /reescrib|refactoriz|reorganiz|reestructur|limpia (el|todo)|optimiza (todo|el proyecto)|mejora todo|todo el (proyecto|c[oó]digo)|formatea|corrige todos|todos los archivos|migra(r)? (el|todo)/i
const nombresEn = (t: string) => (t.match(/[\w\/\\.-]+\.[A-Za-z][A-Za-z0-9]{0,5}\b/g) ?? []).map((x) => x.replace(/\\/g, "/").toLowerCase().split("/").pop()!).filter((x) => !/^(www|http|https)\b|\.(com|net|org|co|io)$/.test(x))
const PREG = (q: string) => `${q} NO lo cambies por tu cuenta. Si de verdad es indispensable para lo que pidió, PREGÚNTALE en 1 línea: "Para <lo que pidió> necesito tocar <archivo> porque <motivo>. ¿Lo autorizas?" y espera su sí. Si es una mejora aparte, solo propónla al final.`
const MODIFICA_BASH = /\bsed\s+(-[a-z]*i|--in-place)|\bperl\s+-[a-z]*i|\bSet-Content\b|\bOut-File\b|\bAdd-Content\b|\btee\b|-replace\b|[^>&0-9]>>?\s*[^&>\s]|\b(mv|move|ren|rename|Move-Item|Rename-Item)\b/i
const IGNORA_ALCANCE = /(^|\/)(\.skill_dey|docs?|tests?|__tests__|spec|logs?|tmp|temp|dist|build|node_modules|vendor|coverage)\/|\.(test|spec)\.|\.(md|mdx|txt|log|lock)$/i
const viejoDe = (cwd: string, abs: string) => join(cwd, ".skill_dey", ".viejos", createHash("sha1").update(abs).digest("hex").slice(0, 16) + ".txt")

/** Comandos en lenguaje normal que se resuelven por código (0 tokens del modelo). null = va al modelo. */
function porCodigo(cwd: string, texto: string): string | null {
  const c = intencion(texto); if (!c) return null
  const [cmd, ...r] = c.split(" "), arg = r.join(" ").trim()
  if (cmd === "deshacer") return arg && !/^\d+$/.test(arg) ? deshacerArchivo(cwd, arg) : deshacer(cwd, Number(arg) || 1)
  if (cmd === "rehacer") return rehacer(cwd)
  if (cmd === "historial") return historial(cwd)
  if (cmd === "antes-de") { const p = buscarPaso(cwd, arg); return p.n ? deshacer(cwd, p.n) : `No encontré un punto guardado que coincida con "${arg}". Escribe "historial" para ver la lista.` }
  if (cmd === "donde") { const l = dondeQuedamos(cwd, 6); return l.length ? "**Dónde quedamos** (últimos pedidos en este proyecto, de todas las sesiones):\n" + l.map((x) => "- " + x).join("\n") + '\n\nPara seguir: "sigue". Para volver a un punto: "historial".' : "Aún no hay pedidos registrados en este proyecto." }
  if (cmd === "cambios") return cambiosExactos(cwd)
  if (cmd === "hitos") return listarHitos(cwd)
  if (cmd === "version") return `SKILL_DEY ${VERSION} · guardián en vivo activo en esta IA.`
  return null
}

export function procesar(host: Host, ev: Evento, entrada: any): Salida {
  const prompt = String(primero(entrada, ["prompt", "user_prompt", "userMessage", "message", "input.prompt"]) ?? "")
  if (ev === "prompt" && FINALIZAR.test(prompt) && prompt.trim().length <= 40) { fijarActivo(false); return { mostrar: "⏸ SKILL_DEY apagado. Escribe \"iniciar skill dey\" para encenderlo de nuevo." } }
  if (ev === "prompt" && INICIAR.test(prompt)) { fijarActivo(true); return { mostrar: `▶ SKILL_DEY ${VERSION} encendido: guardián, copias para deshacer y cero errores activos.` } }
  if (!activo()) return {}

  const cwd = carpetaProyecto(entrada)
  const sid = String(primero(entrada, ["session_id", "sessionId", "conversation_id", "conversationId"]) ?? "")
  const transcript = String(primero(entrada, ["transcript_path", "transcriptPath"]) ?? "")
  const st = cwd ? cargar(cwd, host, sid) : nuevo(sid)
  const fin = (s: Salida) => { if (cwd) guardar(cwd, host, st); return s }

  if (ev === "inicio") {
    let extra = ""
    if (cwd) {
      try { asegurarMemoria(cwd) } catch {}
      try { const l = dondeQuedamos(cwd, 4); if (l.length) extra = "\n[SKILL_DEY · proyecto con historia] Últimos pedidos (de sesiones anteriores):\n" + l.map((x) => "- " + x).join("\n") + "\nSi el usuario dice 'sigue' o se refiere a algo anterior, parte de aquí." } catch {}
      st.sesionVista = true
    }
    let reglas = "" // Claude Code no tiene archivo de reglas por plugin: se entregan aquí (Gemini y Antigravity ya las cargan solos)
    if (host === "claude") try { reglas = "\n\n" + readFileSync(join(dirname(process.argv[1] ?? ""), "..", "REGLAS.md"), "utf8") } catch {}
    return fin({ contexto: `SKILL_DEY ${VERSION} activo.${reglas}${extra}` })
  }

  if (ev === "prompt") {
    const autoriza = SI.test(prompt) && prompt.trim().length <= 80
    if (autoriza) { // "sí" = autoriza lo que la IA preguntó (sigue el MISMO pedido)
      const t = textoIADesdeUsuario(transcript)
      st.nombrados = [...new Set([...st.nombrados, ...nombresEn(prompt), ...nombresEn(t?.desde || t?.antes || "")])]
      return fin({})
    }
    const previo = { ...st }
    Object.assign(st, nuevo(sid), { prompt: prompt.slice(0, 2000), nombrados: nombresEn(prompt), amplio: AMPLIO.test(prompt), sesionVista: previo.sesionVista })
    if (cwd) try { const v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")); st.baseVerde = v?.ok === true } catch {}
    if (cwd) { const r = porCodigo(cwd, prompt); if (r) return fin({ mostrar: r }) }
    return fin({})
  }

  const herramienta = String(primero(entrada, ["tool_name", "toolName", "tool", "name", "tool_call.name", "toolCall.name"]) ?? "")
  let args = primero(entrada, ["tool_input", "toolInput", "args", "arguments", "input", "tool_call.args", "toolCall.args", "parameters"]) ?? {}
  if (typeof args === "string") { try { args = JSON.parse(args) } catch { args = {} } }
  const acc = normalizar(herramienta, args)
  const base = cwd ?? "/"

  if (ev === "antes") {
    const cmd = acc.comando
    // .env reales: ni leerlos ni escribirlos (credenciales que no se pueden deshacer)
    if ((acc.tipo === "leer" && acc.archivos.some((f) => ENV_REAL.test(f))) || (acc.tipo === "comando" && LEE_ENV.test(cmd)))
      return fin({ negar: "SKILL_DEY: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable." })
    if (acc.tipo === "editar" && acc.archivos.some((f) => ENV_REAL.test(f) && existsSync(isAbsolute(f) ? f : join(base, f))))
      return fin({ negar: "SKILL_DEY: no escribo ni borro .env reales (tus credenciales no se pueden deshacer). Agrega la variable a .env.example y dile al usuario qué copiar a su .env." })

    // ANTI-VUELTAS: misma acción con los mismos datos sin cambiar nada entre medio = mismo resultado
    if (!/skill_dey_(deshacer|historial|estado|rehacer)/.test(herramienta)) {
      const firma = `${herramienta}|${JSON.stringify(args).slice(0, 400)}|${st.ediciones}${acc.tipo === "editar" ? "|" + st.evaluaciones : ""}`
      const n = (st.firmas[firma] ?? 0) + 1
      st.firmas[firma] = n; if (Object.keys(st.firmas).length > 300) st.firmas = { [firma]: n }
      if (n >= 3) return fin({ negar: `SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable, o skill_dey_deshacer y reporta.` })
      if (st.enRojo) {
        st.accionesEnRojo++
        if (st.accionesEnRojo === 15) return fin({ negar: "SKILL_DEY anti-vueltas: 15 acciones sobre el mismo error sin quedar verde. Para: escribe en 1 línea qué sabes (hechos) y tu hipótesis; haz UNA comprobación que la refute (references/diagnostico-sistematico.md de la skill skill-dey)." })
        if (st.accionesEnRojo >= 30 && !/skill_dey_/.test(herramienta)) return fin({ negar: "SKILL_DEY FRENO: 30 acciones sin resolver el error. No sigas: skill_dey_deshacer al último verde y reporta al usuario hechos · hipótesis · siguiente paso (2–3 opciones)." })
      }
    }
    if (acc.tipo === "leer" || /skill_dey_/.test(herramienta)) st.evaluaciones++

    const modifica = acc.tipo === "editar" || (acc.tipo === "comando" && !!cmd && !esSoloLectura(cmd))
    if (acc.tipo === "editar" && cwd) for (const f of acc.archivos) if (fueraDelProyecto(cwd, f)) return fin({ negar: `SKILL_DEY: ${f} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.` })

    if (cwd) {
      // ALCANCE ESTRICTO: solo se modifica lo que el usuario pidió
      let objetivos: string[] = []
      if (acc.tipo === "editar") objetivos = acc.archivos
      else if (acc.tipo === "comando" && MODIFICA_BASH.test(cmd)) objetivos = [...cmd.matchAll(/(?:^|[\s>"'=(])([\w.\/\\:-]+\.[A-Za-z][\w]{0,5})\b/g)].map((m) => m[1]).filter((f) => { try { return existsSync(isAbsolute(f) ? f : join(cwd, f)) && !fueraDelProyecto(cwd, f) } catch { return false } })
      const nombrados = new Set(st.nombrados), existentes = new Set(st.existentes)
      for (const f of objetivos) {
        const abs = isAbsolute(f) ? f : join(cwd, f), clave = relNorm(cwd, f)
        if (!existsSync(abs) || existentes.has(clave) || IGNORA_ALCANCE.test(clave)) continue
        const nombre = clave.split("/").pop()!.toLowerCase()
        if (nombrados.size && !nombrados.has(nombre)) return fin({ negar: PREG(`SKILL_DEY alcance: el usuario pidió cambios en ${[...nombrados].slice(0, 5).join(", ")}, no en "${clave}" (que ya funcionaba).`) })
        if (!nombrados.size && !st.amplio && existentes.size >= 3) return fin({ negar: PREG(`SKILL_DEY alcance: ya modificaste ${existentes.size} archivos que existían (${[...existentes].slice(0, 4).join(", ")}) y ahora vas por "${clave}".`) })
      }
      // dentro de un archivo pedido: nada de reescribirlo entero
      if (!st.amplio && acc.tipo === "editar" && acc.archivos[0]) {
        const abs = isAbsolute(acc.archivos[0]) ? acc.archivos[0] : join(cwd, acc.archivos[0])
        if (existsSync(abs)) {
          let viejo = ""; try { if (statSync(abs).size < 2_000_000) viejo = readFileSync(abs, "utf8") } catch {}
          const vl = viejo.split(/\r?\n/)
          const quita = acc.reescribe ? (() => { const m = new Map<string, number>(); for (const l of acc.texto.split(/\r?\n/)) m.set(l, (m.get(l) ?? 0) + 1); let q = 0; for (const l of vl) { const n = m.get(l) ?? 0; if (n > 0) m.set(l, n - 1); else if (l.trim()) q++ } return q })() : acc.quita.split(/\r?\n/).filter((l) => l.trim()).length
          const limite = Math.max(25, Math.round(vl.length * 0.3))
          if (viejo && quita > limite) return fin({ negar: `SKILL_DEY alcance: ibas a cambiar ${quita} líneas de "${relNorm(cwd, acc.archivos[0])}" (de ${vl.length}). Cambia SOLO las líneas necesarias para lo que pidió el usuario, con ediciones pequeñas. No reescribas ni "mejores" el resto del archivo. Si el usuario pidió reescribirlo, que lo diga.` })
        }
      }
      for (const f of objetivos) if (existsSync(isAbsolute(f) ? f : join(cwd, f))) existentes.add(relNorm(cwd, f))
      st.existentes = [...existentes]

      // RAZONAR ANTES DE TOCAR (si la IA entrega la transcripción): "Entendí · Causa/Por qué · Plan" antes del 1er cambio a código existente
      if (acc.tipo === "editar" && !st.entendido && !st.avisoEntendi && acc.archivos.some((f) => existsSync(isAbsolute(f) ? f : join(cwd, f)))) {
        const t = textoIADesdeUsuario(transcript)
        if (!t) st.entendido = true // sin transcripción legible no se exige (nunca bloquear por no poder leer)
        else if (/entend[ií]\s*:/i.test(t.desde) && /(causa|por ?qu[eé]|plan|pasos?)\s*:/i.test(t.desde)) st.entendido = true
        else { st.avisoEntendi = true; return fin({ negar: "SKILL_DEY razonar: antes de cambiar código, escribe al usuario (corto):\nEntendí: <qué pidió exactamente y qué NO pidió>\nCausa/Por qué: <qué hay hoy en el código y por qué pasa o qué falta, con archivo:línea que LEÍSTE>\nPlan: <cambio mínimo, archivo por archivo, y cómo lo vas a comprobar>\nSi algo no está claro, PREGUNTA en vez de suponer. Luego haz el cambio." }) }
      }

      // ZONAS CONGELADAS (.skill_dey/CONGELADO.txt)
      if (modifica) try {
        const cong = readFileSync(join(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim().replace(/\\/g, "/").replace(/^\.\//, "")).filter((l) => l && !l.startsWith("#")).map((l) => process.platform === "win32" ? l.toLowerCase() : l)
        const rutas = acc.archivos.map((f) => relNorm(cwd, f))
        if (acc.tipo === "comando") for (const m of cmd.matchAll(/(?:^|[\s>"'])([\w.\/\\-]+\.[\w]+)/g)) rutas.push(relNorm(cwd, m[1]))
        const choca = rutas.find((r) => cong.some((c) => r === c || r.startsWith(c.replace(/\/$/, "") + "/")))
        if (choca) return fin({ negar: `SKILL_DEY: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.` })
      } catch {}
    }

    if (acc.tipo === "editar") {
      const t = acc.texto.split(/\r?\n/).find((l) => TRUNCADO.test(l))
      if (t) return fin({ negar: `SKILL_DEY: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o edita solo las líneas que cambian.` })
      if (!acc.archivos.every((f) => /\.env(\.|$)|\.example|\.md$/i.test(f))) {
        const linea = acc.texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l))
        if (linea) return fin({ negar: `SKILL_DEY: secreto en código bloqueado → "${linea.trim().slice(0, 80)}". Muévelo a .env y documenta la variable en .env.example.` })
      }
      if (!acc.archivos.every((f) => /(^|[\\/])(migrations?|migrate|alembic[\\/]versions)([\\/]|$)|\.(md|mdx|txt|rst)$/i.test(f))) {
        const d = bdDestructivo(acc.texto, acc.archivos.some((f) => /\.sql$/i.test(f)))
        if (d) return fin({ negar: `SKILL_DEY: PROHIBIDO para proteger la integridad de los datos → "${d.slice(0, 60)}". No se elimina base ni tabla, ni se vacía una tabla. Si de verdad hace falta, dilo al usuario para que lo haga él.` })
      }
    }

    let nuevoCmd = ""
    if (acc.tipo === "comando" && cmd) {
      for (const [re, motivo] of PELIGROSO) if (re.test(cmd)) return fin({ negar: `SKILL_DEY: bloqueado (${motivo}). Pide confirmación explícita al usuario y que lo ejecute él.` })
      if (borradoMasivo(cmd, base)) return fin({ negar: "SKILL_DEY: bloqueado (borrado masivo de carpetas). Pide confirmación explícita al usuario y que lo ejecute él." })
      const sqlArchivo = cwd ? sqlEjecutado(cmd, cwd) : ""
      if (sqlArchivo && bdDestructivo(sqlArchivo, true)) return fin({ negar: "SKILL_DEY: bloqueado: el archivo .sql que vas a ejecutar elimina o vacía datos (DROP/TRUNCATE/DELETE sin WHERE). Que lo ejecute el usuario si de verdad hace falta." })
      // servidores y pruebas que nunca terminan (congelan la sesión)
      const yaFondo = /(&\s*$|nohup|disown|--detach|-d\b)/.test(cmd) || args?.run_in_background === true || args?.is_background === true
      if (/\bStart-Process\b[^;|]*-Redirect(StandardOutput|StandardError|StandardInput)\b|\bstart\s+\/b\b/i.test(cmd)) return fin({ negar: `SKILL_DEY: ese arranque deja la terminal colgada en Windows (la salida queda atada al servidor). ${FONDO[host]}` })
      if (SERVIDOR.test(cmd) && !yaFondo) {
        if (host === "gemini" && process.platform !== "win32") {
          const log = `.skill_dey/logs/servidor-${Date.now()}.log`
          nuevoCmd = `mkdir -p .skill_dey/logs && (nohup sh -c '${cmd.replace(/'/g, `'\\''`)}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: ${log}" ; tail -n 25 "${log}"`
        } else return fin({ negar: `SKILL_DEY: este comando deja un servidor corriendo y congela la sesión. ${FONDO[host]}` })
      }
      let t = nuevoCmd || cmd
      if (/\bvitest\b/.test(t) && !/\bvitest\s+(run|related)\b|--run\b/.test(t)) t = t.replace(/\bvitest\b/, "vitest run")
      if (/--watch(All)?\b/.test(t) && /jest|vitest|mocha|test/.test(t)) t = t.replace(/\s--watch(All)?\b/g, "")
      if (t !== (nuevoCmd || cmd)) { if (host === "gemini") nuevoCmd = t; else return fin({ negar: `SKILL_DEY: las pruebas en modo "watch" no terminan nunca. Usa: ${t}` }) }
      // dependencias: solo si el usuario las pidió o aprobó
      const dep = cmd.match(DEPENDENCIA)
      if (dep && st.prompt && !/(^|\s)-(D|-save-dev)\b.*playwright|--dry-run/.test(cmd)) {
        const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""))
        const tu = st.prompt.toLowerCase()
        const pidio = /instal|dependenc|librer|paquete|package|m[oó]dulo npm|composer/.test(tu) || paquetes.some((p) => tu.includes(p.toLowerCase().split("/").pop()!)) || SI.test(tu) || paquetes.length === 0
        if (!pidio) return fin({ negar: `SKILL_DEY: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.` })
      }
      if (cwd) {
        // BD: respaldo obligatorio antes de migrar o modificar datos (contra una copia de prueba sí se puede ensayar)
        if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd) || (sqlArchivo && /\b(insert|update|delete|alter|create|drop|replace)\b/i.test(sqlArchivo))) && !/--pretend\b|--dry-run\b|\bmigrate:status\b|\bmigrate\s+status\b|\s--status\b|\bshowmigrations\b/.test(cmd) && !/\b(DB_DATABASE|DB_NAME|DATABASE_URL)["']?\s*=\s*["']?[^\s"';]*(_skilldey_prueba_?\d*|bd-prueba\.sqlite)\b/i.test(cmd) && !respaldoBdReciente(cwd))
          return fin({ negar: "SKILL_DEY: antes de migrar o modificar la BD real: 1) ensaya en una copia · 2) haz respaldo en .skill_dey/respaldos-bd/ (pg_dump -Fc -f .skill_dey/respaldos-bd/<fecha>.dump <bd> · mysqldump <bd> > .skill_dey/respaldos-bd/<fecha>.sql · copiar el .sqlite). Si es BD de producción, NO lo hagas: pide al usuario." })
        if (/git\s+(add|commit)\b/.test(cmd)) { const tr = blindarGitignore(cwd); if (tr) return fin({ negar: `SKILL_DEY: ${tr} está versionado en git (secretos expuestos). Ejecuta: git rm --cached ${tr} y avisa al usuario que cambie esas claves.` }) }
        if (/git\s+commit\b/.test(cmd) && !/checkpoint|baseline|wip/i.test(cmd) && st.ultimaEdicion > 0) {
          let v: any = null; try { v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")) } catch {}
          if (!v || !v.ok || v.ts < st.ultimaEdicion) return fin({ negar: "SKILL_DEY: commit bloqueado. Ejecuta skill_dey_verificar (debe salir ✅) después de tu última edición. Para guardar avance usa un commit 'skill_dey: checkpoint'." })
        }
      }
    }

    // INTEGRIDAD: foto del proyecto antes del primer cambio del pedido (sin git o proyecto enorme: copia de cada archivo)
    if (modifica && cwd) {
      try {
        const ped = st.prompt.replace(/\s+/g, " ").trim().slice(0, 100)
        if (!st.foto) {
          st.foto = true
          const grande = (() => { try { return contarArchivos(cwd, 2500) >= 2500 } catch { return false } })()
          st.git = esRepo(cwd) ? asegurarRepo(cwd) : grande ? false : asegurarRepo(cwd)
          if (st.git) { const c = foto(cwd, "pasos", "cambio", ped ? `"${ped}"` : acc.tipo === "comando" ? `bash: ${cmd}` : `${acc.herramienta} ${acc.archivos.join(", ")}`); if (c && !st.commitBase) st.commitBase = c }
        }
        if (!st.git) for (const f of acc.archivos) respaldarArchivo(cwd, f, st.turno, ped)
      } catch (e: any) { log(`foto: ${e?.message}`) }
      // guardar cómo estaba el archivo: al terminar la edición el CÓDIGO mide a quién afecta (sin gastar pasos del modelo)
      if (acc.tipo === "editar") for (const f of acc.archivos) {
        const abs = isAbsolute(f) ? f : join(cwd, f)
        if (!CODIGO.test(abs)) continue
        try { if (existsSync(abs) && statSync(abs).size < 400_000) { const d = viejoDe(cwd, abs); mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, readFileSync(abs, "utf8")) } } catch {}
      }
    }
    return fin(nuevoCmd ? { comando: nuevoCmd } : {})
  }

  if (ev === "despues") {
    const resp = JSON.stringify(primero(entrada, ["tool_response", "toolResponse", "output", "result", "error"]) ?? "")
    if (/skill_dey_(verificar|revisar|chrome)/.test(herramienta)) { if (/✅ todo verde|✅ sitio sin errores|0 problema/.test(resp)) { st.enRojo = false; st.accionesEnRojo = 0; st.firmas = {} } else if (/❌/.test(resp)) st.enRojo = true }
    if (/skill_dey_(deshacer|rehacer)/.test(herramienta)) st.foto = false // el próximo cambio vuelve a tomar foto
    if (acc.tipo === "comando" && acc.comando && !esSoloLectura(acc.comando)) { st.ediciones++; if (MODIFICA_BASH.test(acc.comando)) st.ultimaEdicion = Date.now() }
    if (acc.tipo !== "editar" || !cwd) return fin({})
    st.ediciones++; st.ultimaEdicion = Date.now()
    const avisos: string[] = []
    for (const archivo of acc.archivos) {
      if (!st.editados.includes(archivo)) st.editados.push(archivo)
      const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo), d = viejoDe(cwd, abs)
      try { if (existsSync(d)) { const a = impactoDe(cwd, abs, readFileSync(d, "utf8"), readFileSync(abs, "utf8")); unlinkSync(d); if (a) avisos.push(a) } } catch {}
      const err = sintaxis(cwd, archivo)
      if (err) avisos.push(`⚠ SKILL_DEY sintaxis en ${archivo}:\n${err}\n→ Corrígelo antes de seguir.`)
    }
    if (!avisos.length) return fin({})
    if (host === "antigravity") { st.avisos.push(...avisos); return fin({}) } // Antigravity no acepta contexto aquí: se entrega al cerrar
    return fin({ contexto: avisos.join("\n\n") })
  }

  // ev === "fin": CERO ERRORES — el guardián verifica GRATIS lo que cambió y solo despierta a la IA si hay un error real
  if (!cwd || !st.editados.length) { if (cwd && st.avisos.length) { const a = st.avisos.join("\n\n"); st.avisos = []; return fin({ frenar: a }) } return fin({}) }
  const errores = st.editados.map((f) => {
    const e = sintaxis(cwd, f); if (e) { const l = e.split("\n"); return `${f}: ${(l.find((x) => /error/i.test(x)) ?? l[l.length - 1]).trim().slice(0, 120)}` }
    try { const abs = isAbsolute(f) ? f : join(cwd, f); if (existsSync(abs) && statSync(abs).size < 2_000_000 && /^(<{7}|={7}|>{7})( |$)/m.test(readFileSync(abs, "utf8"))) return `${f}: marcas de conflicto de git sin resolver` } catch {}
    return ""
  }).filter(Boolean)
  if (errores.length && st.autoIntentos < 3) {
    st.autoIntentos++
    const orden = st.autoIntentos >= 3 ? "CICLO 4 — DIAGNÓSTICO SISTEMÁTICO: abandona el enfoque anterior; escribe tu hipótesis comprobable en 1 línea antes de editar (references/diagnostico-sistematico.md). Si no queda bien: skill_dey_deshacer." : "Corrige exactamente eso por causa raíz."
    return fin({ frenar: `[GUARDIAN] ${errores.slice(0, 6).join(" | ")}\n${orden} Responde en 1-3 líneas.` })
  }
  let resultado = "✅"
  if (errores.length) {
    resultado = "❌ quedó con errores"
    if (st.baseVerde && st.git) {
      const r = deshacerDesde(cwd, st.inicioPedido, st.commitBase)
      resultado = "↩ deshecho automático (rompía la app)"
      try { appendFileSync(join(cwd, ".skill_dey", "BITACORA.md"), `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} · "${st.prompt.replace(/\s+/g, " ").slice(0, 100)}" · ↩ DESHECHO AUTOMÁTICO: rompía lo que funcionaba (${errores[0].slice(0, 120)})\n`) } catch {}
      st.editados = []; st.autoIntentos = 99
      return fin({ frenar: `[GUARDIAN] Deshice tu cambio automáticamente: rompía lo que funcionaba y no quedó bien en 3 intentos.\n${errores.join(" | ").slice(0, 600)}\n${r.split("\n")[0]}\nNo vuelvas a editar. Dile al usuario en 2 líneas qué pasó y que puede escribir "rehaz" si igual lo quiere.` })
    }
  } else {
    try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), JSON.stringify({ ok: true, ts: Date.now(), errores: 0, origen: `guardian-${host}`, archivos: st.editados.slice(0, 50) })) } catch {}
  }
  const lista = st.editados.map((f) => relNorm(cwd, f))
  try { registrarCambio(cwd, lista, st.prompt, resultado) } catch {} // la próxima sesión sabe dónde quedamos
  try { if (contarArchivos(cwd, 2500) < 2500 && lista.some((f) => !/(^|\/)docs\/|database\/instalacion\.sql$/.test(f))) documentar(cwd) } catch (e: any) { log(`documentar: ${String(e?.message ?? e).slice(0, 200)}`) }
  st.editados = []
  const avisos = st.avisos.splice(0)
  if (avisos.length) return fin({ frenar: avisos.join("\n\n") })
  return fin({})
}

// ---------- Programa ----------
async function leerStdin(): Promise<string> {
  if (process.stdin.isTTY) return ""
  let t = ""; process.stdin.setEncoding("utf8")
  for await (const c of process.stdin) t += c
  return t
}
export async function main(argv: string[]) {
  const host = (argv[0] ?? "claude") as Host, ev = (argv[1] ?? "antes") as Evento
  const t0 = Date.now()
  let salida: object = {}
  try {
    if (!["claude", "gemini", "antigravity"].includes(host) || !["inicio", "prompt", "antes", "despues", "fin"].includes(ev)) throw new Error("uso: skill_dey-hook <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>")
    const txt = await leerStdin()
    salida = responder(host, ev, procesar(host, ev, txt.trim() ? JSON.parse(txt) : {}))
  } catch (e: any) { log(`${host}/${ev}: ${String(e?.stack ?? e).slice(0, 400)}`); salida = {} }
  const ms = Date.now() - t0
  if (ms > 3000) log(`lento ${host}/${ev} ${ms} ms`)
  process.stdout.write(JSON.stringify(salida))
}
if (process.argv[1] && /skill_dey-hook\.(mjs|ts|js)$/.test(process.argv[1])) main(process.argv.slice(2))
