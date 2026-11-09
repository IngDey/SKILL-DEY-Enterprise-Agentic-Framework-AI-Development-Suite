# Modo ADOPCIÓN — tomar una app existente y dejarla sana (cargar solo en este modo)

Objetivo: al terminar, la app **arranca sin errores (back y front), no tiene errores en ningún archivo, los riesgos graves están corregidos y la lógica de negocio está entendida y revisada**, sin romper nada que hoy funcione para los usuarios.

1. `skill_dey_adoptar` (hace por código: copia, revisión total, arranque, análisis, docs, informe). No leas la app entera: trabaja sobre `.skill_dey/ADOPCION.md` y el mapa.
2. **Entender el negocio** (lectura mínima): `skill_dey_mapa` → lee solo puntos de entrada, rutas/páginas principales, esquema (`docs/DICCIONARIO-DATOS.md`) y 2–3 flujos clave. Completa `.skill_dey/NEGOCIO.md`. Pregunta solo lo que el código no dice (máx. 5, con opciones, una ronda).
3. **Corregir lo que rompe** (orden: arranque del backend → errores de sintaxis/tipos → `.skill_dey/ERRORES-SITIO.md` (páginas, consola, red, enlaces; método de `depuracion.md`, repetir `skill_dey_sitio` hasta 0) → seguridad CRÍTICO/ALTO). Cada corrección es N1: mínima, quirúrgica, `skill_dey_verificar`. Marca ✅ en ADOPCION.md §4.
4. **Revisión de lógica de negocio** — para cada flujo principal de NEGOCIO.md, contrasta con el código:
   - ¿El flujo termina en todos los casos (estados sin salida, registros que quedan a medias)?
   - ¿Las reglas se validan en el servidor, no solo en el navegador?
   - ¿El mismo cálculo (totales, saldos, indicadores) da igual en pantalla, reporte y exportación?
   - ¿Los estados/valores se escriben igual en todo lado (mayúsculas, tildes)?
   - ¿Cada acción respeta permisos por rol y por dueño del registro?
   - ¿Qué pasa con datos vacíos, duplicados, fechas en el borde del mes, concurrencia (doble clic)?
   Resultado: tabla corta en ADOPCION.md §4 — problema · impacto real · propuesta recomendada · riesgo de cambiarlo. **No apliques cambios de lógica sin OK del usuario**: una app en uso tiene datos y procesos reales que dependen de su comportamiento actual (aunque sea incorrecto).
5. **Cierre**: `skill_dey_verificar(nivel:"N2", cierre:true)` → la app debe arrancar limpia y `todo` sin errores. Informe final ≤8 líneas: qué se corrigió, qué se propone (con prioridad), confianza, qué quedó pendiente y por qué.

Reglas: nunca "reescribir desde cero"; nunca refactors grandes en la adopción; si algo no se puede corregir sin cambiar comportamiento visible, se propone. Todo queda reversible con `skill_dey_deshacer`.
