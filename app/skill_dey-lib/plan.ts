// SKILL_DEY — PLAN y COHERENCIA por código (0 tokens). En tareas grandes el modelo registra qué va a hacer
// (una línea por requisito/parte); al cerrar, el CÓDIGO verifica que no quede nada pendiente. Así la coherencia
// ("cubrir cada cosa pedida") deja de depender de que el modelo se acuerde: es un candado.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const F = (cwd: string) => join(cwd, ".skill_dey", "REQUISITOS.md")

/** Registra el plan: una línea por requisito/parte. Marca [parte] las que se delegan a un subagente. */
export function guardarPlan(cwd: string, items: string[], tarea = ""): string {
  const limpios = items.map((s) => s.trim()).filter(Boolean)
  if (!limpios.length) return "plan vacío: pasa al menos un requisito"
  mkdirSync(join(cwd, ".skill_dey"), { recursive: true })
  const cab = `# PLAN / REQUISITOS${tarea ? " — " + tarea : ""} · ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n(skill_dey verifica al cerrar que todo quede en [x]; marca cada uno al terminarlo)\n`
  writeFileSync(F(cwd), cab + limpios.map((i) => `- [ ] ${i}`).join("\n") + "\n")
  return `📋 Plan guardado (${limpios.length} punto(s)). Marca cada uno \`[x]\` al terminarlo; al cerrar se verifica que no quede ninguno pendiente.\n` + limpios.map((i, n) => `  ${n + 1}. ${i}`).join("\n")
}

export function estadoPlan(cwd: string): { total: number; pendientes: string[] } {
  if (!existsSync(F(cwd))) return { total: 0, pendientes: [] }
  const ls = readFileSync(F(cwd), "utf8").split(/\r?\n/)
  const items = ls.filter((l) => /^\s*-\s*\[[ xX]\]/.test(l))
  const pendientes = items.filter((l) => /^\s*-\s*\[\s\]/.test(l)).map((l) => l.replace(/^\s*-\s*\[\s\]\s*/, ""))
  return { total: items.length, pendientes }
}

/** Marca un requisito como hecho buscando su texto (lo usa el modelo o el código). */
export function marcarPlan(cwd: string, texto: string): string {
  if (!existsSync(F(cwd))) return "no hay plan"
  const t = readFileSync(F(cwd), "utf8"); const k = texto.trim().toLowerCase()
  const nuevo = t.split(/\r?\n/).map((l) => { const m = l.match(/^(\s*-\s*)\[\s\](\s*)(.*)$/); return m && m[3].toLowerCase().includes(k) ? `${m[1]}[x]${m[2]}${m[3]}` : l }).join("\n")
  writeFileSync(F(cwd), nuevo); return "marcado"
}

/** Verificación de cierre: ¿quedó algo del plan sin hacer? Devuelve líneas y cuántas fallas. */
export function verificarPlan(cwd: string): { lineas: string[]; fallas: number } {
  const e = estadoPlan(cwd)
  if (!e.total) return { lineas: [], fallas: 0 }
  if (!e.pendientes.length) return { lineas: [`✅ coherencia: los ${e.total} puntos del plan quedaron cubiertos`], fallas: 0 }
  return { lineas: [`❌ coherencia: faltan ${e.pendientes.length}/${e.total} punto(s) del plan (lo pedido no quedó completo):`, ...e.pendientes.map((p) => "   - " + p)], fallas: 1 }
}

/** Limpia el plan (al terminar una tarea del todo, antes de otra). */
export function limpiarPlan(cwd: string): string { try { writeFileSync(F(cwd), "") } catch {} ; return "plan limpiado" }
