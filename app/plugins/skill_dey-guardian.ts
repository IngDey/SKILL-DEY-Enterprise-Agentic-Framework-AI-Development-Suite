// SKILL_DEY Guardián — reglas que se CUMPLEN aunque el modelo las olvide.
// 1) Bloquea secretos escritos en código.   2) Bloquea comandos peligrosos.
// 3) Revisa sintaxis de cada archivo apenas se edita y avisa al modelo en la misma respuesta (0 tokens extra si está bien).
// 4) Bloquea el commit final si no hay una verificación verde posterior a la última edición.
// 5) Evita que el modelo lea .env reales (protege tus credenciales).
// 6) INTEGRIDAD: antes del primer cambio de cada pedido toma una foto completa del proyecto → siempre se puede deshacer.
// 8) CONSUMO: al terminar cada respuesta muestra tokens, costo y tiempo (sin gastar tokens del modelo) y lo anota en .skill_dey/CONSUMO.md.
// 9) CERO ERRORES: si al terminar una respuesta quedó un archivo con error o sin verificación verde, le ordena al agente corregir (máx. 2 veces) o deshacer.
// 7) Base de datos: exige respaldo reciente antes de migraciones o SQL que modifica datos/esquema.
import { tool, type Plugin } from "@opencode-ai/plugin"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, appendFileSync, readdirSync, statSync, mkdirSync, renameSync, writeFileSync } from "node:fs"
import { join, extname, isAbsolute, resolve, relative } from "node:path"
import { foto, respaldarArchivo, asegurarRepo, hayGit } from "../skill_dey-lib/respaldo.ts"
import { homedir as _home } from "node:os"
import { verificar as verificarTool } from "../tools/skill_dey.ts"
import { documentar } from "../skill_dey-lib/documentar.ts"
import { autoprueba } from "../skill_dey-lib/autoprueba.ts"
import { errorJs } from "../skill_dey-lib/sintaxis.ts"
import { esProyectoAvanzado } from "../skill_dey-lib/adopcion.ts"
import { capacidades, agenteVision, leerDisenoSinVision, esErrorDeLimite, marcarLimitado, siguienteModelo, estaLimitado, resumenModelos } from "../skill_dey-lib/modelos.ts"
import { ejecutarComando, intencion } from "../skill_dey-lib/comandos.ts"
import { empalme, comprimirMemoria } from "../skill_dey-lib/empalme.ts"
import { listar as listarReglas, quitarRegla, quitarVacuna } from "../skill_dey-lib/reglas.ts"
import { resumenSeguridad } from "../skill_dey-lib/seguridad.ts"
import { probarApp } from "../skill_dey-lib/probador.ts"
import { notasVersion, principios, asegurarPrincipios } from "../skill_dey-lib/saber.ts"
import { formatear, validacionServidor, erroresProduccion, rendimiento as _rendimiento, consultasEnBucle } from "../skill_dey-lib/extras.ts"
import { organizar as _organizar } from "../skill_dey-lib/organizar.ts"
import { buscarSkill as _buscarSkill } from "../skill_dey-lib/buscar_skill.ts"
import { capacitar as _capacitar } from "../skill_dey-lib/video.ts"
import { pruebasProfesionales as _pruebasPro } from "../skill_dey-lib/testpro.ts"
import { aprenderDeCorrida as _aprender } from "../skill_dey-lib/aprender.ts"
import { revisarMovil as _movil } from "../skill_dey-lib/movil.ts"
import { auditarDependencias as _audit, semgrep as _semgrep, sentryCheck as _sentry } from "../skill_dey-lib/pro.ts"
import { instalarMultiIA as _multiia } from "../skill_dey-lib/multiia.ts"
import { doctor as _doctor, instalarHook as _hook, reporte as _reporte } from "../skill_dey-lib/robustez.ts"
import { documentosPdf } from "../skill_dey-lib/pdf.ts"
import { iniciarApp as _iniApp, asegurarPlaywright as _pw, rutasAProbar as _rutas } from "../skill_dey-lib/app.ts"
import { writeFileSync as _wf, appendFileSync as _af, existsSync as _ex, mkdirSync as _mk } from "node:fs"
import { copiaPrueba } from "../skill_dey-lib/bd.ts"
import * as Herramientas from "../tools/skill_dey.ts"

const SECRETO = /(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i
const PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-])/i
const PELIGROSO: [RegExp, string][] = [
  [/git\s+push\s+.*(--force\b|-f\b)/, "push forzado"],
  [/rm\s+-rf?\s+(\/|~|\*|\.\s*$|\$HOME)(\s|$)/, "borrado masivo"],
  [/git\s+clean\s+-[a-z]*f[a-z]*d/, "git clean de archivos no versionados"],
  [/\b(drop\s+database|drop\s+schema|truncate\s+table)\b/i, "borrado de base de datos"],
  [/(migrate|migration).*(--env[= ]?prod|production)/i, "migración en producción"],
]

// Garantiza que .env y capturas nunca se suban a git (crea/completa .gitignore)
function blindarGitignore(cwd: string): string | null {
  const gi = join(cwd, ".gitignore")
  const actual = existsSync(gi) ? readFileSync(gi, "utf8") : ""
  const faltan = [".env", ".env.*", "!.env.example", ".skill_dey/shots/", ".skill_dey/.ultimo-verificar.json", ".skill_dey/respaldos-bd/", ".skill_dey/respaldos-archivos/"].filter((l) => !actual.split(/\r?\n/).map((x) => x.trim()).includes(l))
  if (faltan.length) appendFileSync(gi, (actual && !actual.endsWith("\n") ? "\n" : "") + "# SKILL_DEY: nunca subir secretos ni temporales\n" + faltan.join("\n") + "\n")
  const r = spawnSync("git", ["ls-files", "--cached", "--", ".env", ".env.local", ".env.production", ".env.prod"], { cwd, encoding: "utf8" })
  const trackeados = (r.stdout || "").trim()
  return trackeados ? trackeados.split(/\r?\n/).join(", ") : null
}

// Código truncado (los modelos gratis lo hacen y rompen archivos)
const TRUNCADO = /(\/\/|#|\/\*|<!--|--)\s*\.{3}\s*(resto|rest|existing|c[oó]digo|code|same|sin cambios|unchanged|igual|anterior|previous|etc)|\.{3}\s*(resto del|rest of (the )?)(c[oó]digo|code|file|archivo)|(\/\/|#)\s*(aqu[ií] va|el resto|the rest|remaining code|c[oó]digo existente|existing code)\b/i
// Servidores que nunca terminan (congelan al agente) y pruebas en modo "watch"
const SERVIDOR = /(^|&&|;|\|\|)\s*((npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|watch|preview)\b|php\s+(artisan\s+serve|-S\s)|(python3?|py)\s+manage\.py\s+runserver|nodemon\b|npx\s+(vite|next\s+dev|nodemon)|vite(\s|$)|next\s+dev|flask\s+run|uvicorn\b|rails\s+s(erver)?\b|dotnet\s+(run|watch)\b|go\s+run\b)/i
// Instalar dependencias
const DEPENDENCIA = /\b(npm\s+(i|install|add)|yarn\s+add|pnpm\s+(add|i|install)|bun\s+add|composer\s+require|pip3?\s+install|poetry\s+add|go\s+get|cargo\s+add|gem\s+install|dotnet\s+add\s+package)\s+(?<pkgs>[^&|;]+)/i
const SOLO_LECTURA = /^\s*(ls|dir|cat|type|head|tail|less|grep|rg|find|wc|tree|pwd|echo|which|where|whoami|date|env|printenv|node\s+(-v|--version|--check)|npm\s+(ls|view|outdated|audit(?!\s+fix))|pip\s+(show|list)|composer\s+(show|audit)|git\s+(status|log|diff|show|branch|rev-parse|ls-files|grep|remote|config\s+--get|blame|describe|tag\s*$))\b/i
const esSoloLectura = (cmd: string) => !/[^2]>|>>|\btee\b|\s-i\b/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every((p) => !p.trim() || SOLO_LECTURA.test(p))

const MIGRACION = /(artisan\s+migrate(?!:status)|prisma\s+(migrate\s+(dev|deploy|reset)|db\s+push)|knex\s+migrate:(latest|up|down|rollback)|sequelize(-cli)?\s+db:migrate|alembic\s+(upgrade|downgrade)|manage\.py\s+migrate|typeorm.*migration:(run|revert)|flyway\s+migrate|rails\s+db:(migrate|rollback)|goose\s+(up|down)|doctrine:migrations:migrate)/i
const SQL_MODIFICA = /(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?)\b[\s\S]*\b(delete\s+from|update\s+[\w."`\[\]]+\s+set|alter\s+table|drop\s+(table|column|index)|insert\s+into|deleteMany|updateMany)\b/i
function respaldoBdReciente(cwd: string, horas = 3): boolean {
  const d = join(cwd, ".skill_dey", "respaldos-bd")
  if (!existsSync(d)) return false
  return readdirSync(d).some((f) => Date.now() - statSync(join(d, f)).mtimeMs < horas * 3_600_000)
}

function sintaxis(cwd: string, file: string): string {
  const f = isAbsolute(file) ? file : join(cwd, file)
  if (!existsSync(f)) return ""
  const e = extname(f).toLowerCase()
  if ([".js", ".mjs", ".cjs"].includes(e)) return errorJs(cwd, f)
  const cmd = e === ".php" ? `php -l "${f}"` : e === ".py" ? `${process.platform === "win32" ? "python" : "python3"} -m py_compile "${f}"` : [".js", ".mjs", ".cjs"].includes(e) ? `node --check "${f}"` : ""
  if (e === ".json") { try { JSON.parse(readFileSync(f, "utf8")); return "" } catch (x: any) { return `JSON inválido: ${x.message}` } }
  if (!cmd) return ""
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 20_000 })
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`
  if (r.status === 0 || /not recognized|not found|no se reconoce/i.test(out)) return ""
  return out.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join("\n")
}

// ---------- AUTODIAGNÓSTICO: comprueba que cada protección esté activa ----------
const VERSION = "32.0.0" // (no exportar: OpenCode trata cada export del plugin como un plugin)
function diagnosticar(client: any, cwd: string): { ok: string[]; mal: string[] } {
  const ok: string[] = [], mal: string[] = []
  const chk = (c: boolean, bien: string, malo: string) => (c ? ok : mal).push(c ? bien : malo)
  chk(typeof client?.session?.messages === "function" && typeof client?.session?.get === "function", "lectura de sesiones (consumo, verificación final)", "OpenCode cambió la API de sesiones: consumo y verificación final desactivados → actualiza skill_dey")
  chk(typeof client?.session?.prompt === "function", "órdenes automáticas [GUARDIAN] (corrección y cambio de modelo)", "OpenCode cambió session.prompt: sin corrección automática ni cambio de modelo por límite")
  chk(typeof client?.session?.abort === "function", "corte de reintentos por límite", "sin session.abort: el cambio de modelo por límite tardará más")
  chk(typeof client?.tui?.showToast === "function", "avisos en pantalla", "sin avisos en pantalla (showToast): el consumo solo queda en .skill_dey/CONSUMO.md")
  chk(hayGit(cwd), "git (copias y deshacer completos)", "git no está instalado: deshacer solo cubre archivos editados, no comandos → instala git")
  const dir = join(_home(), ".config", "opencode", "skill_dey")
  let cat: any = null; try { cat = JSON.parse(readFileSync(join(dir, "MODELOS.json"), "utf8")) } catch {}
  chk(!!cat, "catálogo de modelos", "falta MODELOS.json: reinstala skill_dey para detectar tus modelos")
  if (cat) chk(Date.now() - Date.parse(cat.actualizado) < 30 * 86_400_000, "catálogo de modelos al día", "el catálogo de modelos tiene más de 30 días: reinstala para registrar modelos nuevos")
  let ver = ""; try { ver = readFileSync(join(dir, "VERSION"), "utf8").trim() } catch {}
  chk(!ver || ver === VERSION, `versión ${VERSION} completa`, `instalación mezclada (${ver} vs ${VERSION}): vuelve a ejecutar el instalador`)
  return { ok, mal }
}

// ---------- ENCENDIDO / APAGADO: "iniciar skill dey" · "finalizar skill dey" ----------
const ESTADO_ON = join(_home(), ".config", "opencode", "skill_dey", "ACTIVO.json")
const estaActivo = () => { try { return JSON.parse(readFileSync(ESTADO_ON, "utf8")).activo !== false } catch { return true } }
function fijarActivo(v: boolean) { try { mkdirSync(join(_home(), ".config", "opencode", "skill_dey"), { recursive: true }); writeFileSync(ESTADO_ON, JSON.stringify({ activo: v, desde: new Date().toISOString() })) } catch {} }
const INICIAR = /\b(iniciar|inicia|activar|activa|encender|enciende|empezar)\s+(la\s+)?skill[\s_-]*dey\b/i
const FINALIZAR = /\b(finalizar|finaliza|desactivar|desactiva|apagar|apaga|terminar|termina|detener|salir\s+de)\s+(la\s+)?skill[\s_-]*dey\b/i

// ---------- consumo de tokens / costo / tiempo ----------
const k = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n)))
const tok = (i: any) => { const t = i?.tokens ?? {}; return (t.input ?? 0) + (t.output ?? 0) + (t.reasoning ?? 0) + (t.cache?.read ?? 0) + (t.cache?.write ?? 0) }
const seg = (ms: number) => (ms >= 60_000 ? `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s` : `${Math.round(ms / 1000)} s`)
async function medir(client: any, sid: string) {
  const r = await client.session.messages({ path: { id: sid } })
  const msgs: any[] = (r?.data ?? r ?? []).map((m: any) => m.info ?? m)
  const usuarios = msgs.filter((m) => m.role === "user")
  const asis = msgs.filter((m) => m.role === "assistant")
  const ultimo = usuarios[usuarios.length - 1]
  const turno = asis.filter((m) => m.parentID === ultimo?.id)
  const suma = (l: any[]) => ({ tokens: l.reduce((a, m) => a + tok(m), 0), costo: l.reduce((a, m) => a + (m.cost ?? 0), 0),
    entrada: l.reduce((a, m) => a + (m.tokens?.input ?? 0) + (m.tokens?.cache?.read ?? 0) + (m.tokens?.cache?.write ?? 0), 0), salida: l.reduce((a, m) => a + (m.tokens?.output ?? 0) + (m.tokens?.reasoning ?? 0), 0) })
  const fin = Math.max(0, ...turno.map((m) => m.time?.completed ?? m.time?.created ?? 0))
  const dur = ultimo?.time?.created && fin ? fin - ultimo.time.created : 0
  const ult = asis[asis.length - 1]
  let limite = 0
  try {
    const pr = await client.config.providers()
    const provs: any[] = pr?.data?.providers ?? pr?.providers ?? []
    limite = provs.find((p) => p.id === ult?.providerID)?.models?.[ult?.modelID]?.limit?.context ?? 0
  } catch {}
  const ctx = ult ? (ult.tokens?.input ?? 0) + (ult.tokens?.cache?.read ?? 0) + (ult.tokens?.cache?.write ?? 0) + (ult.tokens?.output ?? 0) : 0
  return { consulta: { ...suma(turno), dur, llamadas: turno.length }, sesion: { ...suma(asis), consultas: usuarios.length }, ctx, limite, modelo: ult ? `${ult.providerID}/${ult.modelID}` : "", hoy: 0 }
}
/** Suma los tokens de hoy con un modelo leyendo CONSUMO.md (0 tokens del modelo). */
function tokensHoy(f: string, modelo: string): number {
  const hoy = new Date().toISOString().slice(0, 10), n = (x: string) => parseFloat(x) * (x.endsWith("M") ? 1e6 : x.endsWith("k") ? 1e3 : 1)
  try { return readFileSync(f, "utf8").split("\n").filter((l) => l.startsWith(hoy) && l.includes(`| ${modelo} |`)).reduce((a, l) => a + n(l.match(/consulta ([\d.]+[kM]?)/)?.[1] ?? "0"), 0) } catch { return 0 }
}
function texto(m: Awaited<ReturnType<typeof medir>>) {
  const c = m.consulta, s = m.sesion
  const dinero = (v: number) => (v > 0 ? ` · US$${v.toFixed(v < 0.01 ? 4 : 2)}` : " · gratis/sin costo reportado")
  const pct = m.limite ? Math.round((m.ctx / m.limite) * 100) : 0
  const libre = m.limite ? `  |  QUEDAN ${k(Math.max(0, m.limite - m.ctx))} tokens en esta sesión (${100 - pct}% libre de ${k(m.limite)})` : "  |  quedan: el modelo no informa su límite de contexto"
  return {
    pct, hoy: m.hoy,
    corto: `Esta consulta: ${k(c.tokens)} tokens (${k(c.entrada)} leídos / ${k(c.salida)} escritos)${dinero(c.costo)} · ${seg(c.dur)}  |  Sesión: ${k(s.tokens)}${dinero(s.costo)} en ${s.consultas} consultas${libre}${m.hoy ? `  |  Hoy con ${m.modelo.split("/").pop()}: ${k(m.hoy)} tokens` : ""}`,
    linea: `${new Date().toISOString().slice(0, 16).replace("T", " ")} | ${m.modelo} | consulta ${k(c.tokens)} (lee ${k(c.entrada)} / escribe ${k(c.salida)}) | US$${c.costo.toFixed(4)} | ${seg(c.dur)} | sesión ${k(s.tokens)} US$${s.costo.toFixed(4)}`,
  }
}
/** TABLERO para ver al lado de la conversación (.skill_dey/TABLERO.txt). Se reescribe al terminar cada respuesta. 0 tokens del modelo. */
function tablero(m: Awaited<ReturnType<typeof medir>>, x: { herrTurno: number; herrSesion: number; sesionMs: number }) {
  const c = m.consulta, s = m.sesion
  const pct = m.limite ? Math.min(100, Math.round((m.ctx / m.limite) * 100)) : 0
  const llenos = Math.round(pct / 10)
  const barra = m.limite ? "[" + "█".repeat(llenos) + "░".repeat(10 - llenos) + `] ${pct}% lleno · quedan ${k(Math.max(0, m.limite - m.ctx))}` : "[el modelo no informa su límite]"
  const money = (v: number) => (v > 0 ? `US$${v.toFixed(v < 0.01 ? 4 : 2)}` : "gratis")
  const col = (a: string, b: string) => " " + a.padEnd(11) + b
  const modelo = (m.modelo || "—").split("/").pop() || "—"
  return [
    `╭─ SKILL_DEY · TABLERO DE CONSUMO · ${new Date().toTimeString().slice(0, 5)} ─╮`,
    col("Pregunta", `${k(c.tokens)} tok  (${k(c.entrada)} lee / ${k(c.salida)} escribe) · ${money(c.costo)} · ${seg(c.dur)} · ${x.herrTurno} herram.`),
    col("Sesión", `${k(s.tokens)} tok · ${money(s.costo)} · ${s.consultas} consulta(s) · ${x.herrSesion} herram. · ${seg(x.sesionMs)}`),
    col("Hoy", `${k(m.hoy || 0)} tok con ${modelo}   (para anticipar el cupo diario gratis)`),
    col("Contexto", barra),
    col("Modelo", m.modelo || "—"),
    `╰─ histórico: .skill_dey/CONSUMO.md · en el chat: /skill_dey consumo ─╯`,
  ].join("\n")
}

export const SkillDeyGuardian: Plugin = async ({ directory, worktree, client }: any) => {
  const cwd = worktree || directory
  try { const d = join(_home(), ".config", "opencode", "skill_dey"); mkdirSync(d, { recursive: true }); writeFileSync(join(d, ".guardian-activo"), String(process.pid)) } catch {} // latido: lo revisa skill_dey_verificar
  try { if (existsSync(join(cwd, ".forja")) && !existsSync(join(cwd, ".skill_dey"))) renameSync(join(cwd, ".forja"), join(cwd, ".skill_dey")) } catch {} // migración desde FORJA
  let ultimaEdicion = 0
  let fotoDelTurno = false          // una foto por pedido del usuario (se reinicia cuando el agente termina de responder)
  let turno = new Date().toISOString().replace(/[:.]/g, "-")
  let conGit: boolean | null = null
  const editados = new Set<string>()   // archivos tocados en el pedido actual
  let avisoModelo = false
  let anuncio: "on" | "off" | "" = ""
  let diagnosticoMostrado = false
  let fotoFallo = false
  let autoIntentos = 0
  const sesionInicio = Date.now()           // reloj de sesión para el tablero
  let herrTurno = 0, herrSesion = 0          // herramientas usadas (pregunta actual / sesión) para el tablero
  // ANTI-VUELTAS (0 tokens): corta al modelo cuando repite lo mismo o da vueltas sobre un error
  let enRojo = false, accionesEnRojo = 0, ediciones = 0, cambioPorTerminal = false
  const repetidas = new Map<string, number>(), comandos = new Map<string, string>() // callID → comando bash
  const reiniciarVueltas = () => { enRojo = false; accionesEnRojo = 0; repetidas.clear() }
  let ultimoCambio = 0
  const cambios: number[] = []          // cambios automáticos de modelo por límite (máx. 4 por hora)                   // órdenes automáticas de corrección enviadas en este pedido
  const protegerAntesDeCambiar = (desc: string) => {
    if (fotoDelTurno) return
    fotoDelTurno = true
    if (conGit === null) conGit = asegurarRepo(cwd)
    if (conGit) fotoFallo = !foto(cwd, "pasos", "cambio", desc)
  }
  const pendientes = new Map<string, string>() // callID → archivo editado

  const hooks: any = {
    // Detecta "iniciar skill dey" / "finalizar skill dey" en el mensaje del usuario (antes de que llegue al modelo)
    "chat.message": async (_input: any, output: any) => {
      // /skill_dey <comando>: se ejecuta por código; el modelo solo muestra el resultado
      const partes: any[] = output?.parts ?? []
      let pc = partes.find((p) => p.type === "text" && /^\s*SKILL_DEY_CMD\b/.test(p.text ?? ""))
      let args = pc ? String(pc.text).replace(/^\s*SKILL_DEY_CMD\b/, "").trim() : ""
      // Sin comando: la MISMA acción pedida en lenguaje normal ("documenta la app", "¿cuántos tokens me quedan?"…) se ejecuta por código
      if (!pc && estaActivo() && partes.filter((p) => p.type === "text").length === 1) {
        const p0 = partes.find((p) => p.type === "text"), c = intencion(String(p0?.text ?? ""))
        if (c) { pc = p0; args = c }
      }
      if (pc) {
        const modeloAct = _input?.model ? `${_input.model.providerID}/${_input.model.modelID}` : ""
        const r = await ejecutarComando(args, {
          cwd, sesion: _input?.sessionID ?? "", T: { ...Herramientas, ...hooks.tool }, documentar: (c: string) => { const d = documentar(c); let pdf = ""; try { pdf = documentosPdf(c) } catch {} ; return d + (pdf ? "\n" + pdf : "") }, empalme, organizar: _organizar, reglas: listarReglas, quitarRegla, quitarVacuna, copiaBd: copiaPrueba,
          seguridad: (c: string) => [...resumenSeguridad(c).lineas, ..._audit(c), _semgrep(c)].filter(Boolean).join("\n"), probar: async (c: string) => (await probarApp(c)).lineas.join("\n"), notas: notasVersion,
          principios: (c: string) => asegurarPrincipios(c),
          formato: (c: string) => formatear(c), validar: (c: string) => validacionServidor(c), produccion: (c: string) => [erroresProduccion(c), _sentry(c)].filter(Boolean).join("\n"),
          rendimiento: async (c: string) => { try { const nb = consultasEnBucle(c); const app = await _iniApp(c).catch(() => null); const base = (app as any)?.url; const r = await _rendimiento(c, base, base ? _rutas(c, []) : [], _pw(c)); (app as any)?.detener?.(); return r.lineas.join("\n") } catch (e: any) { return "no pude medir: " + e.message } }, congelar: (c: string, ruta: string) => { if (!ruta) return "di qué ruta congelar, ej: /skill_dey congelar pagos/"; try { _mk(join(c, ".skill_dey"), { recursive: true }); _af(join(c, ".skill_dey", "CONGELADO.txt"), (_ex(join(c, ".skill_dey", "CONGELADO.txt")) ? "" : "# rutas que no se tocan sin permiso\n") + ruta.trim() + "\n"); return "🧊 congelado: " + ruta.trim() + " (no se tocará sin permiso)" } catch (e: any) { return "no pude: " + e.message } },
          diagnostico: () => { const d = diagnosticar(client, cwd); return [`SKILL_DEY ${VERSION} · diagnóstico`, ...d.ok.map((x) => "✅ " + x), ...d.mal.map((x) => "❌ " + x)].join("\n") },
          autoprueba: () => autoprueba((x: any, c: any) => verificarTool.execute(x, c)),
          consumo: async () => { try { const m = await medir(client, _input?.sessionID); m.hoy = tokensHoy(join(cwd, ".skill_dey", "CONSUMO.md"), m.modelo); return texto(m).corto } catch (e: any) { return "No pude leer el consumo: " + e.message } },
          modelos: () => resumenModelos(modeloAct), fijarActivo,
          tablero: () => { try { return readFileSync(join(cwd, ".skill_dey", "TABLERO.txt"), "utf8") } catch { return "Aún no hay tablero: aparece al terminar la primera respuesta (y queda en .skill_dey/TABLERO.txt)." } },
          buscarSkill: (c: string, tema: string) => _buscarSkill(c, tema || ""),
          capacitar: async (c: string) => (await _capacitar(c)).lineas.join("\n"),
          pruebas: async (c: string) => { const r = await _pruebasPro(c); try { _aprender(c, "pruebas", r.lineas) } catch {} ; return r.lineas.join("\n") },
          movil: (c: string) => { const r = _movil(c); try { _aprender(c, "movil", r.lineas) } catch {} ; return r.lineas.join("\n") },
          multiIA: (c: string) => _multiia(c).lineas.join("\n"),
          doctor: () => _doctor(), hook: (c: string) => _hook(c), reporte: (c: string) => _reporte(c),
        }).catch((e: any) => ({ codigo: true as const, texto: "No pude ejecutar el comando: " + e.message }))
        pc.text = r.codigo ? `[SKILL_DEY] Resultado de "/skill_dey ${args || "ayuda"}" (ya ejecutado por código: no ejecutes nada ni agregues comentarios). Muéstralo al usuario tal cual:\n\n${r.texto}` : r.prompt
        return
      }
      // Modelo elegido llegó a su límite hace menos de 1 h → este mensaje va directo al siguiente modelo libre
      const mod = output?.message?.model ?? _input?.model
      if (estaActivo() && mod?.providerID) {
        const id = `${mod.providerID}/${mod.modelID}`
        if (estaLimitado(id)) {
          const sig = siguienteModelo(id)
          if (sig) {
            const [providerID, ...r] = sig.id.split("/"); const nuevo = { providerID, modelID: r.join("/") }
            if (output?.message) output.message.model = nuevo
            if (_input) _input.model = nuevo
            client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: `${id} sigue en su límite: este mensaje va con ${sig.nombre}.`, variant: "info", duration: 8000 } }).catch(() => {})
          }
        }
      }
      const txt = (output?.parts ?? []).map((p: any) => (p.type === "text" ? p.text ?? "" : "")).join(" ")
      if (!txt.startsWith("[GUARDIAN]")) reiniciarVueltas() // pedido nuevo del usuario
      if (FINALIZAR.test(txt)) { fijarActivo(false); anuncio = "off" }
      else if (INICIAR.test(txt)) { fijarActivo(true); anuncio = "on" }
    },

    // Apagado: se QUITAN las instrucciones de SKILL_DEY (0 tokens) y la IA queda como viene por defecto
    "experimental.chat.system.transform": async (_input: any, output: any) => {
      if (!Array.isArray(output?.system)) return
      if (!estaActivo()) {
        // modificar EN SU LUGAR (OpenCode conserva la referencia al arreglo original)
        const limpio = output.system.map((t: string) => String(t).replace(/<!-- SKILL_DEY-AGENTE -->[\s\S]*?<!-- \/SKILL_DEY-AGENTE -->/g, "").replace(/<!-- SKILL_DEY-INICIO -->[\s\S]*?<!-- SKILL_DEY-FIN -->/g, "")).filter((t: string) => t.trim())
        output.system.splice(0, output.system.length, ...limpio)
        output.system.push(anuncio === "off" ? "El usuario escribió 'finalizar skill dey'. Confirma en una línea: 'SKILL_DEY finalizado: sigo como asistente normal (escribe \"iniciar skill dey\" para activarlo)'. Desde ahora trabaja como el asistente de programación por defecto, sin reglas ni herramientas skill_dey." : "SKILL_DEY está desactivado: trabaja como el asistente de programación por defecto; no uses herramientas skill_dey ni la skill skill-dey.")
        return
      }
      const extra: string[] = []
      if (anuncio === "on") extra.push("El usuario escribió 'iniciar skill dey': confirma en una línea 'SKILL_DEY activo' y aplica SKILL_DEY en todo lo que siga.")
      try { if (!existsSync(join(cwd, ".skill_dey", "ADOPCION.md")) && esProyectoAvanzado(cwd)) extra.push("[SKILL_DEY] Este proyecto ya tiene código y aún no se adoptó: antes del primer cambio (o ya mismo si el usuario escribió 'iniciar skill dey') ejecuta skill_dey_adoptar y sigue references/adopcion.md de la skill skill-dey.") } catch {}
      if (extra.length) output.system.push(extra.join("\n"))
    },

    event: async ({ event }: any) => {
      if (event?.type === "session.idle") anuncio = "" // la confirmación de encendido/apagado dura toda la respuesta
      if (!estaActivo()) return
      // LÍMITE DE USO: avisar y continuar solo con el siguiente modelo
      const reintentoPorLimite = event?.type === "session.status" && event.properties?.status?.type === "retry" && esErrorDeLimite(event.properties?.status)
      if ((event?.type === "session.error" && esErrorDeLimite(event.properties?.error)) || reintentoPorLimite) {
        if (Date.now() - ultimoCambio < 20_000) return
        ultimoCambio = Date.now()
        try {
          const sid = event.properties?.sessionID
          const r = await client.session.messages({ path: { id: sid } })
          const l: any[] = (r?.data ?? r ?? []).map((m: any) => m.info ?? m)
          const ua = [...l].reverse().find((m) => m.role === "assistant")
          const actual = ua ? `${ua.providerID}/${ua.modelID}` : ""
          if (actual) marcarLimitado(actual)
          const sig = siguienteModelo(actual)
          const ahora = Date.now(); while (cambios.length && ahora - cambios[0] > 3_600_000) cambios.shift()
          if (!sig) { await client.tui?.showToast?.({ body: { title: "SKILL_DEY · límite", message: `${actual} llegó a su límite y no hay otro modelo libre ahora. Espera un rato o agrega otro proveedor.`, variant: "warning", duration: 15000 } }).catch(() => {}); return }
          if (cambios.length >= 4) { await client.tui?.showToast?.({ body: { title: "SKILL_DEY · límite", message: `${actual} llegó a su límite. Sigue con: ${sig.nombre} (/models).`, variant: "warning", duration: 15000 } }).catch(() => {}); return }
          cambios.push(ahora)
          await client.tui?.showToast?.({ body: { title: "SKILL_DEY · límite", message: `${actual} llegó a su límite. Continúo con ${sig.nombre} para no perder tu tarea.`, variant: "warning", duration: 12000 } }).catch(() => {})
          // cortar los reintentos de OpenCode con el modelo agotado (esperan cada vez más) y seguir ya con el nuevo
          await client.session.abort({ path: { id: sid } }).catch(() => {})
          await new Promise((r) => setTimeout(r, 1500))
          const [providerID, ...m] = sig.id.split("/")
          client.session.prompt({ path: { id: sid }, body: { model: { providerID, modelID: m.join("/") }, ...(ua?.agent || ua?.mode ? { agent: ua.agent ?? ua.mode } : {}), parts: [{ type: "text", text: `[GUARDIAN] El modelo anterior (${actual}) llegó a su límite de uso. Continúa exactamente donde quedó la tarea, sin repetir lo ya hecho.` }] } }).catch(() => {})
          const d = join(cwd, ".skill_dey"); if (!existsSync(d)) mkdirSync(d, { recursive: true })
          appendFileSync(join(d, "CONSUMO.md"), `${new Date().toISOString().slice(0, 16).replace("T", " ")} | LÍMITE ${actual} → continúa con ${sig.id}\n`)
        } catch {}
        return
      }
      if (!diagnosticoMostrado && (event?.type === "session.created" || event?.type === "session.idle")) {
        diagnosticoMostrado = true
        const d = diagnosticar(client, cwd)
        if (d.mal.length) await client.tui?.showToast?.({ body: { title: "SKILL_DEY · diagnóstico", message: d.mal.join(" · "), variant: "warning", duration: 20000 } }).catch(() => {})
      }
      if (event?.type === "session.idle" && fotoFallo) {
        fotoFallo = false
        await client.tui?.showToast?.({ body: { title: "SKILL_DEY · atención", message: "No se pudo tomar la copia de seguridad antes del último cambio. Revisa git (pregunta: ¿skill_dey funciona?).", variant: "warning", duration: 15000 } }).catch(() => {})
      }
      if (event?.type === "session.idle") {
        fotoDelTurno = false; turno = new Date().toISOString().replace(/[:.]/g, "-")
        // Consumo de la consulta: aviso en pantalla + registro en .skill_dey/CONSUMO.md (no gasta tokens del modelo)
        try {
          const sid = event.properties?.sessionID
          if (!sid || !client) return
          const ses = await client.session.get({ path: { id: sid } }).catch(() => null)
          if ((ses?.data ?? ses)?.parentID) return // subagentes: se suman en la sesión principal

          // ¿El último mensaje del usuario fue una orden automática del guardián? Si no, es un pedido nuevo → reiniciar intentos
          const rm = await client.session.messages({ path: { id: sid } }).catch(() => null)
          const lista: any[] = rm?.data ?? rm ?? []
          const ultU = [...lista].reverse().find((m: any) => (m.info ?? m).role === "user")
          const textoU = (ultU?.parts ?? []).map((p: any) => p.text ?? "").join(" ")
          if (!textoU.startsWith("[GUARDIAN]")) autoIntentos = 0

          // CERO ERRORES: el guardián verifica GRATIS (sin tokens del modelo); solo despierta al agente si hay un error real
          if (editados.size) {
            const errores = [...editados].map((f) => { const e = sintaxis(cwd, f); if (!e) return ""; const l = e.split("\n"); return `${f}: ${(l.find((x) => /error/i.test(x)) ?? l[l.length - 1]).trim().slice(0, 120)}` }).filter(Boolean)
            const leerV = () => { try { return JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")) } catch { return null } }
            let v: any = leerV(), detalle = ""
            if (!errores.length && (!v || v.ts < ultimaEdicion)) {
              const r: string = await verificarTool.execute({ nivel: "N1", archivos: [...editados], rapido: true } as any, { worktree: cwd, directory: cwd } as any).catch((e: any) => "❌ " + e.message)
              v = leerV()
              detalle = r.split("\n").filter((l) => /^❌|^   /.test(l)).slice(0, 12).join("\n")
            }
            const fallo = !!v && !v.ok
            const uiSinRevisar = false // ya no despierta al modelo por esto (gastaba tokens sin haber error real)
            const rojos = v?.rojos ?? 0
            if ((errores.length || fallo || uiSinRevisar) && autoIntentos < 3 && rojos < 4) {
              autoIntentos++
              const motivo = errores.length ? `sintaxis: ${errores.join(" | ")}` : fallo ? `verificación falló:\n${detalle}` : "cambiaste interfaz y no revisaste la consola del navegador"
              const orden = uiSinRevisar && !errores.length && !fallo ? "Levanta la app (o usa la que corre) y ejecuta skill_dey_verificar con url de la vista; corrige errores de consola."
                : rojos >= 3 || autoIntentos >= 3 ? "CICLO 4 — DIAGNÓSTICO SISTEMÁTICO: 3 ciclos sin verde, abandona el enfoque anterior. Carga references/diagnostico-sistematico.md de la skill skill-dey y síguelo paso a paso; escribe tu hipótesis comprobable en 1 línea antes de editar. Si tampoco queda verde: skill_dey_deshacer y reporta hechos · hipótesis · siguiente paso."
                : "Corrige exactamente eso por causa raíz y ejecuta skill_dey_verificar."
              client.session.prompt({ path: { id: sid }, body: { parts: [{ type: "text", text: `[GUARDIAN] ${motivo}\n${orden} Responde en 1-3 líneas.` }] } }).catch(() => {})
              return
            }
            if ((autoIntentos >= 3 || rojos >= 4) && (errores.length || fallo))
              await client.tui?.showToast?.({ body: { title: "SKILL_DEY · atención", message: "Ni el diagnóstico sistemático (ciclo 4) dejó todo verde. Escribe 'deshaz' para volver al estado sano y revisa el reporte.", variant: "warning", duration: 20000 } }).catch(() => {})
          }
          // Documentación viva (por código, 0 tokens): diccionario, script BD, manual técnico, esqueleto del manual de usuario
          if (cambioPorTerminal || (editados.size && [...editados].some((f) => !/(^|[\\/])docs[\\/]|database[\\/]instalacion\.sql$/.test(f)))) {
            try { documentar(cwd) } catch (e: any) { try { appendFileSync(join(_home(), ".config", "opencode", "skill_dey", "errores-guardian.log"), `${new Date().toISOString()} documentar: ${String(e?.stack ?? e).slice(0, 300)}\n`) } catch {} }
          }
          cambioPorTerminal = false
          try { comprimirMemoria(cwd) } catch {} // memoria corta = menos tokens al leerla
          editados.clear()
          const med = await medir(client, sid)
          const d = join(cwd, ".skill_dey"); if (!existsSync(d)) mkdirSync(d, { recursive: true })
          const f = join(d, "CONSUMO.md"); if (!existsSync(f)) appendFileSync(f, "# CONSUMO (una línea por consulta)\n")
          med.hoy = tokensHoy(f, med.modelo) + med.consulta.tokens // uso de hoy con este modelo (para anticipar el límite diario gratis)
          const t = texto(med)
          const poco = t.pct >= 80
          const sesionMs = Date.now() - sesionInicio
          try { writeFileSync(join(d, "TABLERO.txt"), tablero(med, { herrTurno, herrSesion, sesionMs })) } catch {} // panel para tener al lado
          await client.tui?.showToast?.({ body: { title: poco ? "SKILL_DEY · quedan pocos tokens" : "SKILL_DEY · consumo", message: t.corto + `  |  ${herrTurno} herram. · sesión ${seg(sesionMs)}` + (poco ? "  →  escribe /compact o abre una sesión nueva para no perder calidad" : ""), variant: poco ? "warning" : "info", duration: poco ? 20000 : 15000 } }).catch(() => {})
          appendFileSync(f, t.linea + "\n")
          herrTurno = 0                       // la siguiente pregunta cuenta sus herramientas desde cero
        } catch {}
      }
    },

    "tool.execute.before": async (input: any, output: any) => {
      if (!estaActivo()) return
      const a = output?.args ?? {}
      const archivo: string = a.filePath ?? a.path ?? ""

      // Proteger .env reales (se permite .env.example)
      if (input.tool === "read" && /(^|[\\/])\.env(\.(local|production|prod|dev|development|staging))?$/.test(archivo))
        throw new Error("SKILL_DEY: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.")

      // ANTI-VUELTAS: misma acción con los mismos datos y sin editar nada entre medio = mismo resultado → se bloquea
      if (!/^skill_dey_(deshacer|consumo|diagnostico)$/.test(input.tool)) {
        const firma = `${input.tool}|${JSON.stringify(a).slice(0, 400)}|${ediciones}`
        const n = (repetidas.get(firma) ?? 0) + 1; repetidas.set(firma, n)
        if (n >= 3) throw new Error(`SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable y aplica el CICLO 4 (references/diagnostico-sistematico.md), o skill_dey_deshacer y reporta.`)
        if (enRojo) {
          accionesEnRojo++
          if (accionesEnRojo === 15) throw new Error("SKILL_DEY anti-vueltas: 15 acciones sobre el mismo error sin quedar verde. Para: escribe en 1 línea qué sabes (hechos) y tu hipótesis; aplica el CICLO 4 (references/diagnostico-sistematico.md) con UNA comprobación que la refute.")
          if (accionesEnRojo >= 30 && !/^skill_dey_/.test(input.tool)) throw new Error("SKILL_DEY FRENO: 30 acciones sin resolver el error. No sigas: skill_dey_deshacer al último verde y reporta al usuario hechos · hipótesis · siguiente paso (2–3 opciones).")
        }
      }

      if (input.tool === "bash") { comandos.set(input.callID ?? "_", String(a.command ?? "")); if (comandos.size > 200) comandos.clear() }
      if (["edit", "write", "patch", "multiedit"].includes(input.tool) && archivo) pendientes.set(input.callID ?? "_", archivo)

      // INTEGRIDAD: foto del proyecto antes del primer cambio del pedido (y copia por archivo si no hay git)
      const modifica = ["edit", "write", "patch", "multiedit"].includes(input.tool) || (input.tool === "bash" && !esSoloLectura(a.command ?? ""))
      if (modifica) {
        try {
          protegerAntesDeCambiar(input.tool === "bash" ? `bash: ${a.command}` : `${input.tool} ${archivo}`)
          if (!conGit && archivo) respaldarArchivo(cwd, archivo, turno)
        } catch {}
      }

      // Nada fuera del proyecto sin permiso
      if (["edit", "write", "patch", "multiedit"].includes(input.tool) && archivo) {
        const abs = resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))
        if (relative(resolve(cwd), abs).startsWith("..")) throw new Error(`SKILL_DEY: ${archivo} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.`)
      }
      // ZONAS CONGELADAS: rutas en .skill_dey/CONGELADO.txt que no se tocan sin permiso (bloquea edición Y comandos de terminal)
      try {
        const cong = readFileSync(join(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
        if (cong.length) {
          const rutas: string[] = []
          if (archivo) rutas.push(relative(resolve(cwd), resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))))
          if (input.tool === "bash") for (const m of String(a.command ?? "").matchAll(/(?:^|[\s>])([\w./-]+\.[\w]+)/g)) rutas.push(m[1].replace(/^\.\//, ""))
          const choca = rutas.find((r) => cong.some((c) => r === c || r.startsWith(c.replace(/\/$/, "") + "/")))
          if (choca && modifica) throw new Error(`SKILL_DEY: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.`)
        }
      } catch (e: any) { if (String(e?.message ?? "").startsWith("SKILL_DEY")) throw e }
      // Prohibido código truncado
      if (["edit", "write", "patch", "multiedit"].includes(input.tool)) {
        const nuevo: string = [a.content, a.newString, a.new_string, ...(Array.isArray(a.edits) ? a.edits.map((e: any) => e.newString) : [])].filter(Boolean).join("\n")
        const t = nuevo.split(/\r?\n/).find((l) => TRUNCADO.test(l))
        if (t) throw new Error(`SKILL_DEY: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o usa una edición puntual (edit) solo de las líneas que cambian.`)
      }

      // Secretos en código
      if (["edit", "write", "patch", "multiedit"].includes(input.tool) && !/\.env(\.|$)|\.example|\.md$/.test(archivo)) {
        const texto: string = [a.content, a.newString, a.new_string, ...(Array.isArray(a.edits) ? a.edits.map((e: any) => e.newString) : [])].filter(Boolean).join("\n")
        const linea = texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l))
        if (linea) throw new Error(`SKILL_DEY: secreto en código bloqueado → "${linea.trim().slice(0, 80)}". Muévelo a .env y documenta la variable en .env.example.`)
      }

      if (input.tool === "bash") {
        const cmd: string = a.command ?? ""
        for (const [re, motivo] of PELIGROSO) if (re.test(cmd)) throw new Error(`SKILL_DEY: bloqueado (${motivo}). Pide confirmación explícita al usuario y que lo ejecute él.`)

        // Servidor en primer plano → segundo plano con log (si no, el agente queda congelado para siempre)
        const yaFondo = /(&\s*$|nohup|start\s+\/b|disown|--detach|-d\b)/.test(cmd)
        const bashUnix = process.platform !== "win32" || /bash|zsh|sh$/.test(process.env.SHELL ?? "")
        if (SERVIDOR.test(cmd) && !yaFondo && bashUnix) {
          const log = join(cwd, ".skill_dey", "logs", `servidor-${Date.now()}.log`)
          const envuelto = cmd.replace(/'/g, `'\\''`)
          output.args.command = `mkdir -p "${join(cwd, ".skill_dey", "logs")}" && (nohup sh -c '${envuelto}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: .skill_dey/logs/${log.split(/[\\/]/).pop()} · para bajarlo: skill_dey_procesos(accion:detener)" ; tail -n 25 "${log}"`
        }
        // Pruebas: nunca en modo watch (se quedan esperando)
        if (/\bvitest\b/.test(cmd) && !/\bvitest\s+(run|related)\b|--run\b/.test(cmd)) output.args.command = cmd.replace(/\bvitest\b/, "vitest run")
        if (/--watch(All)?\b/.test(cmd) && /jest|vitest|mocha|test/.test(cmd)) output.args.command = (output.args.command ?? cmd).replace(/\s--watch(All)?\b/g, "")
        if (bashUnix && /\b(npm|pnpm|yarn)\s+(run\s+)?test\b|\bjest\b|\bvitest\b|\bng\s+test\b/.test(cmd) && !/\bCI=/.test(cmd)) output.args.command = `CI=1 ${output.args.command ?? cmd}`

        // Dependencias: solo si el usuario las pidió o aprobó
        const dep = cmd.match(DEPENDENCIA)
        if (dep && !/(^|\s)-(D|-save-dev)\b.*playwright|--dry-run/.test(cmd)) {
          const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""))
          let textoU = ""
          try { const r = await client.session.messages({ path: { id: input.sessionID } }); const l: any[] = r?.data ?? r ?? []; const u = [...l].reverse().find((m: any) => (m.info ?? m).role === "user"); textoU = (u?.parts ?? []).map((p: any) => p.text ?? "").join(" ").toLowerCase() } catch {}
          const pidio = /instal|dependenc|librer|paquete|package|m[oó]dulo npm|composer/.test(textoU) || paquetes.some((p) => textoU.includes(p.toLowerCase().split("/").pop()!)) || /^\s*(ok|sí|si|dale|hazlo|listo|de acuerdo|aprobado|adelante|procede)\b/.test(textoU) || paquetes.length === 0
          if (!pidio) throw new Error(`SKILL_DEY: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.`)
        }

        // Base de datos: respaldo obligatorio antes de migrar o modificar datos
        if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd)) && !/--pretend|--dry-run|--status|status\b|SKILL_DEY_BD_PRUEBA=1/.test(cmd) && !respaldoBdReciente(cwd))
          throw new Error("SKILL_DEY: antes de migrar la BD real: 1) ensaya en una copia con skill_dey_qa (accion:bd, no toca la real) · 2) haz respaldo en .skill_dey/respaldos-bd/ (pg_dump -Fc -f .skill_dey/respaldos-bd/<fecha>.dump <bd> · mysqldump <bd> > .skill_dey/respaldos-bd/<fecha>.sql · copiar el .sqlite). Si es BD de producción, NO lo hagas: pide al usuario.")

        // Nunca subir .env: asegura .gitignore y bloquea si ya está versionado
        if (/git\s+(add|commit)\b/.test(cmd)) {
          const trackeado = blindarGitignore(cwd)
          if (trackeado) throw new Error(`SKILL_DEY: ${trackeado} está versionado en git (secretos expuestos). Ejecuta: git rm --cached ${trackeado} y avisa al usuario que cambie esas claves.`)
        }

        // Commit final solo con verificación verde posterior a la última edición
        const esCommit = /git\s+commit\b/.test(cmd) && !/checkpoint|baseline|wip/i.test(cmd)
        if (esCommit && ultimaEdicion > 0) { // el agente editó en esta sesión → exige verificación verde posterior
          let v: any = null
          try { v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")) } catch {}
          if (!v || !v.ok || v.ts < ultimaEdicion)
            throw new Error("SKILL_DEY: commit bloqueado. Ejecuta skill_dey_verificar (debe salir ✅) después de tu última edición. Para guardar avance usa un commit 'skill_dey: checkpoint iN'.")
        }
      }
    },

    tool: {
      skill_dey_imagen: tool({
        description: "Antes de usar imagen/boceto/Excel: cómo leerlo.",
        args: { ruta: tool.schema.string().describe("ruta") },
        async execute(a: any, ctx: any) {
          const ruta = a.ruta
          if (/\.xlsx?m?$/i.test(ruta)) return leerDisenoSinVision(cwd, ruta) + "\n→ Interprétalo según references/imagen-a-ui.md §3 (celdas combinadas = bloques, colores = zonas, notas = instrucciones)."
          let modelo = ""
          try { const r = await client.session.messages({ path: { id: ctx.sessionID } }); const l: any[] = (r?.data ?? r ?? []).map((m: any) => m.info ?? m).filter((m: any) => m.role === "assistant"); const u = l[l.length - 1]; modelo = u ? `${u.providerID}/${u.modelID}` : "" } catch {}
          const cap = modelo ? await capacidades(client, modelo) : null
          if (cap?.imagen) return `Tu modelo (${modelo}) ve imágenes: usa read("${ruta}") y sigue references/imagen-a-ui.md.`
          const vis = agenteVision()
          if (vis) return `Tu modelo (${modelo || "actual"}) NO ve imágenes. Delega YA: task(subagent_type="skill_dey-vision", description="leer boceto", prompt="Describe ${ruta} como especificación de maqueta.") y construye con su especificación. No digas que no puedes.`
          return leerDisenoSinVision(cwd, ruta)
        },
      }),
      // Una sola herramienta para consumo, diagnóstico y autoprueba (menos herramientas = menos tokens en cada mensaje)
      skill_dey_estado: tool({
        description: "Tokens, diagnóstico y autoprueba.",
        args: { que: tool.schema.enum(["consumo", "diagnostico", "prueba"]).optional().describe("defecto consumo") },
        async execute(a: any, ctx: any) {
          const que = a.que ?? "consumo"
          if (que === "diagnostico" || que === "prueba") {
            const d = diagnosticar(client, cwd)
            const diag = [`SKILL_DEY ${VERSION} · diagnóstico`, ...d.ok.map((x) => "✅ " + x), ...d.mal.map((x) => "❌ " + x)].join("\n")
            return que === "prueba" ? diag + "\n\n" + await autoprueba((x: any, c: any) => verificarTool.execute(x, c)) : diag
          }
          try { const m = await medir(client, ctx.sessionID); m.hoy = tokensHoy(join(ctx.worktree || ctx.directory || process.cwd(), ".skill_dey", "CONSUMO.md"), m.modelo); return texto(m).corto + "\nLos planes gratis no informan el cupo diario que queda; 'Hoy' ayuda a anticiparlo.\nHistórico: .skill_dey/CONSUMO.md" } catch (e: any) { return "No pude leer el consumo: " + e.message }
        },
      }),
    },

    "tool.execute.after": async (input: any, output: any) => {
      if (!estaActivo()) return
      herrTurno++; herrSesion++            // contador de herramientas usadas (tablero)
      if (input.tool === "skill_dey_verificar" || input.tool === "skill_dey_sitio") {
        const r = String(output?.output ?? "")
        if (/✅ todo verde|✅ sitio sin errores/.test(r)) reiniciarVueltas(); else if (/❌/.test(r)) enRojo = true
      }
      // un comando que modifica archivos también cuenta como cambio (para no bloquear un "npm test" legítimo tras editar)
      if (input.tool === "bash" && /sed -i|>>?|\btee\b|\bmv\b|\bcp\b|git (checkout|restore|apply|stash)|npm (i|install)|composer (require|install)|pip install|migrate/.test(String(comandos.get(input.callID ?? "_") ?? input?.args?.command ?? ""))) { ediciones++; cambioPorTerminal = true }
      if (!["edit", "write", "patch", "multiedit"].includes(input.tool)) return
      ediciones++
      ultimaEdicion = Date.now()
      const archivo: string = pendientes.get(input.callID ?? "_") ?? output?.metadata?.filePath ?? input?.args?.filePath ?? ""
      pendientes.delete(input.callID ?? "_")
      if (!archivo) return
      editados.add(archivo)
      const err = sintaxis(cwd, archivo)
      if (err && output && typeof output.output === "string")
        output.output += `\n\n⚠ SKILL_DEY sintaxis en ${archivo}:\n${err}\n→ Corrígelo antes de seguir.`
    },
  }
  // AISLAMIENTO: si una función del guardián falla por un error inesperado, se anota y OpenCode sigue normal
  // (solo los bloqueos intencionales "SKILL_DEY…" llegan al modelo). Así una pieza rota nunca tumba la sesión.
  for (const [nombre, fn] of Object.entries(hooks)) {
    if (typeof fn !== "function") continue
    hooks[nombre] = async (...a: any[]) => {
      const t0 = Date.now()
      try { return await (fn as any)(...a) }
      catch (e: any) {
        if (String(e?.message ?? "").startsWith("SKILL_DEY")) throw e
        try { appendFileSync(join(_home(), ".config", "opencode", "skill_dey", "errores-guardian.log"), `${new Date().toISOString()} ${nombre}: ${String(e?.stack ?? e).slice(0, 400)}\n`) } catch {}
      } finally { const ms = Date.now() - t0; if (ms > 3000 && nombre !== "event") try { appendFileSync(join(_home(), ".config", "opencode", "skill_dey", "lentitud.log"), `${new Date().toISOString()} ${nombre} ${ms} ms\n`) } catch {} }
    }
  }
  return hooks
}
