// SKILL_DEY — VACUNAS (errores ya corregidos que quedan bloqueados para siempre en TODAS las apps) y
// REGLAS DE NEGOCIO ejecutables (consultas de solo lectura que deben dar 0 en cada verificación). Todo por código, 0 tokens.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { contar, consultaSegura, conexion } from "./bd.ts"

const GLOBAL = join(homedir(), ".config", "opencode", "skill_dey")
const VACUNAS = join(GLOBAL, "VACUNAS.json")
const leerJ = (p: string, d: any) => { try { return JSON.parse(readFileSync(p, "utf8")) } catch { return d } }
const guardarJ = (p: string, v: any) => { mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 1)) }

export type Vacuna = { patron: string; ext: string; texto: string; fecha: string }
/** Agrega una vacuna: patrón (regex) que reconoce el error en una línea de código. Valida que no sea demasiado amplio. */
export function agregarVacuna(patron: string, ext: string, texto: string): string {
  let re: RegExp; try { re = new RegExp(patron) } catch (e: any) { return `vacuna rechazada: patrón inválido (${e.message})` }
  if (patron.length < 4 || re.test("") || re.test("const a = 1") || re.test("<div>") || re.test("$x = 1;")) return "vacuna rechazada: el patrón es demasiado amplio (marcaría código normal)"
  const l: Vacuna[] = leerJ(VACUNAS, [])
  if (l.some((v) => v.patron === patron)) return "vacuna ya existía"
  l.push({ patron, ext: ext || "php|m?[jt]sx?|cjs|vue|svelte|py", texto, fecha: new Date().toISOString().slice(0, 10) }); guardarJ(VACUNAS, l)
  return `🛡 vacuna #${l.length} activa en todas tus apps: ${texto}`
}
export const vacunas = (): Vacuna[] => leerJ(VACUNAS, [])
export function quitarVacuna(n: number): string { const l: Vacuna[] = leerJ(VACUNAS, []); if (!l[n - 1]) return "no existe esa vacuna"; const [v] = l.splice(n - 1, 1); guardarJ(VACUNAS, l); return `vacuna quitada: ${v.texto}` }

export type Regla = { texto: string; sql: string; fecha: string }
const archivoReglas = (cwd: string) => join(cwd, ".skill_dey", "REGLAS.json")
/** Regla de negocio verificable: SELECT que cuenta los registros que la INCUMPLEN (debe dar 0). */
export function agregarRegla(cwd: string, texto: string, sql: string): string {
  if (!consultaSegura(sql)) return "regla rechazada: debe ser un SELECT de solo lectura que cuente los registros que incumplen (ej. SELECT COUNT(*) FROM llenados WHERE litros < 0)"
  const l: Regla[] = leerJ(archivoReglas(cwd), [])
  if (l.some((r) => r.sql === sql)) return "la regla ya existía"
  l.push({ texto, sql, fecha: new Date().toISOString().slice(0, 10) }); guardarJ(archivoReglas(cwd), l)
  const prueba = contar(cwd, sql)
  return `📏 regla de negocio #${l.length} guardada: ${texto}${prueba.ok ? ` · hoy: ${prueba.n === 0 ? "✅ se cumple" : `❌ ${prueba.n} registro(s) la incumplen`}` : ` · (no pude probarla ahora: ${prueba.error})`}`
}
export const reglas = (cwd: string): Regla[] => leerJ(archivoReglas(cwd), [])
export function quitarRegla(cwd: string, n: number): string { const l: Regla[] = reglas(cwd); if (!l[n - 1]) return "no existe esa regla"; const [r] = l.splice(n - 1, 1); guardarJ(archivoReglas(cwd), l); return `regla quitada: ${r.texto}` }

/** Verifica todas las reglas de negocio contra la BD real (solo lectura). */
export function verificarReglas(cwd: string): { lineas: string[]; fallas: number } {
  const l = reglas(cwd); if (!l.length) return { lineas: [], fallas: 0 }
  if (!conexion(cwd)) return { lineas: [`⏭ reglas de negocio (${l.length}): sin conexión a BD en .env`], fallas: 0 }
  let fallas = 0; const malas: string[] = [], sinProbar: string[] = []
  for (const r of l) { const c = contar(cwd, r.sql); if (!c.ok) sinProbar.push(`${r.texto} (${c.error})`); else if (c.n! > 0) { fallas++; malas.push(`${r.texto}: ${c.n} registro(s) la incumplen`) } }
  return { lineas: [fallas ? `❌ reglas de negocio incumplidas:\n${malas.map((m) => "   " + m).join("\n")}` : `✅ reglas de negocio (${l.length - sinProbar.length}) se cumplen`, ...(sinProbar.length ? [`⚠ reglas sin probar: ${sinProbar.join(" · ")}`] : [])], fallas }
}

/** Texto para "/skill_dey reglas" y "/skill_dey vacunas". */
export function listar(cwd: string): string {
  const v = vacunas(), r = reglas(cwd), vr = verificarReglas(cwd)
  return [`**Reglas de negocio de esta app** (${r.length})`, ...(r.length ? r.map((x, i) => `${i + 1}. ${x.texto} — \`${x.sql}\``) : ["(ninguna: dile a skill_dey las reglas de tu negocio, ej. \"los litros nunca pueden ser negativos\")"]), ...vr.lineas,
    "", `**Vacunas activas en todas tus apps** (${v.length})`, ...(v.length ? v.map((x, i) => `${i + 1}. ${x.texto} (${x.fecha})`) : ["(ninguna aún: se crean solas cuando skill_dey corrige un error que se puede detectar)"]),
    "", "Quitar: `/skill_dey quitar-regla <n>` · `/skill_dey quitar-vacuna <n>`"].join("\n")
}
