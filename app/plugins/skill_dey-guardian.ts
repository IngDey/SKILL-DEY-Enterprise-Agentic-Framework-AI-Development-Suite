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
import { sdDir } from "../skill_dey-lib/rutas.ts"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, appendFileSync, readdirSync, statSync, mkdirSync, renameSync, writeFileSync } from "node:fs"
import { join, extname, isAbsolute, resolve, relative, sep } from "node:path"
import { foto, respaldarArchivo, asegurarRepo, hayGit, esRepo, deshacerDesde as _deshacerDesde } from "../skill_dey-lib/respaldo.ts"
import { homedir as _home } from "node:os"
import { verificar as verificarTool } from "../tools/skill_dey.ts"
import { documentar } from "../skill_dey-lib/documentar.ts"
import { autoprueba } from "../skill_dey-lib/autoprueba.ts"
import { errorJs } from "../skill_dey-lib/sintaxis.ts"
import { esProyectoAvanzado } from "../skill_dey-lib/adopcion.ts"
import { capacidades, agenteVision, leerDisenoSinVision, esErrorDeLimite, esErrorDeRegion, esErrorDeRed, marcarLimitado, marcarBueno, siguienteModelo, estaLimitado, resumenModelos, esCupoDelProveedor, marcarProveedor, refrescarCatalogo } from "../skill_dey-lib/modelos.ts"
import { ejecutarComando, intencion } from "../skill_dey-lib/comandos.ts"
import { empalme, comprimirMemoria } from "../skill_dey-lib/empalme.ts"
import { listar as listarReglas, quitarRegla, quitarVacuna } from "../skill_dey-lib/reglas.ts"
import { resumenSeguridad } from "../skill_dey-lib/seguridad.ts"
import { probarApp } from "../skill_dey-lib/probador.ts"
import { notasVersion, asegurarPrincipios } from "../skill_dey-lib/saber.ts"
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
import { mapaMental as _mapa } from "../skill_dey-lib/mapa_mental.ts"
import { rutear } from "../skill_dey-lib/ruteo.ts"
import { generarMockup as _mockup } from "../skill_dey-lib/diseno.ts"
import { optimizarPrompt as _optprompt } from "../skill_dey-lib/prompt.ts"
import { registrarTraza as _traza, panel as _panel } from "../skill_dey-lib/trazas.ts"
import { checkpoint as _checkpoint, listarHitos as _hitos, volver as _volver, cambiosExactos as _cambiosExactos } from "../skill_dey-lib/respaldo.ts"
import { revisionProduccion as _impactoProfundo } from "../skill_dey-lib/impacto_profundo.ts"
import { asegurarMemoria as _asegurarMemoria, registrarCambio as _registrarMemoria, dondeQuedamos as _dondeQuedamos, contarArchivos as _contarArchivos, sugerirSubcarpetas as _sugerirSubcarpetas } from "../skill_dey-lib/memoria_base.ts"
import { buscarMemoria as _buscarMem } from "../skill_dey-lib/indice.ts"
import { documentosPdf } from "../skill_dey-lib/pdf.ts"
import { iniciarApp as _iniApp, asegurarPlaywright as _pw, rutasAProbar as _rutas } from "../skill_dey-lib/app.ts"
import { writeFileSync as _wf, appendFileSync as _af, existsSync as _ex, mkdirSync as _mk } from "node:fs"
import { copiaPrueba } from "../skill_dey-lib/bd.ts"
import * as Herramientas from "../tools/skill_dey.ts"

// Reglas compartidas con Claude Code, Gemini CLI y Antigravity CLI: viven en skill_dey-lib/guardia.ts (una sola fuente de verdad)
import { SECRETO, PLACEHOLDER, CLIENTE_BD, PELIGROSO, borradoMasivo, sqlEjecutado, blindarGitignore, TRUNCADO, SERVIDOR, DEPENDENCIA, SOLO_LECTURA, esSoloLectura, EDITA, parcheTexto, archivosDe, textoNuevo, fueraDelProyecto, CODIGO, impactoDe, esTerminal, relNorm, ENV_REAL, LEE_ENV, MIGRACION, BD_SQL, BD_EN_CODIGO, bdDestructivo, SQL_MODIFICA, respaldoBdReciente, sintaxis } from "../skill_dey-lib/guardia.ts"

// ---------- AUTODIAGNÓSTICO: comprueba que cada protección esté activa ----------
const VERSION = (() => { try { return readFileSync(sdDir("VERSION"), "utf8").trim() || "?" } catch { return "?" } })() // lee la versión del archivo (nunca se desincroniza; no exportar)
const VERSION_CODIGO = "41.0.0" // la escribe el empaquetador: si no coincide con el archivo VERSION, la instalación quedó mezclada
const _txt = (r: any): string => (typeof r === "string" ? r : String(r?.output ?? r ?? "")) // salida de herramienta siempre como texto
function diagnosticar(client: any, cwd: string): { ok: string[]; mal: string[] } {
  const ok: string[] = [], mal: string[] = []
  const chk = (c: boolean, bien: string, malo: string) => (c ? ok : mal).push(c ? bien : malo)
  chk(typeof client?.session?.messages === "function" && typeof client?.session?.get === "function", "lectura de sesiones (consumo, verificación final)", "OpenCode cambió la API de sesiones: consumo y verificación final desactivados → actualiza skill_dey")
  chk(typeof client?.session?.prompt === "function", "órdenes automáticas [GUARDIAN] (corrección y cambio de modelo)", "OpenCode cambió session.prompt: sin corrección automática ni cambio de modelo por límite")
  chk(typeof client?.session?.abort === "function", "corte de reintentos por límite", "sin session.abort: el cambio de modelo por límite tardará más")
  chk(typeof client?.tui?.showToast === "function", "avisos en pantalla", "sin avisos en pantalla (showToast): el consumo solo queda en .skill_dey/CONSUMO.md")
  chk(hayGit(cwd), "git (copias y deshacer completos)", "git no está instalado: deshacer solo cubre archivos editados, no comandos → instala git")
  const dir = sdDir()
  let cat: any = null; try { cat = JSON.parse(readFileSync(join(dir, "MODELOS.json"), "utf8")) } catch {}
  chk(!!cat, "catálogo de modelos", "falta MODELOS.json: reinstala skill_dey para detectar tus modelos")
  if (cat) chk(Date.now() - Date.parse(cat.actualizado) < 30 * 86_400_000, "catálogo de modelos al día", "el catálogo de modelos tiene más de 30 días: reinstala para registrar modelos nuevos")
  let ver = ""; try { ver = readFileSync(join(dir, "VERSION"), "utf8").trim() } catch {}
  chk(!ver || ver === VERSION_CODIGO, `versión ${ver || VERSION_CODIGO} completa`, `instalación mezclada (archivos v${ver} con guardián v${VERSION_CODIGO}): vuelve a ejecutar el instalador`)
  return { ok, mal }
}

// ---------- ENCENDIDO / APAGADO: "iniciar skill dey" · "finalizar skill dey" ----------
const ESTADO_ON = sdDir("ACTIVO.json")
const estaActivo = () => { try { return JSON.parse(readFileSync(ESTADO_ON, "utf8")).activo !== false } catch { return true } }
function fijarActivo(v: boolean) { try { mkdirSync(sdDir(), { recursive: true }); writeFileSync(ESTADO_ON, JSON.stringify({ activo: v, desde: new Date().toISOString() })) } catch {} }
// COMPUERTA DE AUTOPRUEBA visible: corre la autoprueba SOLO cuando cambió la versión (rápido); cachea, guarda log y devuelve el resultado.
async function correrAutoprueba(): Promise<string> {
  let salida = ""
  try { salida = await autoprueba((x: any, c: any) => verificarTool.execute(x, c).then(_txt)) } catch (e: any) { salida = "no corrió: " + String(e?.message ?? e) }
  try {
    const dir = sdDir()
    const m = salida.match(/(\d+)\/(\d+)\s+piezas OK/)
    const res = { version: VERSION, bien: m ? Number(m[1]) : 0, total: m ? Number(m[2]) : 0, ok: /RESULTADO:\s*\u2705/.test(salida), fecha: new Date().toISOString() }
    mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "AUTOPRUEBA.json"), JSON.stringify(res, null, 1))
    appendFileSync(join(dir, "autoprueba.log"), res.fecha + " v" + VERSION + " " + res.bien + "/" + res.total + " " + (res.ok ? "OK" : "FALLA") + "\n")
  } catch {}
  return salida
}
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
/** Ventanita de consumo: 3 líneas alineadas — cuánto queda, cuánto gastó esta consulta y para cuánto alcanza. */
function ventana(m: Awaited<ReturnType<typeof medir>>): { titulo: string; mensaje: string; poco: boolean } {
  const c = m.consulta, s = m.sesion
  const libre = m.limite ? Math.max(0, m.limite - m.ctx) : 0
  const pctLibre = m.limite ? Math.max(0, 100 - Math.round((m.ctx / m.limite) * 100)) : 0
  const porConsulta = s.consultas ? Math.max(1, m.ctx / s.consultas) : Math.max(1, c.tokens) // cuánto crece la conversación por consulta
  const quedanN = m.limite ? Math.floor(libre / porConsulta) : 0
  const minutos = c.dur ? Math.max(1, Math.round((quedanN * c.dur) / 60_000)) : 0
  let cupo = ""
  try { const lim = JSON.parse(readFileSync(sdDir("LIMITES.json"), "utf8")); const t = lim[m.modelo]; if (t && Date.now() - t < 3_600_000) { const ms = 3_600_000 - (Date.now() - t); cupo = ms > 3_600_000 ? `${Math.floor(ms / 3_600_000)} h ${Math.round((ms % 3_600_000) / 60_000)} min` : `${Math.round(ms / 60_000)} min` } } catch {}
  const fila = (a: string, b: string) => a.padEnd(10) + b
  const L = [
    fila("Quedan", m.limite ? `${k(libre)} tokens · ${pctLibre}% libre` : "el modelo no informa su límite"),
    fila("Consulta", `${k(c.tokens)} tokens · ${seg(c.dur)}`),
    fila("Alcanza", cupo ? `cupo agotado · vuelve en ${cupo}` : m.limite ? `≈ ${quedanN} consulta${quedanN === 1 ? "" : "s"} más${minutos ? ` · ~${minutos} min` : ""}` : "—"),
  ]
  const poco = m.limite > 0 && pctLibre <= 20
  if (poco) L.push("→ escribe /compact o abre otra sesión")
  return { titulo: poco ? "SKILL_DEY · quedan pocos tokens" : "SKILL_DEY · consumo", mensaje: L.join("\n"), poco }
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
  try { const d = sdDir(); mkdirSync(d, { recursive: true }); writeFileSync(join(d, ".guardian-activo"), String(process.pid)) } catch {} // latido: lo revisa skill_dey_verificar
  try { if (existsSync(join(cwd, ".forja")) && !existsSync(join(cwd, ".skill_dey"))) renameSync(join(cwd, ".forja"), join(cwd, ".skill_dey")) } catch {} // migración desde FORJA
  let ultimaEdicion = 0
  let fotoDelTurno = false          // una foto por pedido del usuario (se reinicia cuando el agente termina de responder)
  let turno = new Date().toISOString().replace(/[:.]/g, "-")
  let conGit: boolean | null = null
  const editados = new Set<string>()   // archivos tocados en el pedido actual
  let anuncio: "on" | "off" | "" = ""
  let diagnosticoMostrado = false
  let pruebaMostrada = false
  let memoriaLista = false
  let proyectoGrande: boolean | null = null
  // CACHÉ por sesión (el system.transform corre en CADA paso del modelo: no releer el disco cada vez)
  let _avz: { v: boolean; t: number } | null = null, _subs: string[] | null = null, _lec: { q: string; r: string[] } | null = null
  const avanzado = (): boolean => { if (!_avz || Date.now() - _avz.t > 300_000) { let v = false; try { v = esProyectoAvanzado(cwd) } catch {} _avz = { v, t: Date.now() } } return _avz.v }
  let avisoGrande = false
  let ultimoPedido = ""
  // ALCANCE: solo se toca lo que el usuario pidió. Archivos que nombró en su pedido + avisos ya dados en este pedido.
  // ALCANCE ESTRICTO: la IA solo modifica lo que el usuario pidió. Otro archivo → tiene que PREGUNTAR y esperar su "sí".
  let nombrados = new Set<string>(), existentesTocados = new Set<string>(), pedidoAmplio = false
  const nombresEn = (t: string) => (t.match(/[\w\/\\.-]+\.[A-Za-z][A-Za-z0-9]{0,5}\b/g) ?? []).map((x) => x.replace(/\\/g, "/").toLowerCase().split("/").pop()!).filter((x) => !/^(www|http|https)\b|\.(com|net|org|co|io)$/.test(x))
  const SI = /^\s*(s[ií]|si señor|ok|okay|dale|hazlo|h[aá]gale|listo|de acuerdo|autorizo|autorizado|adelante|procede|correcto|est[aá] bien|perfecto|aprobado)(?![\wáéíóúñ])/i
  const fijarPedido = (t: string, ultimaRespuesta = "") => {
    if (SI.test(t) && t.trim().length <= 80) { for (const n of [...nombresEn(t), ...nombresEn(ultimaRespuesta)]) nombrados.add(n); return } // "sí" = autoriza lo que la IA preguntó (sigue el mismo pedido)
    nombrados = new Set(nombresEn(t)); existentesTocados = new Set()
    entendido = false; avisoEntendi = false; avisoSinTexto = false; inicioPedido = Date.now(); commitBase = ""; fotoDelTurno = false // pedido nuevo = punto de regreso nuevo
    try { const v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")); baseVerde = v?.ok === true } catch { baseVerde = false } // ¿la app estaba sana antes de este pedido?
    pedidoAmplio = /reescrib|refactoriz|reorganiz|reestructur|limpia (el|todo)|optimiza (todo|el proyecto)|mejora todo|todo el (proyecto|c[oó]digo)|formatea|corrige todos|todos los archivos|migra(r)? (el|todo)/i.test(t)
  }
  let fotoFallo = false
  let autoIntentos = 0
  const sesionInicio = Date.now()           // reloj de sesión para el tablero
  let herrTurno = 0, herrSesion = 0          // herramientas usadas (pregunta actual / sesión) para el tablero
  // ANTI-VUELTAS (0 tokens): corta al modelo cuando repite lo mismo o da vueltas sobre un error
  let enRojo = false, accionesEnRojo = 0, ediciones = 0, cambioPorTerminal = false
  const repetidas = new Map<string, number>(), comandos = new Map<string, string>() // callID → comando bash
  const reiniciarVueltas = () => { enRojo = false; accionesEnRojo = 0; repetidas.clear() }
  let ultimoCambio = 0, ultimoFallado = ""
  let resultadoTurno = ""
  let ultimoResultado = "", avisoSinTexto = false // respuesta INVISIBLE: la IA terminó sin escribirle nada al usuario
  let modeloBase = "", ultimoRuteado = "" // ruteo por tarea: el modelo que TÚ elegiste y el que skill_dey usó solo para el último pedido
  // EVALUAR ANTES DE TOCAR: qué leyó la IA (y cuándo) y si midió el impacto en este pedido · línea base para no romper lo que funcionaba
  let entendido = false, avisoEntendi = false // RAZONAR antes de tocar: la IA debe escribir qué entendió, la causa y el plan
  const viejos = new Map<string, string>() // contenido antes de cada edición (para medir el impacto por código)
  let inicioPedido = Date.now(), baseVerde = false, commitBase = "", evaluaciones = 0
  // CONTINUIDAD entre sesiones: en el 1er mensaje de cada sesión nueva, la IA recibe (una vez, ~80 tokens) los últimos pedidos del proyecto
  const sesionesVistas = new Set<string>(); let contextoSesion = ""
  const vistas = new Map<string, number>() // herramientas que pasaron por el guardián (diagnóstico: "/skill_dey version")
  const cambios: number[] = []          // cambios automáticos de modelo por límite (máx. 4 por hora)                   // órdenes automáticas de corrección enviadas en este pedido
  const cambiosRegion: number[] = []     // cambios de modelo por región — tope seguro: 6 por 10 min (nunca bucle infinito)
  const protegerAntesDeCambiar = (desc: string) => {
    if (fotoDelTurno) return
    fotoDelTurno = true
    if (conGit === null) {
      if (proyectoGrande === null) { try { proyectoGrande = _contarArchivos(cwd, 2500) >= 2500 } catch { proyectoGrande = false } }
      conGit = esRepo(cwd) ? asegurarRepo(cwd) : proyectoGrande ? false : asegurarRepo(cwd) // ENORME sin git (o repo de tu carpeta personal): copia por archivo, rápida, igual se deshace
    }
    if (conGit) { const c = foto(cwd, "pasos", "cambio", desc); fotoFallo = !c; if (c && !commitBase) commitBase = c } // la 1ª foto del pedido = estado sano al que se vuelve si algo se rompe
  }
  const pendientes = new Map<string, string[]>() // callID → archivos editados

  const hooks: any = {
    // Detecta "iniciar skill dey" / "finalizar skill dey" en el mensaje del usuario (antes de que llegue al modelo)
    "chat.message": async (_input: any, output: any) => {
      // /skill_dey <comando>: se ejecuta por código; el modelo solo muestra el resultado
      const partes: any[] = output?.parts ?? []
      try {
        const sidM = String(_input?.sessionID ?? "")
        if (sidM && !sesionesVistas.has(sidM)) {
          sesionesVistas.add(sidM); if (sesionesVistas.size > 200) sesionesVistas.clear()
          const l = _dondeQuedamos(cwd, 4)
          contextoSesion = l.length ? "[SKILL_DEY · sesión nueva en un proyecto con historia] Últimos pedidos (de sesiones anteriores):\n" + l.map((x) => "- " + x).join("\n") + "\nSi el usuario dice 'sigue' o se refiere a algo anterior, parte de aquí. Para volver atrás: skill_dey_deshacer(antesDe:\"<pedido>\") o historial." : ""
        }
      } catch {}
      try {
        const t0 = partes.filter((p) => p.type === "text" && !p.synthetic).map((p) => String(p.text ?? "")).join(" ")
        if (t0.trim() && !/^\s*\[(GUARDIAN|SKILL_DEY)/.test(t0)) {
          let prev = ""
          if (SI.test(t0) && t0.trim().length <= 80) { try { const r = await client.session.messages({ path: { id: _input?.sessionID } }); const l: any[] = r?.data ?? r ?? []; const u = [...l].reverse().find((m: any) => (m.info ?? m).role === "assistant"); prev = (u?.parts ?? []).map((p: any) => p.text ?? "").join(" ").slice(-4000) } catch {} }
          fijarPedido(t0, prev)
        }
      } catch {}
      let pc = partes.find((p) => p.type === "text" && /^\s*SKILL_DEY_CMD\b/.test(p.text ?? ""))
      let args = pc ? String(pc.text).replace(/^\s*SKILL_DEY_CMD\b/, "").trim() : ""
      let pedidoOriginal = "" // si la acción vino de una frase normal que además pide algo (ej. "revisa en chrome y corrige"), la IA sigue con eso
      // Sin comando: la MISMA acción pedida en lenguaje normal ("documenta la app", "¿cuántos tokens me quedan?"…) se ejecuta por código
      if (!pc && estaActivo() && partes.filter((p) => p.type === "text").length === 1) {
        const p0 = partes.find((p) => p.type === "text"), original = String(p0?.text ?? ""), c = intencion(original)
        if (c) { pc = p0; args = /^(plan|build|mockup|prompt|buscar-skill|buscar-memoria)$/.test(c) ? `${c} ${original}` : c; if (c.startsWith("chrome")) pedidoOriginal = original } // estos comandos necesitan tu texto
      }
      if (pc) {
        const modeloAct = _input?.model ? `${_input.model.providerID}/${_input.model.modelID}` : ""
        const r = await ejecutarComando(args, {
          cwd, sesion: _input?.sessionID ?? "", donde: _dondeQuedamos, T: { ...Herramientas, ...hooks.tool }, documentar: (c: string) => { const d = documentar(c); let pdf = ""; try { pdf = documentosPdf(c) } catch {} ; return d + (pdf ? "\n" + pdf : "") }, empalme, organizar: _organizar, reglas: listarReglas, quitarRegla, quitarVacuna, copiaBd: copiaPrueba,
          seguridad: async (c: string) => [...resumenSeguridad(c).lineas, ...await _audit(c), await _semgrep(c)].filter(Boolean).join("\n"), probar: async (c: string) => (await probarApp(c)).lineas.join("\n"), notas: notasVersion,
          principios: (c: string) => asegurarPrincipios(c),
          formato: (c: string) => formatear(c), validar: (c: string) => validacionServidor(c), produccion: (c: string) => [erroresProduccion(c), _sentry(c)].filter(Boolean).join("\n"),
          rendimiento: async (c: string) => { try { const nb = consultasEnBucle(c); const app = await _iniApp(c).catch(() => null); const base = (app as any)?.url; const r = await _rendimiento(c, base, base ? _rutas(c, []) : [], _pw(c)); (app as any)?.detener?.(); return [...r.lineas, ...(nb.length ? ["", "CONSULTAS EN BUCLE (N+1):", ...nb.slice(0, 10)] : [])].join("\n") } catch (e: any) { return "no pude medir: " + e.message } }, congelar: (c: string, ruta: string) => { if (!ruta) return "di qué ruta congelar, ej: /skill_dey congelar pagos/"; try { _mk(join(c, ".skill_dey"), { recursive: true }); _af(join(c, ".skill_dey", "CONGELADO.txt"), (_ex(join(c, ".skill_dey", "CONGELADO.txt")) ? "" : "# rutas que no se tocan sin permiso\n") + ruta.trim() + "\n"); return "🧊 congelado: " + ruta.trim() + " (no se tocará sin permiso)" } catch (e: any) { return "no pude: " + e.message } },
          version: () => { let u = ""; try { const a = JSON.parse(readFileSync(sdDir("AUTOPRUEBA.json"), "utf8")); u = ` · última autoprueba: ${a.bien}/${a.total} ${a.ok ? "✅" : "❌"} (${String(a.fecha).slice(0, 10)}${a.version !== VERSION ? ", de otra versión" : ""})` } catch {} const v = [...vistas].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, n]) => `${k} ${n}`).join(", "); return `SKILL_DEY v${VERSION} · guardián activo${u}${v ? ` · vigilando: ${v}` : ""}. Prueba completa: /skill_dey prueba` },
          diagnostico: () => { const d = diagnosticar(client, cwd); return [`SKILL_DEY ${VERSION} · diagnóstico`, ...d.ok.map((x) => "✅ " + x), ...d.mal.map((x) => "❌ " + x)].join("\n") },
          autoprueba: () => correrAutoprueba(),
          consumo: async () => { try { const m = await medir(client, _input?.sessionID); m.hoy = tokensHoy(join(cwd, ".skill_dey", "CONSUMO.md"), m.modelo); return "```\n" + ventana(m).mensaje + "\n" + "Sesión".padEnd(10) + `${k(m.sesion.tokens)} tokens en ${m.sesion.consultas} consulta(s)` + "\n```" } catch (e: any) { return "No pude leer el consumo: " + e.message } },
          modelos: () => resumenModelos(modeloAct), fijarActivo,
          tablero: () => { try { return readFileSync(join(cwd, ".skill_dey", "TABLERO.txt"), "utf8") } catch { return "Aún no hay tablero: aparece al terminar la primera respuesta (y queda en .skill_dey/TABLERO.txt)." } },
          buscarSkill: (c: string, tema: string) => _buscarSkill(c, tema || ""),
          capacitar: async (c: string) => (await _capacitar(c)).lineas.join("\n"),
          pruebas: async (c: string) => { const r = await _pruebasPro(c); try { _aprender(c, "pruebas", r.lineas) } catch {} ; return r.lineas.join("\n") },
          movil: (c: string) => { const r = _movil(c); try { _aprender(c, "movil", r.lineas) } catch {} ; return r.lineas.join("\n") },
          multiIA: (c: string) => _multiia(c).lineas.join("\n"),
          doctor: () => _doctor(), hook: (c: string) => _hook(c), reporte: (c: string) => _reporte(c), mapa: (c: string) => _mapa(c).lineas.join("\n"), mockup: (c: string, brief: string) => _mockup(c, brief).lineas.join("\n"), optimizar: (texto: string) => _optprompt(texto),
          panel: (c: string) => _panel(c).lineas.join("\n"), checkpoint: (c: string, n: string) => _checkpoint(c, n), hitos: (c: string) => _hitos(c), volver: (c: string, n: string) => _volver(c, n),
          buscarMemoria: (c: string, q: string) => { const r = _buscarMem(c, q, 8); return r.length ? "🔎 En tu memoria (lo más relevante):\n" + r.map((x) => "  · " + x).join("\n") : "sin resultados en la memoria del proyecto" },
          impactoProfundo: (c: string, objetivo: string) => _impactoProfundo(c, objetivo || "").lineas.join("\n"),
          cambiosExactos: (c: string) => _cambiosExactos(c),
        }).catch((e: any) => ({ codigo: true as const, texto: "No pude ejecutar el comando: " + e.message }))
        if (/^(deshacer|rehacer|volver|restaurar|revertir)\b/.test(args)) fotoDelTurno = false
        if (r.codigo) { ultimoResultado = (r as any).texto ?? ""; try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(join(cwd, ".skill_dey", "ULTIMO-RESULTADO.md"), ultimoResultado) } catch {} }
        pc.text = !r.codigo ? (r as any).prompt
          : pedidoOriginal ? `${pedidoOriginal}\n\n[SKILL_DEY ya probó la app en Chrome por código (consola, JS, red, HTTP). Usa este resultado para responder lo que pidió y, si pidió corregir, corrige por causa raíz:]\n${r.texto}`
          : `[SKILL_DEY] Resultado de "/skill_dey ${args || "ayuda"}" (ya ejecutado por código: no ejecutes nada ni agregues comentarios). Muéstralo al usuario tal cual:\n\n${r.texto}`
        return
      }
      // RUTEO por complejidad (0 tokens): tarea simple → modelo barato; compleja → potente. Antes de responder.
      if (estaActivo() && !pc) {
        const ut = partes.find((p) => p.type === "text")?.text ?? ""
        if (ut && !ut.startsWith("[GUARDIAN]")) {
          if (!(SI.test(ut) && ut.trim().length <= 80)) ultimoPedido = ut // un "sí" sigue siendo el MISMO pedido (no se pierde su nombre)
          try {
            const m0 = output?.message?.model ?? _input?.model
            const entrante = m0?.providerID ? `${m0.providerID}/${m0.modelID}` : ""
            if (entrante && entrante !== ultimoRuteado) modeloBase = entrante // lo elegiste tú (no es el que puso skill_dey)
            const base = modeloBase || entrante
            const r = rutear(ut, base)
            const destino = r?.id ?? base // pedido normal → SIEMPRE vuelve a tu modelo
            if (destino && destino !== entrante) {
              const [p, ...rest] = destino.split("/"); const nuevo = { providerID: p, modelID: rest.join("/") }
              if (output?.message) output.message.model = nuevo
              if (_input) _input.model = nuevo
              const nb = (x: string) => x.split("/").pop() || x
              client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: r ? `tarea ${r.tier === "simple" ? "ligera" : "compleja"} → ${nb(r.id)} · al terminar vuelvo a ${nb(base)}` : `vuelvo a tu modelo: ${nb(base)}`, variant: "info", duration: 7000 } }).catch(() => {})
            }
            ultimoRuteado = r ? r.id : ""
          } catch {}
        }
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
      // solo lo que ESCRIBIÓ el usuario (no archivos adjuntos con @, que OpenCode agrega como texto sintético)
      const txt = (output?.parts ?? []).filter((p: any) => p.type === "text" && !p.synthetic).map((p: any) => p.text ?? "").join(" ")
      if (!txt.startsWith("[GUARDIAN]")) reiniciarVueltas() // pedido nuevo del usuario
      if (FINALIZAR.test(txt) && txt.trim().length <= 40) { fijarActivo(false); anuncio = "off" } // apagar: solo si el mensaje ES la orden
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
      try { if (!existsSync(join(cwd, ".skill_dey", "ADOPCION.md")) && avanzado()) extra.push("[SKILL_DEY] Este proyecto ya tiene código y aún no se adoptó: antes del primer cambio (o ya mismo si el usuario escribió 'iniciar skill dey') ejecuta skill_dey_adoptar y sigue references/adopcion.md de la skill skill-dey.") } catch {}
      try { if (proyectoGrande === true) { if (_subs === null) { try { _subs = _sugerirSubcarpetas(cwd, 3) } catch { _subs = [] } } const subs = _subs; if (subs.length) extra.push("[SKILL_DEY] Proyecto ENORME: trabajar en la raíz es lento. Sugiere al usuario abrir OpenCode dentro de una subcarpeta con su código (ej.: " + subs.join(", ") + ") para ir mucho más rápido.") } } catch {}
      if (contextoSesion) extra.push(contextoSesion)
      if (extra.length) output.system.push(extra.join("\n"))
      // REFLEXION: reinyecta SOLO las lecciones relevantes al pedido actual (pocas lineas, 0 tokens de mas)
      try {
        if (ultimoPedido) {
          if (_lec?.q !== ultimoPedido) _lec = { q: ultimoPedido, r: _buscarMem(cwd, ultimoPedido, 3) }
          const lec = _lec.r
          if (lec.length) output.system.push("[SKILL_DEY - lecciones aprendidas, evita repetir estos fallos]\n" + lec.map((x: string) => "- " + x).join("\n"))
        }
      } catch {}
    },

    event: async ({ event }: any) => {
      if (event?.type === "session.idle") contextoSesion = "" // solo durante la 1ª respuesta de la sesión
      if (event?.type === "session.idle" && ultimoRuteado && modeloBase && ultimoRuteado !== modeloBase) { const nb = (x: string) => x.split("/").pop() || x; client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: `Terminó con ${nb(ultimoRuteado)}. Tu próximo pedido vuelve a ${nb(modeloBase)} (o al que toque según la tarea).`, variant: "info", duration: 7000 } }).catch(() => {}) }
      if (event?.type === "session.idle") anuncio = "" // la confirmación de encendido/apagado dura toda la respuesta
      if (!estaActivo()) return
      // LÍMITE DE USO: avisar y continuar solo con el siguiente modelo
      const reintentoPorLimite = event?.type === "session.status" && event.properties?.status?.type === "retry" && esErrorDeLimite(event.properties?.status)
      const reintentoPorRegion = event?.type === "session.status" && event.properties?.status?.type === "retry" && esErrorDeRegion(event.properties?.status)
      const porRegion = (event?.type === "session.error" && esErrorDeRegion(event.properties?.error)) || reintentoPorRegion // modelo bloqueado por región/privacidad (incluye el reintento visible "attempt #N")
      const reintentoPorRed = event?.type === "session.status" && event.properties?.status?.type === "retry" && esErrorDeRed(event.properties?.status)
      const porRed = (event?.type === "session.error" && esErrorDeRed(event.properties?.error)) || reintentoPorRed // el modelo no respondió a tiempo (timeout/caída): seguir con otro para no quedarse colgado
      if (event?.type === "session.created") refrescarCatalogo(client).catch(() => 0) // modelos gratis al día (cambian seguido)
      const estadoErr = event?.properties?.status ?? event?.properties?.error
      // reintento con espera LARGA (ej. "retrying in 9h"): OpenCode quedaría horas esperando → también se cambia de modelo
      const espera = event?.type === "session.status" && event.properties?.status?.type === "retry" && Number(event.properties.status.next) ? Number(event.properties.status.next) - Date.now() : 0
      const cupo = (event?.type === "session.error" || event?.properties?.status?.type === "retry") && esCupoDelProveedor(estadoErr)
      if ((event?.type === "session.error" && esErrorDeLimite(event.properties?.error)) || reintentoPorLimite || porRegion || porRed || cupo || espera > 900_000) {
        try {
          const sid = event.properties?.sessionID
          const r = await client.session.messages({ path: { id: sid } })
          const l: any[] = (r?.data ?? r ?? []).map((m: any) => m.info ?? m)
          const ua = [...l].reverse().find((m) => m.role === "assistant")
          const actual = ua ? `${ua.providerID}/${ua.modelID}` : ""
          // freno anti-bucle POR MODELO: los avisos repetidos del MISMO modelo se ignoran 12 s; si el NUEVO modelo también falla, se actúa al instante
          if (actual === ultimoFallado && Date.now() - ultimoCambio < 12_000) return
          ultimoFallado = actual; ultimoCambio = Date.now()
          await refrescarCatalogo(client).catch(() => 0)
          const prov = actual.split("/")[0]
          const todoElProveedor = !!prov && (cupo || espera > 900_000)
          const ahora = Date.now()
          while (cambios.length && ahora - cambios[0] > 3_600_000) cambios.shift()
          while (cambiosRegion.length && ahora - cambiosRegion[0] > 600_000) cambiosRegion.shift()
          const motivoTxt = porRegion ? `requiere la región Global (no está permitido en tu workspace)` : porRed ? "no respondió a tiempo (lo cambio para no dejarte colgado)" : "llegó a su límite"
          const arreglo = porRegion ? ` Para usarlo, activa "Global" en Ajustes → Privacidad de tu workspace.` : ""
          // TOPE SEGURO — nunca entrar en bucle infinito de cambios de modelo
          if (porRegion && cambiosRegion.length >= 6) { await client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: `Probé varios modelos seguidos y todos piden la región Global. Activa "Global" en Ajustes → Privacidad, o agrega otro proveedor; no es algo que cambiar de modelo pueda resolver.`, variant: "warning", duration: 18000 } }).catch(() => {}); return }
          if (!porRegion && cambios.length >= 6) { if (espera > 900_000 || cupo) await client.session.abort({ path: { id: sid } }).catch(() => {}); await client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: `${actual} ${motivoTxt}. Revisa /models.${arreglo}`, variant: "warning", duration: 15000 } }).catch(() => {}); return }
          const porContexto = /context|too long|maximum.*tokens|token limit|prompt is too long/i.test(JSON.stringify(event.properties?.error ?? event.properties?.status ?? ""))
          const vuelve = espera > 900_000 ? espera : 6 * 3_600_000 // cupo del proveedor: hasta que se renueva (o 6 h si no lo dice)
          if (actual && !porContexto) marcarLimitado(actual, todoElProveedor ? vuelve : porRed ? 300_000 : 3_600_000) // caída de red: 5 min (no 1 h); contexto lleno: el modelo está sano
          if (todoElProveedor) marcarProveedor(prov, vuelve) // sus OTROS modelos gratis comparten el cupo: no sirve saltar entre ellos
          const sig = siguienteModelo(actual, false, todoElProveedor ? prov : "")
          if (!sig) {
            const hora = new Date(Date.now() + vuelve).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            if (todoElProveedor) await client.session.abort({ path: { id: sid } }).catch(() => {}) // no dejar OpenCode horas "reintentando"
            const msg = todoElProveedor
              ? `Se acabó el cupo GRATIS de ${prov} (se renueva ~${hora}) y no tienes otro proveedor gratis para seguir solo. Agrega uno gratis con /connect (OpenRouter modelos ":free", Google Gemini, Groq…) y skill_dey lo usará automáticamente. Tu trabajo quedó guardado: escribe "continúa" cuando haya modelo.`
              : `${actual} ${motivoTxt} y no hay otro modelo libre ahora.${arreglo || " Espera un rato o agrega otro proveedor."}`
            await client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: msg, variant: "warning", duration: 30000 } }).catch(() => {})
            try { const d = join(cwd, ".skill_dey"); mkdirSync(d, { recursive: true }); appendFileSync(join(d, "CONSUMO.md"), `${new Date().toISOString().slice(0, 16).replace("T", " ")} | LÍMITE ${actual}${todoElProveedor ? " (cupo de todo " + prov + ")" : ""} → sin otro modelo gratis\n`) } catch {}
            return
          }
          if (porRegion) cambiosRegion.push(ahora); else cambios.push(ahora)
          await client.tui?.showToast?.({ body: { title: "SKILL_DEY · modelo", message: `${actual} ${motivoTxt}. Continúo con ${sig.nombre} para no perder tu tarea.${arreglo}`, variant: "warning", duration: 12000 } }).catch(() => {})
          // cortar los reintentos de OpenCode con el modelo agotado (esperan cada vez más) y seguir ya con el nuevo
          await client.session.abort({ path: { id: sid } }).catch(() => {})
          await new Promise((r) => setTimeout(r, 1500))
          const [providerID, ...m] = sig.id.split("/")
          client.session.prompt({ path: { id: sid }, body: { model: { providerID, modelID: m.join("/") }, ...(ua?.agent || ua?.mode ? { agent: ua.agent ?? ua.mode } : {}), parts: [{ type: "text", text: `[GUARDIAN] El modelo anterior (${actual}) ${porRegion ? "no está disponible por región" : todoElProveedor ? `agotó el cupo gratis de ${prov}` : "llegó a su límite de uso"}. Continúa exactamente donde quedó la tarea, sin repetir lo ya hecho.` }] } }).catch(() => {})
          const d = join(cwd, ".skill_dey"); if (!existsSync(d)) mkdirSync(d, { recursive: true })
          appendFileSync(join(d, "CONSUMO.md"), `${new Date().toISOString().slice(0, 16).replace("T", " ")} | LÍMITE ${actual} → continúa con ${sig.id}\n`)
        } catch {}
        return
      }
      if (!diagnosticoMostrado && (event?.type === "session.created" || event?.type === "session.idle")) {
        diagnosticoMostrado = true
        const d = diagnosticar(client, cwd)
        await client.tui?.showToast?.({ body: { title: "SKILL_DEY", message: d.mal.length ? "⚠ v" + VERSION + " · " + d.mal.join(" · ") : "v" + VERSION + " · activo ✓", variant: d.mal.length ? "warning" : "info", duration: d.mal.length ? 20000 : 6000 } }).catch(() => {})
      }
      if (!memoriaLista && (event?.type === "session.created" || event?.type === "session.idle")) {
        memoriaLista = true
        try { const nuevos = _asegurarMemoria(cwd); if (nuevos.length) await client.tui?.showToast?.({ body: { title: "SKILL_DEY · memoria", message: "Creé la memoria del proyecto (.skill_dey/memoria.md + " + nuevos.length + " archivos) para el contexto.", variant: "info", duration: 8000 } }).catch(() => {}) } catch {}
      }
      if (!pruebaMostrada && (event?.type === "session.created" || event?.type === "session.idle")) {
        pruebaMostrada = true
        // NO corre la autoprueba en el arranque (era síncrona y congelaba OpenCode): solo muestra el resultado ya guardado.
        try {
          const res: any = JSON.parse(readFileSync(sdDir("AUTOPRUEBA.json"), "utf8"))
          if (res && res.version === VERSION && res.ok) await client.tui?.showToast?.({ body: { title: "SKILL_DEY · autoprueba", message: "✅ " + res.bien + "/" + res.total + " piezas OK · v" + VERSION, variant: "info", duration: 8000 } }).catch(() => {})
        } catch {}
      }
      if (event?.type === "session.idle" && fotoFallo) {
        fotoFallo = false
        await client.tui?.showToast?.({ body: { title: "SKILL_DEY · atención", message: "No se pudo tomar la copia de seguridad antes del último cambio. Revisa git (pregunta: ¿skill_dey funciona?).", variant: "warning", duration: 15000 } }).catch(() => {})
      }
      if (event?.type === "session.idle") {
        // Consumo de la consulta: aviso en pantalla + registro en .skill_dey/CONSUMO.md (no gasta tokens del modelo)
        try {
          const sid = event.properties?.sessionID
          if (!sid || !client) return
          const ses = await client.session.get({ path: { id: sid } }).catch(() => null)
          if ((ses?.data ?? ses)?.parentID) return // subagentes: se suman en la sesión principal (y NO cortan el punto de deshacer del pedido)
          fotoDelTurno = false; turno = new Date().toISOString().replace(/[:.]/g, "-")

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
              const r: string = _txt(await verificarTool.execute({ nivel: "N1", archivos: [...editados], rapido: true } as any, { worktree: cwd, directory: cwd } as any).catch((e: any) => "❌ " + e.message))
              v = leerV()
              detalle = r.split("\n").filter((l) => /^❌|^   /.test(l)).slice(0, 12).join("\n")
            }
            const fallo = !!v && !v.ok
            resultadoTurno = errores.length || fallo ? "❌ quedó con errores" : "✅"
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
            if ((autoIntentos >= 3 || rojos >= 4) && (errores.length || fallo)) {
              try { _aprender(cwd, "verificacion", [...errores.map((e) => "❌ " + e), ...(fallo ? ["❌ verificacion quedo en rojo"] : [])]) } catch {}
              if (baseVerde) {
                // NUNCA ROMPER: la app estaba sana antes de este pedido y quedó rota tras 3 intentos → vuelve SOLA al estado sano (reversible con "rehaz")
                const r = _deshacerDesde(cwd, inicioPedido, commitBase)
                resultadoTurno = "↩ deshecho automático (rompía la app)"
                try { appendFileSync(join(cwd, ".skill_dey", "BITACORA.md"), `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} · "${ultimoPedido.replace(/\s+/g, " ").slice(0, 100)}" · ↩ DESHECHO AUTOMÁTICO: rompía lo que funcionaba (${(errores[0] ?? detalle.split("\n")[0] ?? "").slice(0, 120)})\n`) } catch {}
                await client.tui?.showToast?.({ body: { title: "SKILL_DEY · protegí tu app", message: "El cambio rompía algo que funcionaba y no se pudo arreglar en 3 intentos: dejé la app como estaba antes. Si igual lo quieres, escribe 'rehaz'.", variant: "warning", duration: 25000 } }).catch(() => {})
                client.session.prompt({ path: { id: sid }, body: { parts: [{ type: "text", text: `[GUARDIAN] Deshice tu cambio automáticamente: rompía lo que funcionaba y no quedó verde en 3 intentos.\n${(errores.length ? errores.join(" | ") : detalle).slice(0, 600)}\n${r.split("\n")[0]}\nNo vuelvas a editar sin el OK del usuario. Explícale en 2-3 líneas qué falló y propón otro enfoque más seguro.` }] } }).catch(() => {})
                autoIntentos = 3; editados.clear(); return
              }
              await client.tui?.showToast?.({ body: { title: "SKILL_DEY · atención", message: "Ni el diagnóstico sistemático (ciclo 4) dejó todo verde. La app ya tenía errores antes de este pedido, así que no deshice solo: escribe 'deshaz' si quieres volver al estado anterior.", variant: "warning", duration: 20000 } }).catch(() => {})
            }
          }
          // Documentación viva (por código): en proyectos ENORMES es síncrona y pesada → se pausa (evita congelar OpenCode)
          if (proyectoGrande === null) { try { proyectoGrande = _contarArchivos(cwd, 2500) >= 2500 } catch { proyectoGrande = false } }
          if (proyectoGrande) {
            if (!avisoGrande) { avisoGrande = true; let subs: string[] = []; try { subs = _sugerirSubcarpetas(cwd, 3) } catch {} const tip = subs.length ? " Para ir MÁS RÁPIDO, abre OpenCode dentro de la subcarpeta con tu código: " + subs.join(", ") + "." : ""; await client.tui?.showToast?.({ body: { title: "SKILL_DEY · proyecto grande", message: "Muchos archivos: la documentación automática está EN PAUSA para no congelar (corre /skill_dey documentar cuando quieras)." + tip, variant: "info", duration: 14000 } }).catch(() => {}) }
          } else if (cambioPorTerminal || (editados.size && [...editados].some((f) => !/(^|[\\/])docs[\\/]|database[\\/]instalacion\.sql$/.test(f)))) {
            try { documentar(cwd) } catch (e: any) { try { appendFileSync(sdDir("errores-guardian.log"), `${new Date().toISOString()} documentar: ${String(e?.stack ?? e).slice(0, 300)}\n`) } catch {} }
          }
          if (editados.size) { const l = [...editados].map((f) => relNorm(cwd, f)); await client.tui?.showToast?.({ body: { title: "SKILL_DEY · cambié " + l.length + " archivo(s)", message: l.slice(0, 6).join(", ") + (l.length > 6 ? "…" : "") + ' · para volver solo uno: "deshaz <archivo>"', variant: "info", duration: 12000 } }).catch(() => {}) }
          try { if (editados.size) _registrarMemoria(cwd, [...editados].map((f) => relNorm(cwd, f)), ultimoPedido, resultadoTurno) } catch {} // TIEMPO REAL (con tu pedido: la próxima sesión sabe dónde quedamos)
          resultadoTurno = ""
          cambioPorTerminal = false
          try { comprimirMemoria(cwd) } catch {} // memoria corta = menos tokens al leerla
          editados.clear()
          let pedirResumen = false
          // ¿Terminó SIN texto visible? (solo herramientas o solo "pensamiento") → nunca dejar al usuario sin respuesta
          try {
            const idU = (ultU?.info ?? ultU)?.id
            const turnoA = lista.filter((m: any) => (m.info ?? m).role === "assistant" && (!idU || (m.info ?? m).parentID === idU))
            const visible = turnoA.flatMap((m: any) => m.parts ?? []).some((p: any) => p.type === "text" && !p.synthetic && String(p.text ?? "").trim().length > 0)
            const err = turnoA.map((m: any) => (m.info ?? m).error).find(Boolean)
            if (turnoA.length && !visible) {
              if (/^\[SKILL_DEY\] Resultado/.test(textoU) && ultimoResultado) { // comando ejecutado por código: se muestra igual, sin gastar otro paso
                const l = ultimoResultado.split("\n").filter((x) => x.trim())
                await client.tui?.showToast?.({ body: { title: "SKILL_DEY · resultado", message: l.slice(0, 8).join("\n") + (l.length > 8 ? "\n… completo en .skill_dey/ULTIMO-RESULTADO.md" : ""), variant: "info", duration: 25000 } }).catch(() => {})
              } else if (err && /abort/i.test(String(err?.name ?? err?.message ?? ""))) { /* lo cortaste tú (Esc): no se insiste */
              } else if (err) {
                const msg = String(err?.data?.message ?? err?.message ?? err?.name ?? "error del modelo").slice(0, 140)
                await client.tui?.showToast?.({ body: { title: "SKILL_DEY · la respuesta se cortó", message: `${msg}\nTu trabajo quedó guardado. Escribe "sigue" para continuar.`, variant: "warning", duration: 20000 } }).catch(() => {})
              } else if (!avisoSinTexto) {
                avisoSinTexto = true; pedirResumen = true // se pide DESPUÉS de mostrar el consumo
              }
            }
          } catch {}
          const med = await medir(client, sid)
          try { if (med?.modelo) marcarBueno(med.modelo) } catch {} // salud: este modelo respondio bien -> se prefiere luego
          const d = join(cwd, ".skill_dey"); if (!existsSync(d)) mkdirSync(d, { recursive: true })
          const f = join(d, "CONSUMO.md"); if (!existsSync(f)) appendFileSync(f, "# CONSUMO (una línea por consulta)\n")
          med.hoy = tokensHoy(f, med.modelo) + med.consulta.tokens // uso de hoy con este modelo (para anticipar el límite diario gratis)
          const t = texto(med)
          const poco = t.pct >= 80
          const sesionMs = Date.now() - sesionInicio
          try { writeFileSync(join(d, "TABLERO.txt"), tablero(med, { herrTurno, herrSesion, sesionMs })) } catch {} // panel para tener al lado
          try { _traza(cwd, { ts: Date.now(), modelo: med.modelo, tokens: med.consulta.tokens, costo: med.consulta.costo, dur: med.consulta.dur, herramientas: herrTurno }) } catch {} // observabilidad
          const vt = ventana(med)
          await client.tui?.showToast?.({ body: { title: vt.titulo, message: vt.mensaje, variant: vt.poco || poco ? "warning" : "info", duration: vt.poco ? 20000 : 12000 } }).catch(() => {})
          appendFileSync(f, t.linea + "\n")
          if (pedirResumen) client.session.prompt({ path: { id: sid }, body: { parts: [{ type: "text", text: "[GUARDIAN] Terminaste sin escribirle nada al usuario. Escríbele AHORA, sin usar herramientas, en máx. 5 líneas: qué hiciste o encontraste (ruta:línea), si quedó funcionando y qué falta." }] } }).catch(() => {})
          herrTurno = 0                       // la siguiente pregunta cuenta sus herramientas desde cero
        } catch {}
      }
    },

    "tool.execute.before": async (input0: any, output: any) => {
      if (!estaActivo()) return
      const a = output?.args ?? {}
      vistas.set(String(input0?.tool), (vistas.get(String(input0?.tool)) ?? 0) + 1); if (vistas.size > 60) vistas.clear()
      const input = esTerminal(input0?.tool, a) && input0.tool !== "bash" ? { ...input0, tool: "bash" } : input0
      const archivos = EDITA.has(input.tool) || input.tool === "read" ? archivosDe(input.tool, a) : []
      const archivo: string = archivos[0] ?? a.filePath ?? a.path ?? ""
      // señal de actividad: avisa que skill_dey está TRABAJANDO (para no parecer colgado)
      if (/^skill_dey_(verificar|sitio|qa|adoptar|impacto)$/.test(input.tool)) client.tui?.showToast?.({ body: { title: "SKILL_DEY · trabajando", message: input.tool.replace("skill_dey_", "") + " en curso (puede tardar unos segundos)…", variant: "info", duration: 6000 } }).catch(() => {})

      // Proteger .env reales (se permite .env.example)
      if ((input.tool === "read" && ENV_REAL.test(archivo)) || (input.tool === "grep" && (ENV_REAL.test(String(a.path ?? "")) || /^\.?env/i.test(String(a.include ?? "")))) || (input.tool === "bash" && LEE_ENV.test(String(a.command ?? ""))))
        throw new Error("SKILL_DEY: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.")

      // ANTI-VUELTAS: misma acción con los mismos datos y sin editar nada entre medio = mismo resultado → se bloquea
      if (!/^skill_dey_(deshacer|consumo|diagnostico)$/.test(input.tool)) {
        const firma = `${input.tool}|${JSON.stringify(a).slice(0, 400)}|${ediciones}${EDITA.has(input.tool) ? "|" + evaluaciones : ""}`
        const n = (repetidas.get(firma) ?? 0) + 1; repetidas.set(firma, n)
        if (n >= 3) throw new Error(`SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable y aplica el CICLO 4 (references/diagnostico-sistematico.md), o skill_dey_deshacer y reporta.`)
        if (enRojo) {
          accionesEnRojo++
          if (accionesEnRojo === 15) throw new Error("SKILL_DEY anti-vueltas: 15 acciones sobre el mismo error sin quedar verde. Para: escribe en 1 línea qué sabes (hechos) y tu hipótesis; aplica el CICLO 4 (references/diagnostico-sistematico.md) con UNA comprobación que la refute.")
          if (accionesEnRojo >= 30 && !/^skill_dey_/.test(input.tool)) throw new Error("SKILL_DEY FRENO: 30 acciones sin resolver el error. No sigas: skill_dey_deshacer al último verde y reporta al usuario hechos · hipótesis · siguiente paso (2–3 opciones).")
        }
      }

      if (input.tool === "bash") { comandos.set(input.callID ?? "_", String(a.command ?? "")); if (comandos.size > 200) comandos.clear() }
      if (input.tool === "read" || /^skill_dey_/.test(input.tool)) evaluaciones++ // evaluar también es avanzar: reintentar tras leer NO es "dar vueltas"
      if (EDITA.has(input.tool) && archivos.length) { pendientes.set(input.callID ?? "_", archivos); if (pendientes.size > 200) pendientes.clear() }

      // INTEGRIDAD: foto del proyecto antes del primer cambio del pedido (y copia por archivo si no hay git)
      const modifica = EDITA.has(input.tool) || (input.tool === "bash" && !esSoloLectura(a.command ?? ""))
      if (modifica) {
        try {
          const ped = ultimoPedido.replace(/\s+/g, " ").trim().slice(0, 100)
          protegerAntesDeCambiar(ped ? `"${ped}"` : input.tool === "bash" ? `bash: ${a.command}` : `${input.tool} ${archivos.map((f) => relNorm(cwd, f)).join(", ")}`) // el punto guardado lleva TU pedido: así lo encuentras en cualquier sesión
          if (!conGit) for (const f of archivos) respaldarArchivo(cwd, f, turno, ped)
        } catch {}
      }

      // Nada fuera del proyecto sin permiso
      if (EDITA.has(input.tool) && archivos.some((f) => ENV_REAL.test(f) && existsSync(isAbsolute(f) ? f : join(cwd, f)))) throw new Error("SKILL_DEY: no escribo ni borro .env reales (tus credenciales no se pueden deshacer). Agrega la variable a .env.example y dile al usuario qué copiar a su .env.")
      if (EDITA.has(input.tool)) for (const f of archivos) if (fueraDelProyecto(cwd, f)) throw new Error(`SKILL_DEY: ${f} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.`)
      // ALCANCE ESTRICTO (0 tokens): solo se modifica lo que el usuario pidió. Archivo que ya funcionaba y no pidió → BLOQUEADO hasta que él diga "sí".
      {
        const PREG = (q: string) => `${q} NO lo cambies por tu cuenta. Si de verdad es indispensable para lo que pidió, PREGÚNTALE en 1 línea: "Para <lo que pidió> necesito tocar <archivo> porque <motivo>. ¿Lo autorizas?" y espera su sí. Si es una mejora aparte, solo propónla al final.`
        let objetivos: string[] = []
        if (EDITA.has(input.tool)) objetivos = archivos
        else if (input.tool === "bash" && /\bsed\s+(-[a-z]*i|--in-place)|\bperl\s+-[a-z]*i|\bSet-Content\b|\bOut-File\b|\bAdd-Content\b|\btee\b|-replace\b|[^>&0-9]>>?\s*[^&>\s]|\b(mv|move|ren|rename|Move-Item|Rename-Item)\b/i.test(String(a.command ?? "")))
          objetivos = [...String(a.command ?? "").matchAll(/(?:^|[\s>"'=(])([\w.\/\\:-]+\.[A-Za-z][\w]{0,5})\b/g)].map((m) => m[1]).filter((f) => { try { return existsSync(isAbsolute(f) ? f : join(cwd, f)) && !fueraDelProyecto(cwd, f) } catch { return false } })
        for (const f of objetivos) {
          const abs = isAbsolute(f) ? f : join(cwd, f), clave = relNorm(cwd, f)
          if (!existsSync(abs) || existentesTocados.has(clave) || /(^|\/)(\.skill_dey|docs?|tests?|__tests__|spec|logs?|tmp|temp|dist|build|node_modules|vendor|coverage)\/|\.(test|spec)\.|\.(md|mdx|txt|log|lock)$/i.test(clave)) continue
          const base = clave.split("/").pop()!.toLowerCase()
          if (nombrados.size && !nombrados.has(base))
            throw new Error(PREG(`SKILL_DEY alcance: el usuario pidió cambios en ${[...nombrados].slice(0, 5).join(", ")}, no en "${clave}" (que ya funcionaba).`))
          if (!nombrados.size && !pedidoAmplio && existentesTocados.size >= 3)
            throw new Error(PREG(`SKILL_DEY alcance: ya modificaste ${existentesTocados.size} archivos que existían (${[...existentesTocados].slice(0, 4).join(", ")}) y ahora vas por "${clave}".`))
        }
        // dentro de un archivo pedido: nada de reescribirlo entero (así se cuelan cambios que nadie pidió)
        if (!pedidoAmplio && (input.tool === "write" || input.tool === "edit")) {
          const f = archivos[0], abs = f ? (isAbsolute(f) ? f : join(cwd, f)) : ""
          if (abs && existsSync(abs)) {
            let viejo = ""; try { if (statSync(abs).size < 2_000_000) viejo = readFileSync(abs, "utf8") } catch {}
            const vl = viejo.split(/\r?\n/), quita = input.tool === "write" ? (() => { const nuevo = new Map<string, number>(); for (const l of String(a.content ?? "").split(/\r?\n/)) nuevo.set(l, (nuevo.get(l) ?? 0) + 1); let q = 0; for (const l of vl) { const n = nuevo.get(l) ?? 0; if (n > 0) nuevo.set(l, n - 1); else if (l.trim()) q++ } return q })() : String(a.oldString ?? "").split(/\r?\n/).filter((l) => l.trim()).length
            const limite = Math.max(25, Math.round(vl.length * 0.3))
            if (viejo && quita > limite) throw new Error(`SKILL_DEY alcance: ibas a cambiar ${quita} líneas de "${relNorm(cwd, f)}" (de ${vl.length}). Cambia SOLO las líneas necesarias para lo que pidió el usuario, con ediciones pequeñas (edit). No reescribas ni "mejores" el resto del archivo. Si el usuario pidió reescribirlo, que lo diga.`)
          }
        }
        for (const f of objetivos) if (existsSync(isAbsolute(f) ? f : join(cwd, f))) existentesTocados.add(relNorm(cwd, f))
      }
      // RAZONAR ANTES DE TOCAR: antes del 1er cambio del pedido, la IA tiene que haber escrito "Entendí: … · Causa/Por qué: … · Plan: …"
      if (EDITA.has(input.tool) && !entendido && !avisoEntendi && archivos.some((f) => existsSync(isAbsolute(f) ? f : join(cwd, f)))) {
        let txt = ""
        try { const r = await client.session.messages({ path: { id: input.sessionID } }); const l: any[] = r?.data ?? r ?? []; let desde = 0; for (let i = l.length - 1; i >= 0; i--) { const m = l[i]; if ((m.info ?? m).role === "user" && !String((m.parts ?? []).map((p: any) => p.text ?? "").join(" ")).startsWith("[GUARDIAN]")) { desde = i; break } } txt = l.slice(Math.max(0, desde)).filter((m: any) => (m.info ?? m).role === "assistant").flatMap((m: any) => m.parts ?? []).map((p: any) => (p.type === "text" || p.type === "reasoning") ? p.text ?? "" : "").join("\n") } catch {}
        if (/entend[ií]\s*:/i.test(txt) && /(causa|por ?qu[eé]|plan|pasos?)\s*:/i.test(txt)) entendido = true
        else { avisoEntendi = true; throw new Error(`SKILL_DEY razonar: antes de cambiar código, escribe al usuario (corto):\nEntendí: <qué pidió exactamente y qué NO pidió>\nCausa/Por qué: <qué hay hoy en el código y por qué pasa o qué falta, con archivo:línea que LEÍSTE>\nPlan: <cambio mínimo, archivo por archivo, y cómo lo vas a comprobar>\nSi algo no está claro, PREGUNTA en vez de suponer. Luego haz el cambio.`) }
      }
      // EVALUAR SIN GASTAR PASOS: se guarda cómo estaba el archivo; al terminar la edición el CÓDIGO mide a quién afecta y se lo dice a la IA
      // (antes se la frenaba para que leyera y midiera: cada freno re-enviaba toda la conversación = muchos tokens).
      if (EDITA.has(input.tool)) for (const f of archivos) {
        const abs = isAbsolute(f) ? f : join(cwd, f)
        if (!CODIGO.test(abs)) continue
        try { if (statSync(abs).size < 400_000) { viejos.set(`${input.callID ?? "_"}|${abs}`, readFileSync(abs, "utf8")); if (viejos.size > 100) viejos.clear() } } catch {}
      }
      // ZONAS CONGELADAS: rutas en .skill_dey/CONGELADO.txt que no se tocan sin permiso (bloquea edición Y comandos de terminal)
      try {
        const cong = readFileSync(join(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim().replace(/\\/g, "/").replace(/^\.\//, "")).filter((l) => l && !l.startsWith("#")).map((l) => process.platform === "win32" ? l.toLowerCase() : l)
        if (cong.length) {
          const rutas: string[] = archivos.map((f) => relNorm(cwd, f))
          if (input.tool === "bash") for (const m of String(a.command ?? "").matchAll(/(?:^|[\s>"'])([\w.\/\\-]+\.[\w]+)/g)) rutas.push(relNorm(cwd, m[1]))
          const choca = rutas.find((r) => cong.some((c) => r === c || r.startsWith(c.replace(/\/$/, "") + "/")))
          if (choca && modifica) throw new Error(`SKILL_DEY: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.`)
        }
      } catch (e: any) { if (String(e?.message ?? "").startsWith("SKILL_DEY")) throw e }
      // Prohibido código truncado
      if (EDITA.has(input.tool)) {
        const nuevo: string = textoNuevo(a)
        const t = nuevo.split(/\r?\n/).find((l) => TRUNCADO.test(l))
        if (t) throw new Error(`SKILL_DEY: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o usa una edición puntual (edit) solo de las líneas que cambian.`)
      }

      // Secretos en código
      if (EDITA.has(input.tool) && !archivos.every((f) => /\.env(\.|$)|\.example|\.md$/i.test(f))) {
        const texto: string = textoNuevo(a)
        const linea = texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l))
        if (linea) throw new Error(`SKILL_DEY: secreto en código bloqueado → "${linea.trim().slice(0, 80)}". Muévelo a .env y documenta la variable en .env.example.`)
      }

      // INTEGRIDAD DE BD: prohibido escribir operaciones que eliminan/vacían datos (excepto migraciones del framework)
      if (EDITA.has(input.tool) && !archivos.every((f) => /(^|[\\/])(migrations?|migrate|alembic[\\/]versions)([\\/]|$)|\.(md|mdx|txt|rst)$/i.test(f))) {
        const d = bdDestructivo(textoNuevo(a), archivos.some((f) => /\.sql$/i.test(f)))
        if (d) throw new Error(`SKILL_DEY: PROHIBIDO para proteger la integridad de los datos → "${d.slice(0, 60)}". No se elimina base ni tabla, ni se vacía/limpia una tabla. Si de verdad hace falta, dilo al usuario para que lo haga él.`)
      }

      if (input.tool === "bash") {
        const cmd: string = a.command ?? ""
        for (const [re, motivo] of PELIGROSO) if (re.test(cmd)) throw new Error(`SKILL_DEY: bloqueado (${motivo}). Pide confirmación explícita al usuario y que lo ejecute él.`)
        if (borradoMasivo(cmd, cwd)) throw new Error("SKILL_DEY: bloqueado (borrado masivo de carpetas). Pide confirmación explícita al usuario y que lo ejecute él.")
        const sqlArchivo = sqlEjecutado(cmd, cwd)
        if (sqlArchivo && bdDestructivo(sqlArchivo, true)) throw new Error("SKILL_DEY: bloqueado: el archivo .sql que vas a ejecutar elimina o vacía datos (DROP/TRUNCATE/DELETE sin WHERE). Que lo ejecute el usuario si de verdad hace falta.")

        // Servidor en primer plano → segundo plano con log (si no, el agente queda congelado para siempre)
        const yaFondo = /(&\s*$|nohup|start\s+\/b|disown|--detach|-d\b)/.test(cmd)
        const bashUnix = process.platform !== "win32" || /bash|zsh|sh$/.test(process.env.SHELL ?? "")
        // Windows (PowerShell/cmd): Start-Process con -Redirect* o "start /b" HEREDAN la salida de la terminal → la herramienta queda esperando
        // hasta que el servidor muera (minutos colgada). Y un servidor en primer plano no termina nunca. → que lo suba skill_dey sin colgar nada.
        const psCuelga = /\bStart-Process\b[^;|]*-Redirect(StandardOutput|StandardError|StandardInput)\b|\bstart\s+\/b\b/i.test(cmd)
        if (psCuelga || (!bashUnix && SERVIDOR.test(cmd) && !/\bStart-Process\b/i.test(cmd)))
          throw new Error(`SKILL_DEY: ese arranque deja la terminal colgada en Windows (la salida queda atada al servidor). Usa skill_dey_procesos(accion:"levantar", cmd:"<comando>", carpeta:"<subcarpeta>", puerto:N): lo sube en segundo plano, espera a que responda (sin Start-Sleep fijo), te da su salida y errores, y luego se baja con accion:"detener". Para probar la salud usa otro comando aparte (Invoke-WebRequest / curl).`)
        if (SERVIDOR.test(cmd) && !yaFondo && bashUnix) {
          const log = join(cwd, ".skill_dey", "logs", `servidor-${Date.now()}.log`)
          const envuelto = cmd.replace(/'/g, `'\\''`)
          output.args.command = `mkdir -p "${join(cwd, ".skill_dey", "logs")}" && (nohup sh -c '${envuelto}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: .skill_dey/logs/${log.split(/[\\/]/).pop()} · para bajarlo: skill_dey_procesos(accion:detener)" ; tail -n 25 "${log}"`
        }
        // Pruebas: nunca en modo watch (se quedan esperando)
        if (/\bvitest\b/.test(cmd) && !/\bvitest\s+(run|related)\b|--run\b/.test(cmd)) output.args.command = (output.args.command ?? cmd).replace(/\bvitest\b/, "vitest run")
        if (/--watch(All)?\b/.test(cmd) && /jest|vitest|mocha|test/.test(cmd)) output.args.command = (output.args.command ?? cmd).replace(/\s--watch(All)?\b/g, "")
        if (bashUnix && /\b(npm|pnpm|yarn)\s+(run\s+)?test\b|\bjest\b|\bvitest\b|\bng\s+test\b/.test(cmd) && !/\bCI=/.test(cmd)) output.args.command = `export CI=1; ${output.args.command ?? cmd}`

        // Dependencias: solo si el usuario las pidió o aprobó
        const dep = cmd.match(DEPENDENCIA)
        if (dep && !/(^|\s)-(D|-save-dev)\b.*playwright|--dry-run/.test(cmd)) {
          const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""))
          let textoU = ""
          try { const r = await client.session.messages({ path: { id: input.sessionID } }); const l: any[] = r?.data ?? r ?? []; const u = [...l].reverse().find((m: any) => (m.info ?? m).role === "user"); textoU = (u?.parts ?? []).map((p: any) => p.text ?? "").join(" ").toLowerCase() } catch {}
          const pidio = /instal|dependenc|librer|paquete|package|m[oó]dulo npm|composer/.test(textoU) || paquetes.some((p) => textoU.includes(p.toLowerCase().split("/").pop()!)) || /^\s*(ok|sí|si|dale|hazlo|listo|de acuerdo|aprobado|adelante|procede)(?![\wáéíóúñ])/.test(textoU) || paquetes.length === 0
          if (!pidio) throw new Error(`SKILL_DEY: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.`)
        }

        // Base de datos: respaldo obligatorio antes de migrar o modificar datos
        if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd) || (sqlArchivo && /\b(insert|update|delete|alter|create|drop|replace)\b/i.test(sqlArchivo))) && !/--pretend\b|--dry-run\b|\bmigrate:status\b|\bmigrate\s+status\b|\s--status\b|\bshowmigrations\b/.test(cmd) && !/\b(DB_DATABASE|DB_NAME|DATABASE_URL)["']?\s*=\s*["']?[^\s"';]*(_skilldey_prueba_?\d*|bd-prueba\.sqlite)\b/i.test(cmd) && !respaldoBdReciente(cwd)) // contra la COPIA de prueba sí se puede ensayar
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
            return que === "prueba" ? diag + "\n\n" + await correrAutoprueba() : diag
          }
          try { const m = await medir(client, ctx.sessionID); m.hoy = tokensHoy(join(ctx.worktree || ctx.directory || process.cwd(), ".skill_dey", "CONSUMO.md"), m.modelo); return texto(m).corto + "\nLos planes gratis no informan el cupo diario que queda; 'Hoy' ayuda a anticiparlo.\nHistórico: .skill_dey/CONSUMO.md" } catch (e: any) { return "No pude leer el consumo: " + e.message }
        },
      }),
    },

    "tool.execute.after": async (input0: any, output: any) => {
      if (!estaActivo()) return
      const input = esTerminal(input0?.tool, input0?.args ?? output?.args) || comandos.has(input0?.callID ?? "_") ? { ...input0, tool: "bash" } : input0
      herrTurno++; herrSesion++            // contador de herramientas usadas (tablero)
      if (input.tool === "skill_dey_verificar" || input.tool === "skill_dey_sitio") {
        const r = String(output?.output ?? "")
        if (/✅ todo verde|✅ sitio sin errores/.test(r)) reiniciarVueltas(); else if (/❌/.test(r)) enRojo = true
      }
      // un comando que modifica archivos también cuenta como cambio (para no bloquear un "npm test" legítimo tras editar)
      if (input.tool === "bash") {
        const c = String(comandos.get(input.callID ?? "_") ?? input?.args?.command ?? ""); comandos.delete(input.callID ?? "_")
        if (!esSoloLectura(c)) ediciones++ // cualquier comando que cambia algo cuenta (el anti-vueltas no frena reintentos legítimos)
        if (/sed -i|>>?|\btee\b|\bmv\b|\bcp\b|git (checkout|restore|apply|stash)|npm (i|install)|composer (require|install)|pip install|migrate/.test(c)) cambioPorTerminal = true
      }
      if (/^skill_dey_deshacer$/.test(input.tool)) fotoDelTurno = false // después de deshacer/rehacer, el próximo cambio vuelve a tomar foto
      if (!EDITA.has(input.tool)) return
      ediciones++
      ultimaEdicion = Date.now()
      const lista: string[] = pendientes.get(input.callID ?? "_") ?? [output?.metadata?.filePath ?? input?.args?.filePath].filter(Boolean)
      pendientes.delete(input.callID ?? "_")
      for (const archivo of lista) {
        editados.add(archivo)
        // IMPACTO POR CÓDIGO (0 pasos extra): ¿cambió una función/clase/variable que otros archivos usan? → se lo dice en la misma respuesta
        try {
          const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo), k0 = `${input.callID ?? "_"}|${abs}`, viejo = viejos.get(k0)
          if (viejo !== undefined && output && typeof output.output === "string") {
            viejos.delete(k0)
            const aviso = impactoDe(cwd, abs, viejo, readFileSync(abs, "utf8"))
            if (aviso) output.output += "\n\n" + aviso
          }
        } catch {}
        const err = sintaxis(cwd, archivo)
        if (err && output && typeof output.output === "string") output.output += `\n\n⚠ SKILL_DEY sintaxis en ${archivo}:\n${err}\n→ Corrígelo antes de seguir.`
      }
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
        try { appendFileSync(sdDir("errores-guardian.log"), `${new Date().toISOString()} ${nombre}: ${String(e?.stack ?? e).slice(0, 400)}\n`) } catch {}
      } finally { const ms = Date.now() - t0; if (ms > 3000 && nombre !== "event") try { appendFileSync(sdDir("lentitud.log"), `${new Date().toISOString()} ${nombre} ${ms} ms\n`) } catch {} }
    }
  }
  return hooks
}
