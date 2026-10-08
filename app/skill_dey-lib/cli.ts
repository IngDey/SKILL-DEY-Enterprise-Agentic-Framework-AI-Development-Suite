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

const [cmd = "ayuda", carpeta = ".", url] = process.argv.slice(2)
const cwd = resolve(carpeta)
const AYUDA = `skill_dey por Ing. Dey (@IngDey) · terminal, funciona con cualquier IA
  node skill_dey.mjs revisar [carpeta]          Errores de código, arranque y sitio
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
    case "seguridad": return console.log([...resumenSeguridad(cwd).lineas, ...auditarDependencias(cwd), semgrep(cwd)].filter(Boolean).join("\n"))
    case "movil": return console.log(revisarMovil(cwd).lineas.join("\n"))
    case "multi-ia": case "multiia": return console.log(instalarMultiIA(cwd).lineas.join("\n"))
    case "doctor": return console.log(doctor().join("\n"))
    case "hook": case "git-hook": return console.log(instalarHook(cwd))
    case "reporte": case "informe": return console.log(reporte(cwd).join("\n"))
    case "pruebas": case "test": { const r = await pruebasProfesionales(cwd, url); console.log(r.lineas.join("\n")); process.exitCode = r.fallas ? 1 : 0; return }
    case "capacitar": case "video": { const r = await capacitar(cwd, url); return console.log(r.lineas.join("\n")) }
    case "revisar": {
      const t = revisarTodo(cwd); console.log(t.lineas.join("\n"))
      const h = analizar(cwd); if (h.length) console.log("\nHallazgos:\n" + h.map((x) => `[${x.prioridad}·${x.tipo}] ${x.texto}\n   ${x.donde.slice(0, 4).join(" · ")}`).join("\n"))
      process.exitCode = t.ok ? 0 : 1; return
    }
    default: return console.log(AYUDA)
  }
}
main()
