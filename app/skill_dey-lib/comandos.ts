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
| \`chrome [url] [visible] [conectar]\` | Abre la app en Chrome, recorre las páginas y lee consola, errores JS, red y HTTP; deja capturas. \`visible\`=lo ves navegar · \`conectar\`=usa tu Chrome abierto | "revisa la consola en chrome" |
| \`corregir\` | Busca y corrige todos los errores hasta dejar 0 | "corrige los errores" |
| \`auditar\` | Revisión de seguridad, calidad y diseño sin tocar el código | "audita la app" |
| \`seguridad\` | Busca huecos de seguridad: sesión, contraseñas, CSRF, accesos, subidas, debug, CORS | "revisa la seguridad" |
| \`probar\` | Usa la app como un usuario y la ataca (formularios, obligatorios, SQL/XSS, acceso sin sesión) | "prueba la app" |
| \`pruebas\` | Testeo profesional: deja la suite E2E en el repo (tests/e2e) y corre una prueba real en vivo | "hazme las pruebas profesionales" |
| \`capacitar\` | Graba un video subtitulado enseñando a usar la app (docs/capacitacion: tutorial.html + .srt + .mp4) | "crea el video de capacitación" |
| \`movil\` | App Flutter/React Native: corre su analizador y pruebas (flutter analyze/test, lint/test RN) | "revisa la app móvil" |
| \`multi-ia\` | Escribe las reglas de skill_dey para TODAS las IAs (Claude Code, Cursor, Windsurf, Copilot, Codex, Gemini, Cline…) | "haz que funcione con todas las ias" |
| \`mapa\` | Dibuja un mapa mental (Mermaid) con lo pedido + la arquitectura para ordenar la info (.skill_dey/MAPA.md + .html) | "hazme el mapa mental" |
| \`mockup <brief>\` | Genera un mockup de UI responsive (claro/oscuro) desde tu brief (docs/mockups/, un archivo por brief) | "mockup login con dashboard y tabla" |
| \`prompt <texto>\` | Reescribe tu pedido como instrucción clara (objetivo, criterios, lo implícito, qué aclarar) para acertar más | "optimiza el prompt: agrega login" |
| \`deshacer\` · \`rehacer\` · \`historial\` | Volver al estado anterior · anular el deshacer · ver los cambios guardados | "deshaz" |
| \`historial\` · \`antes-de\` | Puntos guardados con TU pedido (también de sesiones anteriores) y volver a uno | "vuelve al punto 3" · "vuelve a antes de arreglar el login" |
| \`deshacer <archivo>\` | Deshace SOLO ese archivo; lo demás queda igual | "deshaz solo ventas.php" |
| \`donde\` | Dónde quedamos: últimos pedidos del proyecto, de todas las sesiones | "¿dónde quedamos?" |

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
| \`panel\` | Panel de observabilidad (tokens/costo/tiempo por consulta, tendencias) en .skill_dey/PANEL.html | "muéstrame el panel" |
| \`checkpoint <nombre>\` · \`volver <nombre>\` · \`hitos\` | Guarda un punto exacto, vuelve a él (time-travel) y lista los puntos | "checkpoint antes-de-pagos" |
| \`buscar-memoria <texto>\` | Busca en tu memoria solo lo relevante (ranking BM25, no satura el contexto a escala) | "busca en la memoria lo de facturación" |
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
  cwd: string; sesion: string; donde?: (cwd: string, n?: number) => string[]
  T: Record<string, any>
  documentar: (cwd: string) => string; empalme: (cwd: string) => string; organizar: (cwd: string) => string
  reglas: (cwd: string) => string; quitarRegla: (cwd: string, n: number) => string; quitarVacuna: (n: number) => string; copiaBd: (cwd: string) => string
  seguridad: (cwd: string) => Promise<string> | string; probar: (cwd: string) => Promise<string>; notas: (cwd: string) => string; principios: (cwd: string) => string; congelar: (cwd: string, ruta: string) => string
  capacitar: (cwd: string) => Promise<string>; pruebas: (cwd: string) => Promise<string>; movil: (cwd: string) => string; multiIA: (cwd: string) => string; mapa: (cwd: string) => string; mockup: (cwd: string, brief: string) => string; optimizar: (texto: string) => string
  panel: (cwd: string) => string; checkpoint: (cwd: string, n: string) => string; hitos: (cwd: string) => string; volver: (cwd: string, n: string) => string; buscarMemoria: (cwd: string, q: string) => string
  formato: (cwd: string) => string; validar: (cwd: string) => string; rendimiento: (cwd: string) => Promise<string>; produccion: (cwd: string) => string
  diagnostico: () => string; autoprueba: () => Promise<string>
  doctor: () => string[]; hook: (cwd: string) => string; reporte: (cwd: string) => string[]
  consumo: () => Promise<string>; modelos: () => string
  tablero: () => string; buscarSkill: (cwd: string, tema: string) => string; version: () => string
  impactoProfundo: (cwd: string, objetivo: string) => string; cambiosExactos: (cwd: string) => string
  fijarActivo: (v: boolean) => void
}
export type Resultado = { codigo: true; texto: string } | { codigo: false; prompt: string }

/** Pedido en lenguaje normal → comando equivalente (solo frases cortas e inequívocas; lo demás lo atiende el modelo). */
export function intencion(texto: string): string | null {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,"'“”«»`]/g, "").trim()
  if (!t || t.split(/\s+/).length > 12) return null
  // "revisa la consola en chrome [url] [visible] [con mi chrome]" → prueba real en Chrome (debe EMPEZAR con el verbo)
  if (/^(revisa|revisar|prueba|probar|abre|abrir|lee|leer|mira|mirar|verifica|chequea|conectate|testea|corre)\b/.test(t) && (/\b(en|con|usando|desde) (el |mi )?(chrome|navegador)\b|\bconsola (del navegador|de chrome|de devtools|del browser)\b|\bdevtools\b/.test(t) || /^(revisa|lee|mira|chequea) (la )?consola$/.test(t))) { // "la consola de administración" NO es la del navegador
    const url = texto.match(/https?:\/\/[^\s"'<>]+/i)?.[0]
    return ["chrome", url, /\bvisible\b|que (yo )?(lo )?vea|ver(lo)? navegando/.test(t) ? "visible" : "", /conecta|mi chrome|chrome abierto|ya abierto/.test(t) ? "conectar" : ""].filter(Boolean).join(" ")
  }
  // "deshaz solo lado.php" / "revierte los cambios de src/api/rutas.ts" → deshace SOLO ese archivo (el resto queda igual)
  const da = texto.trim().replace(/[.!¡¿?]+$/, "").match(/^(?:deshaz|deshacer|revierte|revertir|regresa|devuelve|restaura)(?:\s+(?:solo|solamente|únicamente|unicamente))?(?:\s+(?:el|lo|los)\s+(?:cambios?|archivo)(?:\s+(?:de|en|del))?)?(?:\s+(?:lo de|el|la))?\s+[`"']?([\w.\/\\-]+\.[A-Za-z0-9]{1,6})[`"']?(?:\s+(?:como estaba|a como estaba))?$/i)
  if (da) return `deshacer ${da[1]}`
  // volver a un punto de cualquier sesión anterior: "vuelve al punto 3" · "vuelve a antes de arreglar el login" · "¿dónde quedamos?"
  const vp = t.match(/^(?:vuelve|volver|regresa|regresar|devuelvete|devuelve todo)(?: al?)?(?: (?:punto|paso|cambio))? (\d{1,3})$/)
  if (vp) return `deshacer ${vp[1]}`
  const va = t.match(/^(?:vuelve|volver|regresa|regresar|deja todo)(?: (?:a|todo|el proyecto|la app))?(?: (?:como|a como) estaba)? antes de(?:l| que| lo de| la| el)? (.{3,80})$/)
  if (va) return `antes-de ${va[1]}`
  if (/^(sigue|sigamos|continua|continuemos|seguimos|reanuda|retoma)( (con )?(lo (de antes|de ayer|que (ibamos|estabamos))|lo pendiente|donde (ibamos|quedamos)|la tarea|el trabajo))?$/.test(t)) return "sigue"
  if (/^(en )?donde (ibamos|quedamos|nos quedamos)$|^(que|en que) (hicimos|ibamos|quedamos|estabamos haciendo)( ayer| antes| la ultima vez)?$|^que (fue lo ultimo|hiciste) (que hicimos|la ultima vez)$/.test(t)) return "donde"
  // Solo pedidos INEQUÍVOCOS (anclados). Cualquier frase sobre TU app ("el informe de ventas no carga") va a la IA, no a un comando.
  const SD = "( (de |en )?(la )?skill ?dey)?"
  const R: [RegExp, string][] = [
    [new RegExp(`^(ayuda|comandos)${SD}$|^(que|cuales son los) comandos( tiene| hay)?${SD}$`), "ayuda"],
    [/^que (hace|es) (la )?skill ?dey$|^que hace (la|esta) skill$/, "que-hace"],
    [/^(muestra(me)?|dame|haz(me)?|genera)?\s*(la )?estructura del? (proyecto|codigo)$|^arbol de (archivos|dependencias)( del proyecto)?$|^mapa de (estructura|dependencias)$/, "estructura"],
    [/^(analisis de dependencias|impacto profundo|dependencias ocultas)( del proyecto)?$/, "impacto-profundo"],
    [/^(que|cuales) (lineas|palabras|archivos) (cambiaste|moviste|modificaste)$|^cambios exactos$/, "cambios"],
    [/^(documenta|documentar)( la| el| toda la)? (app|aplicacion|proyecto)$|^(genera|actualiza|haz|crea)( la| el| los)? (documentacion|manual(es)?( de usuario| tecnico)?|diccionario de datos)( de la app| del proyecto)?$/, "documentar"],
    [/^(prepara|genera|haz|arma)( el| la| un| una)? (empalme|paquete de empalme|entrega del (cargo|puesto))$/, "empalme"],
    [/^(cuantos|cuantas) tokens( (me quedan|llevo|he gastado|gaste))?$|^cuanto (he gastado|llevo gastado|me queda)( de tokens)?$|^(consumo|mi consumo|uso) de tokens$/, "consumo"],
    [/^(muestra(me)?|ver|dame|abre)( el)? tablero( de (consumo|tokens))?$/, "tablero"],
    [/^busca(r)? (una )?skill (para|de) .+/, "buscar-skill"],
    [/^(que|cuales) modelos( tengo| hay| gratis| disponibles)?$|^modelos (gratis|disponibles)$/, "modelos"],
    [new RegExp(`^(version|que version|cual version|en que version)( es| esta| tiene)?${SD}$|^skill ?dey version$`), "version"],
    [/^skill ?dey (funciona|esta funcionando)$|^(funciona|prueba) (la )?skill ?dey$/, "prueba"],
    [new RegExp(`^(doctor|diagnostico de instalacion)${SD}$|^(revisa|verifica) (la )?instalacion${SD}$|^(skill ?dey )?esta bien instalad[ao]$`), "doctor"],
    [/^(instala|pon|activa)( el| un)? (git ?hook|pre-?commit)$/, "hook"],
    [new RegExp(`^(reporte|informe) de uso${SD}$|^(reporte|informe) de skill ?dey$|^(resumen|estadisticas) de uso$`), "reporte"],
    [/^(deshaz|deshacer|revierte|revertir|vuelve( a)? como estaba|eso lo dano|regresa como estaba)( (el|lo) ultimo( cambio)?)?$/, "deshacer"],
    [/^(rehaz|rehacer)$/, "rehacer"],
    [new RegExp(`^historial( de cambios)?${SD}$|^que cambios (hiciste|guardaste)$`), "historial"],
    [new RegExp(`^(que|cuales) reglas( tiene| hay)?( (la app|el proyecto))?${SD}$|^(muestra|ver) (las )?(reglas|vacunas)$`), "reglas"],
    [/^(haz|crea|dame)( la| una)? copia de prueba de (la )?(bd|base de datos)$/, "copia-bd"],
    [/^(revisa|revisar|chequea|audita)( la)? seguridad( de la app| del proyecto)?$|^(hay )?huecos de seguridad$/, "seguridad"],
    [/^(prueba|probar|testea)( la)? (app|aplicacion|aplicativo)$/, "probar"],
    [/^(haz(me)?|corre|ejecuta)( las)? pruebas profesionales$|^(suite de pruebas|testeo profesional)$/, "pruebas"],
    [/^(crea|haz|genera|graba)( el| un)? video (de capacitacion|tutorial)( de la app)?$/, "capacitar"],
    [/^(revisa|prueba|analiza)( la)? app (movil|flutter|react native)$/, "movil"],
    [/^(configura|instala|activa) (skill ?dey )?(para )?(todas las ias|multi ?ia|otras ias)$|^(haz que )?(skill ?dey )?(funcione|sirva) (con|en) (todas las|otras) ias$|^reglas para (cursor|copilot|windsurf|gemini|codex|cline)$/, "multi-ia"],
    [/^(haz(me)?|crea|genera|dame) (un |el )?mapa mental( del (plan|proyecto))?$|^mindmap$/, "mapa"],
    [/^(mockup|maqueta) (de |para )?.+/, "mockup"],
    [/^(optimiza|mejora) (mi|este) (prompt|pedido)\b.*/, "prompt"], // "mejora el prompt del chatbot" es trabajo sobre TU app, no este comando
    [/^(haz(me)?|dame|arma|armame) (un |el )?plan( de trabajo| de implementacion)? para (implementar|agregar|crear|construir|hacer|desarrollar|integrar|migrar|cambiar|mejorar|refactorizar|arreglar|corregir)\b.+|^solo (el )?plan\b.*|^primero (el|un) plan\b.*/, "plan"], // "plan de pagos para los clientes" NO
    [/^(construye|ejecuta|implementa) (el|ese|mi) plan$|^(dale,? )?build$/, "build"],
    [/^(muestra(me)?|abre|ver) (el )?panel de (observabilidad|skill ?dey|consumo)$|^observabilidad$/, "panel"],
    [/^(hitos|checkpoints)$|^lista de (puntos|checkpoints|hitos)$/, "hitos"],
    [/^busca(r)? en (la |mi )?memoria .+|^que recuerdas (de|sobre) .+/, "buscar-memoria"],
    [/^(genera|haz|crea)( las| el)? (notas de version|changelog|novedades de la version)$/, "notas"],
    [new RegExp(`^(que|cuales) (son los )?principios${SD}$|^ver principios$`), "principios"],
    [/^(organiza|ordena)( el| todo el)? (proyecto|codigo|estructura del proyecto)$/, "organizar"],
    [/^(revisa|mide|chequea)( el)? rendimiento( de la app| del sitio)?$|^que tan rapida es la app$/, "rendimiento"],
    [/^(valida|validar)( los| las)? (formularios|campos)$/, "validar"],
    [/^(formatea|formatear)( el)? codigo$/, "formato"],
    [/^((ver|muestra(me)?|revisa) (los )?)?(errores de produccion|logs del servidor)$|^revisa los logs$/, "produccion"],
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
    case "empalme": case "entrega": return ok(d.empalme(d.cwd))
    case "reglas": case "vacunas": return ok(d.reglas(d.cwd))
    case "quitar-regla": return ok(d.quitarRegla(d.cwd, Number(arg)))
    case "quitar-vacuna": return ok(d.quitarVacuna(Number(arg)))
    case "copia-bd": case "bd-prueba": return ok(d.copiaBd(d.cwd))
    case "seguridad": return ok(await d.seguridad(d.cwd))
    case "probar": return ok(await d.probar(d.cwd))
    case "pruebas": case "testear": return ok(await d.pruebas(d.cwd))
    case "capacitar": case "video": case "tutorial": return ok(await d.capacitar(d.cwd))
    case "movil": case "flutter": case "rn": return ok(d.movil(d.cwd))
    case "multi-ia": case "multiia": case "multi": return ok(d.multiIA(d.cwd))
    case "mapa": case "mapa-mental": case "mindmap": return ok(d.mapa(d.cwd))
    case "mockup": case "diseno": case "maqueta": return ok(d.mockup(d.cwd, arg))
    case "prompt": case "optimizar": return ok(d.optimizar(arg))
    case "panel": case "observabilidad": return ok(d.panel(d.cwd))
    case "checkpoint": case "hito": return ok(d.checkpoint(d.cwd, arg))
    case "volver": case "restaurar": return ok(d.volver(d.cwd, arg))
    case "hitos": case "checkpoints": return ok(d.hitos(d.cwd))
    case "buscar-memoria": case "memoria": return ok(d.buscarMemoria(d.cwd, arg))
    case "notas": case "novedades": case "changelog": return ok(d.notas(d.cwd))
    case "principios": return ok(d.principios(d.cwd))
    case "congelar": return ok(d.congelar(d.cwd, arg))
    case "rendimiento": case "rendir": return ok(await d.rendimiento(d.cwd))
    case "validar": case "validacion": return ok(d.validar(d.cwd))
    case "formato": case "formatear": return ok(d.formato(d.cwd))
    case "produccion": case "logs": return ok(d.produccion(d.cwd))
    case "revisar": case "revisa": case "todo": return ok(await run("verificar", { todo: true }))
    case "sitio": return ok(await run("sitio", arg ? { url: arg } : {}))
    case "chrome": case "navegador": case "consola": { // /skill_dey chrome [url] [visible] [conectar]
      const url = arg.split(/\s+/).find((x) => /^https?:\/\//i.test(x))
      return ok(await run("sitio", { ...(url ? { url } : {}), visible: /\b(visible|ver)\b/i.test(arg), conectar: /\b(conectar|abierto)\b|mi chrome/i.test(arg) }))
    }
    case "verificar": return ok(await run("verificar", { nivel: /^N[0-3]$/i.test(arg) ? arg.toUpperCase() : "N1" }))
    case "estructura": case "mapa-proyecto": return ok(await run("mapa", { forzar: true }))
    case "impacto-profundo": case "dependencias": case "que-rompe": case "produccion-revisar": return ok(d.impactoProfundo(d.cwd, arg))
    case "cambios": case "que-cambie": return ok(d.cambiosExactos(d.cwd))
    case "revertir": return ok(await run("deshacer", arg && !/^\d+$/.test(arg.trim()) ? { accion: "deshacer", archivo: arg.trim() } : { accion: "deshacer", pasos: Number(arg) || 1 }))
    case "prueba": case "diagnostico": case "test": case "eval": return ok(d.diagnostico() + "\n\n" + await d.autoprueba())
    case "doctor": return ok(d.doctor().join("\n"))
    case "hook": case "git-hook": return ok(d.hook(d.cwd))
    case "reporte": case "informe": return ok(d.reporte(d.cwd).join("\n"))
    case "consumo": case "tokens": return ok(await d.consumo())
    case "tablero": return ok(d.tablero())
    case "buscar-skill": case "buscarskill": case "skill": return ok(d.buscarSkill(d.cwd, arg))
    case "modelos": case "modelo": return ok(d.modelos())
    case "version": case "version-skill": return ok(d.version())
    case "deshacer": return ok(await run("deshacer", arg && !/^\d+$/.test(arg.trim()) ? { accion: "deshacer", archivo: arg.trim() } : { accion: "deshacer", pasos: Number(arg) || 1 }))
    case "rehacer": return ok(await run("deshacer", { accion: "rehacer" }))
    case "antes-de": return ok(await run("deshacer", { accion: "deshacer", antesDe: arg }))
    case "donde": case "quedamos": { const l = d.donde ? d.donde(d.cwd) : []; return ok(l.length ? "**Dónde quedamos** (últimos pedidos en este proyecto, de todas las sesiones):\n" + l.map((x) => "- " + x).join("\n") + '\n\nPara seguir: "sigue". Para volver a un punto: "historial".' : "Aún no hay trabajo registrado en este proyecto.") }
    case "historial": return ok(await run("deshacer", { accion: "historial" }))
    case "procesos": return ok(await run("procesos", { accion: "listar" }))
    case "liberar": return ok(await run("procesos", { accion: "liberar", puerto: Number(arg) || undefined }))
    case "levantar": return ok(await run("procesos", { accion: "levantar" }))
    case "detener": return ok(await run("procesos", { accion: "detener" }))
    case "adoptar": return ok(await run("adoptar"))
    case "iniciar": case "encender": d.fijarActivo(true); return ok("✅ SKILL_DEY activo: desde ahora todo lo que pidas usa sus reglas y protecciones.")
    case "finalizar": case "apagar": d.fijarActivo(false); return ok("⏹ SKILL_DEY finalizado: OpenCode funciona como viene por defecto. Para volver: /skill_dey iniciar")
    case "plan": case "planear": case "planifica": case "planea": return { codigo: false, prompt: `Haz SOLO el PLAN para: ${arg || "la tarea pedida"}. NO toques código ni ejecutes nada todavía. Entrega: objetivo en 1 línea · pasos numerados (qué y por qué) · archivos/áreas afectadas · qué se podría romper (usa skill_dey_impacto / impacto-profundo si aplica) · preguntas si falta info. Cierra con: "¿Apruebo y construyo? → /skill_dey build".` }
    case "build": case "construir": case "ejecuta": case "ejecutar": return { codigo: false, prompt: `CONSTRUYE el plan aprobado${arg ? ` para: ${arg}` : ""}. Aplica SKILL_DEY: checkpoint antes, cambios reversibles y pequeños, verifica tras CADA paso (skill_dey_verificar), marca cada parte del plan como hecha, y no cierres hasta 0 errores. Si algo falla, deshaz y reporta qué y por qué.` }
    case "corregir": return { codigo: false, prompt: "Revisa que no haya errores y corrígelos todos: carga la skill `skill-dey` y sigue references/depuracion.md hasta 0 errores." }
    case "commit": return { codigo: false, prompt: "Carga la skill `skill-dey`. Verifica en verde; si lo está, haz git add de lo cambiado y un commit con mensaje claro (qué y por qué). No hagas push salvo que el usuario lo pida." }
    case "pr": return { codigo: false, prompt: "Carga la skill `skill-dey`. Verifica en verde y prepara el pull request: commit si falta, y un resumen (qué cambió, por qué, cómo probarlo). No hagas push ni abras el PR sin confirmación." }
    case "publicar": case "desplegar": return { codigo: false, prompt: "Carga la skill `skill-dey`. ANTES de publicar verifica en verde y, si no está en PRINCIPIOS.md, pregunta cómo se publica esta app (FTP, git en el servidor, panel). Verifica antes y después; si algo falla, revierte. Nunca publiques sin confirmación." }
    case "auditar": return { codigo: false, prompt: `Carga la skill \`skill-dey\`. Audita sin cambiar código ${arg || "todo el proyecto"}: verificación funcional, seguridad, visual y UX; entrega hallazgos priorizados (crítico/alto/medio/bajo) con archivo:línea.` }
    case "sigue": case "reanudar": case "continua": { const l = d.donde ? d.donde(d.cwd, 4) : []; return { codigo: false, prompt: `Retoma la tarea que quedó a medias en este proyecto, sin re-analizar lo cerrado.${l.length ? "\nÚltimos pedidos (de sesiones anteriores):\n" + l.map((x) => "- " + x).join("\n") + "\nSi el último terminó en ❌ o quedó a medias, sigue con ese." : ""} Revisa .skill_dey/ESTADO.md si hace falta.` } }
    default: return { codigo: false, prompt: args.trim() }
  }
}
