# Banco de pruebas de SKILL_DEY

## Automático (recomendado): skill_dey vs IA directa con TU modelo
```
node ~/.config/opencode/skills/skill-dey/evals/comparar.mjs
node ~/.config/opencode/skills/skill-dey/evals/comparar.mjs --modelos gratis          # todos tus modelos gratuitos + ranking
node ~/.config/opencode/skills/skill-dey/evals/comparar.mjs --modelos opencode/big-pickle --casos 1,2,3
```
Crea un proyecto de prueba, hace los mismos 5 pedidos (texto, bug, regla de negocio, pregunta, trampa de lógica) con `skill_dey` y con `build` (IA directa), y genera `RESULTADOS-COMPARATIVO.md` con correctos, tokens, costo y tiempo. Córrelo tras cada actualización.

## Manual

Sirve para comprobar, con números, si un cambio a la skill la mejoró o la empeoró. Correr las 10 pruebas después de cada actualización importante y anotar los resultados en la tabla del final.

## Preparación (una vez)
1. Crear una carpeta `skill_dey-pruebas` con un proyecto pequeño real (ej. una app CRUD con login, 1 listado, 1 formulario, 1 dashboard, tests básicos). Commit inicial.
2. Guardar en `skill_dey-pruebas/bocetos/` un dibujo de una pantalla (papel fotografiado o Paint).
3. Antes de cada prueba: `git reset --hard <commit inicial>` y sesión nueva de OpenCode.

## Casos (escribir el mensaje tal cual)

| # | Mensaje | Modo esperado | Nivel | Debe hacer | NO debe hacer |
|---|---|---|---|---|---|
| 1 | "cambia el texto del botón Guardar por Registrar" | CAMBIO | N0 (o N1 si `skill_dey_impacto` detecta clave i18n) | `skill_dey_impacto` → edición → `skill_dey_verificar(N0)` → 1 línea | Tests completos, capturas, plan escrito |
| 2 | "¿qué diferencia hay entre JWT y sesiones?" | RESPONDER | — | Respuesta breve | Tocar archivos |
| 3 | "el campo estado del listado muestra Activo, cámbialo a Habilitado" (y el backend compara `== "Activo"`) | CAMBIO | N1→N3 | Detectar comparación, no romper la lógica (cambiar solo etiqueta visible o todos los usos) | Renombrar a ciegas |
| 4 | "revisa el módulo de usuarios" | AUDITAR | — | Hallazgos priorizados archivo:línea | Editar código |
| 5 | pegar un stack trace real | DEPURAR | según causa | Reproducir, test rojo, causa raíz, arreglo, test verde | Parchear el síntoma |
| 6 | "agrega exportar a Excel en el listado de productos" | CAMBIO | N2 | Ciclo F1→F4, tests, captura, cierre | Saltarse verificación de cierre |
| 7 | "haz la pantalla del boceto de la carpeta bocetos" | CAMBIO + imagen | N2 | Leer la imagen, especificación, vista funcional, comparación G16 | Decir "no puedo leer imágenes" |
| 8 | "crea un dashboard con el promedio de ventas por mes y la meta" | CAMBIO + diseño + estadística | N2 | Ficha de indicador, test dorado, gráfica correcta, rúbrica G14/G15 | Promedio de promedios, torta con 12 partes |
| 9 | "sigue" (con una tarea a medias) | REANUDAR | — | Continuar desde ESTADO | Re-analizar todo |
| 10 | Tras el caso 1, decir "no, eso era solo revisar" | corrección | — | `skill_dey_leccion(tipo:"modo")` y la próxima vez acertar | Ignorar la corrección |

## Qué medir en cada caso
- **Tokens y costo**: los muestra OpenCode en la sesión.
- **Tiempo** hasta la respuesta final.
- **Acierto de modo y nivel** (✅/❌) según la tabla.
- **Resultado correcto** (✅/❌): la app funciona y no rompió nada (`skill_dey_verificar(N2, cierre:true)` verde).
- **Reglas**: ¿intentó algo que el guardián bloqueó? (anotar).

## Registro

| Fecha | Versión skill | Modelo | Caso | Tokens | Tiempo | Modo ✅ | Nivel ✅ | Resultado ✅ | Nota |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

**Meta:** 10/10 en modo y resultado. N0 (caso 1) con menos de ~8k tokens totales. Si una versión nueva sube los tokens de un caso más del 20% sin mejorar el resultado, se revierte ese cambio.
