#!/usr/bin/env node
// SKILL DEY — construye TODO desde una sola fuente (app/):
//   1) sincroniza la versión (app/skill_dey/VERSION) en todos los archivos,
//   2) empaqueta el motor (CLI, servidor MCP y hook) en archivos .mjs sin dependencias (requiere bun),
//   3) genera los paquetes de cada IA en hosts/: claude-code, gemini-cli, antigravity.
// Uso: node scripts/build.mjs [--sin-bundle]
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, copyFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..")
const APP = join(RAIZ, "app")
const V = readFileSync(join(APP, "skill_dey", "VERSION"), "utf8").trim()
const leer = (p) => readFileSync(join(RAIZ, p), "utf8")
const escribir = (p, t) => { const f = join(RAIZ, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, t) }
const json = (p, o) => escribir(p, JSON.stringify(o, null, 2) + "\n")
const reemplazar = (p, re, por) => { const t = leer(p); const n = t.replace(re, por); if (n !== t) escribir(p, n) }
const paso = (t) => console.log(`  • ${t}`)

const AUTOR = { name: "Ing. Dey (@IngDey)", url: "https://github.com/IngDey" }
const REPO = "https://github.com/IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite"
const DESC = "Agentes de IA que programan sin romper tu app: guardián en vivo, deshacer cualquier cambio, cero errores, seguridad y documentación automática."
const KEYWORDS = ["ai", "agents", "skills", "mcp", "quality", "security", "undo", "zero-errors", "spanish"]

console.log(`\nSKILL DEY ${V} · build`)

// ---------- 1) versión ----------
reemplazar("app/plugins/skill_dey-guardian.ts", /const VERSION = "[\d.]+"/, `const VERSION = "${V}"`)
reemplazar("app/skills/skill-dey/SKILL.md", /version: "[\d.]+"/, `version: "${V}"`)
for (const s of ["skill-dey", "politicas-ia"]) reemplazar(`app/portable/skills/${s}/SKILL.md`, /version: "[\d.]+"/, `version: "${V}"`)
reemplazar("app/instalador/instalar.mjs", /esc\(join\(OC, "skill_dey", "VERSION"\), "[\d.]+"\)/, `esc(join(OC, "skill_dey", "VERSION"), "${V}")`)
reemplazar("app/instalador/instalar-sin-node.sh", /echo "[\d.]+" > "\$OC\/skill_dey\/VERSION"/, `echo "${V}" > "$OC/skill_dey/VERSION"`)
reemplazar("app/instalador/instalar-sin-node.ps1", /'skill_dey\/VERSION'\), '[\d.]+'\)/, `'skill_dey/VERSION'), '${V}')`)
reemplazar("CITATION.cff", /^version: .*$/m, `version: ${V}`)
paso(`versión ${V} sincronizada`)

// ---------- 2) motor empaquetado ----------
const BUNDLES = [["cli.ts", "app/cli/skill_dey.mjs"], ["mcp.ts", "app/mcp/skill_dey-mcp.mjs"], ["hook.ts", "app/hook/skill_dey-hook.mjs"]]
if (!process.argv.includes("--sin-bundle")) {
  for (const [src, out] of BUNDLES) {
    const r = spawnSync("bun", ["build", join(APP, "skill_dey-lib", src), "--target=node", "--format=esm", `--define=SKILL_DEY_VERSION="${V}"`, `--outfile=${join(RAIZ, out)}`], { encoding: "utf8" })
    if (r.status !== 0) { console.error(r.stderr || r.stdout || r.error?.message); console.error("✖ Falta bun (https://bun.sh) o hay un error de compilación. Usa --sin-bundle para reutilizar los .mjs actuales."); process.exit(1) }
    const t = readFileSync(join(RAIZ, out), "utf8")
    if (!t.startsWith("#!")) writeFileSync(join(RAIZ, out), `#!/usr/bin/env node\n// SKILL DEY ${V} · generado por scripts/build.mjs desde app/skill_dey-lib/${src} — no editar a mano\n${t}`)
  }
  paso("motor empaquetado (CLI, MCP, hook)")
}
for (const [, out] of BUNDLES) if (!existsSync(join(RAIZ, out))) { console.error(`✖ falta ${out}: corre el build sin --sin-bundle`); process.exit(1) }

// ---------- 3) paquetes por IA ----------
const REGLAS = leer("app/portable/REGLAS.md")
const agentes = {
  "skill-dey-revisor": { claude: { tools: "Read, Grep, Glob, Bash", model: "inherit" }, antigravity: { mainAgent: false } },
  "skill-dey-explorador": { claude: { tools: "Read, Grep, Glob, Bash", model: "haiku" }, antigravity: { mainAgent: false, model: "flash" } },
  "skill-dey-vision": { claude: { tools: "Read", model: "inherit" }, antigravity: { mainAgent: false } },
}
/** Copia un agente agregando el frontmatter propio de cada host. */
function agente(destino, nombre, host) {
  const t = leer(`app/portable/agents/${nombre}.md`)
  const extra = Object.entries(agentes[nombre]?.[host] ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")
  escribir(`${destino}/agents/${nombre}.md`, extra ? t.replace(/\n---\n/, `\n${extra}\n---\n`) : t)
}
function skills(destino) {
  rmSync(join(RAIZ, destino, "skills"), { recursive: true, force: true })
  cpSync(join(APP, "portable", "skills"), join(RAIZ, destino, "skills"), { recursive: true })
  // el método completo: referencias y plantillas compartidas con la edición OpenCode
  for (const d of ["references", "assets"]) cpSync(join(APP, "skills", "skill-dey", d), join(RAIZ, destino, "skills", "skill-dey", d), { recursive: true })
}
function motor(destino, carpeta) {
  mkdirSync(join(RAIZ, destino, carpeta), { recursive: true })
  for (const [, out] of BUNDLES) copyFileSync(join(RAIZ, out), join(RAIZ, destino, carpeta, out.split("/").pop()))
}
const limpiar = (d) => rmSync(join(RAIZ, d), { recursive: true, force: true })

// --- Claude Code (plugin + marketplace) ---
{
  const D = "hosts/claude-code"
  limpiar(D)
  json(`${D}/.claude-plugin/plugin.json`, { name: "skill-dey", version: V, description: DESC, author: AUTOR, homepage: REPO, repository: REPO, license: "MIT", keywords: KEYWORDS })
  const h = (ev, t) => [{ type: "command", command: `node "\${CLAUDE_PLUGIN_ROOT}/bin/skill_dey-hook.mjs" claude ${ev}`, timeout: t }]
  json(`${D}/hooks/hooks.json`, {
    description: "SKILL DEY: guardián en vivo (bloqueos, copia para deshacer, cero errores)",
    hooks: {
      SessionStart: [{ matcher: "startup|resume|clear|compact", hooks: h("inicio", 10) }],
      UserPromptSubmit: [{ hooks: h("prompt", 60) }],
      PreToolUse: [{ matcher: "Bash|Edit|Write|MultiEdit|NotebookEdit|Read", hooks: h("antes", 60) }],
      PostToolUse: [{ matcher: "Bash|Edit|Write|MultiEdit|NotebookEdit|mcp__.*skill_dey.*", hooks: h("despues", 30) }],
      Stop: [{ hooks: h("fin", 90) }],
    },
  })
  json(`${D}/.mcp.json`, { mcpServers: { skill_dey: { command: "node", args: ["${CLAUDE_PLUGIN_ROOT}/bin/skill_dey-mcp.mjs"] } } })
  escribir(`${D}/REGLAS.md`, REGLAS)
  skills(D)
  for (const a of Object.keys(agentes)) agente(D, a, "claude")
  motor(D, "bin")
  if (existsSync(join(RAIZ, "docs", "logo.png"))) copyFileSync(join(RAIZ, "docs", "logo.png"), join(RAIZ, D, ".claude-plugin", "icon.png"))
  json(".claude-plugin/marketplace.json", {
    name: "skill-dey",
    owner: AUTOR,
    metadata: { description: "Marketplace oficial de SKILL DEY, por Ing. Dey (@IngDey).", version: V },
    plugins: [{ name: "skill-dey", source: "./hosts/claude-code", description: DESC, version: V, author: AUTOR, homepage: REPO, license: "MIT", keywords: KEYWORDS, category: "development" }],
  })
  paso("Claude Code: hosts/claude-code + .claude-plugin/marketplace.json")
}

// --- Gemini CLI (extensión) ---
{
  const D = "hosts/gemini-cli"
  limpiar(D)
  json(`${D}/gemini-extension.json`, {
    name: "skill-dey", version: V, description: DESC, contextFileName: "GEMINI.md",
    mcpServers: { skill_dey: { command: "node", args: ["${extensionPath}${/}bin${/}skill_dey-mcp.mjs", "--carpeta", "${workspacePath}"] } },
  })
  escribir(`${D}/GEMINI.md`, REGLAS)
  const h = (nombre, ev, ms) => [{ name: `skill-dey-${nombre}`, type: "command", command: `node "\${extensionPath}\${/}bin\${/}skill_dey-hook.mjs" gemini ${ev}`, timeout: ms }]
  json(`${D}/hooks/hooks.json`, {
    hooks: {
      SessionStart: [{ hooks: h("inicio", "inicio", 10_000) }],
      BeforeAgent: [{ hooks: h("prompt", "prompt", 60_000) }],
      BeforeTool: [{ matcher: "run_shell_command|write_file|replace|edit|read_file|read_many_files", hooks: h("antes", "antes", 60_000) }],
      AfterTool: [{ matcher: "run_shell_command|write_file|replace|edit|.*skill_dey.*", hooks: h("despues", "despues", 30_000) }],
      AfterAgent: [{ hooks: h("fin", "fin", 90_000) }],
    },
  })
  const cmd = (n, d, p) => escribir(`${D}/commands/skill-dey/${n}.toml`, `description = "${d}"\nprompt = """\n${p}\n"""\n`)
  cmd("verificar", "SKILL DEY: verifica todo el proyecto (cero errores)", "Usa la herramienta skill_dey_verificar sobre el proyecto. Si sale ❌, corrige con la skill skill-dey hasta que salga ✅. {{args}}")
  cmd("auditar", "SKILL DEY: auditoría (seguridad, funcionalidad, UX) sin cambiar código", "Carga la skill skill-dey. Ejecuta solo F3 y F4 sobre: {{args}} (si está vacío, todo el proyecto). NO modifiques código. Entrega la tabla de compuertas y los hallazgos priorizados con archivo:línea.")
  cmd("deshacer", "SKILL DEY: deshace el último cambio de la IA", "Usa la herramienta skill_dey_deshacer (pasos: {{args}} o 1) e informa en 2 líneas qué quedó restaurado.")
  cmd("reanudar", "SKILL DEY: continúa la tarea pendiente", "Carga la skill skill-dey. Lee .skill_dey/ESTADO.md, las últimas 5 líneas de .skill_dey/BITACORA.md y git log --oneline -5. Continúa desde donde quedó sin re-analizar lo cerrado. {{args}}")
  skills(D)
  for (const a of Object.keys(agentes)) agente(D, a, "gemini")
  motor(D, "bin")
  paso("Gemini CLI: hosts/gemini-cli")
}

// --- Antigravity CLI (plugin) ---
{
  const D = "hosts/antigravity"
  limpiar(D)
  json(`${D}/plugin.json`, {
    $schema: "https://antigravity.google/schemas/v1/plugin.json",
    name: "skill-dey", displayName: "SKILL DEY", version: V,
    description: "Agentes que programan sin romper tu app: guardián en vivo, deshacer cualquier cambio, cero errores, seguridad y documentación. Por Ing. Dey.",
    logo: "assets/logo.png",
    suggestedPrompts: ["Revisa este proyecto y déjalo sin errores", "Deshaz el último cambio", "Redacta la política de uso seguro de IA de la empresa"],
    author: AUTOR, homepage: REPO, repository: REPO, license: "MIT", keywords: KEYWORDS,
  })
  escribir(`${D}/rules/AGENTS.md`, REGLAS)
  const h = (ev) => ({ type: "command", command: `node ./scripts/skill_dey-hook.mjs antigravity ${ev}` })
  json(`${D}/hooks.json`, {
    "skill-dey": {
      enabled: true,
      SessionStart: [h("inicio")],
      PreInvocation: [h("prompt")],
      PreToolUse: [{ matcher: ".*", hooks: [h("antes")] }],
      PostToolUse: [{ matcher: ".*", hooks: [h("despues")] }],
      Stop: [h("fin")],
    },
  })
  json(`${D}/mcp_config.json`, { mcpServers: { skill_dey: { command: "node", args: ["${PLUGIN_ROOT}/scripts/skill_dey-mcp.mjs"] } } })
  skills(D)
  for (const a of Object.keys(agentes)) agente(D, a, "antigravity")
  motor(D, "scripts")
  if (existsSync(join(RAIZ, "docs", "logo.png"))) { mkdirSync(join(RAIZ, D, "assets"), { recursive: true }); copyFileSync(join(RAIZ, "docs", "logo.png"), join(RAIZ, D, "assets", "logo.png")) }
  paso("Antigravity CLI: hosts/antigravity")
}

console.log(`✔ listo · SKILL DEY ${V}\n`)
