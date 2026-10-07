// SKILL_DEY — acceso a la base de datos del proyecto (por código, 0 tokens) para: leer su estructura, verificar reglas
// de negocio con consultas de SOLO LECTURA y crear una COPIA DE PRUEBA donde ensayar migraciones sin tocar la real.
// La conexión sale del .env; la contraseña viaja por variable de entorno y nunca se escribe ni se muestra.
import { spawnSync } from "node:child_process"
import { readFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs"
import { join, isAbsolute } from "node:path"

export type Conexion = { motor: "mysql" | "pg" | "sqlite"; host: string; port: string; db: string; user: string; pass: string }
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

/** Conexión a la BD según el .env del proyecto (Laravel, Node, PHP, DATABASE_URL…). null si no hay. */
export function conexion(cwd: string): Conexion | null {
  const env = leer(join(cwd, ".env")); if (!env) return null
  const v = (...ks: string[]) => { for (const k of ks) { const m = env.match(new RegExp(`^\\s*${k}\\s*=\\s*["']?([^"'\\r\\n#]*)`, "m")); if (m && m[1].trim()) return m[1].trim() } return "" }
  let tipo = v("DB_CONNECTION", "DB_DRIVER", "DB_TYPE", "DB_ENGINE").toLowerCase()
  let host = v("DB_HOST", "DB_SERVER", "MYSQL_HOST", "PGHOST") || "127.0.0.1", port = v("DB_PORT", "MYSQL_PORT", "PGPORT")
  let db = v("DB_DATABASE", "DB_NAME", "MYSQL_DATABASE", "PGDATABASE"), user = v("DB_USERNAME", "DB_USER", "MYSQL_USER", "PGUSER"), pass = v("DB_PASSWORD", "DB_PASS", "MYSQL_PASSWORD", "PGPASSWORD")
  const url = v("DATABASE_URL").match(/^(\w+):\/\/(?:([^:@/]+)(?::([^@/]*))?@)?([^:/?]+)?(?::(\d+))?\/([^?]+)/)
  if (url) { tipo = tipo || url[1]; user = user || decodeURIComponent(url[2] ?? ""); pass = pass || decodeURIComponent(url[3] ?? ""); host = url[4] ?? host; port = port || (url[5] ?? ""); db = db || url[6] }
  if (!db) return null
  const motor = /sqlite/.test(tipo) || /\.(sqlite3?|db)$/i.test(db) ? "sqlite" : /pg|postgres/.test(tipo) ? "pg" : "mysql"
  return { motor, host, port, db: motor === "sqlite" && !isAbsolute(db) ? join(cwd, db) : db, user, pass }
}

function correr(c: Conexion, cmd: "dump" | "consulta", sql = "", otraBd?: string): { ok: boolean; out: string } {
  const db = otraBd ?? c.db
  const r = c.motor === "sqlite"
    ? spawnSync("sqlite3", cmd === "dump" ? [db, ".schema"] : ["-noheader", db, sql], { encoding: "utf8", timeout: 25_000 })
    : c.motor === "pg"
      ? spawnSync(cmd === "dump" ? "pg_dump" : "psql", cmd === "dump" ? ["--schema-only", "--no-owner", "--no-privileges", "-h", c.host, ...(c.port ? ["-p", c.port] : []), ...(c.user ? ["-U", c.user] : []), db] : ["-tA", "-h", c.host, ...(c.port ? ["-p", c.port] : []), ...(c.user ? ["-U", c.user] : []), "-d", db, "-c", sql], { encoding: "utf8", timeout: 25_000, env: { ...process.env, PGPASSWORD: c.pass } })
      : spawnSync(cmd === "dump" ? "mysqldump" : "mysql", cmd === "dump" ? ["--no-data", "--skip-comments", "--skip-add-drop-table", "--skip-lock-tables", "-h", c.host, ...(c.port ? ["-P", c.port] : []), ...(c.user ? ["-u", c.user] : []), db] : ["-N", "-B", "-h", c.host, ...(c.port ? ["-P", c.port] : []), ...(c.user ? ["-u", c.user] : []), db, "-e", sql], { encoding: "utf8", timeout: 25_000, env: { ...process.env, MYSQL_PWD: c.pass } })
  return { ok: r.status === 0, out: `${r.stdout ?? ""}`.trim() || `${r.stderr ?? r.error?.message ?? ""}`.trim() }
}

/** Estructura (CREATE TABLE…) de la BD real, sin datos. "" si no se pudo. */
export function volcarEsquema(cwd: string): { sql: string; motor: string } {
  const c = conexion(cwd); if (!c) return { sql: "", motor: "" }
  const r = correr(c, "dump"); return { sql: r.ok ? r.out : "", motor: { mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor] }
}

/** Solo SELECT, una sentencia, sin escritura ni archivos: así una regla nunca puede modificar datos. */
export const consultaSegura = (sql: string) => /^\s*select\b/i.test(sql) && !/;\s*\S/.test(sql) && !/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|into\s+outfile|load_file|pg_sleep|sleep\s*\(|copy\s)\b/i.test(sql)

/** Ejecuta una consulta de solo lectura que devuelve un número (ej. cuántos registros violan una regla). */
export function contar(cwd: string, sql: string): { ok: boolean; n?: number; error?: string } {
  if (!consultaSegura(sql)) return { ok: false, error: "consulta no permitida (solo SELECT de lectura)" }
  const c = conexion(cwd); if (!c) return { ok: false, error: "sin conexión a BD en .env" }
  const r = correr(c, "consulta", sql.replace(/;\s*$/, ""))
  if (!r.ok) return { ok: false, error: r.out.split("\n")[0].replace(c.pass || "\u0000", "***").slice(0, 120) }
  const n = Number(r.out.split(/\s+/)[0]); return Number.isFinite(n) ? { ok: true, n } : { ok: false, error: "la consulta no devolvió un número" }
}

/**
 * COPIA DE PRUEBA de la BD (misma estructura, sin tocar la real) para ensayar migraciones.
 * Devuelve el prefijo de variables para correr la migración contra la copia.
 */
export function copiaPrueba(cwd: string): string {
  const c = conexion(cwd); if (!c) return "No hay conexión a BD en .env: no se puede crear la copia de prueba."
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  if (c.motor === "sqlite") {
    if (!existsSync(c.db)) return `No existe el archivo de BD ${c.db}.`
    const copia = join(cwd, ".skill_dey", "bd-prueba.sqlite"); copyFileSync(c.db, copia)
    return `✅ Copia de prueba lista (con datos, SQLite): ${copia}\nMigra contra la copia anteponiendo: DB_DATABASE="${copia}" SKILL_DEY_BD_PRUEBA=1 <comando de migración>\nSi sale bien (up → down → up), haz el respaldo y migra la real.`
  }
  const prueba = `${c.db}_skilldey_prueba`, d = correr(c, "dump")
  if (!d.ok) return `No pude leer la estructura de la BD (${d.out.split("\n")[0].slice(0, 100)}).`
  const crear = c.motor === "pg"
    ? spawnSync("psql", ["-h", c.host, ...(c.port ? ["-p", c.port] : []), ...(c.user ? ["-U", c.user] : []), "-d", "postgres", "-c", `DROP DATABASE IF EXISTS "${prueba}"; CREATE DATABASE "${prueba}";`], { encoding: "utf8", timeout: 25_000, env: { ...process.env, PGPASSWORD: c.pass } })
    : spawnSync("mysql", ["-h", c.host, ...(c.port ? ["-P", c.port] : []), ...(c.user ? ["-u", c.user] : []), "-e", `DROP DATABASE IF EXISTS \`${prueba}\`; CREATE DATABASE \`${prueba}\`;`], { encoding: "utf8", timeout: 25_000, env: { ...process.env, MYSQL_PWD: c.pass } })
  if (crear.status !== 0) return `No pude crear la BD de prueba (¿el usuario tiene permiso CREATE?): ${(crear.stderr ?? "").split("\n")[0].slice(0, 100)}`
  const cargar = c.motor === "pg"
    ? spawnSync("psql", ["-h", c.host, ...(c.port ? ["-p", c.port] : []), ...(c.user ? ["-U", c.user] : []), "-d", prueba], { input: d.out, encoding: "utf8", timeout: 60_000, env: { ...process.env, PGPASSWORD: c.pass } })
    : spawnSync("mysql", ["-h", c.host, ...(c.port ? ["-P", c.port] : []), ...(c.user ? ["-u", c.user] : []), prueba], { input: d.out, encoding: "utf8", timeout: 60_000, env: { ...process.env, MYSQL_PWD: c.pass } })
  if (cargar.status !== 0) return `No pude cargar la estructura en la copia: ${(cargar.stderr ?? "").split("\n")[0].slice(0, 100)}`
  return `✅ Copia de prueba lista (misma estructura, sin datos): ${prueba}\nMigra contra la copia anteponiendo: DB_DATABASE=${prueba} SKILL_DEY_BD_PRUEBA=1 <comando de migración>\nSi sale bien (up → down → up), haz el respaldo y migra la real.`
}
