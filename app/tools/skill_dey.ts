// SKILL_DEY — herramientas deterministas para OpenCode.
// Crea las tools skill_dey_*: verificar, sitio, impacto, leccion, recordar, deshacer, mapa, documentar, procesos, adoptar
// Objetivo: que el modelo NO gaste tokens decidiendo/leyendo salidas largas; el script hace el trabajo exacto.
import { tool } from "@opencode-ai/plugin"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, appendFileSync } from "node:fs"
import { join, extname, basename, dirname, relative } from "node:path"
import { homedir, tmpdir } from "node:os"
import { documentar as _documentar } from "../skill_dey-lib/documentar.ts"
import { arranqueLimpio, servicios, escuchando, esDeDesarrollo, liberarPuerto, detenerTodo, conTiempo } from "../skill_dey-lib/procesos.ts"
import { revisarTodo } from "../skill_dey-lib/escaneo.ts"
import { analizar } from "../skill_dey-lib/adopcion.ts"
import { rastrearSitio } from "../skill_dey-lib/sitio.ts"
import { errorJs } from "../skill_dey-lib/sintaxis.ts"
import { revisarPracticas } from "../skill_dey-lib/practicas.ts"
import { agregarVacuna, agregarRegla, verificarReglas } from "../skill_dey-lib/reglas.ts"
import { copiaPrueba } from "../skill_dey-lib/bd.ts"
import { resumenSeguridad, auditarSeguridad } from "../skill_dey-lib/seguridad.ts"
import { principios as _principios, buscarSoluciones as _buscarSol, guardarSolucion as _guardarSol } from "../skill_dey-lib/saber.ts"
import { probarApp } from "../skill_dey-lib/probador.ts"
import { formatear, rendimiento, validacionServidor, erroresProduccion, consultasEnBucle } from "../skill_dey-lib/extras.ts"
import { organizar as _organizar } from "../skill_dey-lib/organizar.ts"
import { guardarPlan, verificarPlan, marcarPlan } from "../skill_dey-lib/plan.ts"
import { documentosPdf } from "../skill_dey-lib/pdf.ts"
import { foto } from "../skill_dey-lib/respaldo.ts"
import { iniciarApp, asegurarPlaywright, rutasAProbar, ERROR_PHP } from "../skill_dey-lib/app.ts"
import { deshacer as _deshacer, rehacer as _rehacer, historial as _historial } from "../skill_dey-lib/respaldo.ts"
import { buscarSkill } from "../skill_dey-lib/buscar_skill.ts"
import { capacitar } from "../skill_dey-lib/video.ts"
import { pruebasProfesionales } from "../skill_dey-lib/testpro.ts"
import { aprenderDeCorrida } from "../skill_dey-lib/aprender.ts"
import { revisarMovil } from "../skill_dey-lib/movil.ts"
import { auditarDependencias, semgrep, sentryCheck } from "../skill_dey-lib/pro.ts"

// ---------- utilidades ----------
const GLOBAL_DIR = join(homedir(), ".config", "opencode", "skill_dey")
const IGNORAR = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.next|\.nuxt|coverage|\.venv|venv|__pycache__|\.skill_dey[\\/]shots)([\\/]|$)/

type Res = { code: number; out: string; timeout: boolean }
function sh(cmd: string, cwd: string, timeoutMs = 300_000): Res {
  const r = spawnSync(cmd, {
    cwd, shell: true, encoding: "utf8", timeout: timeoutMs, maxBuffer: 50_000_000,
    env: { ...process.env, CI: "1", FORCE_COLOR: "0", NO_COLOR: "1" },
  })
  const timeout = (r.error as any)?.code === "ETIMEDOUT"
  return { code: r.status ?? (r.error ? 1 : 0), out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd(), timeout }
}
const cola = (s: string, n = 15) => s.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-n).map((l) => "   " + l.slice(0, 220)).join("\n")
const existe = (cwd: string, ...f: string[]) => f.some((x) => existsSync(join(cwd, x)))
const leerJson = (p: string): any => { try { return JSON.parse(readFileSync(p, "utf8")) } catch { return null } }
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const q = (f: string) => `"${f}"`
const hayComando = (c: string, cwd: string) => sh(process.platform === "win32" ? `where ${c}` : `command -v ${c}`, cwd, 10_000).code === 0
function asegurarDir(p: string) { if (!existsSync(p)) mkdirSync(p, { recursive: true }) }
const WIN = process.platform === "win32"
let _py: string | null | undefined
function python(cwd: string): string | null { // Windows suele tener "py"/"python"; macOS/Linux "python3"
  if (_py !== undefined) return _py
  _py = (WIN ? ["python", "py", "python3"] : ["python3", "python"]).find((c) => sh(`${c} --version`, cwd, 10_000).code === 0) ?? null
  return _py
}

function archivosCambiados(cwd: string): string[] {
  const r = sh("git -c core.quotepath=off status --porcelain", cwd, 20_000)
  if (r.code !== 0) return []
  return r.out.split(/\r?\n/).filter(Boolean).map((l) => {
    let p = l.slice(3).trim()
    if (p.includes(" -> ")) p = p.split(" -> ")[1]
    return p.replace(/^"|"$/g, "")
  }).filter((p) => !IGNORAR.test(p) && !p.startsWith(".skill_dey/") && existsSync(join(cwd, p)) && statSync(join(cwd, p)).isFile())
}

// ---------- clasificación de áreas (espejo de la matriz de SKILL.md §3) ----------
type Area = "docs" | "estilos" | "ui" | "front" | "backend" | "api" | "db" | "auth" | "config" | "deps" | "datos" | "infra" | "tests"
function areasDe(f: string): Area[] {
  const p = f.toLowerCase().replace(/\\/g, "/"), e = extname(p), a = new Set<Area>()
  if ([".md", ".txt", ".rst"].includes(e) || p.startsWith("docs/")) a.add("docs")
  if ([".css", ".scss", ".sass", ".less"].includes(e)) a.add("estilos")
  if ([".vue", ".svelte", ".jsx", ".tsx", ".html", ".twig"].includes(e) || p.endsWith(".blade.php") || /(components|pages|views|layouts|screens|templates)\//.test(p)) a.add("ui")
  if (/(^|\/)(migrations?|migrate|db\/schema|database)\//.test(p) || e === ".sql" || p.endsWith("schema.prisma")) a.add("db")
  if (/(auth|login|permis|permission|role|\brol|session|jwt|security|seguridad|guard|policy|middleware)/.test(p)) a.add("auth")
  if (/(routes?|controllers?|api|endpoints?|openapi|swagger|handlers?)\b/.test(p)) a.add("api")
  if (/(kpi|indicador|report|reporte|dashboard|estadistic|metric|grafic|chart|analytics)/.test(p)) a.add("datos")
  if (/(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|composer\.(json|lock)|requirements.*\.txt|pyproject\.toml|poetry\.lock|go\.(mod|sum)|pom\.xml|.*\.csproj)$/.test(p)) a.add("deps")
  if (/(^|\/)(\.env\.example|config\/|settings\.py|appsettings)/.test(p)) a.add("config")
  if (/(dockerfile|docker-compose|\.github\/|\.gitlab-ci|nginx|\.ya?ml$)/.test(p) && !a.has("config")) a.add("infra")
  if (/(test|spec|__tests__|e2e|cypress)/.test(p)) a.add("tests")
  if ([".php", ".py", ".go", ".java", ".cs", ".rb", ".rs"].includes(e) && !a.has("ui")) a.add("backend")
  if ([".ts", ".js", ".mjs", ".cjs"].includes(e) && !a.has("ui")) a.add(/(server|backend|api|modules|services?|repositor)/.test(p) ? "backend" : "front")
  return [...a]
}

// ---------- detección de stack y comandos ----------
function stack(cwd: string) {
  const pkg = leerJson(join(cwd, "package.json"))
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }
  const scripts = pkg?.scripts ?? {}
  return {
    node: !!pkg, scripts, deps,
    vitest: !!deps.vitest, jest: !!deps.jest,
    eslint: !!deps.eslint || existe(cwd, ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.cjs", "eslint.config.js", "eslint.config.mjs"),
    ts: existe(cwd, "tsconfig.json"),
    playwright: !!deps.playwright || !!deps["@playwright/test"],
    axe: !!deps["@axe-core/playwright"],
    php: existe(cwd, "composer.json") || existe(cwd, "index.php"),
    phpunit: existe(cwd, "vendor/bin/phpunit"),
    python: existe(cwd, "pyproject.toml", "requirements.txt", "setup.py", "manage.py"),
    go: existe(cwd, "go.mod"),
  }
}

const SECRETO = /(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i
const PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-])/i

// ======================================================================
export const verificar = tool({
  description:
    "Verifica lo cambiado según nivel. Usar tras editar; nunca correr lint/tests a mano.",
  args: {
    nivel: tool.schema.enum(["N0", "N1", "N2", "N3"]).optional().describe("defecto N1"),
    archivos: tool.schema.array(tool.schema.string()).optional().describe("defecto: git status"),
    cierre: tool.schema.boolean().optional().describe("suite, build, audit, sitio"),
    url: tool.schema.string().optional().describe("si la app ya corre"),
    todo: tool.schema.boolean().optional().describe("todo el proyecto"),
    rapido: tool.schema.boolean().optional().describe("interno"),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const t0 = Date.now()
    const files = (args.archivos?.length ? args.archivos : archivosCambiados(cwd)).filter((f) => existsSync(join(cwd, f)))
    const areas = new Set<Area>(files.flatMap(areasDe))
    const s = stack(cwd)
    const n = args.nivel ?? "N1", rank = { N0: 0, N1: 1, N2: 2, N3: 3 }[n]
    const cierre = !!args.cierre || n === "N3"
    const L: string[] = []
    let fallas = 0
    let pruebas = 0 // cuántos bloques de pruebas reales corrieron (define la confianza)
    let capturas = false
    const pendientes: string[] = []
    const run = (nombre: string, cmd: string, timeout?: number) => {
      const r = sh(cmd, cwd, timeout)
      if (/test|pytest|phpunit|suite/i.test(nombre)) pruebas++
      if (r.code === 0) L.push(`✅ ${nombre}`)
      else { fallas++; L.push(`❌ ${nombre}${r.timeout ? " (tiempo agotado)" : ` (exit ${r.code})`}\n${cola(r.out)}`) }
    }
    const omitir = (nombre: string, motivo: string) => L.push(`⏭ ${nombre}: ${motivo}`)

    if (!files.length && !cierre && !args.todo) return "SKILL_DEY verificar: no hay archivos cambiados (git status limpio). Nada que verificar."
    const soloDocs = files.length > 0 && [...areas].every((a) => a === "docs")
    if (soloDocs && !cierre && !args.todo) return `SKILL_DEY verificar · ${n} · solo documentación (${files.length}) → sin pruebas necesarias ✅`

    // 1) Sintaxis por archivo (todos los niveles, rápido)
    const errSint: string[] = []
    for (const f of files) {
      const e = extname(f).toLowerCase(), fp = q(f)
      let r: Res | null = null
      if (e === ".php") r = sh(`php -l ${fp}`, cwd, 30_000)
      else if (e === ".py" && python(cwd)) r = sh(`${python(cwd)} -m py_compile ${fp}`, cwd, 30_000)
      else if ([".js", ".mjs", ".cjs"].includes(e)) { const x = errorJs(cwd, f); if (x) errSint.push(`${f}:\n${x}`) }
      else if (e === ".json") { try { JSON.parse(readFileSync(join(cwd, f), "utf8")); } catch (x: any) { errSint.push(`${f}: ${x.message}`) } }
      if (r && r.code !== 0 && !/not recognized|not found|no se reconoce/i.test(r.out)) errSint.push(`${f}:\n${cola(r.out, 6)}`)
    }
    if (errSint.length) { fallas++; L.push(`❌ sintaxis\n${errSint.join("\n")}`) } else L.push(`✅ sintaxis (${files.length} archivos)`)

    // 2) Secretos en código (todos los niveles)
    const conSecreto = files.filter((f) => !/\.env(\.|$)|\.example|\.lock$/.test(f)).filter((f) =>
      leer(join(cwd, f)).split(/\r?\n/).some((l) => SECRETO.test(l) && !PLACEHOLDER.test(l)))
    if (conSecreto.length) { fallas++; L.push(`❌ secretos en código: ${conSecreto.join(", ")} → mover a .env`) } else L.push("✅ sin secretos")

    // 2b) Buenas prácticas en las líneas NUEVAS (por código, 0 tokens): graves fallan, avisos quedan pendientes
    const bp = revisarPracticas(cwd, files)
    if (bp.graves.length) { fallas++; L.push(`❌ prácticas peligrosas:\n${bp.graves.map((g) => "   " + g).join("\n")}`) } else L.push("✅ buenas prácticas")
    if (bp.avisos.length) pendientes.push("mejorar: " + bp.avisos.join(" · "))

    // 3) Lint de archivos tocados (N0 solo sintaxis)
    const codigo = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte)$/.test(f))
    if (rank >= 1) {
      if (s.eslint && codigo.length) run("lint", `npx --no-install eslint --no-warn-ignored ${codigo.map(q).join(" ")}`, 180_000)
      const py = files.filter((f) => f.endsWith(".py"))
      if (py.length && hayComando("ruff", cwd)) run("lint python", `ruff check ${py.map(q).join(" ")}`, 120_000)
      if (s.go) run("go vet", "go vet ./...", 180_000)
    } else omitir("lint/tests", "N0 (solo sintaxis)")

    // 4) Typecheck (N2+ o si hay TS en N1 con contratos)
    if (rank >= 2 && s.ts && files.some((f) => /\.tsx?$|\.vue$/.test(f))) run("tipos", "npx --no-install tsc --noEmit -p .", 300_000)

    // 5) Tests relacionados / suite
    const fuente = files.filter((f) => !/\.(md|css|scss|json|txt|sql|ya?ml)$/i.test(f))
    const suite = cierre || areas.has("api") || areas.has("db") || areas.has("auth") || areas.has("deps")
    if (rank >= 1 && (fuente.length || cierre)) {
      if (s.node && (s.vitest || s.jest || s.scripts.test)) {
        if (suite && rank >= 2) run("suite completa", s.scripts.test ? "npm test --silent" : s.vitest ? "npx --no-install vitest run" : "npx --no-install jest", 600_000)
        else if (s.vitest) run("tests relacionados", `npx --no-install vitest related --run --passWithNoTests ${fuente.map(q).join(" ")}`, 300_000)
        else if (s.jest) run("tests relacionados", `npx --no-install jest --findRelatedTests ${fuente.map(q).join(" ")} --passWithNoTests`, 300_000)
        else if (rank >= 2) run("tests", "npm test --silent", 600_000)
      }
      if (s.python && python(cwd) && sh(`${python(cwd)} -m pytest --version`, cwd, 20_000).code === 0) {
        const rel = fuente.filter((f) => f.endsWith(".py")).map((f) => basename(f, ".py")).filter((b) => !b.startsWith("test_"))
        const pt = `${python(cwd)} -m pytest -q -x`
        run(suite && rank >= 2 ? "pytest suite" : "pytest relacionados", suite && rank >= 2 ? pt : rel.length ? `${pt} -k "${rel.join(" or ")}"` : `${pt} --lf`, 600_000)
      }
      if (s.phpunit) {
        const cls = fuente.filter((f) => f.endsWith(".php")).map((f) => basename(f, ".php"))
        const pu = "php vendor/bin/phpunit" // funciona igual en Windows, macOS y Linux
        run("phpunit", suite && rank >= 2 ? pu : cls.length ? `${pu} --filter "${cls.join("|")}"` : pu, 600_000)
      }
      if (s.go) run("go test", suite && rank >= 2 ? "go test ./..." : `go test ${[...new Set(fuente.filter((f) => f.endsWith(".go")).map((f) => "./" + dirname(f).replace(/\\/g, "/")))].join(" ") || "./..."}`, 600_000)
      const testsNode = s.node && !s.vitest && !s.jest && !s.scripts.test ? archivosCambiados(cwd).concat(files).filter((f) => /\.test\.(m?js|cjs)$/.test(f)) : []
      if (testsNode.length || (s.node && !s.vitest && !s.jest && !s.scripts.test && existe(cwd, "test", "tests")))
        run("tests (node --test)", `node --test ${testsNode.length ? [...new Set(testsNode)].map(q).join(" ") : ""}`.trim(), 300_000)
      else if (rank >= 2 && !s.vitest && !s.jest && !s.scripts.test && !s.python && !s.phpunit && !s.go) // aviso solo en N2+ (no repetirlo en cada cambio pequeño)
        pendientes.push(s.php ? "sin PHPUnit: las páginas se prueban con prueba de humo; para lógica crítica agrega PHPUnit (composer require --dev phpunit/phpunit) con una prueba del módulo tocado"
          : s.python ? "sin pruebas: crea test_<modulo>.py con pytest (pip install pytest) para el módulo tocado"
          : "el proyecto no tiene pruebas: crea una prueba mínima del módulo tocado (Node: archivo *.test.js con node:test, sin instalar nada) y vuelve a verificar")
    }

    // 6) Build de producción
    if ((rank >= 2 && (areas.has("api") || areas.has("config") || areas.has("deps") || areas.has("auth") || areas.has("infra"))) || cierre) {
      if (s.scripts.build) run("build producción", "npm run build --silent", 600_000); else omitir("build", "sin script build")
    }

    // 7) Auditoría de dependencias
    if (rank >= 2 && (areas.has("deps") || areas.has("auth") || areas.has("config") || cierre)) {
      if (s.node) run("audit npm (alto/crítico)", "npm audit --omit=dev --audit-level=high", 180_000)
      if (s.php && hayComando("composer", cwd)) run("audit composer", "composer audit --no-interaction", 180_000)
      if (s.python && python(cwd) && hayComando("pip-audit", cwd)) run("pip-audit", "pip-audit -q", 300_000)
    }

    // 7b) Análisis estático PHP / Python (errores que la sintaxis no ve)
    const phpCambiados = files.filter((f) => f.endsWith(".php"))
    if (rank >= 1 && phpCambiados.length) {
      const stan = existe(cwd, "vendor/bin/phpstan") ? "php vendor/bin/phpstan" : hayComando("phpstan", cwd) ? "phpstan" : ""
      if (stan) run("análisis PHP (phpstan)", `${stan} analyse --no-progress --error-format=raw --level=${rank >= 2 ? 5 : 3} ${phpCambiados.map(q).join(" ")}`, 300_000)
    }
    const pyCambiados = files.filter((f) => f.endsWith(".py"))
    if (rank >= 1 && pyCambiados.length && python(cwd)) {
      if (!hayComando("ruff", cwd) && sh(`${python(cwd)} -m pyflakes --version`, cwd, 10_000).code === 0) run("análisis Python (pyflakes)", `${python(cwd)} -m pyflakes ${pyCambiados.map(q).join(" ")}`, 120_000)
      if (rank >= 2 && existe(cwd, "mypy.ini", "setup.cfg", "pyproject.toml") && sh(`${python(cwd)} -m mypy --version`, cwd, 10_000).code === 0) run("tipos Python (mypy)", `${python(cwd)} -m mypy ${pyCambiados.map(q).join(" ")} --ignore-missing-imports`, 300_000)
    }

    // 8) App en marcha: consola, errores del servidor y capturas (la levanta sola si hace falta)
    const hayUI = areas.has("ui") || areas.has("estilos") || areas.has("datos") || phpCambiados.some((f) => !/vendor|config|includes?|lib|clases?|models?|controllers?/i.test(f))
    const tocaServidor = areas.has("backend") || areas.has("api") || areas.has("config") || areas.has("db") || areas.has("deps")
    if (((rank >= 1 && (hayUI || tocaServidor)) || args.todo) && !args.rapido) {
      let app: Awaited<ReturnType<typeof iniciarApp>> = null
      let arr: Awaited<ReturnType<typeof arranqueLimpio>> | null = null
      if (!args.url && servicios(cwd).length) {
        arr = await conTiempo(arranqueLimpio(cwd), 95_000, null).catch(() => null)
        for (const n of arr?.notas ?? []) L.push("🔧 " + n)
        for (const a of arr?.lista ?? []) {
          if (a.ok && !a.errores.length) L.push(`✅ ${a.s.tipo} "${a.s.nombre}" subió sin errores (${a.s.cmd.split(" -")[0]} · ${a.url})`)
          else { fallas++; L.push(`❌ ${a.s.tipo} "${a.s.nombre}" ${a.ok ? "subió CON errores" : "NO subió"}:\n${a.errores.map((e) => "   " + e).join("\n")}`) }
        }
      }
      const frente = arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok)
      const base = args.url ?? frente?.url ?? (arr ? undefined : (app = await iniciarApp(cwd).catch(() => null))?.url)
      try {
        if (!base) pendientes.push("no pude levantar la app sola: arráncala y llama de nuevo con url=<vista>")
        else {
          const dirWeb = frente?.s.dir ?? cwd
          const rel = files.map((f) => relative(dirWeb, join(cwd, f))).filter((f) => !f.startsWith(".."))
          const rutas = args.url ? [""] : frente?.s.tipo === "frontend" ? ["/"] : rutasAProbar(dirWeb, rel)
          // Prueba de humo del servidor (sirve para PHP aunque no haya navegador)
          const humo: string[] = []
          for (const r of rutas) { try { const res = await fetch(base + r, { signal: AbortSignal.timeout(15000) }); const cuerpo = await res.text(); const m = cuerpo.match(ERROR_PHP); if (res.status >= 500 || m) humo.push(`${r || "/"} → ${res.status}${m ? " · " + cuerpo.slice(Math.max(0, cuerpo.indexOf(m[0]) - 10), cuerpo.indexOf(m[0]) + 140).replace(/<[^>]+>/g, "").replace(/\s+/g, " ") : ""}`) } catch (e: any) { humo.push(`${r || "/"} → sin respuesta`) } }
          await new Promise((r) => setTimeout(r, 500))
          const delServidor = app ? [...new Set(app.errores().map((e) => e.split(cwd + "/").join("").split(cwd + "\\").join("").replace(/^\[[^\]]+\]\s*/, "")))].slice(0, 6) : []
          if (delServidor.length) humo.push(...delServidor.map((e) => `servidor: ${e}`))
          pruebas++
          if (humo.length) { fallas++; L.push(`❌ páginas con error del servidor${app ? ` (${app.como})` : ""}:\n${humo.map((h) => "   " + h.slice(0, 220)).join("\n")}`) } else L.push(`✅ páginas responden sin errores (${rutas.length})${app ? ` · app levantada con ${app.como}` : ""}`)
          // Navegador (lento): solo N2+, cierre, "revisa todo" o si pasaron url. N1 = prueba de humo del servidor (rápida).
          const pj = rank >= 2 || cierre || args.todo || args.url ? asegurarPlaywright(cwd) : "omitido"
          if (pj === "omitido") L.push("⏭ navegador: N1 (solo prueba de humo; consola completa en N2+/cierre)")
          else if (args.todo || cierre) { // cierre / "revisa todo": recorrer TODAS las páginas, no solo las tocadas
            const rs = await rastrearSitio(cwd, base, pj ?? null)
            pruebas++; if (rs.conNavegador) capturas = true; L.push(...rs.lineas); if (!rs.ok) fallas++
          }
          const conCapturas = pj !== "omitido" && !(args.todo && !cierre) // "revisa todo": el rastreo ya cubre consola; sin capturas extra
          if (!conCapturas) {}
          else if (!pj) pendientes.push("no pude instalar el navegador de pruebas (sin red?): revisa consola manualmente")
          else {
            const shots = join(cwd, ".skill_dey", "shots"); asegurarDir(shots)
            const anchos = rank >= 2 || cierre ? [375, 768, 1440] : [1440]
            const urls = rutas.map((r) => base + r)
            const script = join(tmpdir(), `skill_dey-snap-${Date.now()}.mjs`)
            writeFileSync(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright'); let Axe = null; try { Axe = require('@axe-core/playwright').default } catch {}
const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {}); const out = [];
for (const [i, u] of ${JSON.stringify(urls)}.entries()) for (const w of ${JSON.stringify(anchos)}) { const p = await b.newPage({ viewport: { width: w, height: 900 } }); const errs = [];
  p.on('console', m => ['error','warning'].includes(m.type()) && !/Failed to load resource|DevTools|favicon/.test(m.text()) && errs.push(m.type() + ': ' + m.text().slice(0,160))); p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => r.status() >= 400 && !/favicon/.test(r.url()) && errs.push(r.status() + ' ' + r.url()));
  try { await p.goto(u, { waitUntil: 'networkidle', timeout: 45000 }) } catch (e) { errs.push('no cargó: ' + e.message.slice(0,80)) }
  const f = ${JSON.stringify(shots)} + '/p' + i + '-' + w + '.png'; await p.screenshot({ path: f, fullPage: true }).catch(() => {});
  const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => false);
  let a11y = ''; if (Axe && w === 1440) { try { const r = await new Axe({ page: p }).analyze(); const v = r.violations.filter(x => ['serious','critical'].includes(x.impact)); a11y = ' · axe serias:' + v.length + (v.length ? ' (' + v.map(x => x.id).slice(0,5).join(',') + ')' : '') } catch {} }
  out.push(u.replace(/^https?:\\/\\/[^/]+/, '') + ' ' + w + 'px → .skill_dey/shots/p' + i + '-' + w + '.png' + (hscroll ? ' · ⚠ scroll horizontal' : '') + (errs.length ? ' · ⚠ ' + errs.slice(0,3).join(' | ') : ' · consola limpia') + a11y); await p.close(); }
await b.close(); console.log(out.join('\\n'));`)
            const r = sh(`node ${q(script)}`, cwd, 300_000)
            if (r.code === 0) { capturas = true; L.push(`📸 consola y capturas:\n${cola(r.out, 12)}`); if (/⚠|serias:[1-9]/.test(r.out)) { fallas++; L.push("❌ visual/consola: corrige lo marcado con ⚠") } ; if (cierre && rank >= 2) pendientes.push("mira UNA captura principal (read, o skill_dey_imagen si tu modelo no ve imágenes) y califica G14") }
            else if (/Executable doesn't exist|playwright install/i.test(r.out)) pendientes.push("falta el navegador: `npx playwright install chromium` en " + dirname(pj))
            else { fallas++; L.push(`❌ capturas\n${cola(r.out, 6)}`) }
          }
        }
      } finally { app?.detener(); for (const a of arr?.lista ?? []) a.detener() }
    }

    // 7c) Revisión de TODO el proyecto (a pedido y siempre en el cierre) + reglas de negocio contra la BD
    if (args.todo || cierre) {
      const rn = verificarReglas(cwd); L.push(...rn.lineas); fallas += rn.fallas
      const t = revisarTodo(cwd)
      L.push(...t.lineas.map((l, i) => (i === 0 ? "🔎 " + l : l)))
      if (!t.ok) fallas += 1
      const seg = resumenSeguridad(cwd); L.push(...seg.lineas); fallas += seg.criticos // huecos de seguridad por código
    }
    // 7d) Probador automático: usa la app como usuario y la ataca (solo cierre; 0 tokens del modelo)
    if (cierre && !args.rapido) {
      const pr = await probarApp(cwd, args.url).catch((e: any) => ({ ok: true, lineas: ["⏭ probador: " + e.message], fallas: 0 }))
      L.push(...pr.lineas); fallas += pr.fallas
      try { const fmt = formatear(cwd); if (!fmt.startsWith("⏭")) L.push(fmt) } catch {} // formato uniforme con el formateador del proyecto
      try { const v = validacionServidor(cwd); if (v.startsWith("⚠")) { L.push(v.split("\n")[0]); pendientes.push(v) } } catch {}
      try { const nb = consultasEnBucle(cwd); if (nb.length) pendientes.push("rendimiento: " + nb.length + " consulta(s) dentro de bucles (posible N+1) → " + nb.slice(0,3).join(" · ")) } catch {}
      try { const vp = verificarPlan(cwd); L.push(...vp.lineas); fallas += vp.fallas } catch {} // coherencia: ¿se cubrió todo lo pedido?
    }

    // 8a) Comentarios: todo archivo de código NUEVO lleva encabezado (propósito) y las funciones su docblock
    const nuevos = sh("git ls-files --others --exclude-standard", cwd, 20_000).out.split(/\r?\n/).filter((f) => files.includes(f) && /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/.test(f))
    const sinEncabezado = nuevos.filter((f) => !/^\s*(<\?php\s*)?(\/\/|\/\*|#|"""|'\'\'|<!--)/.test(leer(join(cwd, f)).replace(/^#!.*\n/, "").slice(0, 300)))
    if (sinEncabezado.length) pendientes.push(`archivos nuevos sin comentario de encabezado (propósito del archivo): ${sinEncabezado.slice(0, 5).join(", ")}`)

    // 8b) TDD (Superpowers): en N2/N3 todo cambio de código trae su prueba nueva o actualizada
    const esPrueba = (f: string) => /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|_test\.(py|go)$|test_[^/]+\.py$|Test\.php$/i.test(f.replace(/\\/g, "/"))
    const codigoCambiado = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/.test(f) && !esPrueba(f))
    if (rank >= 2 && codigoCambiado.length && !files.some(esPrueba)) { fallas++; L.push("❌ TDD: cambio N2/N3 sin prueba nueva o actualizada → escribe primero la prueba que demuestra el comportamiento y vuelve a verificar") }

    // 8c) Cambio quirúrgico (Karpathy): el tamaño del diff debe corresponder al nivel
    const ns = sh("git diff --numstat HEAD --", cwd, 20_000)
    if (ns.code === 0) {
      const lineas = ns.out.split(/\r?\n/).filter(Boolean).map((l) => l.split("\t")).filter((x) => files.includes(x[2])).reduce((a, x) => a + (Number(x[0]) || 0) + (Number(x[1]) || 0), 0)
      const tope = [12, 150, 800, 2000][rank]
      if (lineas > tope) pendientes.push(`cambio poco quirúrgico: ${lineas} líneas tocadas para un ${n} (tope orientativo ${tope}). Revisa el diff: quita reformateos, renombres o refactors que no pidieron`)
    }

    // 9) Lo que un script no puede decidir → queda explícito para el modelo
    if (areas.has("db") && rank >= 2) pendientes.push("migración: ejecutar up → down → up en BD de prueba")
    if (areas.has("datos") && rank >= 1) pendientes.push("datos: tests dorados + conciliación dashboard = detalle = export (G15)")
    if (areas.has("config")) pendientes.push("config: ¿.env.example actualizado y validado al arrancar?")

    const ok = fallas === 0
    asegurarDir(join(cwd, ".skill_dey"))
    if (cierre) { try { aprenderDeCorrida(cwd, "cierre", L) } catch {} } // aprende de cada cierre (0 tokens)
    const confianza = !ok ? "—" : pruebas > 0 && (!hayUI || capturas) ? "ALTA" : pruebas > 0 || capturas ? "MEDIA" : rank === 0 ? "ALTA (N0: solo texto)" : "BAJA (no hubo pruebas reales)"
    if (ok && /BAJA/.test(confianza) && (hayUI || rank >= 2)) L.push("⚠ confianza BAJA: no afirmes 'listo' — faltan pruebas reales. Corre `skill_dey_qa` accion:pruebas antes de cerrar.")
    // Ciclos seguidos sin verde (se reinicia al quedar verde o tras 3 h): el 4º ciclo es DIAGNÓSTICO SISTEMÁTICO
    const previo = leerJson(join(cwd, ".skill_dey", ".ultimo-verificar.json"))
    const rojos = ok ? 0 : (previo && !previo.ok && Date.now() - (previo.ts ?? 0) < 3 * 3600_000 ? (previo.rojos ?? 1) : 0) + 1
    if (rojos === 3) L.push("🔁 3 ciclos seguidos sin verde → CICLO 4: carga references/diagnostico-sistematico.md y síguelo paso a paso (síntoma literal → reproducir → capa → entorno → hipótesis comprobable → cambio mínimo → recorrido real). Abandona el enfoque anterior.")
    if (rojos >= 4) L.push("⛔ FRENO: el ciclo 4 (diagnóstico sistemático) tampoco quedó verde → skill_dey_deshacer al último verde y reporta hechos · hipótesis · siguiente paso con 2–3 opciones. No sigas intentando.")
    writeFileSync(join(cwd, ".skill_dey", ".ultimo-verificar.json"), JSON.stringify({ ok, ts: Date.now(), nivel: n, cierre, archivos: files.length, ui: hayUI, capturas, pruebas, confianza, rojos }))
    // Autodiagnóstico: ¿el guardián está cargado en este OpenCode? (si no, las protecciones automáticas están apagadas)
    let guardian = ""
    try { const pid = readFileSync(join(GLOBAL_DIR, ".guardian-activo"), "utf8").trim(); if (pid !== String(process.pid)) guardian = "⚠ GUARDIÁN NO ACTIVO en esta sesión: copias automáticas, bloqueos y verificación final apagados. Avisa al usuario: reinstalar skill_dey o revisar el plugin." } catch { guardian = "⚠ GUARDIÁN NO ACTIVO: avisa al usuario que reinstale skill_dey." }
    // Ahorro de tokens: si todo está verde, 1-2 líneas (el detalle solo se muestra cuando hay algo que corregir)
    if (ok && !guardian) return [`SKILL_DEY verificar · ${n} · ${files.length} archivos · ${Math.round((Date.now() - t0) / 1000)}s · ✅ todo verde · confianza ${confianza} (${L.filter((l) => l.startsWith("✅")).length} chequeos)`,
      ...L.filter((l) => /^🔁|^⛔|^🔧/.test(l)), ...(pendientes.length ? ["⚠ PENDIENTE: " + pendientes.join(" · ")] : [])].join("\n")
    return [
      `SKILL_DEY verificar · ${n}${cierre ? " · cierre" : ""} · áreas: ${[...areas].join(",") || "-"} · ${files.length} archivos · ${Math.round((Date.now() - t0) / 1000)}s`,
      ...L,
      ...(guardian ? [guardian] : []),
      ...(pendientes.length ? ["⚠ PENDIENTE (tú):", ...pendientes.map((p) => "   - " + p)] : []),
      `RESULTADO: ${ok ? "✅ todo verde" : `❌ ${fallas} falla(s)`} · confianza ${confianza}`,
    ].join("\n")
  },
})

// ======================================================================
export const impacto = tool({
  description:
    "Usos de un término en el proyecto + riesgo + nivel sugerido. Antes de cambiar algo existente.",
  args: {
    termino: tool.schema.string().describe("término exacto"),
    max: tool.schema.number().optional().describe("defecto 25"),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const t = args.termino, max = args.max ?? 25
    let hits: { f: string; n: number; l: string }[] = []
    const gr = spawnSync("git", ["-c", "core.quotepath=off", "grep", "-n", "-I", "-F", "-e", t, "--", ".", ":!node_modules", ":!vendor", ":!dist", ":!build", ":!*.min.*", ":!*lock*", ":!.skill_dey"], { cwd, encoding: "utf8", maxBuffer: 50_000_000, timeout: 60_000 })
    const g = { code: gr.status ?? 2, out: `${gr.stdout ?? ""}` }
    if (g.code === 0 || g.code === 1) {
      hits = g.out.split(/\r?\n/).filter(Boolean).map((x) => { const m = x.match(/^(.+?):(\d+):(.*)$/); return m ? { f: m[1], n: +m[2], l: m[3].trim() } : null }).filter(Boolean) as any
    } else {
      const walk = (d: string, acc: string[] = []) => { for (const e of readdirSync(d)) { const p = join(d, e); if (IGNORAR.test(p)) continue; const st = statSync(p); if (st.isDirectory()) walk(p, acc); else if (st.size < 1_000_000) acc.push(p) } return acc }
      for (const p of walk(cwd)) leer(p).split(/\r?\n/).forEach((l, i) => { if (l.includes(t)) hits.push({ f: relative(cwd, p), n: i + 1, l: l.trim() }) })
    }
    if (!hits.length) return `SKILL_DEY impacto "${t}": 0 usos. Si vas a CREARLO → nivel según lo que construyas. Si esperabas encontrarlo, revisa ortografía/mayúsculas (no inventes nombres).`
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const cat = { i18n: 0, test: 0, backend: 0, frontend: 0, db: 0, comparacion: 0, identificador: 0, estilo: 0 }
    for (const h of hits) {
      const p = h.f.toLowerCase()
      if (/(locale|lang|i18n|translation|messages)/.test(p) || /\.(po|pot)$/.test(p)) cat.i18n++
      if (/(test|spec|__tests__|e2e|cypress)/.test(p)) cat.test++
      if (/\.(sql)$|migrat|schema\.prisma/.test(p)) cat.db++
      else if (/\.(php|py|go|java|cs|rb)$/.test(p) && !p.endsWith(".blade.php") || /(server|backend|api)\//.test(p)) cat.backend++
      else if (/\.(css|scss|less)$/.test(p)) cat.estilo++
      else cat.frontend++
      if (new RegExp(`[=!]==?\\s*["'\`]${esc}["'\`]|["'\`]${esc}["'\`]\\s*[=!]==?|case\\s+["'\`]${esc}["'\`]|\\bin\\s*\\(.*["']${esc}["']`).test(h.l)) cat.comparacion++
      if (new RegExp(`(name|id|key|data-testid|for|v-model|formControlName)\\s*[=:]\\s*["'\`]${esc}["'\`]|["'\`]${esc}["'\`]\\s*:|\\$(_POST|_GET|request)\\[["']${esc}["']\\]|\\.${esc}\\b`).test(h.l)) cat.identificador++
    }
    const archivos = [...new Set(hits.map((h) => h.f))]
    let nivel = "N0", por = "solo texto visible en un lugar"
    if (cat.db || (cat.backend && cat.frontend && (cat.identificador || cat.comparacion))) { nivel = "N3"; por = "cruza BD o front↔back como identificador" }
    else if (cat.comparacion || cat.identificador || cat.i18n || cat.test) { nivel = "N1"; por = "se usa como identificador/comparación/i18n/test" }
    else if (archivos.length > 3) { nivel = "N1"; por = `aparece en ${archivos.length} archivos (componente compartido)` }
    const lista = hits.slice(0, max).map((h) => `   ${h.f}:${h.n}  ${h.l.slice(0, 140)}`).join("\n")
    return [
      `SKILL_DEY impacto "${t}": ${hits.length} usos en ${archivos.length} archivos → nivel sugerido ${nivel} (${por})`,
      `   i18n:${cat.i18n} tests:${cat.test} backend:${cat.backend} frontend:${cat.frontend} bd:${cat.db} estilos:${cat.estilo} comparaciones:${cat.comparacion} identificador:${cat.identificador}`,
      lista, hits.length > max ? `   … ${hits.length - max} más` : "",
      nivel === "N0" ? "→ Cambia solo el texto visible." : "→ Si es identificador, NO lo renombres a ciegas: cambia la etiqueta visible o actualiza TODOS los usos en la misma iteración.",
    ].filter(Boolean).join("\n")
  },
})

// ======================================================================
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2)
const jaccard = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i || 1) }
function guardarLinea(archivo: string, encabezado: string, linea: string, etiquetas: string) {
  asegurarDir(dirname(archivo))
  const lineas = existsSync(archivo) ? readFileSync(archivo, "utf8").split(/\r?\n/) : [encabezado]
  const nueva = norm(linea)
  const idx = lineas.findIndex((l) => l.includes(etiquetas.split(/\s+/)[0] ?? "§§") && jaccard(norm(l), nueva) >= 0.55)
  let accion = "guardada"
  if (idx >= 0) { lineas[idx] = linea; accion = "actualizada (ya existía similar)" } else lineas.push(linea)
  const utiles = lineas.filter((l) => l.trim())
  writeFileSync(archivo, utiles.join("\n") + "\n")
  return `${accion} en ${archivo.startsWith(GLOBAL_DIR) ? "memoria global" : ".skill_dey/" + basename(archivo)}${utiles.length > 220 ? " · ⚠ archivo largo: condénsalo" : ""}`
}

export const leccion = tool({
  description:
    "Guarda una lección (acierto, error, corrección o preferencia).",
  args: {
    tipo: tool.schema.enum(["ok", "error", "modo", "preferencia", "vacuna", "regla", "solucion"]).describe("vacuna: patron · regla: sql · solucion: cómo se resolvió"),
    etiquetas: tool.schema.string().describe("ej: [php][pdf]"),
    texto: tool.schema.string().describe("qué pasó → qué hacer"),
    alcance: tool.schema.enum(["proyecto", "global", "ambos"]).optional().describe("defecto ambos"),
    patron: tool.schema.string().optional().describe("regex"),
    ext: tool.schema.string().optional().describe("php|js"),
    sql: tool.schema.string().optional().describe("SELECT COUNT(*) que incumplen"),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    if (args.tipo === "vacuna") return args.patron ? agregarVacuna(args.patron, args.ext ?? "", `${args.etiquetas} ${args.texto}`.trim()) : "vacuna sin patron"
    if (args.tipo === "regla") { const r = args.sql ? agregarRegla(cwd, args.texto, args.sql) : "regla sin sql"; try { appendFileSync(join(cwd, ".skill_dey", "NEGOCIO.md"), `\n- Regla: ${args.texto}`) } catch {} ; return r }
    if (args.tipo === "solucion") { try { return _guardarSol(cwd, args.etiquetas, args.texto.split("→")[0] ?? args.texto, args.texto.split("→")[1] ?? args.texto) } catch (e: any) { return "no pude guardar: " + e.message } }
    const icono = { ok: "✅", error: "❌", modo: "🧭", preferencia: "⭐" }[args.tipo]
    const fecha = new Date().toISOString().slice(0, 10)
    const linea = `${icono} ${args.etiquetas.trim()} ${args.texto.trim()} (${fecha})`
    const alcance = args.alcance ?? (["preferencia", "modo"].includes(args.tipo) ? "global" : "ambos")
    const r: string[] = []
    if (args.tipo === "preferencia") r.push(guardarLinea(join(GLOBAL_DIR, "PREFERENCIAS.md"), "# PREFERENCIAS del usuario (todas las apps)", linea, args.etiquetas))
    else {
      if (alcance !== "global") r.push(guardarLinea(join(cwd, ".skill_dey", "LECCIONES.md"), "# LECCIONES (✅ repetir · ❌ no repetir · 🧭 modo) — una línea, con [etiquetas]", linea, args.etiquetas))
      if (alcance !== "proyecto") r.push(guardarLinea(join(GLOBAL_DIR, "LECCIONES-GLOBALES.md"), "# LECCIONES GLOBALES (aplican a todos los proyectos)", linea, args.etiquetas))
    }
    return "SKILL_DEY lección " + r.join(" · ")
  },
})

export const recordar = tool({
  description:
    "Lecciones, negocio y estado relevantes para un tema.",
  args: { tema: tool.schema.string().describe("palabras clave") },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const claves = norm(args.tema)
    const fuentes: [string, string][] = [
      ["proyecto", join(cwd, ".skill_dey", "LECCIONES.md")], ["decisiones", join(cwd, ".skill_dey", "DECISIONES.md")],
      ["global", join(GLOBAL_DIR, "LECCIONES-GLOBALES.md")],
    ]
    const cand: { s: number; t: string }[] = []
    for (const [origen, f] of fuentes) for (const l of leer(f).split(/\r?\n/)) {
      if (!l.trim() || l.startsWith("#")) continue
      const w = norm(l); const s = claves.filter((c) => w.some((x) => x.startsWith(c) || c.startsWith(x))).length + (/^(❌|🧭)/.test(l) ? 0.5 : 0)
      if (s > 0) cand.push({ s, t: `[${origen}] ${l.slice(0, 200)}` })
    }
    const prefs = leer(join(GLOBAL_DIR, "PREFERENCIAS.md")).split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#")).slice(-12)
    const top = cand.sort((a, b) => b.s - a.s).slice(0, 12).map((c) => c.t)
    const marca = existsSync(join(cwd, ".skill_dey", "MARCA.md")) ? "MARCA.md del proyecto existe → úsala en diseño." : ""
    const neg = leer(join(cwd, ".skill_dey", "NEGOCIO.md")).split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#") && !l.includes("…"))
    const negocio = neg.length ? ["Negocio del proyecto (.skill_dey/NEGOCIO.md):", ...neg.slice(0, 18).map((l) => "   " + l.slice(0, 160))] : ["⚠ Sin NEGOCIO.md: en tareas N2/N3 créalo (deduce del código; pregunta solo lo que falte, máx. 5 preguntas, una vez)."]
    const prin = (() => { try { return _principios(cwd) } catch { return "" } })()
    const sol = (() => { try { return _buscarSol(cwd, args.tema) } catch { return "" } })()
    return [
      `SKILL_DEY recordar "${args.tema}": ${top.length} lecciones relevantes`,
      prin ? "PRINCIPIOS de la app (respétalos):\n" + prin.split("\n").filter((l: string) => l.startsWith("-")).join("\n") : "",
      ...negocio, sol, ...top, prefs.length ? "Preferencias del usuario:" : "", ...prefs.map((p) => "   " + p), marca,
    ].filter(Boolean).join("\n") || "Sin lecciones aún."
  },
})

// ======================================================================
export const deshacer = tool({
  description:
    "Deshace/rehace el último cambio o muestra el historial.",
  args: {
    accion: tool.schema.enum(["deshacer", "rehacer", "historial"]).optional().describe("defecto deshacer"),
    pasos: tool.schema.number().optional().describe("defecto 1"),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    if (args.accion === "historial") return _historial(cwd)
    if (args.accion === "rehacer") return _rehacer(cwd)
    return _deshacer(cwd, args.pasos ?? 1) + "\n→ Ahora ejecuta skill_dey_verificar para confirmar que la app quedó funcionando."
  },
})

// ======================================================================
export const mapa = tool({
  description:
    "Mapa corto del proyecto (antes de explorar).",
  args: {
    ruta: tool.schema.string().optional().describe("subcarpeta"),
    forzar: tool.schema.boolean().optional().describe("regenerar"),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const destino = join(cwd, ".skill_dey", "MAPA.md")
    let files: string[] = []
    const g = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8", maxBuffer: 100_000_000 })
    if (g.status === 0) files = g.stdout.split(/\r?\n/).filter(Boolean)
    else { const walk = (d: string): void => { for (const e of readdirSync(d)) { const p = join(d, e); if (IGNORAR.test(p)) continue; const st = statSync(p); st.isDirectory() ? walk(p) : files.push(relative(cwd, p)) } }; walk(cwd) }
    files = files.filter((f) => !IGNORAR.test(f) && !f.startsWith(".skill_dey/") && !/\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|eot|pdf|zip|lock|map|min\.js|min\.css)$/i.test(f) && !/(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock)$/.test(f))
    if (args.ruta) files = files.filter((f) => f.replace(/\\/g, "/").startsWith(args.ruta!.replace(/\\/g, "/")))
    const firma = files.length + ":" + Math.max(0, ...files.map((f) => { try { return statSync(join(cwd, f)).mtimeMs } catch { return 0 } }))
    if (!args.forzar && !args.ruta && existsSync(destino)) {
      const prev = leer(destino); if (prev.includes(`<!-- firma ${firma} -->`)) return prev
    }
    const SIM = /^\s*(?:export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+(\w+)|(?:public\s+|private\s+|protected\s+)?(?:static\s+)?function\s+(\w+)|class\s+(\w+)|def\s+(\w+)|func\s+(?:\([^)]*\)\s*)?(\w+)|(?:Route|router|app)\.(?:get|post|put|patch|delete)\s*\(\s*['"]([^'"]+))/
    const porDir = new Map<string, string[]>()
    const grandes: string[] = []
    let total = 0
    for (const f of files.sort()) {
      const txt = leer(join(cwd, f)); const lineas = txt ? txt.replace(/\r?\n$/, "").split(/\r?\n/).length : 0; total += lineas
      const simbolos: string[] = []
      if (/\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/.test(f)) for (const l of txt.split(/\r?\n/)) { const m = l.match(SIM); if (m) { const n = m.slice(1).find(Boolean); if (n && !simbolos.includes(n)) simbolos.push(n); if (simbolos.length >= 6) break } }
      if (lineas > 400 && /\.(m?[jt]sx?|vue|svelte|php|py|go|java|cs|rb)$/.test(f)) grandes.push(`${f} (${lineas})`)
      const d = dirname(f).replace(/\\/g, "/")
      if (!porDir.has(d)) porDir.set(d, [])
      porDir.get(d)!.push(`  ${basename(f)} ${lineas}L${simbolos.length ? " · " + simbolos.join(", ") : ""}`)
    }
    const out = [`# MAPA del proyecto (${files.length} archivos · ${total} líneas) — generado por skill_dey_mapa`, `<!-- firma ${firma} -->`]
    let usadas = 0
    for (const [d, l] of porDir) {
      if (usadas > 220) { out.push(`… (${porDir.size} carpetas en total; usa ruta=<carpeta> para detallar)`); break }
      out.push(`${d === "." ? "(raíz)" : d}/`); const mostrar = l.slice(0, 25); out.push(...mostrar); if (l.length > 25) out.push(`  … +${l.length - 25} archivos`); usadas += mostrar.length + 1
    }
    if (grandes.length) out.push("", `⚠ Archivos >400 líneas (difíciles de leer; al tocarlos, propón dividirlos): ${grandes.slice(0, 10).join(", ")}`)
    const texto = out.join("\n")
    if (!args.ruta) { asegurarDir(join(cwd, ".skill_dey")); writeFileSync(destino, texto) }
    return texto
  },
})

// ======================================================================

// ======================================================================
export const procesos = tool({
  description: "Puertos/servidores: listar·liberar·levantar·detener.",
  args: {
    accion: tool.schema.enum(["listar", "liberar", "levantar", "detener"]).optional().describe("defecto: listar"),
    puerto: tool.schema.number().optional().describe("puerto"),
  },
  async execute(a, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const acc = a.accion ?? "listar"
    if (acc === "liberar") return a.puerto ? liberarPuerto(a.puerto) : servicios(cwd).map((s) => liberarPuerto(s.puerto)).join("\n")
    if (acc === "detener") return detenerTodo(cwd)
    if (acc === "levantar") {
      const r = await conTiempo(arranqueLimpio(cwd), 95_000, { lista: [], notas: ["⏱ el arranque tardó demasiado y se detuvo; revisa el comando del servidor o súbelo a mano"] })
      return [...r.notas.map((n) => "🔧 " + n), ...r.lista.map((x) => `${x.ok && !x.errores.length ? "✅" : "❌"} ${x.s.tipo} "${x.s.nombre}" → ${x.url}${x.errores.length ? "\n   " + x.errores.join("\n   ") : ""}`), "Quedan corriendo; para bajarlos: skill_dey_procesos(accion:\"detener\")."].join("\n")
    }
    const ps = escuchando().filter(esDeDesarrollo)
    const sv = servicios(cwd)
    return [`Servicios del proyecto: ${sv.map((s) => `${s.tipo} "${s.nombre}" (${s.cmd} · puerto ${s.puerto})`).join(" | ") || "ninguno detectado"}`,
      ps.length ? "Servidores de desarrollo escuchando:\n" + ps.map((p) => `   :${p.puerto} · PID ${p.pid} · ${p.cmd.slice(0, 80)}`).join("\n") : "No hay servidores de desarrollo escuchando."].join("\n")
  },
})

// ======================================================================
export const adoptar = tool({
  description: "Adopta app existente: revisión total + informe.",
  args: {},
  async execute(_a, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const t0 = Date.now()
    const copia = foto(cwd, "pasos", "cambio", "estado ANTES de la adopción por skill_dey")
    const todo = revisarTodo(cwd)
    const arr = servicios(cwd).length ? await arranqueLimpio(cwd).catch(() => null) : null
    const web = arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok)
    let sitio: Awaited<ReturnType<typeof rastrearSitio>> | null = null
    try { if (web) sitio = await rastrearSitio(cwd, web.url, asegurarPlaywright(cwd)) } catch {}
    for (const a of arr?.lista ?? []) a.detener()
    const H = analizar(cwd)
    const Hs = (() => { try { return auditarSeguridad(cwd) } catch { return [] } })()
    let docs = ""; try { docs = _documentar(cwd) } catch (e: any) { docs = "documentación: " + e.message }
    const neg = join(cwd, ".skill_dey", "NEGOCIO.md")
    if (!existsSync(neg)) { asegurarDir(join(cwd, ".skill_dey")); writeFileSync(neg, "# NEGOCIO — completar desde el código (máx. ~40 líneas)\nQué es: …\nUsuarios y roles: …\nFlujos principales: …\nReglas de negocio: …\nEstados: …\nGlosario: …\nIntegraciones: …\nQué NO se debe tocar: …\n") }
    const arranque = (arr?.lista ?? []).map((a) => `${a.ok && !a.errores.length ? "✅" : "❌"} ${a.s.tipo} "${a.s.nombre}"${a.errores.length ? ": " + a.errores.slice(0, 3).join(" | ") : " arranca sin errores"}`)
    const informe = [
      `# ADOPCIÓN — ${basename(cwd)} · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      `Copia de seguridad previa: ${copia ? "sí (skill_dey_deshacer la restaura)" : "no disponible (sin git)"}`,
      "", "## 1. Estado técnico", ...todo.lineas, ...(arranque.length ? arranque : ["(no se detectó cómo arrancar la app)"]), ...(sitio ? sitio.lineas : []),
      "", "## 2. Hallazgos priorizados (detectados por código)",
      ...(H.length ? H.map((h, i) => `${i + 1}. [${h.prioridad}·${h.tipo}] ${h.texto}\n   ${h.donde.join(" · ")}`) : ["Sin hallazgos automáticos."]),
      "", "## 2b. Seguridad",
      ...(Hs.length ? Hs.map((h: any) => `- [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 3).join(", ")}`) : ["Sin huecos de seguridad conocidos."]),
      "", "## 3. Plan", "- rompe/seguridad CRÍTICO-ALTO → se corrigen ya (cada uno verificado y reversible).", "- lógica de negocio → se PROPONEN al usuario con opción recomendada; se aplican solo con su OK.", "- calidad → se atienden al tocar cada zona.",
      "", "## 4. Estado de corrección", "(el agente marca aquí cada punto: ✅ corregido · 🟡 propuesto · ⏸ pospuesto)",
    ].join("\n")
    writeFileSync(join(cwd, ".skill_dey", "ADOPCION.md"), informe)
    const n = (p: string) => H.filter((h) => h.prioridad === p).length
    return [
      `ADOPCIÓN lista en ${Math.round((Date.now() - t0) / 1000)} s → .skill_dey/ADOPCION.md`,
      `Código: ${todo.ok ? "✅ sin errores de sintaxis/tipos/lint" : `❌ ${todo.errores} problema(s)`} · Arranque: ${arranque.length ? arranque.map((x) => x.slice(0, 2)).join(" ") : "no detectado"}`,
      ...(sitio ? [sitio.lineas[0] + " → .skill_dey/ERRORES-SITIO.md"] : []),
      `Hallazgos: ${n("CRÍTICO")} críticos · ${n("ALTO")} altos · ${n("MEDIO")} medios · ${n("BAJO")} bajos`,
      ...H.slice(0, 8).map((h) => `  [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 2).join(", ")}`),
      docs.split("\n")[0],
      "SIGUIENTE (references/adopcion.md): 1) completa NEGOCIO.md leyendo solo lo necesario · 2) corrige TODOS los errores del sitio (ERRORES-SITIO.md, references/depuracion.md) y 'rompe' + seguridad CRÍTICO/ALTO uno por uno con skill_dey_verificar · 3) revisa la lógica de negocio y PROPÓN (no apliques) los cambios de lógica · 4) deja la app arrancando sin errores · 5) informe ≤8 líneas.",
    ].join("\n")
  },
})

// ======================================================================
export const sitio = tool({
  description: "Recorre el sitio y lista errores.",
  args: { url: tool.schema.string().optional().describe("si la app ya corre"), max: tool.schema.number().optional().describe("defecto 40") },
  async execute(a, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const t0 = Date.now(), L: string[] = []
    let arr: Awaited<ReturnType<typeof arranqueLimpio>> | null = null, app: Awaited<ReturnType<typeof iniciarApp>> = null
    try {
      if (!a.url && servicios(cwd).length) {
        arr = await arranqueLimpio(cwd).catch(() => null)
        for (const x of arr?.lista ?? []) L.push(x.ok && !x.errores.length ? `✅ ${x.s.tipo} "${x.s.nombre}" arranca sin errores` : `❌ ${x.s.tipo} "${x.s.nombre}" ${x.ok ? "arranca CON errores" : "NO arranca"}: ${x.errores.slice(0, 4).join(" | ")}`)
      }
      const web = arr?.lista.find((x) => x.ok && x.s.tipo === "frontend") ?? arr?.lista.find((x) => x.ok)
      const base = a.url ?? web?.url ?? (arr?.lista.length ? undefined : (app = await iniciarApp(cwd).catch(() => null))?.url)
      if (!base) return [...L, "❌ no pude levantar la app: usa skill_dey_procesos(levantar) o pásame url=<base>"].join("\n")
      const r = await rastrearSitio(cwd, base, asegurarPlaywright(cwd), a.max ?? 40)
      const srv = app ? app.errores().slice(0, 6).map((e) => "   servidor: " + e) : []
      const ok = r.ok && !srv.length && !L.some((l) => l.startsWith("❌"))
      return [`SKILL_DEY sitio · ${r.paginas} páginas · ${Math.round((Date.now() - t0) / 1000)}s`, ...L, ...r.lineas, ...srv,
        ok ? "RESULTADO: ✅ sitio sin errores" : "RESULTADO: ❌ corrige cada error por causa raíz (references/depuracion.md), marca [x] en .skill_dey/ERRORES-SITIO.md y vuelve a llamar skill_dey_sitio hasta 0"].join("\n")
    } finally { app?.detener(); for (const x of arr?.lista ?? []) x.detener() }
  },
})


// ======================================================================
export const buscar_skill = tool({
  description: "¿Hay skill instalada para el tema? Si no, sugiere instalar una (no instala). Úsalo cuando no tengas rutina/skill para lo pedido.",
  args: { tema: tool.schema.string().describe("tema o tecnología del pedido") },
  async execute(a, ctx) { return buscarSkill(ctx.worktree || ctx.directory, a.tema) },
})

// ======================================================================
// QA y mantenimiento en UNA sola herramienta (menos tokens: antes eran 9 herramientas). Mismas funciones, un despachador.
export const qa = tool({
  description: "QA/mantenimiento: seguridad·probar·pruebas(suite profesional+smoke)·capacitar(video subtitulado)·formato·validar·rendir·produccion·organizar·documentar·bd.",
  args: {
    accion: tool.schema.enum(["seguridad", "probar", "pruebas", "capacitar", "movil", "formato", "validar", "rendir", "produccion", "organizar", "documentar", "bd"]).describe("qué revisar/hacer"),
    url: tool.schema.string().optional().describe("probar/pruebas/capacitar/rendir: si la app ya corre"),
    todo: tool.schema.boolean().optional().describe("formato: todo el proyecto"),
  },
  async execute(a, ctx) {
    const cwd = ctx.worktree || ctx.directory
    switch (a.accion) {
      case "seguridad": return [...resumenSeguridad(cwd).lineas, ...auditarDependencias(cwd), semgrep(cwd)].filter(Boolean).join("\n")
      case "probar": return (await probarApp(cwd, a.url)).lineas.join("\n")
      case "pruebas": { const r = await pruebasProfesionales(cwd, a.url); try { aprenderDeCorrida(cwd, "pruebas", r.lineas) } catch {} ; return r.lineas.join("\n") }
      case "capacitar": { const r = await capacitar(cwd, a.url); return r.lineas.join("\n") }
      case "movil": { const r = revisarMovil(cwd); try { aprenderDeCorrida(cwd, "movil", r.lineas) } catch {} ; return r.lineas.join("\n") }
      case "formato": return formatear(cwd, !a.todo)
      case "validar": return validacionServidor(cwd)
      case "produccion": return [erroresProduccion(cwd), sentryCheck(cwd)].filter(Boolean).join("\n")
      case "organizar": return _organizar(cwd)
      case "bd": return copiaPrueba(cwd)
      case "documentar": { const d = _documentar(cwd); let pdf = ""; try { pdf = documentosPdf(cwd) } catch (e: any) { pdf = "PDF: " + e.message } ; return d + "\n" + pdf }
      case "rendir": {
        let arr: any = null, app: any = null, base = a.url
        try {
          if (!base && servicios(cwd).length) { arr = await conTiempo(arranqueLimpio(cwd), 95_000, null).catch(() => null); base = (arr?.lista.find((x: any) => x.ok && x.s.tipo === "frontend") ?? arr?.lista.find((x: any) => x.ok))?.url }
          if (!base) base = (app = await iniciarApp(cwd).catch(() => null))?.url
          const rutas = base ? rutasAProbar(cwd, []) : []
          const r = await rendimiento(cwd, base, rutas, asegurarPlaywright(cwd)); return r.lineas.join("\n")
        } finally { app?.detener?.(); for (const x of arr?.lista ?? []) x.detener?.() }
      }
    }
  },
})

// ======================================================================
export const plan = tool({
  description: "Plan por requisitos; el cierre verifica que estén hechos.",
  args: {
    requisitos: tool.schema.array(tool.schema.string()).optional().describe("una línea por parte a cubrir"),
    hecho: tool.schema.string().optional().describe("marca como cubierto el requisito que contenga este texto"),
    tarea: tool.schema.string().optional().describe("nombre de la tarea"),
  },
  async execute(a, ctx) {
    const cwd = ctx.worktree || ctx.directory
    if (a.hecho) return marcarPlan(cwd, a.hecho)
    if (a.requisitos?.length) return guardarPlan(cwd, a.requisitos, a.tarea)
    const e = verificarPlan(cwd); return e.lineas.join("\n") || "sin plan activo"
  },
})
