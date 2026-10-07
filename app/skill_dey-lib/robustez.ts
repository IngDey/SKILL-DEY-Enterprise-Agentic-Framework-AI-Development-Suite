// SKILL_DEY — ROBUSTEZ (gratis, 0 tokens del modelo): doctor (integridad de la instalación), git hook (red de
// seguridad en cualquier editor) y reporte (datos reales de uso para decidir qué recortar). No agrega features.
import { existsSync, readFileSync, statSync, writeFileSync, chmodSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const OC = () => process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode")

/** Revisa que la instalación esté completa y coherente; dice QUÉ falta y DÓNDE. */
export function doctor(): string[] {
  const oc = OC(); const L: string[] = []; let mal = 0
  const chk = (ok: boolean, bien: string, falla: string) => { L.push((ok ? "✅ " : "❌ ") + (ok ? bien : falla)); if (!ok) mal++ }
  const ver = (() => { try { return readFileSync(join(oc, "skill_dey", "VERSION"), "utf8").trim() } catch { return "" } })()
  chk(!!ver, `versión instalada ${ver}`, "no encuentro skill_dey/VERSION → corre el instalador")
  const need = ["agents/skill_dey.md", "plugins/skill_dey-guardian.ts", "tools/skill_dey.ts", "skills/skill-dey/SKILL.md",
    "skill_dey-lib/comandos.ts", "skill_dey-lib/testpro.ts", "skill_dey-lib/calidad.ts", "skill_dey-lib/pro.ts", "skill_dey-lib/multiia.ts",
    "skill_dey/skill_dey.mjs", "skill_dey/skill_dey-mcp.mjs"]
  for (const f of need) chk(existsSync(join(oc, f)), f, "falta " + f)
  try { const g = readFileSync(join(oc, "plugins", "skill_dey-guardian.ts"), "utf8"); const m = g.match(/VERSION\s*=\s*"([\d.]+)"/); chk(!!m && m[1] === ver, `plugin y VERSION coinciden (${m?.[1] ?? "?"})`, `instalación mezclada (plugin ${m?.[1] ?? "?"} vs ${ver}): reinstala`) } catch { chk(false, "", "no pude leer el plugin") }
  for (const b of ["skill_dey/skill_dey.mjs", "skill_dey/skill_dey-mcp.mjs"]) { try { chk(statSync(join(oc, b)).size > 10_000, b + " (bundle OK)", b + " vacío/corrupto") } catch { } }
  L.push(mal ? `❌ doctor: ${mal} problema(s) → reinstala skill_dey o corre el instalador` : "✅ doctor: instalación sana. Test funcional completo: /skill_dey prueba (o eval)")
  return L
}

/** Instala un git pre-commit hook que corre `skill_dey revisar` y bloquea el commit si hay errores. Red de seguridad en CUALQUIER editor. */
export function instalarHook(cwd: string): string {
  const g = join(cwd, ".git")
  if (!existsSync(g)) return "⏭ git hook: esta carpeta no es un repositorio git (haz `git init` primero)"
  const hooks = join(g, "hooks"); mkdirSync(hooks, { recursive: true })
  const mjs = join(homedir(), ".config", "opencode", "skill_dey", "skill_dey.mjs")
  const hook = `#!/bin/sh\n# SKILL_DEY pre-commit — no deja commitear con errores (salta con: git commit --no-verify)\nnode "${mjs}" revisar . || { echo "SKILL_DEY: hay errores, corrígelos (o usa --no-verify)"; exit 1; }\n`
  const f = join(hooks, "pre-commit")
  try { writeFileSync(f, hook); chmodSync(f, 0o755); return "✅ git hook instalado: antes de cada commit corre `revisar` y bloquea si hay errores (salta con --no-verify). Funciona en cualquier editor." }
  catch (e: any) { return "no pude instalar el hook: " + e.message }
}

/** Resume el uso REAL de skill_dey en este proyecto (para recortar con datos, no con corazonadas). */
export function reporte(cwd: string): string[] {
  const d = join(cwd, ".skill_dey"); const leer = (f: string) => { try { return readFileSync(join(d, f), "utf8") } catch { return "" } }
  const L: string[] = ["📑 Reporte de uso de skill_dey en este proyecto:"]
  const cons = leer("CONSUMO.md").trim().split("\n").filter((l) => l.includes("|"))
  L.push(cons.length ? `   consultas registradas: ${cons.length} · última: ${cons[cons.length - 1].slice(0, 90)}` : "   (sin CONSUMO.md todavía)")
  const ap = leer("APRENDIZAJE.md").split("\n").filter((l) => l.trim().startsWith("❌"))
  if (ap.length) {
    const cont: Record<string, number> = {}; for (const l of ap) { const k = l.replace(/\(\d{4}-\d\d-\d\d\)/, "").trim(); cont[k] = (cont[k] || 0) + 1 }
    L.push(`   fallos aprendidos: ${ap.length} · más repetidos:`)
    for (const [k, c] of Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 5)) L.push(`      (${c}×) ${k.slice(0, 88)}`)
  } else L.push("   fallos aprendidos: 0")
  const pp = leer("PRUEBAS-PROFESIONALES.md"); if (pp) L.push("   último testeo: " + (pp.split("\n").find((l) => /prueba en vivo|cobertura|✅|❌/.test(l)) || "").trim().slice(0, 88))
  const huecos = leer("HUECOS.md").split("\n").filter((l) => l.trim().startsWith("-")); if (huecos.length) L.push(`   skills que faltaron: ${huecos.length}`)
  return L
}
