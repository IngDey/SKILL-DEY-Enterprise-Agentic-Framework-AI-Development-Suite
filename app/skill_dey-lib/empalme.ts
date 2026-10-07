// SKILL_DEY — paquete de EMPALME (entrega de la app a otra persona) y compresión de la memoria. Todo por código, 0 tokens.
// docs/EMPALME.md: qué es, cómo instalarla y correrla, variables (sin valores), BD, pantallas, pendientes, riesgos y cambios recientes.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import { documentar } from "./documentar.ts"
import { analizar } from "./adopcion.ts"
import { servicios } from "./procesos.ts"
import { reglas, vacunas } from "./reglas.ts"
import { conexion } from "./bd.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const nombres = (env: string) => env.split(/\r?\n/).map((l) => l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean) as string[]

/** Genera docs/EMPALME.md (y actualiza la documentación). Nunca escribe valores de variables ni contraseñas. */
export function empalme(cwd: string): string {
  const docs = documentar(cwd)
  const pkg = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))) } catch { return null } })()
  const app = pkg?.name ?? basename(cwd), fecha = new Date().toISOString().slice(0, 10)
  const negocio = leer(join(cwd, ".skill_dey", "NEGOCIO.md")).split("\n").filter((l) => l.trim() && !l.startsWith("#") && !/…\s*$/.test(l)).slice(0, 15)
  const ejemplo = nombres(leer(join(cwd, ".env.example"))), reales = nombres(leer(join(cwd, ".env")))
  const faltan = reales.filter((n) => !ejemplo.includes(n))
  const srv = servicios(cwd), c = conexion(cwd)
  const pantallas = (leer(join(cwd, "docs", "MANUAL-USUARIO.md")).match(/^## .+$/gm) ?? []).map((h) => h.slice(3))
  const H = (() => { try { return analizar(cwd).filter((h) => h.prioridad === "CRÍTICO" || h.prioridad === "ALTO") } catch { return [] } })()
  const errores = (leer(join(cwd, ".skill_dey", "ERRORES-SITIO.md")).match(/^- \[ \] .+$/gm) ?? []).slice(0, 10)
  const pendientes = leer(join(cwd, ".skill_dey", "ESTADO.md")).split("\n").filter((l) => /PAUSAD|PENDIENTE|pendiente|\[ \]/.test(l)).slice(0, 10)
  const log = spawnSync("git", ["log", "--date=short", "--pretty=format:%ad · %s", "-25"], { cwd, encoding: "utf8" }).stdout?.trim() ?? ""
  const R = reglas(cwd)
  const doc = [
    `# Empalme — ${app}`, `Generado por skill_dey el ${fecha}. Documento de entrega para quien recibe la aplicación.`, "",
    "## 1. Qué es", ...(negocio.length ? negocio : ["(Completar: para qué sirve la app, quién la usa y qué procesos del negocio soporta.)"]), "",
    "## 2. Cómo instalarla y correrla", "Ver `docs/MANUAL-TECNICO.md` (instalación, comandos, rutas). Resumen:",
    ...(srv.length ? srv.map((s) => `- ${s.tipo} "${s.nombre}": \`${s.cmd.replace(/ "[^"]*skill_dey-router\.php"/, "")}\` (carpeta \`${s.dir.replace(cwd, ".") || "."}\`, puerto ${s.puerto})`) : ["- (no se detectó cómo arrancarla automáticamente)"]), "",
    "## 3. Configuración (.env)", `Variables necesarias (los VALORES no se incluyen; pedirlos a quien entrega): ${ejemplo.length ? ejemplo.map((n) => `\`${n}\``).join(", ") : "(sin .env.example)"}`,
    ...(faltan.length ? [`⚠ Variables que existen en el .env pero NO están documentadas en .env.example: ${faltan.map((n) => `\`${n}\``).join(", ")}`] : []), "",
    "## 4. Base de datos", c ? `Motor: ${{ mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor]} · BD: \`${basename(c.db)}\` · estructura en \`docs/DICCIONARIO-DATOS.md\` · instalación en \`database/instalacion.sql\`` : "Ver `docs/DICCIONARIO-DATOS.md` si existe.",
    ...(R.length ? ["Reglas de negocio que se verifican solas:", ...R.map((r) => `- ${r.texto}`)] : []), "",
    "## 5. Pantallas", ...(pantallas.length ? pantallas.map((p) => `- ${p}`) : ["(ver docs/MANUAL-USUARIO.md)"]), "Detalle de cada una en `docs/MANUAL-USUARIO.md`.", "",
    "## 6. Pendientes y riesgos", ...(pendientes.length ? ["Tareas pendientes:", ...pendientes] : []), ...(errores.length ? ["Errores conocidos del sitio:", ...errores] : []),
    ...(H.length ? ["Riesgos de seguridad detectados:", ...H.map((h) => `- [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 3).join(", ")}`)] : ["Sin riesgos críticos/altos detectados."]), "",
    "## 7. Cambios recientes", ...(log ? log.split("\n").map((l) => `- ${l}`) : ["(sin historial de git)"]), "",
    "## 8. Para quien recibe", "- Pedir: valores del `.env`, accesos al servidor y a la BD, usuarios administradores.",
    "- Con skill_dey: escribir `/skill_dey ayuda` en OpenCode; `/skill_dey revisar` antes de cualquier cambio.", `- Protecciones activas: ${vacunas().length} vacuna(s) contra errores conocidos, copia y deshacer en cada cambio.`, "",
    "## 9. Contactos", "(Completar: quién entrega, quién recibe, proveedores, soporte.)",
  ].join("\n")
  mkdirSync(join(cwd, "docs"), { recursive: true }); writeFileSync(join(cwd, "docs", "EMPALME.md"), doc)
  return `✅ Paquete de empalme listo: docs/EMPALME.md (+ ${docs.replace("Documentación actualizada: ", "")})${faltan.length ? `\n⚠ ${faltan.length} variable(s) del .env sin documentar en .env.example` : ""}\nCompleta a mano solo: "Qué es" (si quedó vacío) y "Contactos".`
}

/** Compresión de memoria: los archivos .skill_dey crecen con el uso; se recortan para que leerlos cueste pocos tokens. */
export function comprimirMemoria(cwd: string): void {
  const d = join(cwd, ".skill_dey"); if (!existsSync(d)) return
  const recortar = (f: string, max: number, cabecera = 1) => {
    const p = join(d, f); if (!existsSync(p) || statSync(p).size < 6000) return
    const l = readFileSync(p, "utf8").split("\n"); if (l.length <= max + cabecera) return
    writeFileSync(p, [...l.slice(0, cabecera), `(… ${l.length - max - cabecera} líneas antiguas resumidas por skill_dey)`, ...l.slice(-max)].join("\n"))
  }
  recortar("BITACORA.md", 60); recortar("CONSUMO.md", 300)
  for (const f of readdirSync(d).filter((f) => /^LECCIONES.*\.md$/.test(f))) { // lecciones: quitar repetidas (mismo texto, distinta fecha)
    const p = join(d, f), vistos = new Set<string>()
    const l = readFileSync(p, "utf8").split("\n").filter((x) => { const k = x.replace(/\(\d{4}-\d{2}-\d{2}\)\s*$/, "").trim().toLowerCase(); if (!k) return true; if (vistos.has(k)) return false; vistos.add(k); return true })
    writeFileSync(p, l.join("\n"))
  }
}
