# Pruebas de esta versión (v38.14.1)

Todas corridas sobre el paquete final antes de entregarlo.

## Código
| Prueba | Resultado |
|---|---|
| TypeScript en todos los módulos (incluye nulos estrictos y código sin uso) | 0 errores, 0 avisos |
| Compilación del plugin, las herramientas y los 45 módulos | OK |
| Sintaxis del instalador, la CLI y el servidor MCP | OK |
| Autoprueba interna (`/skill_dey prueba`) dentro del plugin, con Bun como en OpenCode | 33/33 en 2,9 s |
| Registro de errores internos del guardián después de todas las pruebas | vacío |

## Chrome (app de prueba con errores sembrados)
| Prueba | Resultado |
|---|---|
| Detecta error y aviso de consola, excepción JS, API 500, imagen 404 y rota | 6/6, en 3 s |
| Nunca visita `/eliminar` ni `/logout` | OK en todas las corridas |
| URL remota: solo lectura, tampoco visita `/aprobar` | OK |
| `conectar` a un Chrome abierto: lee los errores y deja tu Chrome abierto con tus pestañas | OK |
| `conectar` sin Chrome abierto: da el comando para abrirlo | OK |
| `visible` con perfil propio | OK |
| Sin navegador: respaldo que revisa servidor y enlaces | OK |
| OpenCode sigue respondiendo mientras corre la prueba | OK |
| Esc / cancelar corta la prueba al momento | 2,5 s |
| Proceso colgado: se corta al vencer el tiempo, sin restos | OK |
| `/skill_dey chrome`, la frase "revisa la consola en chrome", la CLI y la herramienta MCP | OK |

## Proyecto enorme (30.000 archivos, sin git)
| Prueba | Resultado |
|---|---|
| Cada paso del modelo (inyección de contexto) | 0–19 ms |
| Antes de la 1ª edición: no hace `git init` masivo, guarda copia por archivo | 14 ms |
| `skill_dey_impacto` y `skill_dey_mapa` | ~110 ms |
| Sugiere la subcarpeta con código (`server, frontend`) e ignora la de datos | OK |

## Seguridad
| Prueba | Resultado |
|---|---|
| DROP DATABASE, TRUNCATE, DELETE sin WHERE, migrate:fresh, prisma migrate reset | bloqueados |
| DELETE con WHERE sobre la BD real | exige respaldo antes |
| Escribir `DROP TABLE` en un archivo .sql | bloqueado |
| Leer un `.env` real | bloqueado |
| `git status`, `npm test` | permitidos |

## Instalación
| Prueba | Resultado |
|---|---|
| Instalador real en un equipo limpio | OK, confirma v38.14.1 |
| Detecta Chrome y deja listo el navegador de pruebas sin bajar Chromium | OK |
| Servidor MCP informa la versión real | 38.14.1 |

## Revisión a fondo de v38.14.1 (código revisado línea por línea)
| Prueba | Resultado |
|---|---|
| Deshacer / rehacer / volver a hito (worktrees, monorepo, CRLF, repos anidados, archivo→carpeta, sin git) | 39/39 escenarios |
| Frases normales no disparan comandos · pedidos válidos sí | 32 / 25 OK |
| Comandos peligrosos bloqueados (BD, git, docker, borrados masivos, `rm -rf /*`, ORM `.drop()`) · normales permitidos | 67 / 28 OK |
| Probador de formularios: nunca envía borrar, dar de baja, facturar, `_method=DELETE` | OK |
| Nunca mata un proceso que no inició skill_dey | OK |
| Leer, sobrescribir o borrar un `.env` real | bloqueado |

## v38.14.1 — arranque de servidores sin colgar OpenCode
| Prueba | Resultado |
|---|---|
| `Start-Process ... -RedirectStandardOutput` o `start /b` en Windows (dejaban la terminal colgada minutos) | bloqueado, con la alternativa |
| `skill_dey_procesos(levantar, cmd, carpeta, puerto)`: sube un servidor propio, espera a que responda y da su salida | 0,8 s (antes 6 s fijos + espera) |
| `detener` baja solo ese servidor | OK |

## v38.14.1 — solo cambia lo que pides
| Prueba | Resultado |
|---|---|
| Pides cambiar `pedido.js` y la IA intenta "mejorar" `lado.js` que ya funcionaba | frenada: debe justificar o proponerlo aparte |
| Pedido sin archivos nombrados: al 4º archivo existente que toca | aviso de alcance (una vez) |
| Crear archivos nuevos, pruebas y docs | sin aviso |
| "deshaz solo lado.php": vuelve ese archivo, el resto queda igual (con y sin git) | OK |
| Archivo que creó el cambio | va a `.skill_dey/papelera/` (no se borra) |
| Al terminar cada respuesta: aviso con los archivos que cambió | OK |

## v38.14.1 — cambio de modelo automático cuando se acaba el cupo gratis
| Prueba | Resultado |
|---|---|
| "Free usage exceeded, subscribe to Go" (cupo de TODO OpenCode, reintento en 9 h) | no salta a otro modelo de OpenCode (comparten cupo): pasa solo a otro proveedor gratis |
| El modelo nuevo también falla al instante | se actúa de inmediato (antes se ignoraba 12 s y quedaba colgado) |
| Sin otro proveedor gratis | corta el reintento de 9 h y avisa la hora en que se renueva y cómo agregar uno gratis |
| Nunca elige un modelo de pago | OK |
| Lista de modelos al día desde OpenCode (los gratis cambian seguido) | OK |

## v38.14.1
| Prueba | Resultado |
|---|---|
| La terminal vigilada aunque OpenCode la llame distinto (bash, powershell, shell…) | OK |
| `/skill_dey version` muestra qué herramientas está vigilando (para diagnosticar) | OK |

## v38.14.1 — alcance estricto: solo cambia lo que pides
| Prueba | Resultado |
|---|---|
| Tocar un archivo que no pediste (aunque insista) | bloqueado hasta que tú digas "sí" |
| Intentarlo por la terminal (`sed -i`, `Set-Content`, `>`…) | bloqueado igual |
| Tu "sí" a la pregunta de la IA | autoriza solo los archivos que nombró |
| Reescribir entero un archivo que pediste (o cambiar más del 30 %) | bloqueado: solo las líneas necesarias |
| Si pides "refactoriza", "reorganiza", "limpia todo"… | sí se permite |

## v38.14.1 — continuidad entre sesiones
| Prueba | Resultado |
|---|---|
| Cerrar OpenCode y abrir otra sesión: "¿dónde quedamos?" | lista tus últimos pedidos de todas las sesiones (por código, 0 tokens) |
| Primera respuesta de una sesión nueva | la IA recibe los últimos pedidos del proyecto (una sola vez) |
| `historial` | cada punto guardado lleva TU pedido ("arregla el login…"), hasta ~150 atrás |
| "vuelve a antes de arreglar el login" / "vuelve al punto 3" | vuelve a ese punto aunque sea de otra sesión; se puede rehacer |
| "sigue" | retoma lo último que quedó a medias o con errores |

## v38.14.1 — evalúa antes de tocar y nunca deja la app rota
| Prueba | Resultado |
|---|---|
| Editar un archivo sin leerlo tal como está ahora | bloqueado: primero lo lee |
| El archivo cambió después de leerlo (lo tocaste tú) | bloqueado: lo vuelve a leer |
| Tocar código que ya funciona sin medir a quién afecta | bloqueado: primero `skill_dey_impacto` |
| Archivos nuevos | sin trámite |
| La app estaba sana, el cambio la rompe y no lo arregla en 3 intentos | vuelve SOLA al estado sano, te avisa y queda en la bitácora ("rehaz" si igual lo quieres) |
| La app ya tenía errores antes del pedido | no deshace solo: te avisa |

## v38.14.1 — razona antes de actuar
| Prueba | Resultado |
|---|---|
| Antes del 1er cambio la IA escribe `Entendí` · `Causa/Por qué` · `Plan` | si no lo hace, se frena y se lo pide |
| Un pedido corto ("cambia el color…") ya NO baja a un modelo más débil (flash/mini) | OK (solo sube a uno potente si la tarea es compleja) |
| Instrucciones del agente: método de razonamiento en 5 pasos (qué pidió y qué no · cómo está hoy · causa · plan · cómo lo compruebo) | OK |

## v38.14.1 — modelo según la tarea, y vuelve solo al tuyo
| Prueba | Resultado |
|---|---|
| Tarea ligera (color, texto, estilo, typo, sin lógica) | pasa a un modelo rápido gratis |
| Tarea compleja (BD, auth, refactor, arquitectura, app nueva, pedido largo) | pasa al modelo gratis más potente |
| Tarea normal, errores, lógica, preguntas | tu modelo |
| Pedido siguiente | vuelve solo a TU modelo (aunque la app reenvíe el rápido) y te avisa |
| Modelos nuevos aún no catalogados | se reconocen por su nombre |
| Nunca elige uno de pago | OK |
| Búsquedas amplias / logs grandes | se delegan al explorador (modelo barato) |

## v38.14.1 — menos tokens
| Cambio | Ahorro |
|---|---|
| Instrucciones del agente más cortas (3.947 → ~2.500 caracteres) | ~400 tokens en CADA paso del modelo |
| Ya no se inyecta el aviso de "app existente" en cada paso | ~60 tokens por paso |
| Ya no frena a la IA para que lea y mida el impacto: lo mide el código y se lo dice en la misma edición | 1–2 pasos menos por pedido (cada paso re-envía toda la conversación) |
| La IA no llama a verificar en cambios simples (el guardián ya verifica al final gratis) | 1 paso menos por pedido |
| Ventanita de consumo: 3 líneas — Quedan · Consulta · Alcanza (≈ consultas y minutos, o cuándo vuelve el cupo) | más clara |

## v38.14.1 — nunca sin respuesta visible
| Prueba | Resultado |
|---|---|
| La IA termina solo con herramientas o "pensamiento", sin texto | se lo detecta y se le pide el resumen (una vez, sin herramientas) |
| Un comando que resolvió el código y la IA no lo repite | el resultado aparece igual en pantalla (y completo en `.skill_dey/ULTIMO-RESULTADO.md`) |
| La respuesta se cortó por un error del modelo | te avisa el motivo y que escribas "sigue" |
| La cortaste tú con Esc | no insiste |

## v41.0.0 — el guardián de la v38 en Claude Code, Gemini CLI y Antigravity CLI
| Prueba | Resultado |
|---|---|
| Guardián de OpenCode con las reglas movidas a `guardia.ts`: 19 situaciones lado a lado contra la v38.14.1 | decide igual; solo cambian los 2 bloqueos nuevos |
| `curl … \| sh` · clave `sk-ant-…` en código | bloqueados (nuevo) |
| Responder "sí" con tilde a la pregunta de la IA | ahora autoriza (antes se tomaba como pedido nuevo) |
| 36 pruebas automáticas (`npm test`) con los formatos reales de Claude Code, Gemini CLI y Antigravity | OK |
| Alcance: pidió `app.js` y la IA va por `lado.js` · reescribir entero un archivo pedido | bloqueados; tu "sí" autoriza / "reescribe" lo permite |
| Razonar: editar sin "Entendí · Causa · Plan" (Claude Code) | frenado una vez; sin transcripción legible no se exige |
| Impacto: renombrar una función usada en otro archivo | aviso con el archivo que la usa |
| `deshaz` · `deshaz solo lado.js` · `historial` · "¿dónde quedamos?" | por código, sin gastar turno del modelo |
| Archivo roto al terminar | no deja cerrar; arreglado → verificación verde por código (0 tokens) y queda en la bitácora |
| App sana que se rompe y no se arregla en 3 intentos | vuelve sola al estado sano |
| Servidor MCP: protocolo 2025-06-18 → igual; desconocido → 2025-11-25; carpeta raíz del disco → rechazada | OK |
| Claude Code 2.1: `claude plugin validate` (plugin y marketplace) | sin avisos |
| Gemini CLI 0.67: `gemini extensions validate` + instalación | OK |
| Instalador completo en un equipo limpio (OpenCode + Claude Code + Gemini CLI) | v41.0.0 confirmada en las tres |
| Antigravity CLI | paquete según la especificación; **pendiente** probar con `agy` real |
