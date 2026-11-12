// SKILL_DEY — línea de comandos para usar SIN OpenCode (terminal, cron, CI, CUALQUIER IA). Se empaqueta en skill_dey/skill_dey.mjs (solo Node).
// Uso: node ~/.config/opencode/skill_dey/skill_dey.mjs <accion> [carpeta] [url]
import { resolve } from "node:path"
import { documentar } from "./documentar.ts"
import { revisarTodo } from "./escaneo.ts"
import { analizar } from "./adopcion.ts"
import { empalme } from "./empalme.ts"
import { listar } from "./reglas.ts"
import { notasVersion } from "./saber.ts"
import { validacionServidor, erroresProduccion, formatear } from "./extras.ts"
import { organizar } from "./organizar.ts"
import { documentosPdf } from "./pdf.ts"
import { resumenSeguridad } from "./seguridad.ts"
import { pruebasProfesionales } from "./testpro.ts"
import { capacitar } from "./video.ts"
import { revisarMovil } from "./movil.ts"
import { auditarDependencias, semgrep, sentryCheck } from "./pro.ts"
import { instalarMultiIA } from "./multiia.ts"
import { doctor, instalarHook, reporte } from "./robustez.ts"
import { mapaMental } from "./mapa_mental.ts"
import { generarMockup } from "./diseno.ts"
import { optimizarPrompt } from "./prompt.ts"
import { panel } from "./trazas.ts"
import { checkpoint, listarHitos, volver } from "./respaldo.ts"
import { buscarMemoria } from "./indice.ts"
import { rastrearSitio } from "./sitio.ts"
import { iniciarApp, asegurarPlaywright } from "./app.ts"
import { chromeAbierto, comoAbrirChrome } from "./navegador.ts"

const banderas = process.argv.slice(2).filter((x) => x.startsWith("--")), posicionales = process.argv.slice(2).filter((x) => !x.startsWith("--"))
const [cmd = "ayuda", carpeta = ".", url] = posicionales
const cwd = resolve(carpeta)
const AYUDA = `skill_dey (terminal · funciona con cualquier IA)
  node skill_dey.mjs revisar [carpeta]          Errores de código, arranque y sitio
  node skill_dey.mjs chrome [carpeta] [url]     Abre la app en Chrome y lee consola/JS/red/HTTP (--visible · --conectar)
  node skill_dey.mjs seguridad [carpeta]        Huecos de seguridad + auditoría de dependencias + semgrep
  node skill_dey.mjs pruebas [carpeta] [url]    Suite E2E + prueba en vivo + a11y + carga + cobertura + CI
  node skill_dey.mjs capacitar [carpeta] [url]  Video subtitulado de capacitación (docs/capacitacion)
  node skill_dey.mjs movil [carpeta]            App Flutter/React Native: analizador + pruebas del stack
  node skill_dey.mjs organizar [carpeta]        Ordena el proyecto (formato + estructura)
  node skill_dey.mjs documentar [carpeta]       Manuales + diccionario + BD + PDF
  node skill_dey.mjs validar|produccion|formato|reglas|notas|empalme|pdf [carpeta]
  node skill_dey.mjs multi-ia [carpeta]         Escribe las reglas de skill_dey para TODAS las IAs del proyecto
  node skill_dey.mjs doctor                      Revisa que la instalación esté completa y coherente
  node skill_dey.mjs hook [carpeta]             Instala un git pre-commit que bloquea commits con errores
  node skill_dey.mjs reporte [carpeta]          Resumen de tu uso real (para recortar con datos)
  node skill_dey.mjs mapa [carpeta]             Mapa mental (Mermaid) con requisitos + arquitectura
  node skill_dey.mjs mockup . "<brief>"         Mockup de UI responsive desde un brief (docs/mockups)
  node skill_dey.mjs prompt <texto>             Reescribe tu pedido como instrucción clara y completa
  node skill_dey.mjs panel [carpeta]            Panel de observabilidad (tokens/costo/tiempo) en .skill_dey/PANEL.html
  node skill_dey.mjs checkpoint . <nombre>      Guarda un punto exacto para volver luego (time-travel)
  node skill_dey.mjs volver . <nombre>          Restaura el proyecto a ese checkpoint (reversible)
  node skill_dey.mjs hitos [carpeta]            Lista los checkpoints
  node skill_dey.mjs buscar-memoria <texto>     Busca en tu memoria solo lo relevante (BM25)
  node skill_dey.mjs ayuda                       Esta ayuda
Dentro de OpenCode: /skill_dey ayuda`

async function main() {
  switch (cmd) {
    case "documentar": return console.log(documentar(cwd))
    case "empalme": return console.log(empalme(cwd))
    case "reglas": return console.log(listar(cwd))
    case "notas": return console.log(notasVersion(cwd))
    case "validar": return console.log(validacionServidor(cwd))
    case "produccion": case "logs": return console.log([erroresProduccion(cwd), sentryCheck(cwd)].filter(Boolean).join("\n"))
    case "formato": return console.log(formatear(cwd, false))
    case "organizar": return console.log(organizar(cwd))
    case "pdf": return console.log(documentosPdf(cwd))
    case "seguridad": return console.log([...resumenSeguridad(cwd).lineas, ...await auditarDependencias(cwd), await semgrep(cwd)].filter(Boolean).join("\n"))
    case "movil": return console.log(revisarMovil(cwd).lineas.join("\n"))
    case "multi-ia": case "multiia": return console.log(instalarMultiIA(cwd).lineas.join("\n"))
    case "doctor": return console.log(doctor().join("\n"))
    case "hook": case "git-hook": return console.log(instalarHook(cwd))
    case "reporte": case "informe": return console.log(reporte(cwd).join("\n"))
    case "mapa": case "mapa-mental": case "mindmap": return console.log(mapaMental(cwd).lineas.join("\n"))
    case "mockup": case "diseno": return console.log(generarMockup(cwd, url || "").lineas.join("\n"))
    case "prompt": case "optimizar": return console.log(optimizarPrompt(process.argv.slice(3).join(" ")))
    case "panel": case "observabilidad": return console.log(panel(cwd).lineas.join("\n"))
    case "checkpoint": case "hito": return console.log(checkpoint(cwd, url || ""))
    case "volver": case "restaurar": return console.log(volver(cwd, url || ""))
    case "hitos": case "checkpoints": return console.log(listarHitos(cwd))
    case "buscar-memoria": case "memoria": { const r = buscarMemoria(cwd, process.argv.slice(3).join(" "), 8); return console.log(r.length ? r.join("\n") : "sin resultados") }
    case "pruebas": case "test": { const r = await pruebasProfesionales(cwd, url); console.log(r.lineas.join("\n")); process.exitCode = r.fallas ? 1 : 0; return }
    case "capacitar": case "video": { const r = await capacitar(cwd, url); return console.log(r.lineas.join("\n")) }
    case "chrome": case "navegador": case "consola": {
      let base = url, app: any = null
      if (!base) { app = await iniciarApp(cwd).catch(() => null); base = app?.url }
      if (!base) { console.log("❌ no pude levantar la app: pásame la url"); process.exitCode = 1; return }
      try {
        const cdp = banderas.includes("--conectar") ? await chromeAbierto() : null
        if (banderas.includes("--conectar") && !cdp) { console.log("❌ no encontré tu Chrome con depuración. Ábrelo así y repite:\n" + comoAbrirChrome()); process.exitCode = 1; return }
        const r = await rastrearSitio(cwd, base, asegurarPlaywright(cwd), 40, { visible: banderas.includes("--visible"), cdp })
        console.log(r.lineas.join("\n")); process.exitCode = r.ok ? 0 : 1
      } finally { app?.detener?.() }
      return
    }
    case "revisar": {
      const t = revisarTodo(cwd); console.log(t.lineas.join("\n"))
      const h = analizar(cwd); if (h.length) console.log("\nHallazgos:\n" + h.map((x) => `[${x.prioridad}·${x.tipo}] ${x.texto}\n   ${x.donde.slice(0, 4).join(" · ")}`).join("\n"))
      process.exitCode = t.ok ? 0 : 1; return
    }
    default: return console.log(AYUDA)
  }
}
main()
