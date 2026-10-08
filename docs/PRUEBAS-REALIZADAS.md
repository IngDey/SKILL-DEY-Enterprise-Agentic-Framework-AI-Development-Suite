# Pruebas realizadas — SKILL_DEY v21 en OpenCode 1.18.33

> Creado y probado por **Ing. Dey** ([@IngDey](https://github.com/IngDey))

Método: OpenCode real + "modelo simulado" que ordena cada acción (comprueba que OpenCode carga y ejecuta cada pieza). La calidad de decisión con tu modelo se mide con `skills/skill-dey/evals/BANCO-DE-PRUEBAS.md`.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Instalador (Node, PowerShell y bash) detecta el SO, instala y deja `skill_dey` por defecto | ✅ |
| 2 | Actualización desde FORJA: quita la versión vieja, migra lecciones y preferencias, sin duplicados | ✅ |
| 3 | OpenCode registra agentes `skill_dey` y `skill_dey-explorador`, y 8 herramientas `skill_dey_*` | ✅ |
| 4 | La skill `skill-dey` carga completa; reglas globales y prompt del agente llegan al modelo | ✅ |
| 5 | Memoria del proyecto `.forja/` se migra sola a `.skill_dey/` sin perder lecciones | ✅ |
| 6 | `skill_dey_impacto` detecta comparaciones/identificadores y sube el nivel | ✅ |
| 7 | Bloqueos: secretos en código, leer `.env`, `push --force`, commit sin verificar, `.env` a git | ✅ |
| 8 | **Foto automática antes de cada pedido** (también en cambios pequeños), sin tocar ramas ni historial | ✅ |
| 9 | **Deshacer**: restaura archivos exactos, elimina los creados, respeta ediciones propias del usuario, `.env` y memoria | ✅ |
| 10 | **Rehacer** tras deshacer | ✅ |
| 11 | Migración/SQL que modifica BD sin respaldo reciente → bloqueado | ✅ |
| 12 | **Cero errores**: si la respuesta termina con un archivo roto o sin verificar, el guardián obliga al agente a corregir (máx. 2 veces) | ✅ |
| 13 | Aviso automático de consumo por consulta (tokens leídos/escritos, costo, tiempo, sesión) y registro en `.skill_dey/CONSUMO.md` | ✅ |
| 14 | `skill_dey_mapa`: mapa compacto del proyecto, cacheado | ✅ |
| 15 | `skill_dey_verificar`: capturas 375/768/1440, scroll horizontal y errores de consola | ✅ |
| 17 | **Guardián verifica gratis** al final (sin tokens del modelo); solo despierta al agente con el error exacto si algo falla | ✅ |
| 18 | Confianza de la verificación (ALTA/MEDIA/BAJA) y pruebas con `node --test` sin instalar nada | ✅ |
| 19 | Comparador automático skill_dey vs IA directa (`evals/comparar.mjs`) | ✅ mecánica |
| 20 | Preguntas y cambios N0 sin cargar la skill; skill 63% más liviana | ✅ |
| 21 | Capacidades de todos los modelos detectadas; Big Pickle (sin visión) delega bocetos a Muse Spark (con visión) vía `skill_dey-vision` | ✅ |
| 22 | Boceto en Excel leído exacto sin visión (textos, bloques combinados, zonas de color, anchos) | ✅ |
| 23 | Comparador multi-modelo con ranking | ✅ mecánica |
| 24 | Modelo llega a su límite (error 429) → aviso + continúa la tarea con otro modelo en ~2 s, sin perder el hilo | ✅ |
| 25 | Catálogo completo de modelos (se corrigió lectura cortada: 216 de 216) | ✅ |
| 26 | TDD en N2/N3: cambio de código sin prueba → ❌ (de Superpowers) | ✅ |
| 27 | Cambio poco quirúrgico (diff desproporcionado al nivel) → aviso (de Karpathy) | ✅ |
| 28 | Herramientas toleran llamadas incompletas de modelos gratis | ✅ |
| 29 | App PHP: la levanta sola (php -S), detecta `PHP Warning … tickets.php línea 3` y error de consola JS, captura y la apaga | ✅ |
| 30 | Playwright se instala solo, fuera del proyecto | ✅ |
| 31 | Autodiagnóstico: 8/8 protecciones verificadas al abrir; aviso si el guardián no carga | ✅ |
| 32 | Error encontrado y corregido: un export extra hacía que OpenCode descartara el plugin en silencio | ✅ |
| 33 | Código truncado (`// ...resto del código`) → bloqueado | ✅ |
| 34 | Escribir fuera del proyecto → bloqueado | ✅ |
| 35 | Dependencia no pedida → bloqueada; pedida ("instala lodash…") → permitida | ✅ |
| 36 | Documentación viva por código: diccionario (SQL + Laravel), script BD portable con FKs, manual técnico, esqueleto de manual de usuario | ✅ |
| 37 | Proceso zombi ocupando el puerto del backend → detectado y detenido automáticamente | ✅ |
| 38 | Backend sube primero y sin errores, luego frontend; consola limpia; al final se bajan ambos (0 procesos colgados) | ✅ |
| 39 | Backend que arranca con error ("no se pudo conectar a la BD") → ❌ aunque responda | ✅ |
| 40 | Revisión de TODO el proyecto: encontró un PHP roto en un archivo no tocado | ✅ |
| 41 | `cd backend && npm run dev` ya no congela al agente (antes 120 s colgado; ahora 15 s en segundo plano con log) | ✅ (fallo encontrado y corregido) |
| 42 | `skill_dey_procesos`: listar, detener y liberar puertos | ✅ |
| 43 | "finalizar skill dey" → se quitan las instrucciones de SKILL_DEY del modelo y se apagan bloqueos; sigue apagado en mensajes siguientes | ✅ (fallo encontrado y corregido) |
| 44 | "iniciar skill dey" → vuelve todo, confirma y activa la adopción si la app ya existe | ✅ |
| 45 | Adopción de app PHP heredada: detectó los 8 problemas sembrados (inyección SQL x2, XSS, credenciales, página sin sesión, errores silenciados, "Activo" vs "activo", validación solo en navegador, sin .env.example), arrancó la app y generó docs | ✅ |
| 46 | Falso positivo corregido: "No syntax errors detected" contaba como error PHP | ✅ |
| 16 | Aprendizaje global (`skill_dey_leccion` / `skill_dey_recordar`) entre sesiones | ✅ |

Errores encontrados y corregidos durante las pruebas: commit sin verificar sin carpeta de memoria · `.env` subido a git sin `.gitignore` · la foto de deshacer incluía `.env` y lo habría borrado al restaurar.
No probado: Windows/macOS físicos (lógica probada con PowerShell 7 y rutas multiplataforma) y la inteligencia de decisión con un modelo real. La primera vez que abres OpenCode tras instalar puede tardar (instala dependencias).

## v13 — experto en errores (sitio completo)
47. Sitio PHP sembrado con 7 errores (excepción JS, imagen 404, script 404, warning PHP visible, NaN en pantalla, API 404, enlace roto) → `skill_dey_sitio` detectó los 7 ✅
48. El enlace "Salir" (logout.php) NO se visitó durante el rastreo ✅
49. `php -S` devolvía 200 (index.php) para archivos inexistentes y escondía los 404 → router propio: 404 real ✅
50. Carpeta `api/` de una app PHP se tomaba como servicio aparte → ahora es parte de la app ✅
51. Tras corregir → `skill_dey_sitio`: "✅ sitio sin errores" (3 páginas) ✅
52. `skill_dey_verificar(todo:true)` sin cambios en git → recorre el sitio y reporta los errores reintroducidos ✅

## v14 — ciclo 4 diagnóstico sistemático + agilidad + tokens que quedan
53. 3 verificaciones seguidas en rojo → aparece "🔁 CICLO 4: diagnóstico sistemático"; la siguiente en rojo → "⛔ FRENO" (deshacer y reportar) ✅
54. Verde reinicia el contador de ciclos ✅
55. Guardián al terminar cada respuesta: verificación rápida sin servidores ni navegador → 0,05 s (antes levantaba la app) ✅
56. N1: prueba de humo del servidor sin navegador → 2,5 s; navegador solo en N2+/cierre/"revisa todo" ✅
57. El guardián ya no despierta al modelo si no hay un error real (antes lo hacía por "UI sin capturas") ✅
58. Aviso de consumo: "QUEDAN X tokens en esta sesión (% libre)" + uso de hoy con el modelo; aviso amarillo al 80 % ✅

## v15 — anti-vueltas + compactación
59. Mismo comando 3 veces seguidas sin cambios → la 3ª se bloquea con "anti-vueltas" (OpenCode real) ✅
60. Tras un cambio real (archivo nuevo) el mismo comando vuelve a permitirse ✅
61. Sobre un error en rojo: a las 15 acciones el guardián detiene y ordena ciclo 4; a las 30, freno (lógica revisada, sin prueba en vivo)
62. Instalador agrega "compaction": {auto, prune} y OpenCode 1.18 lo acepta ✅

## v16 — autoprueba + aislamiento
63. `skill_dey_autoprueba` en OpenCode real: 10/10 piezas OK en 2,9 s (proyecto temporal) ✅
64. La autoprueba DESCUBRIÓ un fallo real: Node 22 `node --check` da OK en .js con import/export aunque tengan error → nueva revisión como módulo; JSX se deja al build (sin falsos errores) ✅
65. Aislamiento: un error inesperado dentro del guardián se anota en errores-guardian.log y la sesión sigue; los bloqueos intencionales siguen funcionando ✅
66. Funciones del guardián que tardan >3 s quedan en lentitud.log ✅

## v17 — 71 % menos tokens fijos y 76 % más rápida
67. Tokens fijos por sesión (agente + skill + descripciones de herramientas): ~5.480 → ~1.580 (−71 %) ✅
68. Autoprueba completa: 2,9 s → 0,7 s (−76 %); liberar puerto 2,3 s → 0,25 s ✅
69. Lista de procesos: una sola llamada a `ps` para todos (antes una por proceso) ✅
70. Sin perder funciones en OpenCode real: agente cargado, skill carga, anti-vueltas bloquea, autoprueba 10/10, diagnóstico OK ✅

## v18 — menos tokens, más rápida, buenas prácticas automáticas
71. Tokens fijos por sesión: v16 ~5.480 → v17 ~1.590 → v18 ~1.400 (−74 % vs v16) ✅
72. Tareas pequeñas (N0/N1) ya no cargan la skill: ~540 tokens (v16 ~4.430, −88 %) ✅
73. 14 → 11 herramientas (consumo+diagnóstico+autoprueba en skill_dey_estado; documentar solo automático) ✅
74. Verificar N1 con app real: 2,5 s → 1,3 s (−48 %); "revisa todo": 5,5–6,9 s → 3,7–3,9 s (−35 a −45 %) ✅
75. Recorrido del sitio con 4 páginas a la vez ✅
76. Buenas prácticas por código en líneas nuevas: innerHTML/eval/SQL/echo sin escapar (bloquean); console.log, catch vacío, SELECT *, URL local, img sin alt, any, dinero float, TODO (avisos) — sin falsos positivos en literales, .env ni htmlspecialchars ✅
77. "Revisa errores" ya no recorre el sitio dos veces ✅
78. Regresión en OpenCode real: agente, skill, anti-vueltas, guardián y consumo OK; autoprueba 11/11 en 0,7 s ✅
79. Autoprueba corrida en el equipo del usuario (Node 22 puro) → encontró `require` sin importar (fallaba fuera de OpenCode y dejaba un proceso de prueba abierto) → corregido en autoprueba, app y procesos; los procesos de prueba se cierran siempre ✅ (v18.1)

## v19 — documentación completa por código, comandos y cambio de modelo
80. Manual de usuario sin "pendientes": ficha por pantalla deducida del código (para qué sirve, cómo llegar, acceso/rol, qué muestra, campos con tipo/obligatorio/opciones, botones, pasos, mensajes) ✅
81. Archivos que no son pantallas (conexión, utilidades) ya no aparecen en el manual; restos viejos se limpian ✅
82. Sin `.sql` en el proyecto → diccionario y script desde la BD real (mysqldump/pg_dump/sqlite3 solo estructura); la contraseña no aparece en ningún documento ✅
83. `/skill_dey ayuda`, `documentar`, `modelos` en OpenCode real: se ejecutan por código y el modelo solo muestra el resultado ✅
84. Terminal sin OpenCode: `node skill_dey.mjs documentar|revisar|ayuda` (Node puro) ✅
85. Cambio de modelo: tras llegar al límite, el siguiente mensaje con el modelo agotado se envía solo al siguiente modelo libre (OpenCode real: 2ª corrida sin pasar por el modelo agotado) ✅
86. Más señales de límite: 402, 529, sin créditos, RESOURCE_EXHAUSTED, sobrecarga, contexto lleno ✅
87. Cambios hechos por terminal (sed, >, mv…) también regeneran la documentación; errores de documentar quedan en errores-guardian.log ✅
88. Autoprueba 11/11 (incluye "manual de usuario completo") ✅

## v20 — sin comandos hace lo mismo, vacunas, reglas, revisor, copia BD, empalme
89. Pedidos normales ejecutados por código en OpenCode real: "documenta la app" → documentar, "¿cuántos tokens me quedan?" → consumo; "agrega el campo responsable" sigue yendo al modelo ✅
90. No confunde: "documenta la función X con comentarios" o "deshaz el cambio del login y agrega…" van al modelo ✅
91. `/skill_dey que-hace`, `empalme`, `reglas` en OpenCode real ✅ · ayuda en 6 grupos con "o escribe" ✅
92. Vacuna: rechaza patrones amplios; un error vacunado se bloquea en otro proyecto; la prueba no deja vacunas basura ✅
93. Reglas de negocio: solo SELECT de lectura (rechaza DELETE, ; DROP…) ✅ · se verifican en el cierre contra la BD (sin BD → se avisa, no falla)
94. Empalme: docs/EMPALME.md sin valores de .env ✅
95. Copia de prueba de BD: guardián permite migrar contra la copia (SKILL_DEY_BD_PRUEBA=1) sin respaldo y exige respaldo para la real (lógica revisada; MySQL/PostgreSQL/SQLite sin servidor para probar en vivo)
96. Revisor independiente (agente skill_dey-revisor, solo lectura) instalado ✅
97. Tokens fijos: v19 ~1.430 → v20 ~1.370 (−4 %); tareas pequeñas ~550 → ~500 (−10 %) ✅
98. Regresión OpenCode real: anti-vueltas, skill, guardián, cambio de modelo ✅ · autoprueba 13/13 ✅

## v21 — seguridad fuerte, probador automático, publicar, principios, soluciones, congelar
99. Auditoría de seguridad por código (cierre + adopción): página sin sesión, contraseña sin hash, CSRF, acceso por id ajeno, subidas, debug, CORS, cookies, fuerza bruta — sin falsos positivos en app segura ✅
100. Probador automático en la app encendida: datos válidos, obligatorios, ataques SQL/XSS, acceso sin sesión. App vulnerable → detectó XSS reflejado + página privada abierta; app segura → 0 hallazgos ✅
101. verificar(cierre) corre seguridad + probador solos (sin pedirlo) ✅
102. Comandos nuevos (código, 0 tokens del modelo): seguridad, probar, notas, principios, congelar; y por lenguaje normal "revisa la seguridad", "prueba la app", "genera las notas de version" ✅
103. Nuevos prompts al modelo: commit, pr, publicar (con confirmación y vuelta atrás) ✅
104. Zonas congeladas: .skill_dey/CONGELADO.txt bloquea edición Y comandos de terminal sobre esas rutas ✅
105. Principios de la app + catálogo de soluciones reutilizables; recordar los trae junto con negocio y lecciones ✅
106. Notas de versión en lenguaje de usuario desde los commits (docs/NOVEDADES.md) ✅
107. Autoprueba 15/15 en ~0,6 s; tokens fijos ~1.550 (sigue por debajo de todas las del mercado) ✅

## v21.1 — arranque/parada de servidores sin quedarse pegada
108. Causa del "pegado": arranqueLimpio esperaba hasta 60s por servicio (back+front ~2 min). Ahora el tope es 22s por servicio y ~90s total duro (SKILL_DEY_ARRANQUE_MS lo ajusta). Probado: servidor que no responde cortó a 8,6s con tope de 8s ✅
109. matarArbol: SIGKILL al grupo sin timers colgados; liberarPuerto hace 2º intento (fuser/lsof) si quedó un hijo; detener siempre libera el puerto. Probado: puerto ocupado por proceso zombi → liberado y app arriba en 0,8s; tras detener, puerto LIBRE ✅
110. Tope duro (conTiempo) en levantar/cierre/probador: el tool SIEMPRE responde (máx ~95s) aunque un servidor cuelgue → el modelo no se queda esperando ✅
111. Autoprueba 15/15 ✅

## v22 — rendimiento, formateo, validación de servidor, errores de producción, datos realistas
112. Formateo automático al cierre (prettier/php-cs-fixer/pint/black) + comando "formatea el código" ✅
113. Rendimiento: tiempos de carga por página (playwright) + consultas en bucle N+1; app real → "/ 0.1s" ✅; comando "revisa el rendimiento" ✅
114. Validación de servidor: detecta campos obligatorios no validados en el backend y sugiere el código (Laravel/zod/PHP) ✅
115. Errores de producción: lee el log del servidor y agrupa los fallos más frecuentes (LOG_PATH o rutas comunes) ✅
116. Datos de prueba realistas por nombre de campo (nombre→Juan Pérez, correo, teléfono, cédula, litros…) en el probador ✅
117. 4 comandos nuevos por código (validar, rendimiento, formato, produccion) + lenguaje normal; un pedido real sigue yendo al modelo (OpenCode real) ✅
118. Autoprueba 16/16; tokens fijos ~1.640, N0/N1 ~520 (sigue muy por debajo del mercado) ✅

## v24 — razonamiento guiado, multiagente barato, /organizar y PDF
119. Ley de prioridades (sin error > preciso > rápido > tokens) + escalera de esfuerzo + hipótesis en complejo/errores, al frente del agente ✅
120. Coherencia: regla de cubrir CADA cosa pedida; multiagente barato (contratos + task a subagentes con contexto limpio, solo en partes independientes) ✅
121. /organizar: formatea todo (seguro) y reporta duplicados, capas mal, archivos fuera de lugar, grandes y huérfanos (sin borrar). Probado: detecta SQL en capa visual ✅
122. /documentar genera además los PDF (manual técnico, usuario, diccionario, empalme) con marca, vía el navegador de skill_dey. Probado: PDFs válidos (%PDF-) de 56-63KB ✅
123. Comandos nuevos: organizar, documentar(+pdf); CLI: organizar, pdf. OpenCode real: se ejecutan por código; un pedido real va al modelo ✅
124. Autoprueba 17/17; tokens fijos ~1.750, N0/N1 ~614 (sigue muy por debajo del mercado) ✅

## v25 — arreglo del "verde falso" sin git + coherencia y plan por código
125. Sin git ya NO da verde falso: seguridad/escaneo/organizar/probador/adopción recorren el disco si no hay repo. Probado: app PHP sin git → antes "✅ sin huecos" (falso), ahora detecta los 2 huecos reales ✅
126. Nuevo listar.ts (git o recorrido de disco) usado por seguridad, escaneo, organizar, probador, extras, adopción ✅
127. Coherencia por código (candado): skill_dey_plan registra los requisitos; el cierre FALLA si queda alguno sin marcar. Probado: 2 pendientes → falla; completos → pasa ✅
128. Multiagente/plan reales: en N2/N3 el agente registra el plan y marca cada parte; el código verifica, ya no depende de que el modelo recuerde ✅
129. Autoprueba 19/19; regresión OpenCode real: comandos por código + pedido real al modelo OK ✅
130. Revisado lo anterior: documentar ya tenía respaldo sin git; respaldo.ts (snapshots) es git por diseño, con copia de archivos como alternativa (sin cambios) ✅

## v26 — React/SPA, Windows, menos tokens, modo portable (sin pendientes)
131. Probador y seguridad sobre el DOM REAL: descubre formularios que dibuja JavaScript. Probado: SPA tipo React con form en JS → detectó el XSS; PHP vulnerable sigue detectado; app segura sin falsos ✅
132. Windows: liberación forzada de puertos con netstat+taskkill (antes solo Mac/Linux con fuser/lsof) ✅
133. Tokens: costo fijo por mensaje 1.889 → ~1.022 (agente 605 + descripciones 417); skill (689) solo carga en N2/N3 ✅
134. Modo portable (PORTABLE.md): reglas pegables en Claude Code/Cursor + revisiones por código con el CLI en cualquier terminal; honesto: el guardián en vivo es solo OpenCode ✅
135. Autoprueba 19/19; anti-vueltas y comandos OK en OpenCode real ✅
