// Comparador SKILL_DEY vs IA directa (agente "build" de OpenCode), con TU modelo.
// Uso: node comparar.mjs                                   (tu modelo por defecto)
//      node comparar.mjs --modelos gratis                   (todos los modelos gratuitos con herramientas)
//      node comparar.mjs --modelos opencode/big-pickle,opencode/muse-spark-1.3-contributor-free --casos 1,2,5
// Crea un proyecto de prueba, ejecuta los mismos pedidos con cada agente y mide: tokens, costo, tiempo y si el resultado es CORRECTO.
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined }
const PUERTO = Number(arg("--puerto") ?? 4196)
const AGENTES = (arg("--agentes") ?? "skill_dey,build").split(",")
const SOLO = arg("--casos")?.split(",").map(Number)
let MODELOS = (arg("--modelos") ?? arg("--modelo") ?? "").split(",").filter(Boolean)
if (MODELOS[0] === "gratis") {
  const tmp = join(tmpdir(), "skill-dey-modelos.txt"); spawnSync(`opencode models --verbose > "${tmp}"`, { shell: true, timeout: 180_000 })
  MODELOS = [...(leerSeguro(tmp)).matchAll(/^([\w.-]+\/[\w.:@-]+)\r?\n(\{[\s\S]*?^\})/gm)].filter((m) => { try { const d = JSON.parse(m[2]); return d.cost?.input === 0 && d.cost?.output === 0 && d.capabilities?.toolcall !== false && !/preview/i.test(m[1]) && d.status !== "deprecated" } catch { return false } }).map((m) => m[1])
  console.log(`Modelos gratuitos a comparar: ${MODELOS.join(", ")}`)
}
MODELOS = [...new Set(MODELOS)]
if (!MODELOS.length) MODELOS = [undefined] // modelo por defecto

// ---------- proyecto de prueba (Node puro, sin dependencias) ----------
const PROYECTO = {
  "package.json": JSON.stringify({ name: "inventario-prueba", type: "module", scripts: { test: "node --test" } }, null, 2),
  "src/inventario.js": `// Inventario de tanques
export const ESTADOS = { ACTIVO: "Activo", MANTENIMIENTO: "Mantenimiento" }

export function calcularTotal(tanques) {
  // BUG: los tanques vacíos (litros null) dañan el total
  return tanques.reduce((suma, t) => suma + t.litros, 0)
}

export function registrarLlenado(tanque, litros) {
  tanque.litros = (tanque.litros ?? 0) + litros
  return tanque
}

export function tanquesOperativos(tanques) {
  return tanques.filter((t) => t.estado === "Activo")
}
`,
  "src/ui/index.html": `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Inventario</title></head>
<body><h1>Inventario de tanques</h1>
<table id="tanques"><tr><th>Tanque</th><th>Estado</th></tr><tr><td>T-01</td><td>Activo</td></tr></table>
<button id="guardar">Guardar</button></body></html>
`,
  "test/inventario.test.js": `import { test } from "node:test"
import assert from "node:assert/strict"
import { calcularTotal, tanquesOperativos } from "../src/inventario.js"
test("total con tanques vacíos", () => assert.equal(calcularTotal([{ litros: 100 }, { litros: null }, { litros: 50 }]), 150))
test("operativos", () => assert.equal(tanquesOperativos([{ estado: "Activo" }, { estado: "Mantenimiento" }]).length, 1))
`,
}

const leerSeguro = (f) => { try { return readFileSync(f, "utf8") } catch { return "" } }
const sh = (c, cwd) => spawnSync(c, { cwd, shell: true, encoding: "utf8" })
const pruebasPasan = (d) => sh("node --test", d).status === 0
const cambiados = (d) => sh("git status --porcelain -- . \":(exclude).skill_dey\"", d).stdout.trim().split("\n").filter(Boolean).length
const leer = (d, f) => { try { return readFileSync(join(d, f), "utf8") } catch { return "" } }

const CASOS = [
  { id: 1, nombre: "Texto de botón (N0)", pedido: "cambia el texto del botón Guardar por Registrar",
    ok: (d) => /Registrar/.test(leer(d, "src/ui/index.html")) && !/>Guardar</.test(leer(d, "src/ui/index.html")) },
  { id: 2, nombre: "Corregir bug", pedido: "el total del inventario sale mal cuando hay tanques vacíos, corrígelo",
    ok: (d) => pruebasPasan(d) },
  { id: 3, nombre: "Regla de negocio", pedido: "al registrar un llenado, no se puede superar la capacidad del tanque",
    ok: async (d) => { try { const m = await import(join(d, "src/inventario.js") + "?v=" + Date.now()); let lanzo = false; try { const r = m.registrarLlenado({ litros: 90, capacidad: 100 }, 20); if (r?.error || r === false) lanzo = true } catch { lanzo = true } ; return lanzo && pruebasPasan(d) } catch { return false } } },
  { id: 4, nombre: "Pregunta (no debe tocar nada)", pedido: "¿qué hace la función calcularTotal?",
    ok: (d) => cambiados(d) === 0 },
  { id: 5, nombre: "Trampa: texto que el código compara", pedido: "en la pantalla cambia el estado Activo por Habilitado",
    ok: async (d) => { const html = /Habilitado/.test(leer(d, "src/ui/index.html")); const m = await import(join(d, "src/inventario.js") + "?v=" + Date.now()).catch(() => null)
      const logica = m ? m.tanquesOperativos([{ estado: m.ESTADOS?.ACTIVO ?? "Activo" }, { estado: "Mantenimiento" }]).length === 1 : false
      return html && logica && pruebasPasanSinBug(d) } },
]
// el caso 5 no exige arreglar el bug del caso 2: solo que el test de "operativos" siga pasando
function pruebasPasanSinBug(d) { const r = sh("node --test --test-name-pattern=operativos", d); return r.status === 0 }

function crearProyecto() {
  const d = mkdtempSync(join(tmpdir(), "skill-dey-eval-"))
  for (const [f, c] of Object.entries(PROYECTO)) { mkdirSync(join(d, f, ".."), { recursive: true }); writeFileSync(join(d, f), c) }
  sh("git init -q && git add -A && git -c user.email=e@e -c user.name=e commit -qm base", d)
  return d
}

async function api(ruta, metodo = "GET", cuerpo) {
  const r = await fetch(`http://127.0.0.1:${PUERTO}${ruta}`, { method: metodo, headers: { "content-type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
  return r.json()
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

async function correr(caso, agente, MODELO) {
  const dir = crearProyecto()
  const srv = spawn("opencode", ["serve", "--port", String(PUERTO)], { cwd: dir, stdio: "ignore", shell: process.platform === "win32" })
  try {
    for (let i = 0; i < 60; i++) { try { await api("/session"); break } catch { await esperar(1000) } }
    const s = await api("/session", "POST", {})
    const cuerpo = { agent: agente, parts: [{ type: "text", text: caso.pedido }] }
    if (MODELO) { const [providerID, ...m] = MODELO.split("/"); cuerpo.model = { providerID, modelID: m.join("/") } }
    const t0 = Date.now()
    await api(`/session/${s.id}/message`, "POST", cuerpo)
    await esperar(4000) // deja actuar al guardián (verificación final)
    for (let i = 0; i < 90; i++) { const st = await api("/session/status").catch(() => ({})); if (!st?.[s.id] || st[s.id]?.type === "idle") break; await esperar(2000) }
    const seg = (Date.now() - t0) / 1000
    const msgs = (await api(`/session/${s.id}/message`)).map((m) => m.info ?? m).filter((m) => m.role === "assistant")
    const tokens = msgs.reduce((a, m) => a + (m.tokens?.input ?? 0) + (m.tokens?.output ?? 0) + (m.tokens?.reasoning ?? 0) + (m.tokens?.cache?.read ?? 0) + (m.tokens?.cache?.write ?? 0), 0)
    const costo = msgs.reduce((a, m) => a + (m.cost ?? 0), 0)
    const correcto = await caso.ok(dir)
    const sintaxis = sh("node --check src/inventario.js", dir).status === 0
    return { modelo: MODELO ?? "predeterminado", agente, caso: caso.id, nombre: caso.nombre, tokens, costo, seg, correcto: correcto && sintaxis }
  } finally { srv.kill(); await esperar(800); try { rmSync(dir, { recursive: true, force: true }) } catch {} }
}

const casos = CASOS.filter((c) => !SOLO || SOLO.includes(c.id))
const res = []
for (const mo of MODELOS) for (const c of casos) for (const a of AGENTES) {
  process.stdout.write(`${mo ?? "predeterminado"} · caso ${c.id} · ${a} … `)
  const r = await correr(c, a, mo).catch((e) => ({ modelo: mo ?? "predeterminado", agente: a, caso: c.id, nombre: c.nombre, error: e.message }))
  res.push(r); console.log(r.error ? "error: " + r.error : `${r.correcto ? "✅" : "❌"} ${Math.round(r.tokens / 100) / 10}k tokens · ${r.seg.toFixed(0)} s`)
}
const k = (n) => Math.round(n / 100) / 10 + "k"
const L = ["# Comparativo SKILL_DEY vs IA directa", `Fecha: ${new Date().toLocaleString()}`, ""]
for (const mo of MODELOS.map((m) => m ?? "predeterminado")) {
  const rm = res.filter((r) => r.modelo === mo)
  L.push(`## ${mo}`, "", "| Caso | " + AGENTES.map((a) => `${a}`).join(" | ") + " |", "|---|" + AGENTES.map(() => "---").join("|") + "|")
  for (const c of casos) L.push(`| ${c.id}. ${c.nombre} | ` + AGENTES.map((a) => { const r = rm.find((x) => x.caso === c.id && x.agente === a); return !r || r.error ? "error" : `${r.correcto ? "✅" : "❌"} · ${k(r.tokens)} · ${r.seg.toFixed(0)} s` }).join(" | ") + " |")
  const tot = (a, f) => rm.filter((r) => r.agente === a && !r.error).reduce((s, r) => s + f(r), 0)
  L.push("| **Total** | " + AGENTES.map((a) => `**${tot(a, (r) => (r.correcto ? 1 : 0))}/${casos.length}** · ${k(tot(a, (r) => r.tokens))} · US$${tot(a, (r) => r.costo).toFixed(4)} · ${tot(a, (r) => r.seg).toFixed(0)} s`).join(" | ") + " |", "")
}
if (MODELOS.length > 1) {
  const pts = (mo, a) => res.filter((r) => r.modelo === mo && r.agente === a && !r.error)
  L.push("## Ranking con skill_dey (correctos, luego menos tokens)", "", "| # | Modelo | Correctos | Tokens | Tiempo |", "|---|---|---|---|---|")
  MODELOS.map((m) => m ?? "predeterminado").map((mo) => { const r = pts(mo, AGENTES[0]); return { mo, ok: r.filter((x) => x.correcto).length, t: r.reduce((s, x) => s + x.tokens, 0), s: r.reduce((s, x) => s + x.seg, 0) } })
    .sort((a, b) => b.ok - a.ok || a.t - b.t).forEach((x, i) => L.push(`| ${i + 1} | ${x.mo} | ${x.ok}/${casos.length} | ${k(x.t)} | ${x.s.toFixed(0)} s |`))
}
if (MODELOS.length > 1) { // guarda el ranking para que skill_dey sepa con qué modelo seguir cuando uno llegue a su límite
  const orden = MODELOS.filter(Boolean).map((mo) => { const r = res.filter((x) => x.modelo === mo && x.agente === AGENTES[0] && !x.error); return { mo, ok: r.filter((x) => x.correcto).length, t: r.reduce((s, x) => s + x.tokens, 0) } }).sort((a, b) => b.ok - a.ok || a.t - b.t).map((x) => x.mo)
  const { homedir } = await import("node:os"); const dir = join(homedir(), ".config", "opencode", "skill_dey"); mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "RANKING.json"), JSON.stringify({ actualizado: new Date().toISOString(), orden }, null, 1))
  console.log("Ranking guardado: skill_dey lo usará para elegir con qué modelo seguir si uno llega a su límite.")
}
writeFileSync("RESULTADOS-COMPARATIVO.md", L.join("\n") + "\n")
console.log("\n" + L.join("\n") + "\n\nGuardado en RESULTADOS-COMPARATIVO.md")
