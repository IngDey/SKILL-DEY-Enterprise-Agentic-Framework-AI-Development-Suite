# F1 — ANALIZAR (analista minucioso, profesional, desconfiado)

Objetivo: entender el 100% antes de tocar una línea. Salida: **Plan de iteración** + **Mapa de impacto**.

## 1. Comprensión
- Reformula la tarea en 1–3 líneas. Lista los CA numerados (CA1, CA2…), cada uno verificable con un comando o una observación concreta.
- Identifica ambigüedades. Si una ambigüedad cambia el diseño → pregunta (una sola vez, todo junto). Si no → asume el default más seguro y regístralo en `DECISIONES.md`.
- Si viene de un ❌ de F4: la entrada es la lista de fallas. Aplica **5 porqués** hasta la causa raíz. Prohibido parchear el síntoma.

## 1b. Lógica y funcionalidad (obligatorio, también en N1)
- ¿Para qué lo pide? ¿Qué problema de negocio resuelve? ¿Quién lo usa y en qué momento del flujo?
- Recorre el flujo completo del dato: captura → validación → guardado → consulta → reportes/exportes → permisos → notificaciones.
- Todo lo que el cambio afecta en ese flujo debe quedar consistente (filtros, listados, reportes, estados, validaciones front y back, mensajes).
- Si el pedido literal rompe la lógica existente, explica en 1–2 líneas y aplica o propone la versión coherente.

## 2. Reconocimiento del código (barato en tokens)
1. Estructura: `git ls-files | head -200` o árbol limitado; ignora `node_modules`, `vendor`, `dist`, `.venv`.
2. Puntos de entrada: rutas, controladores, main, App, router.
3. `grep -rn "<símbolo>"` para cada función/clase/tabla/endpoint/variable que se tocará.
4. Lee solo los rangos relevantes. Anota convenciones reales del repo (nombres, capas, manejo de errores, estilos) y **síguelas**.
5. Revisa `LECCIONES.md` por el tema.

## 3. Mapa de impacto (obligatorio antes de F2)

| Elemento a cambiar | Tipo | Quién lo usa (archivo:línea) | Contrato actual | Riesgo | Mitigación |
|---|---|---|---|---|---|

Considera siempre: firmas de funciones, contratos de API (request/response/códigos), esquema BD y datos existentes, eventos/colas, caché, tipos compartidos, estilos globales/CSS, traducciones, permisos, jobs programados, tests existentes, documentación.

Regla: si cambia un contrato público → versionar, adaptador de compatibilidad, o actualizar TODOS los consumidores en la misma iteración.

## 4. Diseño de la solución
- Elige la opción más simple que cumpla CA + no funcionales (seguridad, rendimiento, escalabilidad, mantenibilidad). Si hay 2+ opciones reales, compáralas en 3 líneas y registra la decisión.
- Define: capas afectadas, nuevos módulos, modelo de datos, endpoints, componentes UI, estados (cargando/vacío/error/éxito), variables de entorno nuevas, migraciones (con rollback), tests a escribir **antes o junto** al código.
- Divide en pasos pequeños y ordenados (cada paso compila y pasa tests).

## 5. Revisión de omisiones
Solo en iteración 1 y al cerrar: recorre `checklist-olvidos.md` y marca qué aplica. Lo de bajo riesgo entra al plan; lo de alto impacto se propone al usuario.

## 6. Plan de iteración (escríbelo en ESTADO.md, compacto)
```
## Iteración iN
Objetivo: …
Causa raíz (si reintento): …
Pasos: 1) … 2) … 3) …
Tests nuevos: …
Env nuevas: …
Riesgos: …
```
