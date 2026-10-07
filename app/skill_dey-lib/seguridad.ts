// SKILL_DEY — auditoría de seguridad POR CÓDIGO (0 tokens): revisa huecos que el modelo suele olvidar al construir.
// Corre sola en el cierre de cambios grandes y en la adopción. Cubre lo que las buenas prácticas por línea no ven (necesita el archivo entero).
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { listarArchivos } from "./listar.ts"
import { join } from "node:path"

export type Hueco = { prioridad: "CRÍTICO" | "ALTO" | "MEDIO"; texto: string; donde: string[] }
const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|tests?|__tests__|spec|migrations?)([\\/]|$)|\.min\.js$/i
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const php = (f: string) => /\.php$/.test(f), js = (f: string) => /\.(m?[jt]sx?|cjs)$/.test(f), web = (f: string) => /\.(php|m?[jt]sx?|vue|svelte|html|blade\.php|twig)$/.test(f)

/** Revisa huecos de seguridad en TODO el proyecto (archivos del repo). Pensado para el cierre, no para cada cambio. */
export function auditarSeguridad(cwd: string): Hueco[] {
  const files = listarArchivos(cwd).filter((f) => !IGN.test(f) && web(f) && existsSync(join(cwd, f)) && statSync(join(cwd, f)).size < 1_500_000)
  const H: Hueco[] = []
  const add = (prioridad: Hueco["prioridad"], texto: string, donde: string[]) => { if (donde.length) H.push({ prioridad, texto, donde: [...new Set(donde)].slice(0, 10) }) }
  const buscar = (re: RegExp, filtro: (f: string) => boolean, excluir?: RegExp) => { const r: string[] = []; for (const f of files.filter(filtro)) { const t = leer(join(cwd, f)); if (re.test(t) && !(excluir && excluir.test(t))) r.push(f) } return r }

  // Contraseñas sin cifrar
  add("CRÍTICO", "Contraseña guardada sin cifrar (usa password_hash/bcrypt/argon2)", [
    ...buscar(/(INSERT|UPDATE)[^;]*\b(password|passwd|clave|contrasena|contraseña)\b[^;]*(VALUES|=)[^;]*(\$_(POST|GET|REQUEST)|\$\w+)/i, php, /password_hash|bcrypt|hash\(/i),
    ...buscar(/\b(md5|sha1)\s*\(\s*\$?_?(POST|GET|REQUEST|password|pass|clave)/i, php),
    ...buscar(/password\s*:\s*(req\.body|input)\.\w+/i, js, /bcrypt|hash|argon/i)])
  // Páginas con salida pero sin control de sesión mientras otras sí lo tienen
  const conSesion = files.filter(php).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth|require.*auth/i.test(leer(join(cwd, f))))
  if (conSesion.length >= 2) {
    const paginas = files.filter((f) => php(f) && !/(^|[\\/])(config|includes?|lib|clases?|class|models?|controllers?|conexion|db|functions?|helpers?|api|vendor)([\\/]|\.|$)/i.test(f))
    add("ALTO", "Página sin verificar sesión mientras otras sí lo hacen (¿acceso sin login?)",
      paginas.filter((f) => !conSesion.includes(f) && !/login|logout|index|registro|register|recuperar|forgot|public|install/i.test(f) && /(echo|print|<\?=|<html|<form|<table|json_encode)/i.test(leer(join(cwd, f)))))
  }
  // Formularios que modifican datos sin token CSRF
  add("ALTO", "Formulario POST sin token CSRF (añade y valida un token)", buscar(/<form[^>]*method\s*=\s*["']?post/i, web, /csrf|_token|authenticity_token|nonce|csrf_field|@csrf/i))
  // Acceso a un registro por id sin filtrar por el dueño/usuario
  add("ALTO", "Consulta por id tomado de la URL sin validar el dueño (otro usuario ve/edita datos ajenos)", [
    ...buscar(/WHERE\s+id\s*=\s*['"]?\s*(\.|\$\{?)?\s*\$_(GET|POST|REQUEST)\[/i, php, /user_id|usuario_id|owner|and\s+\w*user/i),
    ...buscar(/findByPk|findOne\(\s*\{?\s*id\s*:\s*(req\.params|req\.query)/i, js, /user|owner|where.*user/i)])
  // Subida de archivos sin validar tipo/tamaño
  add("ALTO", "Subida de archivos sin validar tipo ni tamaño", [
    ...buscar(/move_uploaded_file|\$_FILES\[/i, php, /mime|getimagesize|pathinfo|finfo|extension|type|size|MAX_FILE/i),
    ...buscar(/multer|formidable|busboy|\.upload\(/i, js, /fileFilter|limits|mimetype|allowed/i)])
  // Modo debug encendido / errores visibles
  add("ALTO", "Modo depuración o errores visibles al usuario (expón solo en desarrollo)", [
    ...buscar(/display_errors\s*[,=]\s*['"]?(1|On)|error_reporting\s*\(\s*E_ALL\s*\)/i, php),
    ...buscar(/APP_DEBUG\s*=\s*true/i, (f) => /\.env$/.test(f))])
  // CORS abierto a todos
  add("MEDIO", "CORS abierto a cualquier origen (*) (limita a los dominios necesarios)", [
    ...buscar(/Access-Control-Allow-Origin["'\s:,]+\*/i, web),
    ...buscar(/cors\(\s*\{\s*origin\s*:\s*["']?\*|cors\(\s*\)/i, js)])
  // Cookies de sesión sin HttpOnly/Secure
  add("MEDIO", "Cookie sin HttpOnly/Secure (puede robarse desde el navegador)", buscar(/setcookie\s*\(|session_set_cookie_params\s*\(|res\.cookie\s*\(/i, web, /httponly|secure|samesite/i))
  // Login sin límite de intentos
  const login = files.filter((f) => /login|signin|autenticar|authenticate/i.test(f) && /password|contrasena|contraseña|passwd/i.test(leer(join(cwd, f))))
  add("MEDIO", "Login sin límite de intentos (permite fuerza bruta)", login.filter((f) => !/intentos|attempts|rate.?limit|throttle|lockout|bloqueo|captcha/i.test(leer(join(cwd, f)))))

  const orden = { "CRÍTICO": 0, ALTO: 1, MEDIO: 2 }
  return H.sort((a, b) => orden[a.prioridad] - orden[b.prioridad])
}

/** Resumen corto para el reporte. */
export function resumenSeguridad(cwd: string): { lineas: string[]; criticos: number } {
  const web2 = listarArchivos(cwd).filter((f) => web(f))
  if (!web2.length) return { lineas: ["⏭ seguridad: no encontré páginas/código web que revisar (¿carpeta vacía o fuera del proyecto?)"], criticos: 0 }
  const H = auditarSeguridad(cwd)
  if (!H.length) return { lineas: [`✅ seguridad: ${web2.length} archivo(s) revisados, sin huecos conocidos (sesión, contraseñas, CSRF, accesos, subidas, debug, CORS, cookies, fuerza bruta)`], criticos: 0 }
  const criticos = H.filter((h) => h.prioridad === "CRÍTICO").length
  return { lineas: [`⚠ seguridad: ${H.length} hueco(s) → corrige los CRÍTICO/ALTO antes de entregar:`, ...H.map((h) => `   [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 3).join(", ")}`)], criticos }
}
