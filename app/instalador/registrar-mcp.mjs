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

// ruta COMPLETA de Node: las apps abiertas desde Finder/Inicio no heredan el PATH (nvm, Homebrew) y no encontrarían "node"
const entrada = { command: process.execPath, args: [MCP] }
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
      const texto = readFileSync(c.archivo, "utf8").replace(/^\uFEFF/, "") // BOM del Bloc de notas
      if (texto.trim()) {
        try { conf = JSON.parse(texto) } catch { saltados.push(`${c.nombre} (su configuración tiene comentarios o un error: no la toco; agrega skill_dey a mano, ver MULTI-IA.md)`); continue }
      }
      if (typeof conf !== "object" || conf === null || Array.isArray(conf)) { saltados.push(`${c.nombre} (formato inesperado: no la toco)`); continue }
      if (conf[c.clave]?.skill_dey && JSON.stringify(conf[c.clave].skill_dey) === JSON.stringify(entrada)) { hechos.push(c.nombre + " (ya estaba)"); continue }
      const bak = c.archivo + ".antes-skill_dey.bak"
      copyFileSync(c.archivo, existsSync(bak) ? c.archivo + `.antes-skill_dey-${new Date().toISOString().slice(0, 10)}.bak` : bak) // el primer respaldo (el original) nunca se pisa
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
