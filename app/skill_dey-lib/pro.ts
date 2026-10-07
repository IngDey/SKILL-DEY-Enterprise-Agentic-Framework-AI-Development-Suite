// SKILL_DEY — EXTRAS PROFESIONALES (gratis, cross-platform, 0 tokens del modelo). Todo auto-detectado;
// si falta la herramienta externa, lo dice y sigue (nunca rompe). Se enganchan dentro de pruebas/seguridad/produccion.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { listarArchivos } from "./listar.ts"

const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const tiene = (bin: string) => { try { return spawnSync(bin, ["--version"], { shell: true, timeout: 15_000 }).status === 0 } catch { return false } }
const run = (cmd: string, cwd: string) => spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300_000, maxBuffer: 5e7 })

/** Cobertura de CÓDIGO con el runner del proyecto (c8/istanbul · phpunit · pytest-cov). */
export function coberturaCodigo(cwd: string): string {
  const pkg = (() => { try { return JSON.parse(leer(join(cwd, "package.json"))) } catch { return null } })()
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const s = pkg.scripts.test
    const cmd = /vitest/.test(s) ? "npx vitest run --coverage 2>&1" : /jest/.test(s) ? "npx jest --coverage 2>&1" : /node\s+--test/.test(s) ? "node --test --experimental-test-coverage 2>&1" : "npm test 2>&1"
    const t = (() => { const r = run(cmd, cwd); return r.stdout + r.stderr })()
    const m = t.match(/all files\s*\|\s*(\d+(?:\.\d+)?)/i) || t.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Stmts|statements|coverage|Lines)/i)
    return m ? `📈 cobertura de código: ${m[1]}%` : "⏭ cobertura de código: el runner no reportó % (agrega c8/istanbul o la bandera --coverage)"
  }
  if (existsSync(join(cwd, "vendor", "bin", "phpunit")) || existsSync(join(cwd, "phpunit.xml"))) {
    const r = run('"vendor/bin/phpunit" --coverage-text 2>/dev/null || phpunit --coverage-text 2>/dev/null', cwd)
    const m = r.stdout.match(/Lines:\s*(\d+(?:\.\d+)?)%/); return m ? `📈 cobertura de código (PHP): ${m[1]}%` : "⏭ cobertura PHP: instala Xdebug o pcov para medir el %"
  }
  if (listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = run("python -m pytest --cov -q 2>/dev/null", cwd); const m = r.stdout.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/); return m ? `📈 cobertura de código (Python): ${m[1]}%` : "⏭ cobertura Python: instala pytest-cov"
  }
  return "⏭ cobertura de código: el proyecto no tiene runner de pruebas"
}

/** Auditoría de dependencias (vulnerabilidades conocidas): npm / composer / pip. */
export function auditarDependencias(cwd: string): string[] {
  const L: string[] = []
  if (existsSync(join(cwd, "package.json")) && tiene("npm")) {
    const r = run("npm audit --json 2>/dev/null", cwd)
    try { const j = JSON.parse(r.stdout); const v = j.metadata?.vulnerabilities || {}; const tot = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0)
      L.push(tot ? `${v.critical || v.high ? "❌" : "⚠"} deps npm: ${v.critical || 0} críticas · ${v.high || 0} altas · ${v.moderate || 0} medias (corrige con npm audit fix)` : "✅ deps npm: sin vulnerabilidades conocidas") }
    catch { L.push("⏭ npm audit: falta package-lock.json o no hay red") }
  }
  if (existsSync(join(cwd, "composer.json")) && tiene("composer")) {
    const r = run("composer audit --format=plain 2>/dev/null", cwd); L.push(/no\s+security\s+vulnerabilit/i.test(r.stdout + r.stderr) ? "✅ deps PHP: sin vulnerabilidades" : "⚠ deps PHP: revisa `composer audit`")
  }
  if (existsSync(join(cwd, "requirements.txt"))) L.push(tiene("pip-audit") ? (/no known/i.test(run("pip-audit 2>/dev/null", cwd).stdout) ? "✅ deps Python: sin vulnerabilidades" : "⚠ deps Python: revisa `pip-audit`") : "⏭ deps Python: instala pip-audit para auditarlas")
  return L
}

/** Semgrep (análisis estático de seguridad estándar) — solo si está instalado. */
export function semgrep(cwd: string): string {
  if (!tiene("semgrep")) return "⏭ semgrep no instalado (opcional): `pip install semgrep` para análisis estático estándar"
  const r = run("semgrep --config auto --json --quiet 2>/dev/null", cwd)
  try { const j = JSON.parse(r.stdout); const n = j.results?.length || 0; const err = (j.results || []).filter((x: any) => x.extra?.severity === "ERROR").length
    return n ? `${err ? "❌" : "⚠"} semgrep: ${n} hallazgo(s) (${err} de severidad alta)` : "✅ semgrep: sin hallazgos" } catch { return "⏭ semgrep: no se pudo analizar" }
}

/** OpenAPI: si hay spec la reconoce; si es una API sin spec, genera un starter desde las rutas. */
export function apiOpenapi(cwd: string, rutas: string[]): string {
  const spec = ["openapi.json", "openapi.yaml", "swagger.json", join("docs", "openapi.json")].map((f) => join(cwd, f)).find(existsSync)
  if (spec) return `✅ OpenAPI: encontrado ${spec.split(/[\\/]/).pop()} (sirve para probar endpoints y documentar la API)`
  const esApi = listarArchivos(cwd).some((f) => /(^|[\\/])(api|routes)[\\/]/i.test(f)) || /express|fastify|@nestjs|fastapi|flask|laravel\/framework/.test(leer(join(cwd, "package.json")) + leer(join(cwd, "composer.json")) + leer(join(cwd, "requirements.txt")))
  if (!esApi) return ""
  const paths: any = {}; for (const r of (rutas.length ? rutas : ["/"])) paths[r] = { get: { summary: "auto (completar)", responses: { "200": { description: "ok" } } } }
  mkdirSync(join(cwd, "docs"), { recursive: true })
  writeFileSync(join(cwd, "docs", "openapi.json"), JSON.stringify({ openapi: "3.0.0", info: { title: "API", version: "1.0.0" }, paths }, null, 2))
  return "🧩 OpenAPI: generé un starter en docs/openapi.json desde tus rutas (complétalo con los cuerpos y respuestas)"
}

/** Docker: valida que la imagen CONSTRUYA (si hay Dockerfile/compose y docker disponible). */
export function docker(cwd: string): string {
  const df = existsSync(join(cwd, "Dockerfile")), comp = existsSync(join(cwd, "docker-compose.yml")) || existsSync(join(cwd, "compose.yml"))
  if (!df && !comp) return ""
  if (!tiene("docker")) return "⏭ Docker: hay Dockerfile pero `docker` no está disponible aquí para validar el build"
  const r = comp ? run("docker compose build 2>&1 | tail -6", cwd) : run("docker build -t skill_dey_check . 2>&1 | tail -6", cwd)
  return r.status === 0 ? "✅ Docker: la imagen construye correctamente" : "❌ Docker: el build falla → " + (r.stdout + r.stderr).split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 160)
}

/** Sentry: ¿está integrado para capturar errores en producción? (detección, no envía nada). */
export function sentryCheck(cwd: string): string {
  const dep = /@sentry\/|sentry-sdk|sentry\/sentry|getsentry/.test(leer(join(cwd, "package.json")) + leer(join(cwd, "composer.json")) + leer(join(cwd, "requirements.txt")))
  const dsn = /SENTRY_DSN/.test(leer(join(cwd, ".env")) + leer(join(cwd, ".env.example")))
  if (dep && dsn) return "✅ Sentry: integrado (librería + SENTRY_DSN)"
  if (dep && !dsn) return "⚠ Sentry: la librería está pero falta SENTRY_DSN en .env"
  return ""
}

/** i18n: ¿la app soporta varios idiomas? (detección + recordatorio). */
export function i18nCheck(cwd: string): string {
  const lib = /i18next|vue-i18n|react-intl|formatjs|next-intl/.test(leer(join(cwd, "package.json"))) || ["lang", "locales", join("resources", "lang"), "i18n"].some((d) => existsSync(join(cwd, d)))
  return lib ? "🌐 i18n: soporte de idiomas detectado (revisa que no queden textos quemados sin traducir en las vistas)" : ""
}

/** Todo lo profesional extra en una sola pasada (para pruebas). */
export function extrasPro(cwd: string, rutas: string[]): string[] {
  const L = [coberturaCodigo(cwd), ...auditarDependencias(cwd), semgrep(cwd), apiOpenapi(cwd, rutas), docker(cwd), sentryCheck(cwd), i18nCheck(cwd)].filter(Boolean)
  if (L.some((x) => /Sentry|OpenAPI|i18n|Docker/.test(x))) L.push("ℹ️ nota: Sentry/OpenAPI/i18n son detección y Docker es validación de build — no auditoría profunda; úsalos como señal, no como garantía.")
  return L
}
