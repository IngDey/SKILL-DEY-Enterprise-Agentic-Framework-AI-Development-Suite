// Instalador SKILL_DEY multiplataforma (Windows · macOS · Linux). Uso: node instalador/instalar.mjs
import { platform, homedir, release, arch } from "node:os"
import { existsSync, mkdirSync, rmSync, cpSync, copyFileSync, readFileSync, writeFileSync, readdirSync, realpathSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const SO = { win32: "Windows", darwin: "macOS", linux: "Linux" }[platform()] ?? platform()
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..")
const OC = process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode")
const ok = (t) => console.log(`  \x1b[32m[OK]\x1b[0m ${t}`)
const av = (t) => console.log(`  \x1b[33m[!]\x1b[0m  ${t}`)
const md = (p) => mkdirSync(p, { recursive: true })
const leerJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, "")) } catch { return undefined } }
const esc = (p, s) => writeFileSync(p, s, "utf8")
const cmd = (c, a = []) => { const r = spawnSync(c, a, { encoding: "utf8", shell: platform() === "win32", timeout: 60_000 }); return r.status === 0 ? (r.stdout || "").trim() : null }
const hay = (c) => cmd(platform() === "win32" ? "where" : "which", [c]) !== null

// Elige un modelo rápido y bueno SOLO de familias conocidas y, si se puede, del mismo proveedor del modelo principal.
// Catálogo de capacidades de TODOS los modelos disponibles (sirve para cualquier proveedor, gratis o pago)
export function catalogo() {
  // se redirige a un archivo: por tubería OpenCode puede cortar la salida larga
  const tmp = join(OC, "skill_dey", ".modelos.txt")
  spawnSync(`opencode models --verbose > "${tmp}"`, { shell: true, timeout: 180_000 })
  const txt = existsSync(tmp) ? readFileSync(tmp, "utf8") : ""
  rmSync(tmp, { force: true })
  const modelos = {}
  for (const m of txt.matchAll(/^([\w.-]+\/[\w.:@-]+)\r?\n(\{[\s\S]*?^\})/gm)) {
    try { const d = JSON.parse(m[2]); const c = d.capabilities ?? {}
      modelos[m[1]] = { nombre: d.name, imagen: !!(c.input?.image ?? d.modalities?.input?.includes?.("image")), tools: !!(c.toolcall ?? d.tool_call ?? true), ctx: d.limit?.context ?? 0, gratis: (d.cost?.input ?? 1) === 0 && (d.cost?.output ?? 1) === 0, preview: /preview|exp/i.test(m[1]) || ["beta", "deprecated", "alpha"].includes(d.status) }
    } catch {}
  }
  return modelos
}
// Mejor modelo con visión: mismo proveedor que el principal (o el de los gratuitos), con tools, no preview, mayor contexto
export function elegirVision(cat, principal) {
  const prov = (principal ?? "opencode/").split("/")[0]
  const c = Object.entries(cat).filter(([id, m]) => m.imagen && m.tools && !m.preview)
  const pref = (id) => (/muse|mimo|gemini|gpt|claude|qwen.*vl/i.test(id) ? 1 : 0)
  const orden = (a, b) => pref(b[0]) - pref(a[0]) || b[1].ctx - a[1].ctx
  return (c.filter(([id]) => id.startsWith(prov + "/")).sort(orden)[0] ?? c.filter(([, m]) => m.gratis).sort(orden)[0] ?? c.sort(orden)[0])?.[0] ?? null
}

export function elegirRapido(lista, principal) {
  const buenos = /(lightning|claude-haiku|haiku-4|gpt-[\d.]+-mini|gpt-5-mini|o4-mini|gemini-[\d.]+-flash(?!-lite)|grok-code-fast|deepseek-chat|qwen[\d.]*-coder-(plus|flash))/i
  const cands = lista.filter((m) => /^[\w.-]+\/[\w.:@-]+$/.test(m) && buenos.test(m) && !/(-fin\b|preview|exp|embed|audio|image|tts|vision-only)/i.test(m))
  const prov = (principal ?? "opencode/big-pickle").split("/")[0]
  return prov ? cands.find((m) => m.startsWith(prov + "/")) ?? null : null // sin modelo principal conocido → no arriesgar
}

function main() {
  console.log(`\n\x1b[36mInstalando SKILL_DEY · ${SO} ${release()} ${arch()} · ${OC}\x1b[0m\n`)
  if (!existsSync(join(SRC, "skills", "skill-dey", "SKILL.md"))) throw new Error("No encuentro los archivos: descomprime el zip completo y ejecuta desde esa carpeta.")
  for (const d of ["skills", "agents", "commands", "tools", "plugins", "skill_dey"]) md(join(OC, d))

  // limpiar restos de versiones anteriores en carpetas en singular (evita duplicados)
  for (const v of ["skill/skill-dey", "agent/skill_dey.md", "agent/skill_dey-explorador.md", "command/skill_dey.md", "command/skill_dey-reanudar.md", "command/skill_dey-auditar.md", "tool/skill_dey.ts", "plugin/skill_dey-guardian.ts"])
    rmSync(join(OC, v), { recursive: true, force: true })

  // Migración desde FORJA (nombre anterior): conservar lo aprendido y quitar la versión vieja
  for (const v of ["skills/forja", "skill/forja", "skills/skill-dey-old", "agents/forja.md", "agents/forja-explorador.md", "agent/forja.md", "agent/forja-explorador.md", "commands/forja.md", "commands/forja-reanudar.md", "commands/forja-auditar.md", "tools/forja.ts", "tool/forja.ts", "plugins/forja-guardian.ts", "plugin/forja-guardian.ts", "forja-lib"]) rmSync(join(OC, v), { recursive: true, force: true })
  const viejaLec = join(OC, "forja", "LECCIONES-GLOBALES.md"), nuevaLec = join(OC, "skill_dey", "LECCIONES-GLOBALES.md")
  if (existsSync(viejaLec) && !existsSync(nuevaLec)) { copyFileSync(viejaLec, nuevaLec); ok("Lecciones aprendidas por FORJA migradas") }
  const viejaPref = join(OC, "forja", "PREFERENCIAS.md"), nuevaPref = join(OC, "skill_dey", "PREFERENCIAS.md")
  if (existsSync(viejaPref) && !existsSync(nuevaPref)) copyFileSync(viejaPref, nuevaPref)
  rmSync(join(OC, "skills", "skill-dey"), { recursive: true, force: true })
  cpSync(join(SRC, "skills", "skill-dey"), join(OC, "skills", "skill-dey"), { recursive: true }); ok("Skill skill_dey")
  if (existsSync(join(SRC, "portable", "skills", "politicas-ia"))) { rmSync(join(OC, "skills", "politicas-ia"), { recursive: true, force: true }); cpSync(join(SRC, "portable", "skills", "politicas-ia"), join(OC, "skills", "politicas-ia"), { recursive: true }); ok("Skill politicas-ia (uso seguro de IA para las personas)") }
  copyFileSync(join(SRC, "tools", "skill_dey.ts"), join(OC, "tools", "skill_dey.ts")); ok("Herramientas skill_dey_verificar · skill_dey_impacto · skill_dey_leccion · skill_dey_recordar · skill_dey_deshacer")
  rmSync(join(OC, "skill_dey-lib"), { recursive: true, force: true }); cpSync(join(SRC, "skill_dey-lib"), join(OC, "skill_dey-lib"), { recursive: true })
  copyFileSync(join(SRC, "plugins", "skill_dey-guardian.ts"), join(OC, "plugins", "skill_dey-guardian.ts")); ok("Plugin guardián + respaldo automático (deshacer siempre disponible)")
  // Navegador de pruebas: usa tu Chrome/Edge/Brave (sin bajar 150 MB de Chromium) y deja Playwright listo para que la 1ª prueba sea inmediata
  try {
    const H = homedir(), E = process.env, W = platform() === "win32"
    const cands = platform() === "darwin" ? ["Google Chrome.app/Contents/MacOS/Google Chrome", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "Brave Browser.app/Contents/MacOS/Brave Browser", "Chromium.app/Contents/MacOS/Chromium"].flatMap((a) => ["/Applications/" + a, join(H, "Applications", a)])
      : W ? [E.PROGRAMFILES, E["PROGRAMFILES(X86)"], E.LOCALAPPDATA].filter(Boolean).flatMap((b) => [join(b, "Google", "Chrome", "Application", "chrome.exe"), join(b, "Microsoft", "Edge", "Application", "msedge.exe"), join(b, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")])
      : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome", "/usr/bin/microsoft-edge", "/usr/bin/brave-browser", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"]
    const chrome = cands.find((c) => existsSync(c))
    const pw = join(OC, "skill_dey", "playwright"); md(pw)
    if (!existsSync(join(pw, "package.json"))) esc(join(pw, "package.json"), JSON.stringify({ name: "skill-dey-playwright", private: true }))
    if (!existsSync(join(pw, "node_modules", "playwright"))) {
      console.log("  … preparando el navegador de pruebas (una sola vez, ~30 s)")
      spawnSync("npm", ["i", "playwright", "@axe-core/playwright", "--no-audit", "--no-fund", "--silent"], { cwd: pw, shell: W, timeout: 300_000, env: { ...E, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1" } })
    }
    if (!existsSync(join(pw, "node_modules", "playwright"))) av("No pude preparar Playwright (¿sin internet?): se instalará solo la primera vez que pruebes en el navegador.")
    else ok(chrome ? `Pruebas en tu navegador: ${chrome.split(/[\\/]/).pop().replace(/\.exe$/i, "")} (consola, errores JS, red · /skill_dey chrome)` : "Pruebas en navegador listas (no vi Chrome: la 1ª vez se baja Chromium de pruebas)")
  } catch (e) { av("Navegador de pruebas: se preparará la primera vez que lo uses (" + (e?.message ?? e) + ")") }

  const pj = join(OC, "package.json"); const p = leerJson(pj) ?? (existsSync(pj) ? null : {})
  if (p) { p.dependencies ??= {}; p.dependencies["@opencode-ai/plugin"] ??= "latest"; esc(pj, JSON.stringify(p, null, 2)); ok("Dependencias (OpenCode las instala al abrir)") }
  else av('No pude leer package.json de OpenCode: agrega "@opencode-ai/plugin" en dependencies.')

  // configuración
  // opencode.json u opencode.jsonc (el que exista; si ninguno, se crea opencode.json)
  const fj = ["opencode.json", "opencode.jsonc"].map((f) => join(OC, f)).find(existsSync) ?? join(OC, "opencode.json")
  let conf = leerJson(fj)
  if (conf === undefined && existsSync(fj)) { av(`${fj.split(/[\\/]/).pop()} tiene comentarios: agrega a mano  "default_agent": "skill_dey"`); conf = null }
  else { conf ??= { $schema: "https://opencode.ai/config.json" }; if (existsSync(fj)) copyFileSync(fj, existsSync(fj + ".bak") ? `${fj}.${new Date().toISOString().slice(0, 10)}.bak` : fj + ".bak") } // el respaldo original nunca se pisa

  // agentes + modelo rápido
  copyFileSync(join(SRC, "agents", "skill_dey.md"), join(OC, "agents", "skill_dey.md"))
  let exp = readFileSync(join(SRC, "agents", "skill_dey-explorador.md"), "utf8")
  const lista = (cmd("opencode", ["models"]) ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const cat = catalogo()
  const rapido = elegirRapido(lista, conf?.model)
  const vision = elegirVision(cat, conf?.model)
  writeFileSync(join(OC, "skill_dey", "MODELOS.json"), JSON.stringify({ actualizado: new Date().toISOString(), vision: vision ? "skill_dey-vision" : null, modeloVision: vision, modelos: cat }, null, 1))
  let vis = readFileSync(join(SRC, "agents", "skill_dey-vision.md"), "utf8")
  if (vision) { vis = vis.replace(/^mode: subagent$/m, `mode: subagent\nmodel: ${vision}`); ok(`Bocetos/imágenes: si tu modelo no ve imágenes, se leerán con ${cat[vision]?.nombre ?? vision}`) }
  else av("Ningún modelo disponible ve imágenes: los Excel se leen igual; para fotos/Paint instala OCR (tesseract) o agrega un modelo con visión.")
  esc(join(OC, "agents", "skill_dey-vision.md"), vis)
  const sinVision = Object.entries(cat).filter(([, m]) => !m.imagen).length
  if (Object.keys(cat).length) ok(`Capacidades de ${Object.keys(cat).length} modelos registradas (${sinVision} sin visión: se adaptan solos)`)
  if (rapido) { exp = exp.replace(/^mode: subagent$/m, `mode: subagent\nmodel: ${rapido}`); ok(`Explorador con modelo rápido: ${rapido}`) }
  else ok("Explorador usa tu modelo principal (no hay uno rápido confiable del mismo proveedor)")
  esc(join(OC, "agents", "skill_dey-explorador.md"), exp)
  copyFileSync(join(SRC, "agents", "skill_dey-revisor.md"), join(OC, "agents", "skill_dey-revisor.md")) // revisor independiente (contexto limpio)
  for (const f of readdirSync(join(SRC, "commands"))) copyFileSync(join(SRC, "commands", f), join(OC, "commands", f))
  ok("Agentes skill_dey y skill_dey-explorador")

  copyFileSync(join(SRC, "cli", "skill_dey.mjs"), join(OC, "skill_dey", "skill_dey.mjs"))
  try { copyFileSync(join(SRC, "mcp", "skill_dey-mcp.mjs"), join(OC, "skill_dey", "skill_dey-mcp.mjs")); ok("Servidor MCP (multi-IA: Cursor, Windsurf, Claude Desktop, Cline…)") } catch {}
  try { copyFileSync(join(SRC, "global", "MULTI-IA.md"), join(OC, "skill_dey", "MULTI-IA.md")) } catch {}
  try { copyFileSync(join(SRC, "instalador", "registrar-mcp.mjs"), join(OC, "skill_dey", "registrar-mcp.mjs")) } catch {}
  // Multi-IA de un clic: registra el servidor MCP en Cursor/Windsurf/Claude Desktop/Cline (no destructivo; respalda)
  try { const reg = spawnSync("node", [join(SRC, "instalador", "registrar-mcp.mjs"), join(OC, "skill_dey", "skill_dey-mcp.mjs")], { encoding: "utf8", timeout: 30_000 }); if (reg.stdout) console.log(reg.stdout) } catch {}
  try { copyFileSync(join(SRC, "global", "PORTABLE.md"), join(OC, "skill_dey", "PORTABLE.md")) } catch {} // uso sin OpenCode: node ~/.config/opencode/skill_dey/skill_dey.mjs documentar
  for (const f of ["LECCIONES-GLOBALES.md", "PREFERENCIAS.md"]) if (!existsSync(join(OC, "skill_dey", f))) copyFileSync(join(SRC, "global", f), join(OC, "skill_dey", f))
  { const pf = join(OC, "skill_dey", "PREFERENCIAS.md"); const tiene = readFileSync(pf, "utf8"); const faltan = readFileSync(join(SRC, "global", "PREFERENCIAS.md"), "utf8").split(/\r?\n/).filter((l) => l.startsWith("⭐") && !tiene.includes(l.split("]")[0] + "]"))
    if (faltan.length) writeFileSync(pf, tiene.trimEnd() + "\n" + faltan.join("\n") + "\n") }
  { let _ver = "41.0.0"; try { _ver = readFileSync(join(SRC, "skill_dey", "VERSION"), "utf8").trim() || _ver } catch {} esc(join(OC, "skill_dey", "VERSION"), _ver) }
  ok("Memoria global (lo aprendido se conserva)")

  const ag = join(OC, "AGENTS.md"); let o = existsSync(ag) ? readFileSync(ag, "utf8") : ""
  o = o.replace(/<!-- FORJA-INICIO -->[\s\S]*?<!-- FORJA-FIN -->\r?\n?/g, "").replace(/<!-- SKILL_DEY-INICIO -->[\s\S]*?<!-- SKILL_DEY-FIN -->\r?\n?/g, "").replace(/# Reglas globales \(todas las apps\)[\s\S]*?capturas\)\.\r?\n?/g, "")
  esc(ag, (o.trimEnd() + "\n" + readFileSync(join(SRC, "AGENTS.md"), "utf8")).trimStart()); ok("Reglas globales")

  if (conf) { conf.compaction = { auto: true, prune: true, ...(conf.compaction ?? {}) } /* resume solo al llenarse y poda salidas viejas de herramientas: menos tokens por consulta */; if (conf.default_agent && conf.default_agent !== "skill_dey") esc(join(OC, "skill_dey", "AGENTE-ANTERIOR.txt"), String(conf.default_agent)); conf.default_agent = "skill_dey"; esc(fj, JSON.stringify(conf, null, 2)); ok("SKILL_DEY es el agente por defecto") }

  // diagnóstico del equipo según el sistema operativo
  const py = ["python3", "python", "py"].find(hay)
  const guias = {
    git: { Windows: "winget install Git.Git", macOS: "xcode-select --install (o brew install git)", Linux: "sudo apt install git" },
    opencode: { Windows: "npm i -g opencode-ai", macOS: "brew install opencode (o npm i -g opencode-ai)", Linux: "npm i -g opencode-ai" },
    python: { Windows: "winget install Python.Python.3.12", macOS: "brew install python", Linux: "sudo apt install python3" },
  }
  const falt = [["git", hay("git")], ["opencode", hay("opencode")], ["python", !!py]].filter(([, v]) => !v).map(([n]) => n)
  for (const n of falt) av(`Falta ${n}${n === "python" ? " (opcional)" : ""} en ${SO} → ${guias[n][SO] ?? guias[n].Linux}`)
  if (!falt.length) ok(`Equipo ${SO} listo (git, opencode, ${py})`)
  let _vok = "41.0.0"; try { _vok = readFileSync(join(OC, "skill_dey", "VERSION"), "utf8").trim() || _vok } catch {}
  console.log(`\n  \x1b[32m\u2714 SKILL_DEY v${_vok} instalado correctamente.\x1b[0m`)
  console.log(`  \x1b[36mCierra y abre OpenCode. Para confirmar, escribe:  /skill_dey version\x1b[0m\n`)
  const otras = instalarOtrasIAs()
  if (otras.length) console.log(`\n  \x1b[36mTambién quedó en: ${otras.join(", ")}. Ciérralas y ábrelas de nuevo.\x1b[0m\n`)
}

// ---------- Claude Code, Gemini CLI y Antigravity CLI ----------
// Cada IA recibe su paquete nativo (hosts/<ia>): skill, agentes, guardián en vivo (hooks) y servidor MCP.
// Se copia a una carpeta estable (~/.config/skill_dey/paquetes) para que siga funcionando aunque borres la descarga.
// Los comandos de cada IA se muestran en pantalla: si piden confirmación (p. ej. "¿confías en esta carpeta?"), respondes tú.
const correr = (c, a) => {
  const win = platform() === "win32"
  const args = win ? a.map((x) => (/\s/.test(x) ? `"${x}"` : x)) : a
  const r = spawnSync(c, args, { stdio: "inherit", shell: win, timeout: 300_000 })
  return r.status === 0
}
export function instalarOtrasIAs() {
  const RAIZ = join(SRC, "..")
  const HOSTS = join(RAIZ, "hosts")
  const hechas = []
  if (!existsSync(HOSTS)) { av("No encuentro la carpeta hosts/ (Claude Code, Gemini, Antigravity): descarga el zip completo de la release."); return hechas }
  const DEST = join(homedir(), ".config", "skill_dey", "paquetes")
  const estable = (rel) => { const d = join(DEST, rel); rmSync(d, { recursive: true, force: true }); md(dirname(d)); cpSync(join(RAIZ, rel), d, { recursive: true }); return d }

  if (hay("claude")) {
    console.log("\n  \x1b[36m→ Claude Code\x1b[0m")
    estable(".claude-plugin"); estable(join("hosts", "claude-code"))
    correr("claude", ["plugin", "marketplace", "add", DEST]) || correr("claude", ["plugin", "marketplace", "update", "skill-dey"])
    const listo = correr("claude", ["plugin", "install", "skill-dey@skill-dey"]) || correr("claude", ["plugin", "update", "skill-dey@skill-dey"])
    if (listo) { ok("Claude Code: plugin skill-dey (skills, agentes, guardián en vivo, MCP)"); hechas.push("Claude Code") }
    else av("Claude Code: instálalo a mano dentro de Claude con  /plugin marketplace add IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite  y luego  /plugin install skill-dey@skill-dey")
  }
  if (hay("gemini")) {
    console.log("\n  \x1b[36m→ Gemini CLI\x1b[0m")
    const d = estable(join("hosts", "gemini-cli"))
    if (existsSync(join(homedir(), ".gemini", "extensions", "skill-dey"))) correr("gemini", ["extensions", "uninstall", "skill-dey"])
    if (correr("gemini", ["extensions", "install", d, "--consent"])) { ok("Gemini CLI: extensión skill-dey (GEMINI.md, skills, hooks, comandos /skill-dey:*, MCP)"); hechas.push("Gemini CLI") }
    else av(`Gemini CLI: instálala a mano con  gemini extensions install "${d}"`)
  }
  if (hay("agy")) {
    console.log("\n  \x1b[36m→ Antigravity CLI\x1b[0m")
    const d = estable(join("hosts", "antigravity"))
    if (correr("agy", ["plugin", "install", d])) { ok("Antigravity CLI: plugin skill-dey (reglas, skills, subagentes, hooks, MCP)"); hechas.push("Antigravity CLI") }
    else av(`Antigravity CLI: instálalo a mano con  agy plugin install "${d}"`)
  }
  if (!hechas.length) console.log("  (No encontré Claude Code, Gemini CLI ni Antigravity CLI en este equipo. Si los instalas después, vuelve a correr este instalador.)")
  return hechas
}

const real = (p) => { try { return realpathSync(p) } catch { return p } }
if (process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1])) {
  try { main() } catch (e) { console.error(`\n  \x1b[31mERROR:\x1b[0m ${e.message}\n`); process.exitCode = 1 }
}
