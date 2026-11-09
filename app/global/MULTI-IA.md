# SKILL_DEY en TODAS las IAs

> Creado por **Ing. Dey** ([@IngDey](https://github.com/IngDey))

## Nativo (guardián en vivo + skill + agentes + MCP)

| IA | Cómo se instala | Qué trae |
|---|---|---|
| **OpenCode** | Instalador (`INSTALAR.bat` / `INSTALAR.command`) | Todo, más cambio automático de modelo y tablero de consumo |
| **Claude Code** | Instalador, o en Claude: `/plugin marketplace add IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite` → `/plugin install skill-dey@skill-dey` | Plugin: skills, subagentes, hooks del guardián, MCP |
| **Gemini CLI** | Instalador, o `gemini extensions install <carpeta>/hosts/gemini-cli` | Extensión: GEMINI.md, skills, subagentes, hooks, comandos `/skill-dey:*`, MCP |
| **Antigravity CLI** | Instalador, o `agy plugin install <carpeta>/hosts/antigravity` | Plugin: reglas, skills, subagentes, hooks, MCP |

Las cuatro usan las mismas reglas del guardián (`app/skill_dey-lib/guardia.ts`).

## Otras IAs

### 1) Reglas nativas
En tu proyecto corre una vez:
```
node ~/.config/opencode/skill_dey/skill_dey.mjs multi-ia .
```
Escribe las reglas de skill_dey en el formato que cada IA lee sola: `AGENTS.md` (Codex/OpenCode), `CLAUDE.md`, `GEMINI.md`, `.cursorrules` y `.cursor/rules/skill_dey.mdc` (Cursor), `.windsurfrules` (Windsurf), `.github/copilot-instructions.md` (Copilot), `.clinerules` (Cline/Roo), `.rules` (Zed), `.idx/airules.md` (Firebase Studio). No pisa lo tuyo: agrega un bloque marcado.

### 2) CLI universal (cualquier IA con terminal)
```
node ~/.config/opencode/skill_dey/skill_dey.mjs revisar|seguridad|pruebas|capacitar|movil|organizar|documentar|validar|produccion [carpeta] [url]
```

### 3) Servidor MCP (Cursor, Windsurf, Claude Desktop, Cline, Zed…)
El instalador lo registra solo en los que tengas. A mano:
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
Herramientas: `skill_dey_verificar`, `skill_dey_deshacer`, `skill_dey_rehacer`, `skill_dey_historial`, `skill_dey_congelar`, `skill_dey_revisar`, `skill_dey_seguridad`, `skill_dey_pruebas`, `skill_dey_capacitar`, `skill_dey_organizar`, `skill_dey_documentar`, `skill_dey_validar`, `skill_dey_produccion`, `skill_dey_movil`, `skill_dey_multi_ia`. Cada una acepta `carpeta` y, cuando aplica, `url`.

En estas IAs no hay guardián en vivo (no exponen hooks): tienes las reglas + los chequeos, y conviene hacer `git commit` como punto de retorno antes de cambios grandes.
