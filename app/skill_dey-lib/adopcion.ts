// SKILL_DEY — adopción de una app existente: hallazgos de seguridad, lógica y calidad detectados POR CÓDIGO (0 tokens).
// El modelo después solo lee este informe (no toda la app) y razona la lógica de negocio sobre lo marcado.
import { spawnSync } from "node:child_process"
import { listarArchivos, esRepoGit } from "./listar.ts"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

export type Hallazgo = { prioridad: "CRÍTICO" | "ALTO" | "MEDIO" | "BAJO"; tipo: "rompe" | "seguridad" | "lógica" | "calidad"; texto: string; donde: string[] }
const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|tests?|__tests__|spec)([\\/]|$)|\.min\.js$/i
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }

export function esProyectoAvanzado(cwd: string): boolean {
  const n = listarArchivos(cwd).filter((f) => /\.(php|m?[jt]sx?|vue|py|java|cs|rb|go)$/.test(f) && !IGN.test(f)).length
  return n >= 8
}

export function analizar(cwd: string): Hallazgo[] {
  const files = listarArchivos(cwd).filter((f) => f && !IGN.test(f) && /\.(php|m?[jt]sx?|cjs|vue|svelte|py|html|blade\.php|twig|sql)$/.test(f) && existsSync(join(cwd, f)) && statSync(join(cwd, f)).size < 1_500_000)
  const H: Hallazgo[] = []
  const add = (prioridad: Hallazgo["prioridad"], tipo: Hallazgo["tipo"], texto: string, donde: string[]) => { if (donde.length) H.push({ prioridad, tipo, texto, donde: [...new Set(donde)].slice(0, 12) }) }
  const buscar = (re: RegExp, filtro: (f: string) => boolean = () => true, excluir?: RegExp) => {
    const r: string[] = []
    for (const f of files.filter(filtro)) leer(join(cwd, f)).split(/\r?\n/).forEach((l, i) => { if (re.test(l) && !(excluir && excluir.test(l))) r.push(`${f}:${i + 1}`) })
    return r
  }
  const php = (f: string) => /\.php$/.test(f), js = (f: string) => /\.(m?[jt]sx?|cjs|vue|svelte)$/.test(f), py = (f: string) => f.endsWith(".py")

  // --- Seguridad ---
  add("CRÍTICO", "seguridad", "Inyección SQL: datos del usuario concatenados en consultas (usa consultas preparadas)",
    [...buscar(/(query|execute|prepare|mysqli_query|pg_query|mysql_query)\s*\([^;]*(\$_(GET|POST|REQUEST|COOKIE)|["']\s*\.\s*\$\w+)/i, php, /\?\s*["']|bind_param|:\w+/),
     ...buscar(/(query|execute|mysqli_query|pg_query)\s*\(\s*(\$\w+\s*,\s*)?"[^"]*(SELECT|INSERT|UPDATE|DELETE|WHERE|VALUES)[^"]*\$\w+/i, php, /bind_param|prepare/i),
     ...buscar(/(query|execute|raw)\s*\(\s*[`'"][^`'"]*(SELECT|INSERT|UPDATE|DELETE)[^`]*(\$\{req\.|["']\s*\+\s*req\.)/i, js),
     ...buscar(/execute\s*\(\s*f?["'][^"']*(SELECT|INSERT|UPDATE|DELETE)[^"']*(\{|%s["']\s*%)/i, py)])
  add("ALTO", "seguridad", "XSS: se imprime entrada del usuario sin escapar (usa htmlspecialchars / escape de plantilla)",
    [...buscar(/(echo|print|<\?=)\s*[^;]*\$_(GET|POST|REQUEST|COOKIE)/i, php, /htmlspecialchars|htmlentities|intval|\(int\)|filter_var/i), ...buscar(/innerHTML\s*=\s*[^;]*(location|params|query|input|value)/i, js), ...buscar(/dangerouslySetInnerHTML/, js)])
  add("ALTO", "seguridad", "Credenciales escritas en el código (muévelas a .env)", [
    ...buscar(/(new\s+mysqli|mysqli_connect|new\s+PDO|pg_connect|createConnection|createPool|mongoose\.connect)\s*\([^)]*["'][^"'\s]{4,}["'][^)]*["'][^"'\s$]{4,}["']/i, (f) => !/\.example|test|spec/i.test(f), /getenv|env\(|process\.env|\$_ENV/i),
    ...buscar(/(password|passwd|pwd|pass|secret|api[_-]?key|token)\s*[:=]>?\s*["'][^"'\s$]{4,}["']/i, (f) => !/\.example|test|spec/i.test(f), /getenv|env\(|process\.env|os\.environ|placeholder|example|changeme/i)])
  const conSesion = files.filter(php).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth/.test(leer(join(cwd, f))))
  const paginas = files.filter((f) => php(f) && !/config|includes?|lib|clases?|models?|controllers?|migrations?|routes?|vendor|conexion|db\.php/i.test(f))
  if (conSesion.length >= 2) add("ALTO", "seguridad", "Páginas sin control de sesión mientras otras sí lo tienen (¿acceso sin login?)",
    paginas.filter((f) => !conSesion.includes(f) && !/login|logout|index|registro|register|recuperar|forgot|public|api[\\/]health/i.test(f) && /(echo|print|<\?=|<html|<form|<table|<div|json_encode)/i.test(leer(join(cwd, f)))))
  add("MEDIO", "seguridad", "Errores silenciados (@, catch vacío, error_reporting(0)): ocultan fallas reales",
    [...buscar(/(^|[^\w])@(\$\w+->|mysqli_|mysql_|pg_|file_|fopen|unlink|mkdir|json_)|error_reporting\(\s*0\s*\)/, php), ...buscar(/catch\s*(\([^)]*\))?\s*\{\s*\}/, js), ...buscar(/except\s*:\s*pass|except Exception\s*:\s*pass/, py)])

  // --- Lógica de negocio (señales que el modelo debe revisar) ---
  const estados = new Map<string, Map<string, string[]>>()
  for (const f of files.filter((f) => php(f) || js(f) || py(f))) leer(join(cwd, f)).split(/\r?\n/).forEach((l, i) => {
    for (const m of l.matchAll(/(?:[=!]==?|case|in_array\([^,]+,|IN\s*\()\s*\[?\s*["']([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,25})["']/g)) {
      const k = m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
      if (!estados.has(k)) estados.set(k, new Map()); const v = estados.get(k)!; if (!v.has(m[1])) v.set(m[1], []); v.get(m[1])!.push(`${f}:${i + 1}`)
    }
  })
  for (const [k, variantes] of estados) if (variantes.size > 1) add("MEDIO", "lógica", `Mismo estado/valor escrito distinto (${[...variantes.keys()].map((x) => `"${x}"`).join(" vs ")}): comparaciones que fallan en silencio`, [...variantes.values()].flat())
  const requeridosFront = new Set<string>()
  for (const f of files.filter((f) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f))) for (const m of leer(join(cwd, f)).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) { const n = m[0].match(/name=["']([\w\[\]]+)["']/)?.[1]; if (n) requeridosFront.add(n.replace(/\[\]$/, "")) }
  const sinValidarBack: string[] = []
  for (const n of requeridosFront) {
    const usos = buscar(new RegExp(`\\$_(POST|REQUEST)\\[['"]${n}['"]\\]|req\\.body\\.${n}\\b|request\\.(form|json)\\[['"]${n}['"]\\]`), (f) => php(f) || js(f) || py(f))
    const validado = buscar(new RegExp(`(empty|isset|filter_var|validate|trim|required|strlen)\\s*\\(?[^\\n]*${n}|${n}['"]?\\s*=>\\s*['"][^'"]*required|if\\s*\\(\\s*!\\s*(req\\.body\\.)?${n}\\b`), (f) => php(f) || js(f) || py(f))
    if (usos.length && !validado.length) sinValidarBack.push(`${n} (${usos[0]})`)
  }
  add("MEDIO", "lógica", "Campos obligatorios validados solo en el navegador (el servidor los acepta vacíos)", sinValidarBack)
  add("MEDIO", "lógica", "Cálculos de dinero/cantidades con float o redondeo intermedio (posibles descuadres)", [...buscar(/\b(round|toFixed|number_format)\s*\([^)]*\)\s*[\+\-\*\/]/, (f) => php(f) || js(f)), ...buscar(/parseFloat\([^)]*(precio|valor|total|monto|litros|cantidad)/i, js)])
  add("BAJO", "lógica", "Reglas marcadas como pendientes en el código (TODO/FIXME/HACK)", buscar(/\b(TODO|FIXME|HACK|XXX)\b/))

  // --- Calidad / operación ---
  if (!existsSync(join(cwd, ".env.example")) && !existsSync(join(cwd, ".env.sample"))) add("MEDIO", "calidad", "Sin .env.example: la configuración no está documentada ni separada del código", ["(raíz del proyecto)"])
  const grandes = files.filter((f) => !f.endsWith(".sql")).filter((f) => leer(join(cwd, f)).split("\n").length > 400).map((f) => `${f} (${leer(join(cwd, f)).split("\n").length} líneas)`)
  add("BAJO", "calidad", "Archivos muy grandes (difíciles de mantener; dividir al tocarlos)", grandes)
  if (!files.some((f) => /test|spec/i.test(f))) add("MEDIO", "calidad", "La app no tiene pruebas automáticas: se crearán pruebas de humo de los flujos principales", ["(proyecto)"])

  const orden = { "CRÍTICO": 0, ALTO: 1, MEDIO: 2, BAJO: 3 }
  return H.sort((a, b) => orden[a.prioridad] - orden[b.prioridad])
}
