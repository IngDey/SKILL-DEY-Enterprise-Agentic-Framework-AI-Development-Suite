// SKILL_DEY — soporte de apps MÓVILES (Flutter / React Native). Detecta el stack y corre su analizador/pruebas (gratis).
// No rompe en apps no-web: si no es móvil, lo dice y no hace nada.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type Movil = "flutter" | "react-native" | null

export function esMovil(cwd: string): Movil {
  if (existsSync(join(cwd, "pubspec.yaml"))) return "flutter"
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps["react-native"] || deps["expo"]) return "react-native"
  } catch {}
  return null
}

/** Analiza y prueba la app móvil con las herramientas de su stack (si están instaladas). */
export function revisarMovil(cwd: string): { ok: boolean; lineas: string[]; fallas: number } {
  const tipo = esMovil(cwd)
  if (!tipo) return { ok: true, lineas: ["⏭ móvil: no es un proyecto Flutter ni React Native"], fallas: 0 }
  const run = (cmd: string) => spawnSync(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300_000, maxBuffer: 5e7 })
  const L: string[] = []; let fallas = 0
  const hay = (bin: string) => { try { return spawnSync(bin, ["--version"], { shell: true, timeout: 15_000 }).status === 0 } catch { return false } }
  if (tipo === "flutter") {
    L.push("📱 Flutter detectado")
    if (hay("flutter")) {
      const a = run("flutter analyze"); const okA = a.status === 0
      if (!okA) fallas++
      L.push(`${okA ? "✅" : "❌"} flutter analyze${okA ? " sin problemas" : ": " + (a.stdout + a.stderr).split("\n").filter((x) => /error|warning/i.test(x)).slice(0, 3).join(" · ").slice(0, 160)}`)
      if (existsSync(join(cwd, "test"))) { const t = run("flutter test"); L.push(`${t.status === 0 ? "✅" : "❌"} flutter test`); if (t.status !== 0) fallas++ }
    } else L.push("⏭ no encuentro `flutter` en el PATH: instálalo para analizar y probar")
  } else {
    L.push("📱 React Native detectado")
    const pkg = (() => { try { return JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) } catch { return {} } })()
    if (pkg.scripts?.lint) { const l = run("npm run lint --silent"); L.push(`${l.status === 0 ? "✅" : "❌"} lint`); if (l.status !== 0) fallas++ }
    if (pkg.scripts?.test && !/no test specified/.test(pkg.scripts.test)) { const t = run("npm test --silent -- --watchAll=false"); L.push(`${t.status === 0 ? "✅" : "❌"} pruebas (npm test)`); if (t.status !== 0) fallas++ }
    if (!pkg.scripts?.lint && !pkg.scripts?.test) L.push("⏭ sin scripts de lint/test en package.json: agrégalos para revisarlo")
    L.push("ℹ️ UI móvil: para capturas/flujos reales usa un emulador (Android Studio) o Detox; skill_dey revisa código y pruebas.")
  }
  return { ok: fallas === 0, fallas, lineas: L }
}
