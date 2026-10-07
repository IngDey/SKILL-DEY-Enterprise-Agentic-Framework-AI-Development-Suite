// SKILL_DEY — documentación y script de BD generados POR CÓDIGO (0 tokens del modelo).
// Produce/actualiza: docs/DICCIONARIO-DATOS.md · database/instalacion.sql · docs/MANUAL-TECNICO.md (secciones AUTO) · docs/MANUAL-USUARIO.md (esqueleto por pantalla).
// Las partes escritas a mano o por el agente (fuera de los marcadores AUTO) nunca se borran.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, extname, basename } from "node:path"
import { manualUsuario } from "./manual.ts"
import { volcarEsquema, conexion } from "./bd.ts"

type Col = { nombre: string; tipo: string; nulo: boolean; defecto?: string; clave?: string; comentario?: string }
type Tabla = { nombre: string; columnas: Col[]; origen: string; comentario?: string }

const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__)([\\/]|$)/
function archivos(cwd: string): string[] {
  const g = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8", maxBuffer: 100_000_000 })
  if (g.status === 0) return g.stdout.split(/\r?\n/).filter((f) => f && !IGN.test(f))
  const out: string[] = []; const walk = (d: string) => { for (const e of readdirSync(d)) { const p = join(d, e); if (IGN.test(p)) continue; statSync(p).isDirectory() ? walk(p) : out.push(relative(cwd, p)) } }; walk(cwd); return out
}
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

// ---------- esquema de BD: SQL, Prisma, Laravel ----------
function desdeSQL(txt: string, origen: string): Tabla[] {
  const t: Tabla[] = []
  for (const m of txt.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?[`"[]?(\w+)[`"\]]?\s*\(([\s\S]*?)\)\s*(?:engine|comment|;|with|\n\s*\n)/gi)) {
    const cols: Col[] = []
    for (let l of m[2].split(/,\s*\n|,(?![^(]*\))/)) {
      l = l.trim(); if (!l) continue
      const pk = l.match(/^primary\s+key\s*\(([^)]+)\)/i); if (pk) { pk[1].split(",").forEach((c) => { const x = cols.find((k) => k.nombre === c.replace(/[`"\s]/g, "")); if (x) x.clave = "PK" }); continue }
      const fk = l.match(/foreign\s+key\s*\(([^)]+)\)\s*references\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)/i); if (fk) { const x = cols.find((k) => k.nombre === fk[1].replace(/[`"\s]/g, "")); if (x) x.clave = `FK → ${fk[2]}.${fk[3].replace(/[`"\s]/g, "")}`; continue }
      if (/^(unique|key|index|constraint|check)\b/i.test(l)) continue
      const c = l.match(/^[`"[]?(\w+)[`"\]]?\s+([\w]+(?:\s*\([^)]*\))?(?:\s+unsigned)?)(.*)$/i); if (!c) continue
      const resto = c[3]
      cols.push({ nombre: c[1], tipo: c[2].toUpperCase(), nulo: !/not\s+null|primary\s+key/i.test(resto), defecto: resto.match(/default\s+('[^']*'|[\w.()]+)/i)?.[1],
        clave: /primary\s+key/i.test(resto) ? "PK" : resto.match(/references\s+[`"]?(\w+)[`"]?\s*\(\s*[`"]?(\w+)/i) ? `FK → ${RegExp.$1}.${RegExp.$2}` : /unique/i.test(resto) ? "UNIQUE" : undefined,
        comentario: resto.match(/comment\s+'([^']*)'/i)?.[1] })
    }
    t.push({ nombre: m[1], columnas: cols, origen })
  }
  return t
}
function desdePrisma(txt: string, origen: string): Tabla[] {
  return [...txt.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map((m) => ({ nombre: m[1], origen, columnas: m[2].split("\n").map((l) => l.trim()).filter((l) => /^\w+\s+\w/.test(l) && !l.startsWith("@@"))
    .map((l) => { const [n, t, ...r] = l.split(/\s+/); const resto = r.join(" "); return { nombre: n, tipo: t.replace("?", ""), nulo: t.endsWith("?"), defecto: resto.match(/@default\(([^)]*\)?)\)/)?.[1], clave: /@id/.test(resto) ? "PK" : /@relation/.test(resto) ? "relación" : /@unique/.test(resto) ? "UNIQUE" : undefined, comentario: l.match(/\/\/\/?\s*(.*)$/)?.[1] } }).filter((c) => /^[A-Z]|^(String|Int|Float|Boolean|DateTime|Decimal|Json|BigInt|Bytes)/.test(c.tipo)) }))
}
const TIPO_LARAVEL: Record<string, string> = { string: "VARCHAR(255)", text: "TEXT", longtext: "LONGTEXT", integer: "INT", biginteger: "BIGINT", unsignedbiginteger: "BIGINT", foreignid: "BIGINT", smallinteger: "SMALLINT", tinyinteger: "TINYINT", boolean: "BOOLEAN", date: "DATE", datetime: "DATETIME", timestamp: "TIMESTAMP", time: "TIME", float: "FLOAT", double: "DOUBLE", decimal: "DECIMAL(12,2)", json: "JSON", uuid: "CHAR(36)", enum: "VARCHAR(50)", char: "CHAR(1)" }
function desdeLaravel(txt: string, origen: string): Tabla[] {
  return [...txt.matchAll(/Schema::create\(\s*['"](\w+)['"][\s\S]*?\{([\s\S]*?)\n\s*\}\);/g)].map((m) => {
    const cols: Col[] = []
    for (const c of m[2].matchAll(/\$table->(\w+)\(\s*(?:['"](\w+)['"])?\s*(?:,\s*([^)]*))?\)([^;]*);/g)) {
      const [linea, tipo, nombre, args, cadena] = c; const t = tipo.toLowerCase()
      if (t === "id" || t === "increments" || t === "bigincrements") { cols.push({ nombre: nombre ?? "id", tipo: "BIGINT", nulo: false, clave: "PK" }); continue }
      if (t === "timestamps") { cols.push({ nombre: "created_at", tipo: "TIMESTAMP", nulo: true }, { nombre: "updated_at", tipo: "TIMESTAMP", nulo: true }); continue }
      if (t === "softdeletes") { cols.push({ nombre: "deleted_at", tipo: "TIMESTAMP", nulo: true }); continue }
      if (!nombre) continue
      let sql = TIPO_LARAVEL[t] ?? t.toUpperCase()
      if (args && /^(string|char)$/.test(t)) sql = `${t === "char" ? "CHAR" : "VARCHAR"}(${args.split(",")[0].trim()})`
      if (args && /^(decimal|double|float)$/.test(t)) sql = `DECIMAL(${args.replace(/\s/g, "")})`
      const fk = /foreignId|constrained/.test(linea) ? `FK → ${(cadena.match(/constrained\(\s*['"](\w+)/)?.[1]) ?? nombre.replace(/_id$/, "") + "s"}.id` : /->unique\(/.test(cadena) ? "UNIQUE" : undefined
      cols.push({ nombre, tipo: sql, nulo: /->nullable\(/.test(cadena), defecto: cadena.match(/->default\(([^)]*)\)/)?.[1], clave: fk, comentario: cadena.match(/->comment\(['"]([^'"]*)/)?.[1] })
    }
    return { nombre: m[1], origen, columnas: cols }
  })
}
/**
 * Esquema desde la BASE DE DATOS REAL cuando el proyecto no trae .sql/migraciones (ej. apps PHP sobre una BD existente).
 * Lee la conexión del .env (nunca la muestra), usa mysqldump / pg_dump / sqlite3 SOLO en modo estructura (--no-data).
 */
function desdeBdViva(cwd: string): { tablas: Tabla[]; motor: string } | null {
  const { sql, motor } = volcarEsquema(cwd)
  const db = (conexion(cwd)?.db ?? "").split(/[\\/]/).pop()
  const tablas = sql ? desdeSQL(sql, `BD en vivo: ${db}`) : []
  return tablas.length ? { tablas, motor } : null
}

export function esquema(cwd: string): { tablas: Tabla[]; sqlArchivos: string[]; motor: string } {
  const fs = archivos(cwd)
  const sqlArchivos = fs.filter((f) => f.endsWith(".sql") && !f.endsWith("database/instalacion.sql")).sort()
  let tablas: Tabla[] = []
  for (const f of sqlArchivos) tablas.push(...desdeSQL(leer(join(cwd, f)), f))
  for (const f of fs.filter((f) => f.endsWith("schema.prisma"))) tablas.push(...desdePrisma(leer(join(cwd, f)), f))
  for (const f of fs.filter((f) => /migrations?[\\/].*\.php$/.test(f)).sort()) tablas.push(...desdeLaravel(leer(join(cwd, f)), f))
  let motorVivo = ""
  if (!tablas.length) { const v = desdeBdViva(cwd); if (v) { tablas = v.tablas; motorVivo = v.motor } } // sin esquema en archivos → leerlo de la BD real
  const vistas = new Map<string, Tabla>(); for (const t of tablas) vistas.set(t.nombre.toLowerCase(), t) // la última definición gana
  const env = leer(join(cwd, ".env.example")) + leer(join(cwd, "prisma", "schema.prisma"))
  const motor = motorVivo || (/postgres/i.test(env) ? "PostgreSQL" : /mysql|mariadb/i.test(env) ? "MySQL/MariaDB" : /sqlite/i.test(env) ? "SQLite" : /sqlserver|mssql/i.test(env) ? "SQL Server" : "SQL estándar")
  return { tablas: [...vistas.values()], sqlArchivos, motor }
}

// ---------- utilidades de marcadores AUTO ----------
function conAuto(ruta: string, titulo: string, secciones: Record<string, string>, manualInicial = "") {
  let doc = existsSync(ruta) ? readFileSync(ruta, "utf8") : `# ${titulo}\n\n${manualInicial}`
  for (const [id, cuerpo] of Object.entries(secciones)) {
    const bloque = `<!-- AUTO:${id} (generado por skill_dey; no editar dentro) -->\n${cuerpo.trim()}\n<!-- /AUTO:${id} -->`
    const re = new RegExp(`<!-- AUTO:${id} [\\s\\S]*?<!-- /AUTO:${id} -->`)
    doc = re.test(doc) ? doc.replace(re, bloque) : doc.trimEnd() + "\n\n" + bloque + "\n"
  }
  mkdirSync(join(ruta, ".."), { recursive: true }); writeFileSync(ruta, doc)
}

// ---------- generación ----------
export function documentar(cwd: string): string {
  const fs = archivos(cwd), hecho: string[] = []
  const pkg = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))) } catch { return null } })()
  const comp = (() => { try { return JSON.parse(leer(join(cwd, "composer.json"))) } catch { return null } })()
  const nombreApp = pkg?.name ?? comp?.name ?? basename(cwd)
  const fecha = new Date().toISOString().slice(0, 10)

  // 1) Diccionario de datos + script portable de BD
  const { tablas, sqlArchivos, motor } = esquema(cwd)
  if (tablas.length) {
    const dic = tablas.map((t) => [`### ${t.nombre}`, `Origen: \`${t.origen}\``, "", "| Campo | Tipo | Nulo | Por defecto | Clave | Descripción |", "|---|---|---|---|---|---|",
      ...t.columnas.map((c) => `| ${c.nombre} | ${c.tipo} | ${c.nulo ? "Sí" : "No"} | ${c.defecto ?? ""} | ${c.clave ?? ""} | ${c.comentario ?? ""} |`), ""].join("\n")).join("\n")
    conAuto(join(cwd, "docs", "DICCIONARIO-DATOS.md"), `Diccionario de datos — ${nombreApp}`, { resumen: `Motor: ${motor} · Tablas: ${tablas.length} · Actualizado: ${fecha}`, tablas: dic },
      "Descripción funcional de las tablas (escríbela aquí; lo de abajo se actualiza solo):\n")
    hecho.push(`docs/DICCIONARIO-DATOS.md (${tablas.length} tablas)`)
    let script = ""
    const prisma = fs.find((f) => f.endsWith("schema.prisma"))
    if (prisma && existsSync(join(cwd, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma"))) {
      const r = spawnSync("npx", ["--no-install", "prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", prisma, "--script"], { cwd, encoding: "utf8", shell: process.platform === "win32", timeout: 120_000 })
      if (r.status === 0) script = r.stdout
    }
    const ddl = (ts: Tabla[]) => ts.map((t) => `CREATE TABLE IF NOT EXISTS ${t.nombre} (\n${t.columnas.map((c) => `  ${c.nombre} ${c.tipo}${c.nulo ? "" : " NOT NULL"}${c.defecto ? " DEFAULT " + c.defecto : ""}${c.clave === "PK" ? " PRIMARY KEY" : c.clave === "UNIQUE" ? " UNIQUE" : ""}`).concat(t.columnas.filter((c) => c.clave?.startsWith("FK → ")).map((c) => `  FOREIGN KEY (${c.nombre}) REFERENCES ${c.clave!.slice(5).replace(".", "(")})`)).join(",\n")}\n);`).join("\n\n")
    if (!script) {
      const deSQL = sqlArchivos.map((f) => `-- ===== ${f} =====\n${leer(join(cwd, f)).trim()}\n`).join("\n")
      const otras = tablas.filter((t) => !t.origen.endsWith(".sql"))
      script = [deSQL, otras.length ? `-- ===== Tablas definidas en migraciones/modelos (convertidas a SQL) =====\n${ddl(otras)}` : ""].filter(Boolean).join("\n")
    }
    if (!script) script = tablas.map((t) => `CREATE TABLE IF NOT EXISTS ${t.nombre} (\n${t.columnas.filter((c) => !c.nombre.includes("/")).map((c) => `  ${c.nombre} ${c.tipo.replace(/^STRING$/, "VARCHAR(255)").replace(/^INTEGER$/, "INTEGER")}${c.nulo ? "" : " NOT NULL"}${c.defecto ? " DEFAULT " + c.defecto : ""}${c.clave === "PK" ? " PRIMARY KEY" : ""}`).join(",\n")}\n);`).join("\n\n")
    mkdirSync(join(cwd, "database"), { recursive: true })
    writeFileSync(join(cwd, "database", "instalacion.sql"), `-- Script de instalación de la base de datos — ${nombreApp}\n-- Motor: ${motor} · Generado por skill_dey el ${fecha} a partir de: ${[...new Set(tablas.map((t) => t.origen))].join(", ")}\n-- Uso: crear la BD vacía y ejecutar este archivo. Revisar tipos si se cambia de motor.\n\n${script.trim()}\n`)
    hecho.push("database/instalacion.sql")
  }

  // 2) Manual técnico (secciones AUTO)
  const ex = leer(join(cwd, ".env.example")).split(/\r?\n/).filter((l) => /^\s*[A-Z_][A-Z0-9_]*\s*=/.test(l))
    .map((l) => { const [k, ...r] = l.split("="); const coment = r.join("=").split("#").slice(1).join("#").trim(); return `| ${k.trim()} | ${coment} |` })
  const scripts = [...Object.entries(pkg?.scripts ?? {}).map(([k, v]) => `| npm run ${k} | ${v} |`), ...Object.entries(comp?.scripts ?? {}).map(([k, v]) => `| composer ${k} | ${Array.isArray(v) ? v.join(" && ") : v} |`)]
  const stack = [pkg && "Node.js", comp && "PHP (Composer)", fs.some((f) => f.endsWith(".php")) && !comp && "PHP", fs.some((f) => f.endsWith(".py")) && "Python", fs.some((f) => /\.(tsx?|jsx)$/.test(f)) && "TypeScript/JSX", pkg?.dependencies?.react && "React", pkg?.dependencies?.vue && "Vue", pkg?.dependencies?.express && "Express", comp?.require?.["laravel/framework"] && "Laravel"].filter(Boolean).join(" · ")
  const rutas: string[] = []
  for (const f of fs.filter((f) => /\.(m?[jt]s|php|py)$/.test(f)).slice(0, 800)) {
    const t = leer(join(cwd, f))
    for (const m of t.matchAll(/(?:app|router|Route)(?:\.|::)(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi)) rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`)
    for (const m of t.matchAll(/@(?:app|bp|router)\.(get|post|put|delete|route)\(\s*['"]([^'"]+)['"]/g)) rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`)
  }
  const paginas = fs.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src[\\/]|app[\\/]|clases?|models?|controllers?|migrations?|tests?/i.test(f))
  const carpetas = [...new Set(fs.map((f) => f.split(/[\\/]/)[0]).filter((d) => !d.includes(".")))].slice(0, 25)
  const deps = Object.keys({ ...(pkg?.dependencies ?? {}), ...(comp?.require ?? {}) }).slice(0, 40)
  conAuto(join(cwd, "docs", "MANUAL-TECNICO.md"), `Manual técnico — ${nombreApp}`, {
    general: `Stack detectado: ${stack || "—"} · Base de datos: ${tablas.length ? motor + ` (${tablas.length} tablas, ver DICCIONARIO-DATOS.md)` : "—"} · Actualizado: ${fecha}`,
    instalacion: ["1. Clonar/copiar el proyecto.", pkg ? "2. `npm install`" : comp ? "2. `composer install`" : "2. Instalar dependencias del stack.", "3. Copiar `.env.example` a `.env` y completar los valores.", tablas.length ? "4. Crear la base de datos y ejecutar `database/instalacion.sql` (o las migraciones)." : "", "5. Iniciar con el comando de la tabla Comandos."].filter(Boolean).join("\n"),
    variables: ex.length ? ["| Variable | Descripción |", "|---|---|", ...ex].join("\n") : "Sin `.env.example`.",
    comandos: scripts.length ? ["| Comando | Ejecuta |", "|---|---|", ...scripts].join("\n") : "—",
    estructura: carpetas.map((d) => `- \`${d}/\` (${fs.filter((f) => f.startsWith(d + "/") || f.startsWith(d + "\\")).length} archivos)`).join("\n") || "—",
    rutas: rutas.length ? ["| Método | Ruta | Archivo |", "|---|---|---|", ...[...new Set(rutas)].slice(0, 150)].join("\n") : paginas.length ? ["| Página | Archivo |", "|---|---|", ...paginas.slice(0, 150).map((p) => `| /${p.replace(/\\/g, "/")} | ${p} |`)].join("\n") : "—",
    dependencias: deps.length ? deps.map((d) => `\`${d}\``).join(" · ") : "—",
  }, "## Arquitectura y decisiones\n(El agente completa esta parte en cambios N2/N3; lo marcado AUTO se regenera solo.)\n")
  hecho.push("docs/MANUAL-TECNICO.md")

  // 3) Manual de usuario: esqueleto por pantalla (el agente redacta solo la pantalla que cambió)
  const vistas = [...paginas, ...fs.filter((f) => /(pages|views|screens)[\\/].*\.(vue|svelte|[jt]sx|html|blade\.php)$/.test(f))].slice(0, 80)
  const mu = join(cwd, "docs", "MANUAL-USUARIO.md")
  let doc = existsSync(mu) ? readFileSync(mu, "utf8") : `# Manual de usuario — ${nombreApp}\n\nCómo usar la aplicación, pantalla por pantalla.\n`
  const r = manualUsuario(cwd, vistas, doc) // ficha completa por pantalla, deducida del código
  mkdirSync(join(cwd, "docs"), { recursive: true }); writeFileSync(mu, r.doc)
  hecho.push(`docs/MANUAL-USUARIO.md (${r.fichas} pantallas documentadas)`)
  return `Documentación actualizada: ${hecho.join(" · ")}`
}
