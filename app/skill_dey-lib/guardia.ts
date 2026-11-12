// SKILL_DEY — GUARDIA: las reglas del guardián en UN solo lugar, iguales para OpenCode, Claude Code, Gemini CLI y Antigravity CLI.
// Funciones puras y rápidas (sin red, sin modelo, 0 tokens). El guardián de OpenCode (plugins/skill_dey-guardian.ts) y el
// hook de las otras IAs (hook.ts) las importan: una regla nueva o un arreglo aquí llega a las cuatro IAs a la vez.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, appendFileSync, readdirSync, statSync } from "node:fs"
import { join, extname, isAbsolute, resolve, relative, sep } from "node:path"
import { homedir as _home } from "node:os"
import { errorJs } from "./sintaxis.ts"

export const SECRETO = /(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-(ant-|proj-)?[A-Za-z0-9_-]{32,}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i
export const PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-])/i
// Clientes/herramientas de BD: el SQL destructivo SOLO cuenta si va a una BD (no en un "git commit -m 'truncate titles'" ni en un grep)
export const CLIENTE_BD = String.raw`\b(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?|redis-cli|clickhouse-client|duckdb|cockroach\s+sql)\b`
export const PELIGROSO: [RegExp, string][] = [
  [/\bgit\b[^|;&]*\bpush\b[^|;&]*(\s--force(-with-lease)?\b|\s-[a-zA-Z]*f[a-zA-Z]*(\s|$)|\s\+[\w./-]+|\s--mirror\b|\s:(main|master|develop|production|prod)\b|\s(--delete|-d)\s+(main|master|develop|production|prod)\b)/, "push forzado o borrado de rama principal"],
  [/\bgit\s+clean\b[^|;&]*(\s-[a-zA-Z]*[fxX][a-zA-Z]*|\s--force)\b/, "git clean (borra archivos no versionados o ignorados: .env, bases, subidas)"],
  // BASE DE DATOS: nunca se elimina ni se vacía (motores SQL, Mongo, Redis, ORMs y archivos de BD)
  [new RegExp(CLIENTE_BD + String.raw`[\s\S]*(\bdrop\s+(database|schema|table|collection)\b|\btruncate\s+(table\s+)?[\w."\x60\[\]]+|\bdelete\s+from\s+[\w."\x60\[\]]+\s*(["'\x60;)]|$)|dropDatabase\s*\(|\.drop\s*\(\s*\)|\bflushall\b|\bflushdb\b|\.(deleteMany|remove)\s*\(\s*(\{\s*\})?\s*\))`, "i"), "eliminación o vaciado de base de datos/tabla"],
  [/\bdropdb\b|\bmysqladmin\b[^|;&]*\bdrop\b/i, "eliminación de base de datos"],
  [/\b(migrate:(fresh|reset|refresh)|migrate\s+reset|db:(drop|wipe|reset|schema:load|seed:undo:all)|schema:drop|database:drop|--force-reset|--accept-data-loss|manage\.py\s+flush|rollback\s+--all|db:migrate:undo:all|alembic\s+downgrade\s+base|drizzle-kit\s+(drop|push\b[^|;&]*--force))\b/i, "borrado masivo de la base (migración destructiva)"],
  [/\b(rm|del|erase|unlink|Remove-Item|ri|mv|move)\b[^|;&]*\.(db|sqlite3?|mdb|accdb)(\s|["']|$)|(^|[\s;&|])(:|true|echo\s*\S*)?\s*>\s*[^\s|;&]*\.(db|sqlite3?)\b|\btruncate\s+-s\s*0\b[^|;&]*\.(db|sqlite3?)\b|\bfind\b[^|;&]*\.(db|sqlite3?)\b[^|;&]*(-delete|-exec\s+rm)/i, "borrado o vaciado del archivo de base de datos"],
  [/\bdocker(-compose|\s+compose)?\b[^|;&]*\bdown\b[^|;&]*(\s-v\b|\s--volumes\b)|\bdocker\s+volume\s+(rm|prune)\b|\bdocker\s+system\s+prune\b[^|;&]*--volumes/i, "borrado de volúmenes de Docker (ahí viven los datos de la BD)"],
  // CADENA DE SUMINISTRO: ejecutar un script bajado de internet sin leerlo (así entran los malware de hoy)
  [/\b(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z|da)?sh\b|\b(iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^|;&]*\|\s*(iex|Invoke-Expression)\b|\biex\s*\(\s*(iwr|irm|\(?New-Object)/i, "ejecutar un script descargado sin revisarlo"],
  [/\b(artisan\s+migrate|prisma\s+migrate|knex\s+migrate|sequelize(-cli)?\s+db:migrate|rails\s+db:migrate|manage\.py\s+migrate|typeorm\S*\s+migration:run)\b[^|;&]*(--env[= ]?prod\w*|\bproduction\b)/i, "migración en producción"],
]
/** Borrado masivo (Unix y Windows): raíz, home, el proyecto, una carpeta que lo contiene, "*" o "../*". Borrar carpetas concretas (node_modules, dist) se permite. */
export function borradoMasivo(cmd: string, cwd = process.cwd()): boolean {
  const H = _home()
  const peligroso = (t: string) => {
    const x = t.replace(/^["']|["']$/g, "").replace(/^\$\{?HOME\}?|^~|^%USERPROFILE%|^\$env:USERPROFILE/i, H).replace(/^\$\(pwd\)$|^\$PWD$|^\$\{PWD\}$|^`pwd`$/i, cwd)
    if (/^(\*|\*\.\*)$/.test(x)) return true // todo lo de aquí
    const sinComodin = x.replace(/[\\/]\*(\.\*)?$/, "") // "/*", "../*", "C:\*" → se evalúa la carpeta
    const r = resolve(cwd, sinComodin === "" && x !== "" ? "/" : sinComodin), rel = relative(r, cwd)
    if (sinComodin !== x && (r === resolve(cwd) || !rel || !rel.startsWith("..") || r === resolve("/"))) return true
    return r === resolve("/") || /^[A-Za-z]:\\?$/.test(r) || r === resolve(H) || !rel || (!rel.startsWith("..") && !isAbsolute(rel)) || resolve(H).startsWith(r + sep) // raíz, home, el proyecto o algo que lo contiene
  }
  for (const parte of cmd.split(/&&|\|\||;|\|/)) {
    const toks = parte.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? []
    const i = toks.findIndex((t) => /^(rm|rmdir|rd|del|erase|Remove-Item|ri)$/i.test(t)); if (i < 0) continue
    const resto = toks.slice(i + 1), banderas = resto.filter((t) => /^-/.test(t) || /^\/[a-z]$/i.test(t)).join(" ")
    const recursivo = /(^|\s)-\w*[rR]\w*\b|--recursive\b|-Recurse\b|(^|\s)\/s\b/i.test(banderas) || /^(rmdir|rd)$/i.test(toks[i])
    if (!recursivo && !/^(del|erase)$/i.test(toks[i])) continue
    const objetivos = resto.filter((t) => !(/^-/.test(t) || /^\/[a-z]$/i.test(t)))
    if (objetivos.some(peligroso)) return true
  }
  return /\bfind\s+(\.|\/|~|\$HOME)\s+((-maxdepth|-mindepth)\s+\d+\s+|-type\s+\w\s+)*(-delete|-exec\s+rm)\b/.test(cmd) // find sin filtro de nombre que borra todo
}
/** Archivo .sql que se ejecuta (mysql < x.sql · psql -f x.sql · sqlite3 db ".read x.sql"): se revisa su CONTENIDO. */
export function sqlEjecutado(cmd: string, cwd: string): string {
  if (!new RegExp(CLIENTE_BD, "i").test(cmd)) return ""
  const archivos = [...cmd.matchAll(/(?:<\s*|-f\s*|--file[= ]|\.read\s+|-i\s+|\bsource\s+|\bcat\s+|\\\.\s+)["']?([^\s"'|;&<>()$]+\.sql)\b/gi)].map((m) => m[1])
  let txt = ""
  for (const f of archivos.slice(0, 5)) { try { txt += readFileSync(isAbsolute(f) ? f : join(cwd, f), "utf8").slice(0, 5_000_000) + "\n" } catch {} }
  return txt
}

// Garantiza que .env y capturas nunca se suban a git (crea/completa .gitignore)
export function blindarGitignore(cwd: string): string | null {
  const gi = join(cwd, ".gitignore")
  const actual = existsSync(gi) ? readFileSync(gi, "utf8") : ""
  const faltan = [".env", ".env.*", "!.env.example", ".skill_dey/shots/", ".skill_dey/.ultimo-verificar.json", ".skill_dey/respaldos-bd/", ".skill_dey/respaldos-archivos/"].filter((l) => !actual.split(/\r?\n/).map((x) => x.trim()).includes(l))
  if (faltan.length) appendFileSync(gi, (actual && !actual.endsWith("\n") ? "\n" : "") + "# SKILL_DEY: nunca subir secretos ni temporales\n" + faltan.join("\n") + "\n")
  const r = spawnSync("git", ["ls-files", "--cached", "--", ".env", ".env.local", ".env.production", ".env.prod"], { cwd, encoding: "utf8", timeout: 10_000, maxBuffer: 10_000_000 })
  const trackeados = (r.stdout || "").trim()
  return trackeados ? trackeados.split(/\r?\n/).join(", ") : null
}

// Código truncado (los modelos gratis lo hacen y rompen archivos)
export const TRUNCADO = /(\/\/|#|\/\*|<!--|--)\s*\.{3}\s*(resto|rest|existing|c[oó]digo|code|same|sin cambios|unchanged|igual|anterior|previous|etc)|\.{3}\s*(resto del|rest of (the )?)(c[oó]digo|code|file|archivo)|(\/\/|#)\s*(aqu[ií] va|el resto|the rest|remaining code|c[oó]digo existente|existing code)\b/i
// Servidores que nunca terminan (congelan al agente) y pruebas en modo "watch"
export const SERVIDOR = /(^|&&|;|\|\|)\s*((npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|watch|preview)(?![:\w-])|php\s+(artisan\s+serve|-S\s)|(python3?|py)\s+manage\.py\s+runserver|nodemon\b|npx\s+(vite(?!\s+build)|next\s+dev|nodemon)|vite(\s+(dev|serve|preview)\b|\s*($|&&|;|\|))|next\s+dev|flask\s+run|uvicorn\b|rails\s+s(erver)?\b|dotnet\s+watch\b)/i
// Instalar dependencias
export const DEPENDENCIA = /\b(npm\s+(i|install|add)|yarn\s+add|pnpm\s+(add|i|install)|bun\s+add|composer\s+require|pip3?\s+install|poetry\s+add|go\s+get|cargo\s+add|gem\s+install|dotnet\s+add\s+package)\s+(?<pkgs>[^&|;]+)/i
export const SOLO_LECTURA = /^\s*(ls|dir|cat|type|head|tail|less|grep|rg|find|wc|tree|pwd|echo|which|where|whoami|printenv|node\s+(-v|--version|--check)|npm\s+(ls|view|outdated|audit(?!\s+fix))|pip\s+(show|list)|composer\s+(show|audit)|git\s+(status|log|diff|show|branch|rev-parse|ls-files|grep|remote|config\s+--get|blame|describe|tag\s*$))\b/i
export const esSoloLectura = (cmd: string) => !/[^2]>|>>|\btee\b|\s-i\b|\s-delete\b|\s-exec(dir)?\b|\s-ok\b|\$\(|`|\bxargs\b/.test(cmd) && !/\bgit\s+(branch|tag|remote)\b[^|;&]*\s(-d|-D|-m|-M|-f|--delete|--move|--force|add|remove|rm|rename|set-url)\b/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every((p) => !p.trim() || SOLO_LECTURA.test(p))
// Herramientas que EDITAN archivos (OpenCode usa apply_patch con modelos tipo GPT)
export const EDITA = new Set(["edit", "write", "patch", "multiedit", "apply_patch"])
export const parcheTexto = (a: any) => String(a?.patchText ?? a?.patch ?? "")
export function archivosDe(tool: string, a: any): string[] {
  const pt = parcheTexto(a)
  if (tool === "apply_patch" || pt.includes("*** ")) return [...new Set([...pt.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$|^\*\*\* Move to:\s*(.+?)\s*$/gm)].map((m) => (m[1] ?? m[2]).trim()).filter(Boolean))]
  const f = a?.filePath ?? a?.path ?? a?.file_path ?? ""
  return f ? [String(f)] : []
}
export function textoNuevo(a: any): string {
  const t: string[] = [a?.content, a?.newString, a?.new_string, ...(Array.isArray(a?.edits) ? a.edits.map((e: any) => e?.newString ?? e?.new_string) : [])].filter(Boolean)
  const pt = parcheTexto(a)
  if (pt) t.push(pt.split(/\r?\n/).filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1)).join("\n"))
  return t.join("\n")
}
export const fueraDelProyecto = (cwd: string, archivo: string) => { const rel = relative(resolve(cwd), resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))); return rel.startsWith("..") || isAbsolute(rel) }
export const CODIGO = /\.(m?[jt]sx?|cjs|php|py|java|cs|go|rb|vue|svelte|dart|kt|swift|rs)$/i
/** Nombres (funciones, clases, métodos, constantes) cuya definición cambió y en qué OTROS archivos se usan. Corto y solo si hay algo. */
export function impactoDe(cwd: string, abs: string, viejo: string, nuevo: string): string {
  const cuenta = (t: string) => { const m = new Map<string, number>(); for (const l of t.split(/\r?\n/)) m.set(l, (m.get(l) ?? 0) + 1); return m }
  const a = cuenta(viejo), b = cuenta(nuevo), cambiadas: string[] = []
  for (const [l, n] of a) if ((b.get(l) ?? 0) < n) cambiadas.push(l)
  for (const [l, n] of b) if ((a.get(l) ?? 0) < n) cambiadas.push(l)
  const DEF = /(?:function|def|class|interface|type|enum|func|fn|const|let|var)\s+([A-Za-z_$][\w$]+)|^\s*(?:export\s+)?(?:public|private|protected|static|async|\s)*\s*([A-Za-z_$][\w$]{2,})\s*\([^)]*\)\s*[:{]/
  const nombres = [...new Set(cambiadas.map((l) => l.match(DEF)).filter(Boolean).map((m) => (m![1] ?? m![2])!).filter((n) => !/^(if|for|while|switch|catch|function|return|constructor|render|main|index|data|item|value|result)$/.test(n)))].slice(0, 4)
  if (!nombres.length) return ""
  const rel = relative(cwd, abs).replace(/\\/g, "/"), L: string[] = []
  for (const n of nombres) {
    const r = spawnSync("git", ["-c", "core.quotepath=off", "grep", "--untracked", "-l", "-w", "-I", "-F", "-e", n, "--", ".", ":!node_modules", ":!vendor", ":!dist", ":!build", ":!.skill_dey", ":!*.min.*", ":!*.lock", ":!docs"], { cwd, encoding: "utf8", timeout: 5_000 })
    const usos = (r.stdout ?? "").split("\n").map((x) => x.trim()).filter((x) => x && x !== rel).slice(0, 6)
    if (usos.length) L.push(`\`${n}\` → ${usos.join(", ")}`)
  }
  return L.length ? `⚠ SKILL_DEY impacto: cambiaste algo que OTROS archivos usan:\n${L.join("\n")}\n→ Revisa que esos usos sigan siendo compatibles (nombre, parámetros, lo que devuelve). Si no, ajústalos o revierte.` : ""
}
// La terminal puede llamarse distinto según el sistema/versión de OpenCode (bash, shell, powershell…): se vigila igual.
export const esTerminal = (t: string, a: any) => t === "bash" || (typeof a?.command === "string" && /^(shell|powershell|pwsh|terminal|cmd|exec|run_command|execute_command|run_terminal_cmd|bash_tool)$/i.test(String(t)))
export const relNorm = (cwd: string, archivo: string) => { const r = relative(resolve(cwd), resolve(isAbsolute(archivo) ? archivo : join(cwd, archivo))).replace(/\\/g, "/"); return process.platform === "win32" ? r.toLowerCase() : r }
/** .env reales (credenciales). Se permiten .env.example / .sample / .template / .dist */
export const ENV_REAL = /(^|[\\/])\.env(\.(?!example$|sample$|template$|dist$)[\w.-]+)?$/i
export const LEE_ENV = /(^|[\s;&|(])(cat|type|more|less|head|tail|bat|nl|strings|Get-Content|gc|findstr|Select-String|sls|grep|rg|awk|sed|source|xxd|od)\b[^|;&]*?(^|[\s"'=\/\\])\.env(\.(?!example\b|sample\b|template\b|dist\b)[\w.-]+)?(?=["'\s;|&)]|$)/i

export const MIGRACION = /(artisan\s+migrate(?!:status)|prisma\s+(migrate\s+(dev|deploy|reset)|db\s+push)|knex\s+migrate:(latest|up|down|rollback)|sequelize(-cli)?\s+db:migrate|alembic\s+(upgrade|downgrade)|manage\.py\s+migrate|typeorm.*migration:(run|revert)|flyway\s+migrate|rails\s+db:(migrate|rollback)|goose\s+(up|down)|doctrine:migrations:migrate)/i
export const BD_SQL = /\bdrop\s+(database|schema|table|collection)\b|\btruncate\s+table\s+[\w."`\[\]]+|\btruncate\s+[\w."`\[\]]+\s*;|\bdelete\s+from\s+[\w."`\[\]${}]+\s*(;|$)/i
export const BD_EN_CODIGO = /\b(query|execute|exec|raw|prepare|sql|statement|unsafe|run)\w*\s*\(\s*["'`]\s*(delete\s+from\s+[\w."`\[\]${}]+\s*["'`;]|truncate\s|drop\s+(table|database|schema)\b)|\.(deleteMany|remove)\s*\(\s*(\{\s*\})?\s*\)|\bknex\s*\([^)]*\)\s*\.(del|delete|truncate)\s*\(\s*\)|\.objects\.all\(\)\.delete\(\)|(->|::)truncate\s*\(\s*\)|\.sync\s*\(\s*\{[^}]*\bforce\s*:\s*true|\.dropDatabase\s*\(|\bcollection\s*\([^)]*\)\s*\.drop\s*\(\s*\)|\bdb\.\w+\.drop\s*\(\s*\)|\b(flushall|flushdb)\s*\(/i
/** Texto que elimina o vacía datos (SQL o ORM). Ignora comentarios y documentación. */
export function bdDestructivo(texto: string, esSql: boolean): string | null {
  for (const l of texto.split(/\r?\n/)) {
    const t = l.trim(); if (!t || /^(\/\/|#|--|\*|\/\*|<!--|rem\s)/i.test(t)) continue
    const m = (esSql ? t.match(BD_SQL) : null) ?? t.match(BD_EN_CODIGO) ?? (/["'`][^"'`]*\bdrop\s+(database|schema|table)\b/i.test(t) ? t.match(/\bdrop\s+(database|schema|table)\b/i) : null)
    if (m) return m[0]
  }
  return null
}
export const SQL_MODIFICA = /(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?)\b[\s\S]*\b(delete\s+from|update\s+[\w."`\[\]]+\s+set|alter\s+table|drop\s+(table|column|index)|insert\s+into|deleteMany|updateMany)\b/i
export function respaldoBdReciente(cwd: string, horas = 3): boolean {
  const d = join(cwd, ".skill_dey", "respaldos-bd")
  if (!existsSync(d)) return false
  try { return readdirSync(d).some((f) => { try { return Date.now() - statSync(join(d, f)).mtimeMs < horas * 3_600_000 } catch { return false } }) } catch { return false }
}

export function sintaxis(cwd: string, file: string): string {
  const f = isAbsolute(file) ? file : join(cwd, file)
  if (!existsSync(f)) return ""
  const e = extname(f).toLowerCase()
  if ([".js", ".mjs", ".cjs"].includes(e)) return errorJs(cwd, f)
  const cmd = e === ".php" ? `php -l "${f}"` : e === ".py" ? `${process.platform === "win32" ? "python" : "python3"} -m py_compile "${f}"` : [".js", ".mjs", ".cjs"].includes(e) ? `node --check "${f}"` : ""
  if (e === ".json") { try { JSON.parse(readFileSync(f, "utf8")); return "" } catch (x: any) { return `JSON inválido: ${x.message}` } }
  if (!cmd) return ""
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 8_000 }) // corto: corre en cada edición
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`
  if (r.status === 0 || /not recognized|not found|no se reconoce/i.test(out)) return ""
  return out.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join("\n")
}
