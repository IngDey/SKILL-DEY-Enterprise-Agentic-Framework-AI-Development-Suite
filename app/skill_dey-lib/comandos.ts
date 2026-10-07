// SKILL_DEY — comandos "/skill_dey <acción>" y las MISMAS acciones pedidas en lenguaje normal (sin comando).
// Las acciones de "consulta o mantenimiento" se ejecutan POR CÓDIGO: el modelo solo muestra el resultado (casi 0 tokens).
// Lo que necesita inteligencia (crear, corregir, auditar) va al modelo, como siempre.

export const QUE_HACE = `**¿Qué hace skill_dey?**
Convierte a OpenCode en un desarrollador que **entiende lo que pides, construye sin romper tu app y no entrega nada con errores**, gastando lo mínimo de tokens. No necesitas comandos: escribe normal.

1. **Entiende primero:** te dice "Entendí: …" y mide el tamaño del cambio. Un texto se hace rápido; algo grande lleva plan, preguntas y tu "sí".
2. **Nunca daña la app:** guarda una copia antes de cada pedido; con "deshaz" vuelve atrás. Ensaya las migraciones en una copia de la base de datos.
3. **Cero errores:** revisa código, consola, servidor y recorre todo el sitio; corrige hasta 0. Si se traba, cambia de método y si no, deshace y te explica.
4. **Seguridad y buenas prácticas automáticas:** bloquea contraseñas en el código, código peligroso y comandos riesgosos.
5. **Aprende:** cada error corregido se vuelve una *vacuna* que lo bloquea en todas tus apps; las reglas de tu negocio se verifican solas.
6. **Documenta sola:** manual de usuario por pantalla, manual técnico, diccionario y script de la base de datos, y paquete de empalme.
7. **Diseño y bocetos:** pantallas con buen diseño; lee bocetos de papel, Paint o Excel.
8. **Ahorra:** respuestas cortas, freno a las vueltas, muestra tokens usados y restantes, y si un modelo gratis se agota sigue con otro.
9. **Capacitación en video:** graba un video subtitulado enseñando a usar la app (tutorial.html + .srt + .mp4). Te lo ofrece cuando la app ya está lista, no antes.
10. **Testeo profesional:** deja una suite de pruebas en el repo (tests/e2e) y corre pruebas reales en vivo. También te lo ofrece cuando el proyecto está listo.
11. **Tablero de consumo al lado:** tokens de cada pregunta, de la sesión y de hoy, qué tan lleno está el contexto, herramientas usadas y tiempo de sesión.
12. **Busca skills:** si no tiene cómo resolver algo, busca una skill instalada o te propone instalar una.

**Por defecto hago TODO al darte una instrucción.** Solo te pregunto antes de las acciones finales (video, pruebas profesionales, publicar), y únicamente cuando el proyecto se ve terminado.`

export const AYUDA = `**SKILL_DEY — ayuda** · No necesitas comandos: escribe normal y hago TODO. Los comandos son atajos para pedir UNA sola cosa. Formato: \`/skill_dey <comando>\`. Acciones finales (video, pruebas, publicar): te las pregunto antes y solo cuando el proyecto está listo.

**1. Encender y apagar**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`iniciar\` | Enciende skill_dey: desde ahí todo lo que pidas usa sus reglas y protecciones | "iniciar skill dey" |
| \`finalizar\` | Apaga skill_dey: OpenCode vuelve a funcionar como viene por defecto | "finalizar skill dey" |
| \`que-hace\` | Explica en 8 puntos qué hace skill_dey | "¿qué hace la skill?" |
| \`ayuda\` | Muestra esta lista | "ayuda de skill dey" |

**2. Trabajar en tu app**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`<tu pedido>\` | Hace la tarea completa: entiende, planifica si es grande, construye, prueba y documenta | escribe el pedido normal |
| \`sigue\` | Retoma la tarea que quedó a medias, sin repetir lo hecho | "sigue" |
| \`adoptar\` | Primera vez en una app que ya existe: la revisa entera y deja un informe con lo que hay que corregir | "revisa toda la app" |

**3. Revisar y corregir errores**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`revisar\` | Busca errores en TODO: código, arranque y cada página del sitio. Solo informa | "revisa que no haya errores" |
| \`corregir\` | Busca y corrige todos los errores hasta dejar 0 | "corrige los errores" |
| \`auditar\` | Revisión de seguridad, calidad y diseño sin tocar el código | "audita la app" |
| \`seguridad\` | Busca huecos de seguridad: sesión, contraseñas, CSRF, accesos, subidas, debug, CORS | "revisa la seguridad" |
| \`probar\` | Usa la app como un usuario y la ataca (formularios, obligatorios, SQL/XSS, acceso sin sesión) | "prueba la app" |
| \`pruebas\` | Testeo profesional: deja la suite E2E en el repo (tests/e2e) y corre una prueba real en vivo | "hazme las pruebas profesionales" |
| \`capacitar\` | Graba un video subtitulado enseñando a usar la app (docs/capacitacion: tutorial.html + .srt + .mp4) | "crea el video de capacitación" |
| \`movil\` | App Flutter/React Native: corre su analizador y pruebas (flutter analyze/test, lint/test RN) | "revisa la app móvil" |
| \`multi-ia\` | Escribe las reglas de skill_dey para TODAS las IAs (Claude Code, Cursor, Windsurf, Copilot, Codex, Gemini, Cline…) | "haz que funcione con todas las ias" |
| \`deshacer\` · \`rehacer\` · \`historial\` | Volver al estado anterior · anular el deshacer · ver los cambios guardados | "deshaz" |

**4. Documentar y entregar**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`documentar\` | Crea o actualiza: manual de usuario (cada pantalla), manual técnico, diccionario de datos y script de la base de datos | "documenta la app" |
| \`empalme\` | Prepara la entrega de la app a otra persona (docs/EMPALME.md) | "prepara el empalme" |
| \`notas\` | Genera las notas de versión en lenguaje de usuario (docs/NOVEDADES.md) | "genera las notas de versión" |
| \`principios\` | Muestra o crea las reglas fijas de la app (stack, seguridad, estilo) | "¿cuáles son los principios?" |
| \`organizar\` | Ordena el proyecto: indentación, estructura, reutilizar código, archivos fuera de lugar | "organiza el proyecto" |
| \`documentar\` genera además los **PDF** (manual técnico, usuario, diccionario) con tu marca | — | "documenta la app" |

**5. Negocio y base de datos**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`reglas\` | Muestra las reglas de tu negocio que se verifican solas y las vacunas contra errores | "¿qué reglas tiene la app?" |
| \`copia-bd\` | Crea una copia de prueba de la base de datos para ensayar cambios sin tocar la real | "haz una copia de prueba de la bd" |
| \`rendimiento\` | Mide cuánto tarda cada página y detecta consultas lentas en bucle | "revisa el rendimiento" |
| \`validar\` | Revisa que los campos obligatorios se validen en el servidor y sugiere el código | "valida los formularios" |
| \`formato\` | Deja el código con estilo uniforme (prettier/php-cs-fixer/black) | "formatea el código" |
| \`produccion\` | Lee los errores reales del servidor (log) y los agrupa | "ver errores de producción" |

**6. Estado, consumo y modelos**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`prueba\` · \`eval\` | Comprueba que skill_dey funciona (autoprueba) y mide su velocidad | "¿skill dey funciona?" |
| \`doctor\` | Revisa que la instalación esté completa y coherente; dice qué falta y dónde | "revisa la instalación" |
| \`hook\` | Instala un git pre-commit que bloquea commits con errores (red de seguridad en cualquier editor) | "pon el git hook" |
| \`reporte\` | Resume tu uso real (consultas, fallos más repetidos, último testeo) para recortar con datos | "dame el reporte de uso" |
| \`consumo\` | Tokens usados en la consulta y la sesión, y cuántos quedan | "¿cuántos tokens me quedan?" |
| \`tablero\` | Muestra el panel de consumo (tokens, contexto, herramientas, tiempo); también en .skill_dey/TABLERO.txt | "muéstrame el tablero" |
| \`buscar-skill <tema>\` | Busca una skill instalada para el tema; si no hay, sugiere instalar una | "busca una skill para stripe" |
| \`modelos\` | Modelos gratis, cuáles llegaron a su límite y cuál sigue | "¿qué modelos tengo?" |
| \`procesos\` · \`liberar <puerto>\` · \`levantar\` · \`detener\` | Ver, liberar, subir o bajar los servidores de la app | "el puerto 3000 está ocupado" |

**7. Entregar al repositorio y publicar**
| Comando | Qué hace | O escribe |
|---|---|---|
| \`commit\` | Guarda los cambios en git con un mensaje claro (tras verificar en verde) | "haz commit" |
| \`pr\` | Prepara el pull request con resumen de lo hecho | "haz el PR" |
| \`publicar\` | Sube la app al servidor con verificación antes y después, y vuelve atrás si falla | "publica la app" |
| \`congelar <ruta>\` | Marca archivos o carpetas que no se tocan sin permiso | "congela la carpeta pagos" |

Fuera de OpenCode (terminal): \`node ~/.config/opencode/skill_dey/skill_dey.mjs documentar|empalme|reglas|revisar|notas\``

export type Deps = {
  cwd: string; sesion: string
  T: Record<string, any>
  documentar: (cwd: string) => string; empalme: (cwd: string) => string; organizar: (cwd: string) => string
  reglas: (cwd: string) => string; quitarRegla: (cwd: string, n: number) => string; quitarVacuna: (n: number) => string; copiaBd: (cwd: string) => string
  seguridad: (cwd: string) => string; probar: (cwd: string) => Promise<string>; notas: (cwd: string) => string; principios: (cwd: string) => string; congelar: (cwd: string, ruta: string) => string
  capacitar: (cwd: string) => Promise<string>; pruebas: (cwd: string) => Promise<string>; movil: (cwd: string) => string; multiIA: (cwd: string) => string
  formato: (cwd: string) => string; validar: (cwd: string) => string; rendimiento: (cwd: string) => Promise<string>; produccion: (cwd: string) => string
  diagnostico: () => string; autoprueba: () => Promise<string>
  doctor: () => string[]; hook: (cwd: string) => string; reporte: (cwd: string) => string[]
  consumo: () => Promise<string>; modelos: () => string
  tablero: () => string; buscarSkill: (cwd: string, tema: string) => string
  fijarActivo: (v: boolean) => void
}
export type Resultado = { codigo: true; texto: string } | { codigo: false; prompt: string }

/** Pedido en lenguaje normal → comando equivalente (solo frases cortas e inequívocas; lo demás lo atiende el modelo). */
export function intencion(texto: string): string | null {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,"'“”«»`]/g, "").trim()
  if (!t || t.split(/\s+/).length > 12) return null
  const R: [RegExp, string][] = [
    [/^(ayuda|comandos)( de)?( la)?( skill[ _-]?dey)?$|^(que comandos|cuales son los comandos)/, "ayuda"],
    [/^que (hace|es) (la )?skill[ _-]?dey|^que hace (la|esta) skill/, "que-hace"],
    [/^(documenta|documentar|genera|actualiza|haz|crea)( la| el| los| toda la)? (app|aplicacion|proyecto|documentacion|manual(es)?( de usuario| tecnico)?|diccionario( de datos)?)\b/, "documentar"],
    [/(prepara|genera|haz|arma)( el| la| un| una)? (empalme|entrega)|paquete de empalme/, "empalme"],
    [/^(cuantos|cuantas) tokens|^cuanto (he |llevo |me queda|gaste|gastado|consumo)|^(consumo|mi consumo|uso de tokens)/, "consumo"],
    [/^(muestra(me)?|ver|dame|abre)\s+(el\s+)?(tablero|panel)\b|tablero de (consumo|tokens)/, "tablero"],
    [/^busca(r)? (una )?skill( para| de)?/, "buscar-skill"],
    [/^(que|cuales) modelos|^modelos (gratis|disponibles)/, "modelos"],
    [/skill[ _-]?dey (funciona|esta funcionando)|^funciona (la )?skill|^prueba (la )?skill/, "prueba"],
    [/^doctor|revisa (la )?instalaci|esta bien instalad|^diagnostico de instalaci/, "doctor"],
    [/git.?hook|pre.?commit|antes de (cada )?commit|red de seguridad/, "hook"],
    [/^reporte|^informe|resumen de uso|como (voy|va)|estadisticas de uso/, "reporte"],
    [/^(deshaz|deshacer|revierte|revertir|vuelve( a)? como estaba|eso lo dano|regresa como estaba)( (el|lo) ultimo( cambio)?)?$/, "deshacer"],
    [/^(rehaz|rehacer)$/, "rehacer"],
    [/^(historial|que cambios (hiciste|guardaste))/, "historial"],
    [/^(que|cuales) reglas|^(muestra|ver) (las )?(reglas|vacunas)/, "reglas"],
    [/(copia|base) de prueba (de|para) (la )?(bd|base)|^copia(r)? (la )?(bd|base de datos)/, "copia-bd"],
    [/^(revisa|revisar|chequea|audita)( la)? seguridad|huecos de seguridad|^es segura/, "seguridad"],
    [/^(prueba|probar|testea)( la)? (app|aplicacion|aplicativo|funcionalidad)$/, "probar"],
    [/^(pruebas? profesional|testeo profesional|haz(me)? las pruebas|corre las pruebas|suite de pruebas|test(ea|ear)? profesional)/, "pruebas"],
    [/^(crea|haz|genera)?\s*(el )?video( de)? (capacitaci|tutorial)|^capacita(r)?\b|tutorial (de|para) (la )?app/, "capacitar"],
    [/^(revisa|prueba|analiza)( la)? (app )?(movil|móvil|flutter|react native)|^movil\b|^móvil\b/, "movil"],
    [/multi.?ia|todas las ias|otras ias|funcione (con|en) (todas|otras) (las )?ias|reglas para (cursor|copilot|windsurf|gemini|codex|cline)/, "multi-ia"],
    [/(genera|haz|crea)( las| el)? (notas|changelog|novedades)( de version)?/, "notas"],
    [/^(que|cuales) (son los )?principios|^ver principios/, "principios"],
    [/^(organiza|organizar|ordena|ordenar|limpia)( el| todo el)? (proyecto|codigo|estructura|carpetas)/, "organizar"],
    [/^(revisa|revisar|mide|medir|chequea)( el)? rendimiento|que tan rapid|^es (lenta|rapida)/, "rendimiento"],
    [/^(valida|validar)( los| las)? (formularios|campos|datos)/, "validar"],
    [/^(formatea|formatear|ordena)( el)? (codigo|estilo)/, "formato"],
    [/errores (de |en )?produccion|logs? (del|de) servidor|errores reales/, "produccion"],
  ]
  for (const [re, c] of R) if (re.test(t)) return c
  return null
}

/** Interpreta "/skill_dey <args>". codigo=true → ya se ejecutó; codigo=false → instrucción para el modelo. */
export async function ejecutarComando(args: string, d: Deps): Promise<Resultado> {
  const [c0 = "ayuda", ...resto] = args.trim().split(/\s+/)
  const cmd = c0.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), arg = resto.join(" ")
  const ctx = { worktree: d.cwd, directory: d.cwd, sessionID: d.sesion }
  const run = async (tool: string, a: any = {}) => String(await d.T[tool].execute(a, ctx))
  const ok = (texto: string): Resultado => ({ codigo: true, texto })
  switch (cmd) {
    case "ayuda": case "help": case "comandos": case "?": return ok(AYUDA)
    case "que-hace": case "quehace": case "info": case "que": return ok(QUE_HACE)
    case "documentar": case "docs": case "documentacion": return ok(d.documentar(d.cwd))
    case "organizar": case "ordenar": return ok(d.organizar(d.cwd))
    case "plan": return ok(await d.T["skill_dey_plan"] ? String(await d.T["skill_dey_plan"].execute({}, { worktree: d.cwd, directory: d.cwd, sessionID: d.sesion })) : "sin plan")
    case "empalme": case "entrega": return ok(d.empalme(d.cwd))
    case "reglas": case "vacunas": return ok(d.reglas(d.cwd))
    case "quitar-regla": return ok(d.quitarRegla(d.cwd, Number(arg)))
    case "quitar-vacuna": return ok(d.quitarVacuna(Number(arg)))
    case "copia-bd": case "bd-prueba": return ok(d.copiaBd(d.cwd))
    case "seguridad": return ok(d.seguridad(d.cwd))
    case "probar": return ok(await d.probar(d.cwd))
    case "pruebas": case "testear": return ok(await d.pruebas(d.cwd))
    case "capacitar": case "video": case "tutorial": return ok(await d.capacitar(d.cwd))
    case "movil": case "móvil": case "flutter": case "rn": return ok(d.movil(d.cwd))
    case "multi-ia": case "multiia": case "multi": return ok(d.multiIA(d.cwd))
    case "notas": case "novedades": case "changelog": return ok(d.notas(d.cwd))
    case "principios": return ok(d.principios(d.cwd))
    case "congelar": return ok(d.congelar(d.cwd, arg))
    case "rendimiento": case "rendir": return ok(await d.rendimiento(d.cwd))
    case "validar": case "validacion": return ok(d.validar(d.cwd))
    case "formato": case "formatear": return ok(d.formato(d.cwd))
    case "produccion": case "logs": return ok(d.produccion(d.cwd))
    case "revisar": case "revisa": case "todo": return ok(await run("verificar", { todo: true }))
    case "sitio": return ok(await run("sitio", arg ? { url: arg } : {}))
    case "verificar": return ok(await run("verificar", { nivel: /^N[0-3]$/i.test(arg) ? arg.toUpperCase() : "N1" }))
    case "prueba": case "diagnostico": case "test": case "eval": return ok(d.diagnostico() + "\n\n" + await d.autoprueba())
    case "doctor": return ok(d.doctor().join("\n"))
    case "hook": case "git-hook": return ok(d.hook(d.cwd))
    case "reporte": case "informe": return ok(d.reporte(d.cwd).join("\n"))
    case "consumo": case "tokens": return ok(await d.consumo())
    case "tablero": case "panel": return ok(d.tablero())
    case "buscar-skill": case "buscarskill": case "skill": return ok(d.buscarSkill(d.cwd, arg))
    case "modelos": case "modelo": return ok(d.modelos())
    case "deshacer": return ok(await run("deshacer", { accion: "deshacer", pasos: Number(arg) || 1 }))
    case "rehacer": return ok(await run("deshacer", { accion: "rehacer" }))
    case "historial": return ok(await run("deshacer", { accion: "historial" }))
    case "procesos": return ok(await run("procesos", { accion: "listar" }))
    case "liberar": return ok(await run("procesos", { accion: "liberar", puerto: Number(arg) || undefined }))
    case "levantar": return ok(await run("procesos", { accion: "levantar" }))
    case "detener": return ok(await run("procesos", { accion: "detener" }))
    case "adoptar": return ok(await run("adoptar"))
    case "mapa": return ok(await run("mapa", { forzar: true }))
    case "iniciar": case "encender": d.fijarActivo(true); return ok("✅ SKILL_DEY activo: desde ahora todo lo que pidas usa sus reglas y protecciones.")
    case "finalizar": case "apagar": d.fijarActivo(false); return ok("⏹ SKILL_DEY finalizado: OpenCode funciona como viene por defecto. Para volver: /skill_dey iniciar")
    case "corregir": return { codigo: false, prompt: "Revisa que no haya errores y corrígelos todos: carga la skill `skill-dey` y sigue references/depuracion.md hasta 0 errores." }
    case "commit": return { codigo: false, prompt: "Carga la skill `skill-dey`. Verifica en verde; si lo está, haz git add de lo cambiado y un commit con mensaje claro (qué y por qué). No hagas push salvo que el usuario lo pida." }
    case "pr": return { codigo: false, prompt: "Carga la skill `skill-dey`. Verifica en verde y prepara el pull request: commit si falta, y un resumen (qué cambió, por qué, cómo probarlo). No hagas push ni abras el PR sin confirmación." }
    case "publicar": case "desplegar": return { codigo: false, prompt: "Carga la skill `skill-dey`. ANTES de publicar verifica en verde y, si no está en PRINCIPIOS.md, pregunta cómo se publica esta app (FTP, git en el servidor, panel). Verifica antes y después; si algo falla, revierte. Nunca publiques sin confirmación." }
    case "auditar": return { codigo: false, prompt: `Carga la skill \`skill-dey\`. Audita sin cambiar código ${arg || "todo el proyecto"}: verificación funcional, seguridad, visual y UX; entrega hallazgos priorizados (crítico/alto/medio/bajo) con archivo:línea.` }
    case "sigue": case "reanudar": case "continua": return { codigo: false, prompt: "Carga la skill `skill-dey` y retoma la tarea pendiente desde .skill_dey/ESTADO.md sin re-analizar lo cerrado." }
    default: return { codigo: false, prompt: args.trim() }
  }
}
