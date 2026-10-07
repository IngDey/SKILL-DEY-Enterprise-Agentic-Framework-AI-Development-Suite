// SKILL_DEY — autoprueba: prueba CADA pieza de skill_dey en un proyecto de prueba temporal (nunca en tu app) y mide su velocidad.
// Responde "¿funciona?" y "¿qué tan rápido/óptimo?" con evidencia, sin gastar tokens del modelo (todo es código).
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir, homedir } from "node:os"
import { createServer, connect } from "node:net"
import { foto, deshacer } from "./respaldo.ts"
import { revisarTodo } from "./escaneo.ts"
import { analizar } from "./adopcion.ts"
import { documentar } from "./documentar.ts"
import { escuchando, liberarPuerto } from "./procesos.ts"
import { rastrearSitio } from "./sitio.ts"
import { agregarVacuna, vacunas, quitarVacuna } from "./reglas.ts"
import { consultaSegura } from "./bd.ts"
import { intencion } from "./comandos.ts"
import { auditarSeguridad } from "./seguridad.ts"
import { validacionServidor, consultasEnBucle, formatear } from "./extras.ts"
import { organizar } from "./organizar.ts"
import { listarArchivos, esRepoGit } from "./listar.ts"
import { guardarPlan, verificarPlan, marcarPlan } from "./plan.ts"
import { empalme } from "./empalme.ts"
import { buscarSkill } from "./buscar_skill.ts"
import { aprenderDeCorrida } from "./aprender.ts"
import { esMovil, revisarMovil } from "./movil.ts"
import { apiOpenapi, sentryCheck, i18nCheck } from "./pro.ts"
import { instalarMultiIA } from "./multiia.ts"
import { instalarHook, reporte } from "./robustez.ts"

type Fila = { pieza: string; ok: boolean | null; ms: number; nota: string }
const puertoLibre = () => new Promise<number>((r) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = (s.address() as any).port; s.close(() => r(p)) }) })
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const hay = (c: string) => spawnSync(process.platform === "win32" ? "where" : "sh", process.platform === "win32" ? [c] : ["-c", `command -v ${c}`]).status === 0

/**
 * Ejecuta la batería de pruebas de skill_dey.
 * @param verificar la herramienta skill_dey_verificar (se inyecta para no crear dependencias circulares)
 */
export async function autoprueba(verificar: (args: any, ctx: any) => Promise<string>): Promise<string> {
  const F: Fila[] = []
  const dir = mkdtempSync(join(tmpdir(), "skill_dey-autoprueba-"))
  const prueba = async (pieza: string, fn: () => Promise<[boolean | null, string]> | [boolean | null, string]) => {
    const t0 = Date.now()
    try { const [ok, nota] = await fn(); F.push({ pieza, ok, ms: Date.now() - t0, nota }) }
    catch (e: any) { F.push({ pieza, ok: false, ms: Date.now() - t0, nota: "falló: " + String(e?.message ?? e).slice(0, 90) }) }
  }
  const esc = (f: string, c: string) => { mkdirSync(join(dir, f, ".."), { recursive: true }); writeFileSync(join(dir, f), c) }
  const ctx = { worktree: dir, directory: dir }
  const hijos: any[] = [] // procesos de prueba: se cierran siempre al final, aunque una prueba falle
  try {
    // Proyecto de prueba
    spawnSync("git", ["init", "-q"], { cwd: dir })
    esc("src/app.js", "export const total = 10\n"); esc(".env", "CLAVE=secreta\n"); esc("README.md", "# prueba\n")
    spawnSync("git", ["add", "src", "README.md"], { cwd: dir }); spawnSync("git", ["-c", "user.email=p@p", "-c", "user.name=p", "commit", "-qm", "base"], { cwd: dir })

    await prueba("Copia de seguridad + deshacer", () => {
      if (!hay("git")) return [false, "git no instalado: deshacer queda limitado"]
      foto(dir, "pasos", "cambio", "autoprueba")
      esc("src/app.js", "export const total = ROTO\n")
      deshacer(dir, 1)
      const restaurado = readFileSync(join(dir, "src/app.js"), "utf8").includes("10")
      const envIntacto = existsSync(join(dir, ".env"))
      return [restaurado && envIntacto, restaurado ? (envIntacto ? "restaura el archivo y no toca .env" : "¡borró .env!") : "no restauró el archivo"]
    })
    await prueba("Verificación detecta error de sintaxis", async () => {
      esc("src/malo.js", "export const x = (\n")
      const r = await verificar({ nivel: "N1", archivos: ["src/malo.js"], rapido: true }, ctx)
      rmSync(join(dir, "src/malo.js")); return [/❌ sintaxis/.test(r), /❌ sintaxis/.test(r) ? "lo detectó" : "NO lo detectó"]
    })
    await prueba("Verificación da verde en código sano", async () => {
      const r = await verificar({ nivel: "N0", archivos: ["src/app.js"], rapido: true }, ctx)
      return [/verde/.test(r) && !/❌/.test(r), /verde/.test(r) ? "verde" : r.split("\n").find((l) => l.includes("❌")) ?? "no quedó verde"]
    })
    await prueba("Bloqueo de secretos en código", async () => {
      esc("src/conf.js", 'const password = "SuperClave12345"\n')
      const r = await verificar({ nivel: "N0", archivos: ["src/conf.js"], rapido: true }, ctx)
      rmSync(join(dir, "src/conf.js")); return [/secretos/.test(r), /secretos/.test(r) ? "lo detectó" : "NO lo detectó"]
    })
    await prueba("Buenas prácticas (solo líneas nuevas)", async () => {
      esc("src/vista.js", 'export function f(el, d) { el.innerHTML = d.nombre }\n')
      const r = await verificar({ nivel: "N1", archivos: ["src/vista.js"], rapido: true }, ctx)
      rmSync(join(dir, "src/vista.js")); return [/prácticas peligrosas/.test(r), /prácticas peligrosas/.test(r) ? "detectó innerHTML inseguro (XSS)" : "NO lo detectó"]
    })
    await prueba("Vacuna contra errores (se aplica en todas las apps)", async () => {
      const amplia = agregarVacuna(".*", "js", "x").startsWith("vacuna rechazada")
      const antes = vacunas().length; agregarVacuna("parseInt\\(\\s*\\w+\\s*\\)(?!\\s*,)", "js", "autoprueba: parseInt sin base")
      try {
        esc("src/num.js", "export const n = (x) => parseInt(x)\n")
        const r = await verificar({ nivel: "N1", archivos: ["src/num.js"], rapido: true }, ctx); rmSync(join(dir, "src/num.js"))
        return [amplia && /vacuna/.test(r), `${amplia ? "rechaza patrones amplios ✓" : "aceptó un patrón amplio ✗"} · ${/vacuna/.test(r) ? "bloqueó el error vacunado ✓" : "no lo bloqueó ✗"}`]
      } finally { if (vacunas().length > antes) quitarVacuna(vacunas().length) }
    })
    await prueba("Auditoría de seguridad (huecos que el modelo olvida)", () => {
      esc("panel.php", '<?php session_start(); if(!isset($_SESSION["u"])) die(); ?><html><table><tr><td>ok</td></tr></table>')
      esc("reportes.php", '<?php session_start(); if(!isset($_SESSION["u"])) die(); ?><html><table></table></html>')
      esc("libre.php", '<?php ?><html><form method="post"><input name="x" required><button>Enviar</button></form><table></table></html>')
      const H = auditarSeguridad(dir); rmSync(join(dir, "panel.php")); rmSync(join(dir, "reportes.php")); rmSync(join(dir, "libre.php"))
      const sinSesion = H.some((h) => /sin verificar sesi/i.test(h.texto)), csrf = H.some((h) => /CSRF/i.test(h.texto))
      return [sinSesion && csrf, `página sin sesión ${sinSesion ? "✓" : "✗"} · CSRF ${csrf ? "✓" : "✗"}`]
    })
    await prueba("Sin git: lista archivos igual (no da verde falso)", () => {
      const sub = join(dir, "nogit"); mkdirSync(sub, { recursive: true }); esc("nogit/x.php", "<?php echo 1;")
      const L = listarArchivos(sub)
      return [L.some((f) => f.endsWith("x.php")), L.length ? `recorrió el disco sin git (${L.length} archivo)` : "no listó nada ✗"]
    })
    await prueba("Coherencia por código (plan): el cierre exige todo hecho", () => {
      guardarPlan(dir, ["parte A", "parte B"], "prueba")
      const antes = verificarPlan(dir).fallas          // debe fallar: 2 pendientes
      marcarPlan(dir, "parte A"); marcarPlan(dir, "parte B")
      const despues = verificarPlan(dir).fallas         // 0 pendientes
      try { rmSync(join(dir, ".skill_dey", "REQUISITOS.md")) } catch {}
      return [antes === 1 && despues === 0, antes === 1 && despues === 0 ? "pendiente → falla; completo → pasa ✓" : `antes=${antes} despues=${despues}`]
    })
    await prueba("Organizar proyecto (duplicados, capas, huérfanos)", () => {
      esc("ui/vista.php", '<?php $r = $db->query("SELECT * FROM t"); echo $r; ?>')
      const o = organizar(dir); rmSync(join(dir, "ui/vista.php"), { recursive: true })
      const ok = /organizar/.test(o) && /SQL dentro de la capa visual|fuera de su capa|Reutilizar|huérfanos/i.test(o)
      return [ok, ok ? "detecta SQL en capa visual y reporta estructura ✓" : "no reportó estructura"]
    })
    await prueba("Validación de servidor + rendimiento (N+1)", () => {
      esc("form.php", '<?php if($_POST){ echo "guardado ".$_POST["correo"]; } ?><form method="post"><input name="correo" required><input name="nombre" required></form>')
      esc("lista.php", '<?php foreach($items as $i){ $r = $db->query("SELECT * FROM t WHERE id=".$i); } ?>')
      const v = validacionServidor(dir); const nb = consultasEnBucle(dir)
      rmSync(join(dir, "form.php")); rmSync(join(dir, "lista.php"))
      const valida = /no se validan/i.test(v) && /correo/.test(v); const np = nb.some((x) => /N\+1|bucle/.test(x))
      return [valida && np, `campos sin validar en servidor ${valida ? "✓" : "✗"} · consulta en bucle ${np ? "✓" : "✗"}`]
    })
    await prueba("Intenciones nuevas sin comando", () => {
      const i = intencion
      const ok = i("revisa la seguridad") === "seguridad" && i("prueba la app") === "probar" && i("revisa el rendimiento") === "rendimiento" && i("formatea el codigo") === "formato" && i("agrega un campo") === null
      return [ok, ok ? "seguridad/probar/notas se reconocen; un pedido real va al modelo ✓" : "falló el reconocimiento"]
    })
    await prueba("Reglas de negocio seguras + pedidos sin comando", () => {
      const seg = consultaSegura("SELECT COUNT(*) FROM llenados WHERE litros < 0") && !consultaSegura("DELETE FROM llenados") && !consultaSegura("SELECT 1; DROP TABLE x")
      const int = intencion("documenta la app") === "documentar" && intencion("¿cuántos tokens me quedan?") === "consumo" && intencion("agrega el campo responsable") === null
      return [seg && int, `solo consultas de lectura ${seg ? "✓" : "✗"} · entiende pedidos sin comando ${int ? "✓" : "✗"}`]
    })
    await prueba("Revisión de todo el proyecto", () => {
      esc("config/datos.json", "{ roto ")
      const t = revisarTodo(dir); rmSync(join(dir, "config"), { recursive: true })
      return [!t.ok && t.lineas.some((l) => /JSON/.test(l)), !t.ok ? "encontró el JSON roto" : "NO lo encontró"]
    })
    await prueba("Análisis de seguridad (adopción)", () => {
      esc("web/buscar.php", '<?php $r = mysqli_query($db, "SELECT * FROM u WHERE id=" . $_GET["id"]); echo $_GET["q"];\n')
      const h = analizar(dir); rmSync(join(dir, "web"), { recursive: true })
      const sql = h.some((x) => /Inyección SQL/.test(x.texto)), xss = h.some((x) => /XSS/.test(x.texto))
      return [sql && xss, `inyección SQL ${sql ? "✓" : "✗"} · XSS ${xss ? "✓" : "✗"}`]
    })
    await prueba("Documentación viva (diccionario + script BD)", () => {
      esc("database/esquema.sql", "CREATE TABLE clientes (id INT PRIMARY KEY, nombre VARCHAR(80) NOT NULL);\n")
      esc("clientes.php", '<html><head><title>Clientes</title></head><body><form><label for="n">Nombre</label><input id="n" name="nombre" required><button>Guardar</button></form></body></html>\n')
      documentar(dir)
      const dic = existsSync(join(dir, "docs", "DICCIONARIO-DATOS.md")) && readFileSync(join(dir, "docs", "DICCIONARIO-DATOS.md"), "utf8").includes("clientes")
      const mu = existsSync(join(dir, "docs", "MANUAL-USUARIO.md")) ? readFileSync(join(dir, "docs", "MANUAL-USUARIO.md"), "utf8") : ""
      const manual = /Para qué sirve/.test(mu) && /\| Nombre \| texto \| Sí/.test(mu) && !/pendiente/.test(mu)
      empalme(dir); const emp = existsSync(join(dir, "docs", "EMPALME.md")) && !readFileSync(join(dir, "docs", "EMPALME.md"), "utf8").includes("secreta")
      return [dic && manual && emp, `diccionario ${dic ? "✓" : "✗"} · manual de usuario completo ${manual ? "✓" : "✗"} · empalme sin secretos ${emp ? "✓" : "✗"}`]
    })
    await prueba("Liberar puerto ocupado (proceso zombi)", async () => {
      const p = await puertoLibre()
      // proceso de desarrollo de prueba con lo que haya instalado (node, php o python)
      const cmd = hay("node") ? ["node", ["-e", `require("node:http").createServer(()=>{}).listen(${p},"127.0.0.1")`]]
        : hay("php") ? ["php", ["-S", `127.0.0.1:${p}`, "-t", dir]] : hay("python3") ? ["python3", ["-m", "http.server", String(p), "--bind", "127.0.0.1"]] : null
      if (!cmd) return [null, "sin node/php/python para simular un servidor: omitida"]
      const hijo = spawn(cmd[0] as string, cmd[1] as string[], { stdio: "ignore", detached: process.platform !== "win32" }); hijos.push(hijo)
      let visto = false; for (let i = 0; i < 50 && !visto; i++) { await esperar(60); visto = await new Promise<boolean>((ok) => { const c = connect(p, "127.0.0.1", () => { c.destroy(); ok(true) }).on("error", () => ok(false)) }) }
      if (!visto) { try { hijo.kill() } catch {} ; return [null, "no se pudo leer la lista de puertos en este sistema (lsof/ss/netstat)"] }
      liberarPuerto(p)
      let libre = false; for (let i = 0; i < 40 && !libre; i++) { await esperar(75); libre = !(await new Promise<boolean>((ok) => { const c = connect(p, "127.0.0.1", () => { c.destroy(); ok(true) }).on("error", () => ok(false)) })) }
      if (!libre) try { hijo.kill("SIGKILL") } catch {}
      return [libre, libre ? "detectó y liberó el puerto" : "no lo liberó"]
    })
    await prueba("Revisión del sitio (enlaces y páginas)", async () => {
      if (!hay("php")) return [null, "sin PHP en este equipo: omitida (en apps Node se prueba igual al usarla)"]
      esc("sitio/index.php", '<?php echo "<a href=\\"/falta.php\\">x</a><img src=\\"/no.png\\">";\n')
      const p = await puertoLibre()
      const { routerPhp } = await import("./app.ts")
      const srv = spawn("php", ["-S", `127.0.0.1:${p}`, "-t", join(dir, "sitio"), routerPhp()], { stdio: "ignore" })
      for (let i = 0; i < 20; i++) { try { await fetch(`http://127.0.0.1:${p}/`); break } catch { await esperar(60) } }
      const r = await rastrearSitio(dir, `http://127.0.0.1:${p}/`, null, 5); srv.kill()
      const ok = r.errores.some((e) => /404/.test(e.tipo)) && r.errores.length >= 2
      return [ok, ok ? `encontró ${r.errores.length} errores sembrados` : `encontró ${r.errores.length} de 2`]
    })
    await prueba("Búsqueda de skill cuando no hay rutina", () => {
      const r1 = buscarSkill(dir, "pasarela de pagos stripe xyz")
      const hueco = existsSync(join(dir, ".skill_dey", "HUECOS.md"))
      mkdirSync(join(dir, ".opencode", "skills", "pagos-stripe"), { recursive: true })
      writeFileSync(join(dir, ".opencode", "skills", "pagos-stripe", "SKILL.md"), "---\ndescription: integra pagos con stripe\n---\n")
      const r2 = buscarSkill(dir, "pagos stripe")
      const ok = /No hay skill/.test(r1) && hueco && /Ya hay skill instalada/.test(r2) && /pagos-stripe/.test(r2)
      return [ok, ok ? "sin skill → sugiere + anota hueco; con skill → la recomienda ✓" : "no detectó bien"]
    })
    await prueba("Aprende de cada corrida (lecciones por código)", () => {
      const r = aprenderDeCorrida(dir, "pruebas", ["PASS · / · ok", "FAIL · /x · HTTP 500 error de BD"])
      const f = join(dir, ".skill_dey", "APRENDIZAJE.md")
      const ok = /aprendido/.test(r) && existsSync(f) && /❌/.test(readFileSync(f, "utf8"))
      return [ok, ok ? "registra ok/fallo y promueve patrón reusable a global ✓" : "no registró"]
    })
    await prueba("Detecta y revisa app móvil (Flutter/React Native)", () => {
      const m = join(dir, "movilapp"); mkdirSync(m, { recursive: true }); writeFileSync(join(m, "pubspec.yaml"), "name: demo\n")
      const esF = esMovil(m) === "flutter"
      const r = revisarMovil(m)
      const ok = esF && /Flutter/.test(r.lineas.join(" "))
      return [ok, ok ? "detecta Flutter y arma el reporte del stack ✓" : "no detectó el stack móvil"]
    })
    await prueba("Extras pro: OpenAPI, Sentry, i18n (detección)", () => {
      const a = join(dir, "apiapp"); mkdirSync(join(a, "api"), { recursive: true }); writeFileSync(join(a, "api", "x.js"), "// api")
      const r1 = apiOpenapi(a, ["/", "/users"]); const specOk = existsSync(join(a, "docs", "openapi.json"))
      const s = join(dir, "sapp"); mkdirSync(s, { recursive: true }); writeFileSync(join(s, "package.json"), '{"dependencies":{"@sentry/node":"1"}}'); writeFileSync(join(s, ".env"), "SENTRY_DSN=x")
      const ok = /OpenAPI/.test(r1) && specOk && /integrado/.test(sentryCheck(s))
      return [ok, ok ? "genera OpenAPI starter + detecta Sentry ✓" : "falló la detección"]
    })
    await prueba("Multi-IA: reglas en el formato de cada asistente", () => {
      const m = join(dir, "multiapp"); mkdirSync(m, { recursive: true })
      const r = instalarMultiIA(m)
      const archivos = ["AGENTS.md", "CLAUDE.md", join(".cursor", "rules", "skill_dey.mdc"), join(".github", "copilot-instructions.md"), ".windsurfrules"]
      const ok = r.ok && archivos.every((f) => existsSync(join(m, f))) && /Prioridad fija/.test(readFileSync(join(m, "CLAUDE.md"), "utf8"))
      return [ok, ok ? "escribe reglas para Claude/Cursor/Copilot/Windsurf/Codex/Gemini/Cline ✓" : "faltó algún archivo de IA"]
    })
    await prueba("Robustez: git hook + reporte de uso", () => {
      const r = join(dir, "repo"); mkdirSync(join(r, ".git", "hooks"), { recursive: true })
      const h = instalarHook(r); const hookOk = existsSync(join(r, ".git", "hooks", "pre-commit")) && /git hook instalado/.test(h)
      mkdirSync(join(r, ".skill_dey"), { recursive: true }); writeFileSync(join(r, ".skill_dey", "APRENDIZAJE.md"), "# x\n❌ [pruebas] HTTP 500 error (2026-01-01)\n❌ [pruebas] HTTP 500 error (2026-01-02)\n")
      const rep = reporte(r).join(" "); const ok = hookOk && /HTTP 500|más repetidos|fallos aprendidos: 2/.test(rep)
      return [ok, ok ? "git hook instalado + reporte resume fallos ✓" : "falló hook/reporte"]
    })
    await prueba("Peso de las instrucciones (tokens fijos)", () => {
      const oc = join(homedir(), ".config", "opencode")
      const leerOc = (f: string) => { try { return readFileSync(join(oc, f), "utf8") } catch { return "" } }
      const desc = (t: string) => [...t.matchAll(/description:\s*"([^"]*)"|describe\("([^"]*)"\)/g)].map((m) => m[1] ?? m[2]).join(" ")
      const tk = (t: string) => Math.round(t.length / 4) // ≈ 4 caracteres por token
      const agente = tk(leerOc("agents/skill_dey.md")), skill = tk(leerOc("skills/skill-dey/SKILL.md")), herr = tk(desc(leerOc("tools/skill_dey.ts")) + desc(leerOc("plugins/skill_dey-guardian.ts")))
      const total = agente + skill + herr
      return [total > 0 && total < 2500, `~${total} tokens por sesión (agente ${agente} + skill ${skill} + herramientas ${herr}); referencias solo cuando se necesitan`]
    })
  } finally { for (const h of hijos) try { h.kill("SIGKILL") } catch {} ; try { rmSync(dir, { recursive: true, force: true }) } catch {} }

  const bien = F.filter((f) => f.ok === true).length, mal = F.filter((f) => f.ok === false), total = F.reduce((a, f) => a + f.ms, 0)
  const lento = F.filter((f) => f.ms > 5000)
  const log = (() => { try { return readFileSync(join(homedir(), ".config", "opencode", "skill_dey", "errores-guardian.log"), "utf8").trim().split("\n").slice(-3) } catch { return [] } })()
  return [
    `SKILL_DEY autoprueba · ${bien}/${F.length} piezas OK · ${(total / 1000).toFixed(1)} s en total (proyecto temporal, tu app no se toca)`,
    ...F.map((f) => `${f.ok === true ? "✅" : f.ok === false ? "❌" : "⏭"} ${f.pieza} · ${f.ms} ms · ${f.nota}`),
    ...(lento.length ? [`🐢 lentas (>5 s): ${lento.map((f) => f.pieza).join(", ")}`] : []),
    ...(log.length && log[0] ? ["Últimos errores internos del guardián (aislados, no afectaron tu sesión):", ...log.map((l) => "   " + l.slice(0, 160))] : []),
    mal.length ? `RESULTADO: ❌ ${mal.length} pieza(s) fallan → reinstala skill_dey o envía este reporte` : "RESULTADO: ✅ skill_dey funciona completa",
  ].join("\n")
}
