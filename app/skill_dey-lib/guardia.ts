// SKILL_DEY — GUARDIA: las reglas del guardián en UN solo lugar, iguales para OpenCode, Claude Code,
// Gemini CLI y Antigravity. Funciones puras y rápidas (sin red, sin modelo, 0 tokens).
// Cada host traduce su herramienta a una `Accion` (normalizar) y aplica la `Decision` (evaluar) a su manera.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, appendFileSync, readdirSync, statSync } from "node:fs"
import { join, extname, isAbsolute, resolve, relative } from "node:path"
import { errorJs } from "./sintaxis.ts"

// ---------- Patrones ----------
export const SECRETO = /(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{36,}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret|access[_-]?key)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i
export const PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|import\.meta\.env|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-]|dummy|fake|test[_-]?key)/i

/** Bloqueo duro: nunca los ejecuta la IA. Los corre el usuario si de verdad los quiere. */
export const PELIGROSO: [RegExp, string][] = [
  [/git\s+push\b.*\s(--force(-with-lease)?|-f)\b/, "push forzado"],
  [/\brm\s+(-[a-z]*r[a-z]*\s+|--recursive\s+)(-[a-z]+\s+)*(\/|~\/?|\*|\.\/?|\$HOME\/?|%USERPROFILE%)(\s|$)/i, "borrado masivo"],
  [/\b(rmdir|rd)\s+\/s\s+(\/q\s+)?([a-z]:\\?|\\)\s*$/i, "borrado masivo"],
  [/\bRemove-Item\b.*-Recurse\b.*\s(\\|[a-z]:\\|~|\$HOME|\*)/i, "borrado masivo"],
  [/git\s+clean\s+-[a-z]*f[a-z]*d|git\s+clean\s+-[a-z]*d[a-z]*f/, "git clean de archivos no versionados"],
  [/git\s+reset\s+--hard\b/, "git reset --hard (pierde cambios)"],
  [/\b(drop\s+(database|schema|table)|truncate\s+table)\b/i, "borrado de base de datos o tabla"],
  [/(psql|mysql|mariadb|sqlite3|sqlcmd)\b[\s\S]*\btruncate\b/i, "vaciado de tabla"],
  [/\bdelete\s+from\s+[\w."`\[\]]+\s*(;|"|'|$)(?![\s\S]*\bwhere\b)/i, "DELETE sin WHERE (vacía la tabla)"],
  [/\b(dropdb|mysqladmin\s+.*\bdrop)\b/i, "borrado de base de datos"],
  [/\b(dropDatabase|deleteMany\(\s*\{\s*\}\s*\)|\.drop\(\s*\))/, "borrado de base de datos (Mongo)"],
  [/\b(flushall|flushdb)\b/i, "vaciado de Redis"],
  [/(artisan\s+(migrate:(fresh|reset|refresh)|db:wipe)|prisma\s+migrate\s+reset|prisma\s+db\s+push\s+.*--force-reset|rails\s+db:(drop|reset|schema:load)|manage\.py\s+flush|sequelize(-cli)?\s+db:(drop|migrate:undo:all)|knex\s+migrate:rollback\s+--all|doctrine:(database:drop|schema:drop))/i, "reinicio/borrado de base de datos"],
  [/(migrate|migration).*(--env[= ]?prod|production)/i, "migración en producción"],
  [/\b(mkfs|format\s+[a-z]:|diskpart)\b/i, "formateo de disco"],
  [/:\(\)\s*\{\s*:\|:&\s*\};:/, "bomba de procesos"],
  [/\b(curl|wget|iwr|Invoke-WebRequest)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b|\biex\s*\(\s*(iwr|irm|New-Object)/i, "ejecutar un script descargado sin revisarlo"],
]

/** Código truncado (los modelos lo hacen y rompen archivos). */
export const TRUNCADO = /(\/\/|#|\/\*|<!--|--)\s*\.{3}\s*(resto|rest|existing|c[oó]digo|code|same|sin cambios|unchanged|igual|anterior|previous|etc)|\.{3}\s*(resto del|rest of (the )?)(c[oó]digo|code|file|archivo)|(\/\/|#)\s*(aqu[ií] va|el resto|the rest|remaining code|c[oó]digo existente|existing code)\b/i
/** Servidores que nunca terminan (congelan al agente). */
export const SERVIDOR = /(^|&&|;|\|\|)\s*((npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|watch|preview)\b|php\s+(artisan\s+serve|-S\s)|(python3?|py)\s+manage\.py\s+runserver|nodemon\b|npx\s+(vite|next\s+dev|nodemon)|vite(\s|$)|next\s+dev|flask\s+run|uvicorn\b|rails\s+s(erver)?\b|dotnet\s+(run|watch)\b|go\s+run\b)/i
export const DEPENDENCIA = /\b(npm\s+(i|install|add)|yarn\s+add|pnpm\s+(add|i|install)|bun\s+add|composer\s+require|pip3?\s+install|uv\s+(add|pip\s+install)|poetry\s+add|go\s+get|cargo\s+add|gem\s+install|dotnet\s+add\s+package)\s+(?<pkgs>[^&|;]+)/i
export const SOLO_LECTURA = /^\s*(ls|dir|cat|type|head|tail|less|grep|rg|find|wc|tree|pwd|echo|which|where|whoami|date|env|printenv|node\s+(-v|--version|--check)|npm\s+(ls|view|outdated|audit(?!\s+fix))|pip\s+(show|list)|composer\s+(show|audit)|git\s+(status|log|diff|show|branch|rev-parse|ls-files|grep|remote|config\s+--get|blame|describe|tag\s*$))\b/i
export const MIGRACION = /(artisan\s+migrate(?!:status)|prisma\s+(migrate\s+(dev|deploy)|db\s+push)|knex\s+migrate:(latest|up|down|rollback)|sequelize(-cli)?\s+db:migrate|alembic\s+(upgrade|downgrade)|manage\.py\s+migrate|typeorm.*migration:(run|revert)|flyway\s+migrate|rails\s+db:(migrate|rollback)|goose\s+(up|down)|doctrine:migrations:migrate|drizzle-kit\s+(push|migrate))/i
export const SQL_MODIFICA = /(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?)\b[\s\S]*\b(delete\s+from|update\s+[\w."`\[\]]+\s+set|alter\s+table|drop\s+(column|index)|insert\s+into|updateMany)\b/i
const ENV_REAL = /(^|[\\/])\.env(\.(local|production|prod|dev|development|staging|test))?$/

export const esSoloLectura = (cmd: string) => !/[^2]>|>>|\btee\b|\s-i\b/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every((p) => !p.trim() || SOLO_LECTURA.test(p))

// ---------- Acción normalizada (la misma para todos los hosts) ----------
export type Tipo = "leer" | "editar" | "comando" | "otra"
export interface Accion { tipo: Tipo; herramienta: string; archivo: string; texto: string; comando: string }

const ES_COMANDO = /(^|_|\b)(bash|shell|run_command|run_shell_command|terminal|exec|powershell)($|_|\b)/i
const ES_LEER = /^(read|view|cat)$|read_file|view_file|read_many_files|^Read$/i
const ES_EDITAR = /(edit|write|replace|patch|create_file|multiedit|notebook|apply_diff|insert)/i

/** Busca un valor de texto en args por varias claves posibles (cada host las nombra distinto). */
function campo(a: any, claves: RegExp): string {
  if (!a || typeof a !== "object") return ""
  for (const [k, v] of Object.entries(a)) if (claves.test(k) && typeof v === "string") return v
  return ""
}
/** Junta todo el texto NUEVO que la herramienta va a escribir (write, edit, multiedit, chunks…). */
function textoNuevo(a: any): string {
  if (!a || typeof a !== "object") return ""
  const partes: string[] = []
  const tomar = (o: any) => {
    if (!o || typeof o !== "object") return
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && /^(content|new_?string|newString|code_?content|CodeContent|replacement(_?content)?|ReplacementContent|new_text|text|patch(Text)?|diff|new_source)$/i.test(k)) partes.push(v)
      else if (Array.isArray(v)) v.forEach(tomar)
    }
  }
  tomar(a)
  return partes.join("\n")
}

/** Traduce una herramienta de cualquier host (Claude Code, Gemini, Antigravity, OpenCode) a una Accion. */
export function normalizar(herramienta: string, args: any): Accion {
  const h = String(herramienta ?? "")
  const a = args ?? {}
  const archivo = campo(a, /^(file_?path|filePath|path|absolute_path|AbsolutePath|TargetFile|target_file|notebook_path|file)$/i)
  const comando = campo(a, /^(command|CommandLine|cmd|script)$/i)
  let tipo: Tipo = "otra"
  if (/^mcp/i.test(h)) tipo = "otra"
  else if (ES_COMANDO.test(h) || (comando && !archivo)) tipo = "comando"
  else if (ES_LEER.test(h)) tipo = "leer"
  else if (ES_EDITAR.test(h)) tipo = "editar"
  return { tipo, herramienta: h, archivo, texto: tipo === "editar" ? textoNuevo(a) : "", comando }
}

// ---------- Utilidades de proyecto ----------
export function respaldoBdReciente(cwd: string, horas = 3): boolean {
  const d = join(cwd, ".skill_dey", "respaldos-bd")
  if (!existsSync(d)) return false
  try { return readdirSync(d).some((f) => Date.now() - statSync(join(d, f)).mtimeMs < horas * 3_600_000) } catch { return false }
}

/** Garantiza que .env y temporales nunca se suban a git. Devuelve los .env ya versionados (o null). */
export function blindarGitignore(cwd: string): string | null {
  const gi = join(cwd, ".gitignore")
  const actual = existsSync(gi) ? readFileSync(gi, "utf8") : ""
  const lineas = actual.split(/\r?\n/).map((x) => x.trim())
  const faltan = [".env", ".env.*", "!.env.example", ".skill_dey/shots/", ".skill_dey/.ultimo-verificar.json", ".skill_dey/respaldos-bd/", ".skill_dey/respaldos-archivos/", ".skill_dey/.sesion-*.json", ".skill_dey/logs/"].filter((l) => !lineas.includes(l))
  if (faltan.length) appendFileSync(gi, (actual && !actual.endsWith("\n") ? "\n" : "") + "# SKILL_DEY: nunca subir secretos ni temporales\n" + faltan.join("\n") + "\n")
  const r = spawnSync("git", ["ls-files", "--cached", "--", ".env", ".env.local", ".env.production", ".env.prod"], { cwd, encoding: "utf8" })
  const trackeados = (r.stdout || "").trim()
  return trackeados ? trackeados.split(/\r?\n/).join(", ") : null
}

/** Sintaxis de un archivo recién editado ("" = bien). Rápido: solo ese archivo. */
export function sintaxis(cwd: string, file: string): string {
  const f = isAbsolute(file) ? file : join(cwd, file)
  if (!existsSync(f)) return ""
  const e = extname(f).toLowerCase()
  if ([".js", ".mjs", ".cjs"].includes(e)) return errorJs(cwd, f)
  if (e === ".json" && !/tsconfig|jsconfig|\.vscode/.test(f)) { try { JSON.parse(readFileSync(f, "utf8")); return "" } catch (x: any) { return `JSON inválido: ${x.message}` } }
  const cmd = e === ".php" ? `php -l "${f}"` : e === ".py" ? `${process.platform === "win32" ? "python" : "python3"} -m py_compile "${f}"` : ""
  if (!cmd) return ""
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 20_000 })
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`
  if (r.status === 0 || /not recognized|not found|no se reconoce/i.test(out)) return ""
  return out.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join("\n")
}

function congeladas(cwd: string): string[] {
  try { return readFileSync(join(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) } catch { return [] }
}

// ---------- Decisión ----------
export interface Contexto {
  cwd: string
  /** ms de la última edición hecha por la IA en esta sesión (0 = no editó) */
  ultimaEdicion?: number
  /** ¿El usuario pidió/aprobó estas dependencias? undefined = no se sabe (no se bloquea). */
  pidioDependencias?: (paquetes: string[]) => boolean | undefined
  /** Texto de ayuda para correr servidores en segundo plano en este host. */
  comoSegundoPlano?: string
  /** true = el host puede reescribir el comando (OpenCode/Gemini); false = se bloquea con instrucciones. */
  puedeReescribir?: boolean
}
export interface Decision { bloquear?: string; comando?: string; aviso?: string }

const MSG = "SKILL_DEY"

/** Evalúa una acción ANTES de ejecutarse. Nunca lanza: ante un error inesperado deja pasar (no frena tu trabajo). */
export function evaluar(acc: Accion, c: Contexto): Decision {
  try { return evaluarInterno(acc, c) } catch { return {} }
}

function evaluarInterno(acc: Accion, c: Contexto): Decision {
  const { cwd } = c
  const archivo = acc.archivo
  // 1) Nunca leer credenciales reales
  if (acc.tipo === "leer" && ENV_REAL.test(archivo))
    return { bloquear: `${MSG}: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.` }
  if (acc.tipo === "comando" && /\b(cat|type|less|more|head|tail|Get-Content|gc)\b[^|;&]*(^|[\s"'\\/])\.env(\.(local|production|prod|dev|development|staging))?(\s|"|'|$)/i.test(acc.comando))
    return { bloquear: `${MSG}: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.` }

  // 2) Nada fuera del proyecto
  if (acc.tipo === "editar" && archivo) {
    const abs = resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))
    if (relative(resolve(cwd), abs).startsWith("..")) return { bloquear: `${MSG}: ${archivo} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.` }
  }

  // 3) Zonas congeladas (.skill_dey/CONGELADO.txt)
  const modifica = acc.tipo === "editar" || (acc.tipo === "comando" && !esSoloLectura(acc.comando))
  if (modifica) {
    const cong = congeladas(cwd)
    if (cong.length) {
      const rutas: string[] = []
      if (archivo) rutas.push(relative(resolve(cwd), resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))).replace(/\\/g, "/"))
      if (acc.tipo === "comando") for (const m of acc.comando.matchAll(/(?:^|[\s>"'])([\w./-]+\.[\w]+|[\w.-]+\/[\w./-]*)/g)) rutas.push(m[1].replace(/^\.\//, ""))
      const choca = rutas.find((r) => cong.some((x) => { const z = x.replace(/\\/g, "/").replace(/\/$/, ""); return r === z || r.startsWith(z + "/") }))
      if (choca) return { bloquear: `${MSG}: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.` }
    }
  }

  if (acc.tipo === "editar") {
    // 4) Código truncado
    const t = acc.texto.split(/\r?\n/).find((l) => TRUNCADO.test(l))
    if (t) return { bloquear: `${MSG}: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o edita solo las líneas que cambian.` }
    // 5) Secretos en código
    if (!/\.env(\.|$)|\.example|\.md$|\.txt$/i.test(archivo)) {
      const linea = acc.texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l))
      if (linea) return { bloquear: `${MSG}: secreto en código bloqueado → "${linea.trim().slice(0, 60)}…". Muévelo a .env y documenta la variable en .env.example.` }
    }
    return {}
  }

  if (acc.tipo !== "comando" || !acc.comando) return {}
  const cmd = acc.comando

  // 6) Comandos peligrosos (BD, borrados masivos, push forzado…)
  for (const [re, motivo] of PELIGROSO) if (re.test(cmd)) return { bloquear: `${MSG}: bloqueado (${motivo}). Explícale al usuario qué haría y que lo ejecute él si de verdad lo quiere.` }

  // 7) BD: respaldo obligatorio antes de migrar o modificar datos
  if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd)) && !/--pretend|--dry-run|--status|\bstatus\b|SKILL_DEY_BD_PRUEBA=1/.test(cmd) && !respaldoBdReciente(cwd))
    return { bloquear: `${MSG}: antes de migrar o modificar la BD: 1) ensaya en una copia · 2) haz respaldo en .skill_dey/respaldos-bd/ (pg_dump -Fc -f .skill_dey/respaldos-bd/<fecha>.dump <bd> · mysqldump <bd> > .skill_dey/respaldos-bd/<fecha>.sql · copiar el .sqlite). Si es BD de producción, NO lo hagas: pide al usuario.` }

  // 8) Dependencias que nadie pidió
  const dep = cmd.match(DEPENDENCIA)
  if (dep && c.pidioDependencias && !/--dry-run/.test(cmd)) {
    const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""))
    if (paquetes.length && c.pidioDependencias(paquetes) === false)
      return { bloquear: `${MSG}: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.` }
  }

  // 9) Nunca subir .env; commit final solo con verificación verde posterior a la última edición
  if (/git\s+(add|commit)\b/.test(cmd)) {
    const trackeado = blindarGitignore(cwd)
    if (trackeado) return { bloquear: `${MSG}: ${trackeado} está versionado en git (secretos expuestos). Ejecuta: git rm --cached ${trackeado} y avisa al usuario que cambie esas claves.` }
  }
  if (/git\s+commit\b/.test(cmd) && !/checkpoint|baseline|wip/i.test(cmd) && (c.ultimaEdicion ?? 0) > 0) {
    let v: any = null
    try { v = JSON.parse(readFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8")) } catch {}
    if (!v || !v.ok || v.ts < (c.ultimaEdicion ?? 0))
      return { bloquear: `${MSG}: commit bloqueado. Corre skill_dey_verificar (debe salir ✅) después de tu última edición. Para guardar avance usa un commit "skill_dey: checkpoint".` }
  }

  // 10) Servidores en primer plano y pruebas en modo watch (congelan al agente)
  const yaFondo = /(&\s*$|nohup|start\s+\/b|disown|--detach|-d\b|Start-Process)/.test(cmd)
  let nuevo = cmd
  if (/\bvitest\b/.test(nuevo) && !/\bvitest\s+(run|related)\b|--run\b/.test(nuevo)) nuevo = nuevo.replace(/\bvitest\b/, "vitest run")
  if (/--watch(All)?\b/.test(nuevo) && /jest|vitest|mocha|test/.test(nuevo)) nuevo = nuevo.replace(/\s--watch(All)?\b/g, "")
  if (SERVIDOR.test(cmd) && !yaFondo) {
    if (c.puedeReescribir && process.platform !== "win32") {
      const log = `.skill_dey/logs/servidor-${Date.now()}.log`
      return { comando: `mkdir -p .skill_dey/logs && (nohup sh -c '${nuevo.replace(/'/g, `'\\''`)}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: ${log}" ; tail -n 25 "${log}"` }
    }
    return { bloquear: `${MSG}: este comando deja un servidor corriendo y congela la sesión. ${c.comoSegundoPlano ?? "Córrelo en segundo plano con log (ej.: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &) y lee el log."}` }
  }
  if (nuevo !== cmd) {
    if (c.puedeReescribir) return { comando: nuevo }
    return { bloquear: `${MSG}: las pruebas en modo "watch" no terminan nunca. Usa: ${nuevo}` }
  }
  return {}
}
