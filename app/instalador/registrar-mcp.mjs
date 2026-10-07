// SKILL_DEY — registrador de MCP de un clic. Agrega el servidor skill_dey a la config de tus IAs (Cursor, Windsurf,
// Claude Desktop, Cline). No borra nada: respalda la config y solo AGREGA/actualiza la entrada "skill_dey".
// Uso: node registrar-mcp.mjs [ruta-al-skill_dey-mcp.mjs]
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { homedir, platform } from "node:os"

const H = homedir(), SO = platform()
const MCP = process.argv[2] || join(H, ".config", "opencode", "skill_dey", "skill_dey-mcp.mjs")

// Config de cada cliente MCP según el sistema operativo (ruta → forma del archivo)
const appData = process.env.APPDATA || join(H, "AppData", "Roaming")
const claudeDesktop = SO === "darwin" ? join(H, "Library", "Application Support", "Claude", "claude_desktop_config.json")
  : SO === "win32" ? join(appData, "Claude", "claude_desktop_config.json")
  : join(H, ".config", "Claude", "claude_desktop_config.json")
const vscodeUser = SO === "darwin" ? join(H, "Library", "Application Support", "Code", "User")
  : SO === "win32" ? join(appData, "Code", "User") : join(H, ".config", "Code", "User")

const CLIENTES = [
  { nombre: "Cursor", archivo: join(H, ".cursor", "mcp.json"), clave: "mcpServers" },
  { nombre: "Windsurf", archivo: join(H, ".codeium", "windsurf", "mcp_config.json"), clave: "mcpServers" },
  { nombre: "Claude Desktop", archivo: claudeDesktop, clave: "mcpServers" },
  { nombre: "Cline", archivo: join(vscodeUser, "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"), clave: "mcpServers" },
]

const entrada = { command: "node", args: [MCP] }
const hechos = [], saltados = []

for (const c of CLIENTES) {
  try {
    const dir = dirname(c.archivo)
    // solo si el cliente parece instalado (su carpeta existe) o el archivo ya existe
    const instalado = existsSync(dir) || existsSync(c.archivo)
    if (!instalado) { saltados.push(`${c.nombre} (no instalado)`); continue }
    mkdirSync(dir, { recursive: true })
    let conf = {}
    if (existsSync(c.archivo)) {
      copyFileSync(c.archivo, c.archivo + ".antes-skill_dey.bak")
      try { conf = JSON.parse(readFileSync(c.archivo, "utf8")) } catch { conf = {} }
    }
    conf[c.clave] = conf[c.clave] || {}
    conf[c.clave]["skill_dey"] = entrada
    writeFileSync(c.archivo, JSON.stringify(conf, null, 2))
    hechos.push(c.nombre)
  } catch (e) { saltados.push(`${c.nombre} (error: ${e.message})`) }
}

console.log("🌐 SKILL_DEY · registro de MCP")
console.log("   Servidor: " + MCP)
console.log(hechos.length ? "   ✅ Registrado en: " + hechos.join(", ") : "   (ningún cliente MCP instalado detectado)")
if (saltados.length) console.log("   ⏭ Omitidos: " + saltados.join(", "))
console.log("   Reinicia cada app para que tome el servidor skill_dey. Guía: skill_dey/MULTI-IA.md")
if (!existsSync(MCP)) console.log("   ⚠ Aún no existe " + MCP + " — instala skill_dey primero.")
