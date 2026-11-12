# Revisión y cambios en apps GRANDES / en PRODUCCIÓN

Objetivo: tocar software grande y en vivo **sin romperlo**, viendo lo que NO se ve (dependencias ocultas, cruces front↔back↔BD) y dejando todo reversible. No existe el "0 fallos" absoluto; esto los minimiza y hace cada cambio reversible y explicable.

## 1. ANTES de tocar (obligatorio)
1. `skill_dey_mapa` (o `/skill_dey estructura`) → estructura del proyecto.
2. `/skill_dey impacto-profundo` → puntos críticos (archivos de los que muchos dependen), rutas front sin back, tablas más usadas, motor JS.
3. Para CADA archivo que vas a cambiar: `/skill_dey impacto-profundo <archivo>` → quién depende de él, **incluyendo dependientes OCULTOS en cadena** (nivel 2+). Si un archivo lo usan muchos o cruza capas/BD = alto riesgo.
4. Si cruza BD: revisa estructura con la herramienta de BD; toda migración se ensaya en **copia** primero (`/skill_dey copia-bd`), luego respaldo, luego la real.

## 2. Advertir (antes de editar nada)
Dile al usuario, en pocas líneas: QUÉ vas a tocar, QUÉ se rompe si sale mal (lista de dependientes directos y ocultos), y CÓMO se resuelve si se presenta. Si el riesgo es alto (contrato compartido, tabla muy usada, hub), **espera su OK**.

## 3. Cambio en caliente — seguro y reversible
1. Checkpoint antes de tocar (skill_dey toma foto automática; refuerza con `/skill_dey checkpoint antes-de-X`).
2. Cambios **pequeños y reversibles**, uno a uno. Un contrato compartido no se renombra a ciegas: o cambias solo la etiqueta visible, o actualizas TODOS sus usos en la misma iteración.
3. Si el cambio es riesgoso, ponlo detrás de una bandera/condición para poder apagarlo sin revertir código.
4. Cambiar versiones de JS/dependencias: respeta `engines` y el tipo de módulo (ESM/CommonJS); cambia, `skill_dey_verificar`, y si rompe algo, revierte esa versión.

## 4. Verificar tras CADA paso
`skill_dey_verificar` + `/skill_dey revisar` (sitio) después de cada cambio. Verde = sigue. Rojo = ve al paso 5.

## 5. Si algo falla → deshacer solo y dejar funcionando
1. `/skill_dey cambios` → muestra EXACTO qué archivo · línea · palabra se movió (viejo → nuevo). Eso es lo que hay que volver.
2. `skill_dey_deshacer` → restaura exactamente el estado del último checkpoint (deja la app como estaba, funcionando).
3. Reporta al usuario: qué falló, qué se revirtió (archivo·línea·palabra) y la hipótesis de causa raíz antes de reintentar por otro camino.

## Reglas de oro
- Nunca borres ni renombres algo usado en otros lados sin actualizar todos sus usos a la vez.
- Nunca migres la BD real sin ensayar en copia + respaldo.
- Ante la duda, NO toques: advierte y pregunta.
- Deja siempre el camino de regreso listo (checkpoint + diff exacto).
