// SKILL_DEY — MULTI-IA (gratis, 0 tokens del modelo): escribe las MISMAS reglas de skill_dey en el formato nativo de
// cada asistente, para que trabajen igual en cualquiera. Los chequeos deterministas se llaman con el CLI universal
// (node skill_dey.mjs <acción>) o con el servidor MCP. El guardián EN VIVO sigue siendo solo de OpenCode.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

/** Reglas portables de skill_dey (una sola fuente de verdad para todas las IAs). */
export function reglasPortables(): string {
  return `# Reglas de trabajo — SKILL_DEY (portátil)
Trabaja como SKILL_DEY en este proyecto, con esta ley y este flujo.

**Prioridad fija:** sin error > preciso > rápido > pocos tokens. Recorta ruido, nunca pasos que evitan errores.
**Entiende primero:** di en 1 línea "Entendí: <qué y para qué>"; deduce lo implícito (validación, permisos, vacío/error, móvil). Si es ambiguo y caro de deshacer, pregunta 1 cosa con opciones.
**Nunca rompas la app:** antes de cambios grandes, respaldo (git add/commit o copia); deja siempre cómo deshacer. Cambios quirúrgicos; no inventes nombres, rutas ni APIs; dependencia nueva → propón y espera OK.
**Cero errores:** al terminar, no entregues nada con errores de código ni de consola. Si 3 intentos no quedan en verde, cambia de enfoque (diagnóstico sistemático) y si no, revierte y explica.
**Acciones finales** (video, pruebas profesionales, publicar): no las hagas solas; ofrécelas con 1 pregunta cuando el proyecto esté listo.

**Chequeos deterministas (0 tokens): usa el CLI de skill_dey en la terminal** (funciona en Mac/Windows/Linux):
- \`node ~/.config/opencode/skill_dey/skill_dey.mjs revisar [carpeta]\`   — errores de código/arranque/sitio
- \`... seguridad [carpeta]\`   — huecos de seguridad + auditoría de dependencias
- \`... pruebas [carpeta] [url]\`   — suite E2E + prueba en vivo + a11y + carga + cobertura + CI
- \`... capacitar [carpeta] [url]\`   — video subtitulado de capacitación
- \`... organizar | documentar | validar | rendimiento | produccion | movil [carpeta]\`
(si no tienes Node, pídele a la IA que corra la acción equivalente a mano siguiendo estas reglas).
Las IAs con MCP pueden usar el servidor \`skill_dey-mcp\` para llamar estos chequeos como herramientas.`
}

type Destino = { archivo: string; pre?: string }
// Cada IA lee su propio archivo de reglas. Escribimos las mismas reglas en todos (y una nota de origen).
const DESTINOS: Destino[] = [
  { archivo: "AGENTS.md" },                                   // OpenAI Codex, OpenCode, Cursor (estándar AGENTS.md)
  { archivo: "CLAUDE.md" },                                   // Claude Code / Claude Desktop
  { archivo: "GEMINI.md" },                                   // Gemini CLI
  { archivo: ".cursorrules" },                                // Cursor (clásico)
  { archivo: join(".cursor", "rules", "skill_dey.mdc"), pre: "---\ndescription: SKILL_DEY\nalwaysApply: true\n---\n\n" }, // Cursor nuevo
  { archivo: ".windsurfrules" },                              // Windsurf
  { archivo: join(".github", "copilot-instructions.md") },   // GitHub Copilot
  { archivo: ".clinerules" },                                 // Cline / Roo Code
  { archivo: ".rules" },                                      // Zed / genérico
  { archivo: join(".idx", "airules.md") },                    // Firebase Studio / Project IDX
]

/** Escribe las reglas de skill_dey en el formato de TODAS las IAs del proyecto (no pisa lo que ya tengas: lo agrega marcado). */
export function instalarMultiIA(cwd: string): { ok: boolean; lineas: string[] } {
  const reglas = reglasPortables()
  const marca = "<!-- SKILL_DEY:inicio -->"
  const fin = "<!-- SKILL_DEY:fin -->"
  const bloque = `${marca}\n${reglas}\n${fin}\n`
  const hechos: string[] = []
  for (const d of DESTINOS) {
    const ruta = join(cwd, d.archivo)
    try {
      mkdirSync(join(ruta, ".."), { recursive: true })
      let contenido = ""
      try { contenido = existsSync(ruta) ? readFileSync(ruta, "utf8") : "" } catch {}
      if (contenido.includes(marca)) {
        // reemplazar solo nuestro bloque, respetando el resto del archivo
        contenido = contenido.replace(new RegExp(`${marca}[\\s\\S]*?${fin}\\n?`), bloque)
      } else {
        contenido = contenido ? contenido.trimEnd() + "\n\n" + (d.pre ?? "") + bloque : (d.pre ?? "") + bloque
      }
      writeFileSync(ruta, contenido)
      hechos.push(d.archivo)
    } catch (e: any) { hechos.push(d.archivo + " (no se pudo: " + e.message + ")") }
  }
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  writeFileSync(join(cwd, ".skill_dey", "MULTI-IA.md"), `# SKILL_DEY multi-IA\nReglas escritas para: ${DESTINOS.map((d) => d.archivo).join(", ")}\n\n${reglasPortables()}`)
  return {
    ok: true,
    lineas: [
      `🌐 Multi-IA: reglas de skill_dey escritas para ${hechos.length} asistentes → ${hechos.join(", ")}`,
      "   Cada IA (Claude Code, Cursor, Windsurf, Copilot, Codex, Gemini, Cline, Zed, IDX) las lee de su propio archivo.",
      "   Chequeos: `node ~/.config/opencode/skill_dey/skill_dey.mjs <revisar|seguridad|pruebas|...>` o el servidor MCP skill_dey-mcp.",
      "   Nota: el guardián automático en vivo (copias, verificación al cerrar, cambio de modelo) solo corre dentro de OpenCode.",
    ],
  }
}
