# SKILL_DEY en TODAS las IAs

skill_dey funciona en cualquier asistente por tres vías (elige la que use tu IA):

## 1) Reglas nativas (todas las IAs)
En tu proyecto corre una vez:
```
node ~/.config/opencode/skill_dey/skill_dey.mjs multi-ia .
```
Escribe las reglas de skill_dey en el formato que cada IA lee sola: `AGENTS.md` (Codex/OpenCode), `CLAUDE.md` (Claude Code/Desktop), `GEMINI.md` (Gemini CLI), `.cursorrules` y `.cursor/rules/skill_dey.mdc` (Cursor), `.windsurfrules` (Windsurf), `.github/copilot-instructions.md` (Copilot), `.clinerules` (Cline/Roo), `.rules` (Zed), `.idx/airules.md` (Firebase Studio). No pisa lo tuyo: agrega un bloque marcado.

## 2) CLI universal (cualquier IA con terminal)
Cualquier asistente que pueda correr comandos usa los chequeos deterministas (gratis, Mac/Windows/Linux):
```
node ~/.config/opencode/skill_dey/skill_dey.mjs revisar|seguridad|pruebas|capacitar|movil|organizar|documentar|validar|produccion [carpeta] [url]
```

## 3) Servidor MCP (IAs con MCP: Cursor, Windsurf, Claude Desktop, Cline, Zed…)
Expone los chequeos como herramientas nativas. Agrega esto a la config MCP de tu cliente (reemplaza la ruta por la tuya):
```json
{
  "mcpServers": {
    "skill_dey": {
      "command": "node",
      "args": ["/Users/TU_USUARIO/.config/opencode/skill_dey/skill_dey-mcp.mjs"]
    }
  }
}
```
- **Cursor:** `~/.cursor/mcp.json` (o Settings → MCP).
- **Claude Desktop:** `claude_desktop_config.json`.
- **Windsurf:** Settings → Cascade → MCP (`mcp_config.json`).
- **Cline / Roo:** panel MCP → añadir servidor.
- **Zed:** `settings.json` → `context_servers`.

Herramientas MCP: `skill_dey_revisar`, `skill_dey_seguridad`, `skill_dey_pruebas`, `skill_dey_capacitar`, `skill_dey_organizar`, `skill_dey_documentar`, `skill_dey_validar`, `skill_dey_produccion`, `skill_dey_movil`. Cada una acepta `carpeta` y, cuando aplica, `url`.

## Qué NO se puede fuera de OpenCode
El **guardián en vivo** (copias automáticas antes de cada cambio, verificación al cerrar, cambio de modelo al agotarse el cupo, anti-vueltas, tablero de consumo) es un plugin de OpenCode y solo corre ahí. En las demás IAs tienes las **reglas** + los **chequeos** (CLI/MCP), que cubren la mayor parte del valor.
