// SKILL_DEY — APRENDER de cada corrida (gratis, 0 tokens del modelo). Guarda qué funcionó y qué falló para no repetir,
// y promueve los fallos con patrón a la biblioteca GLOBAL que se comparte entre todas las apps.
import { appendFileSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const GLOBAL = join(homedir(), ".config", "opencode", "skill_dey")
const leer = (p: string) => { try { return readFileSync(p, "utf8") } catch { return "" } }
const yaEsta = (f: string, linea: string) => leer(f).split("\n").some((l) => l.trim() === linea.trim())

/** Poda: evita que el aprendizaje crezca sin fin. Mantiene el encabezado + las últimas N líneas útiles. */
function podar(f: string, maxLineas = 180) {
  try {
    const t = leer(f); if (!t) return
    const ls = t.split("\n"); if (ls.length <= maxLineas) return
    const cab = ls.filter((l) => l.startsWith("#")).slice(0, 1)
    const resto = ls.filter((l) => l.trim() && !l.startsWith("#"))
    writeFileSync(f, [...cab, ...resto.slice(-maxLineas)].join("\n") + "\n")
  } catch {}
}

/** Aprende de una corrida (pruebas, capacitación, verificación). lineas = resultados ✅/❌/PASS/FAIL. */
export function aprenderDeCorrida(cwd: string, etiqueta: string, lineas: string[]): string {
  const fecha = new Date().toISOString().slice(0, 10)
  const proy = join(cwd, ".skill_dey", "APRENDIZAJE.md")
  const glob = join(GLOBAL, "LECCIONES-GLOBALES.md")
  try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }) } catch {}
  try { mkdirSync(GLOBAL, { recursive: true }) } catch {}
  let nuevas = 0
  const fallos = lineas.filter((l) => /^(FAIL|❌|CRÍTICO|ALTO)/.test(l.trim()))
  const exitos = lineas.filter((l) => /^(PASS|✅)/.test(l.trim())).length
  // resumen del proyecto (una línea por corrida)
  const resumen = `- ${fecha} [${etiqueta}] ${exitos} ok · ${fallos.length} fallo(s)`
  if (!yaEsta(proy, resumen)) { try { if (!existsSync(proy)) writeFileSync(proy, "# APRENDIZAJE (qué funcionó y qué falló, por corrida)\n"); appendFileSync(proy, resumen + "\n") } catch {} }
  // cada fallo con pistas → lección en el proyecto y, si parece patrón reusable, global
  for (const f of fallos.slice(0, 8)) {
    const limpio = f.replace(/^(FAIL|❌|CRÍTICO|ALTO)\s*·?\s*/, "").slice(0, 160).trim()
    const linea = `❌ [${etiqueta}] ${limpio} (${fecha})`
    if (!yaEsta(proy, linea)) { try { appendFileSync(proy, linea + "\n"); nuevas++ } catch {} }
    // patrón reusable entre apps: errores técnicos típicos (no datos del proyecto puntuales)
    if (/HTTP 5\d\d|inyecci|XSS|sin iniciar sesi|sin escapar|error de BD|SQL|consola|pageerror|validaci/i.test(limpio)) {
      const g = `❌ [auto] ${limpio} → revisar este patrón al construir (${fecha})`
      if (!yaEsta(glob, g)) { try { if (!existsSync(glob)) writeFileSync(glob, "# LECCIONES GLOBALES (aplican a todos los proyectos)\n"); appendFileSync(glob, g + "\n") } catch {} }
    }
  }
  podar(proy); podar(glob) // mantener la memoria compacta (menos ruido, menos tokens al leerla)
  return `🧠 aprendido: ${exitos} ok, ${fallos.length} fallo(s) registrados (${nuevas} lección(es) nueva(s)); patrones reusables → biblioteca global`
}
