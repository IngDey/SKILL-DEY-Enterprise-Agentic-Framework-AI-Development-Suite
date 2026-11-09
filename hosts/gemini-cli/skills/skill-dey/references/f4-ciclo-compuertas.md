# F4 — AUDITAR (compuertas) y decidir: ¿otra vuelta o cierre?

Eres el auditor más estricto. Evalúa con la evidencia de F3. Sin evidencia = ❌.

## Compuertas (Definición de Terminado)

| # | Compuerta | Criterio |
|---|---|---|
| G1 | Criterios de aceptación | Todos los CA cumplidos y demostrados |
| G2 | Build | Build de producción ok, sin warnings nuevos |
| G3 | Estático | Lint 0 errores · typecheck 0 errores · formateado |
| G4 | Tests | Suite completa verde · cobertura ≥80% en lo cambiado · sin tests saltados nuevos |
| G5 | Regresión | Ninguna función previa alterada (mapa de impacto verificado) |
| G6 | Seguridad | 0 vulns altas/críticas · 0 secretos en código · validación + authZ en endpoints tocados |
| G7 | Configuración | Toda config en env · `.env.example` actualizado y comentado · app valida env al arrancar |
| G8 | Datos | Migraciones up/down probadas · índices necesarios · sin N+1 en lo nuevo |
| G9 | UI/UX | Screenshots 3 anchos revisados · estados completos · axe 0 serias · consola limpia |
| G10 | Rendimiento | Paginación en listados · presupuesto Lighthouse cumplido (si hay UI) · sin consultas >300ms evitables |
| G11 | Calidad | Sin duplicación nueva · sin TODO/FIXME/console.log/print de depuración · nombres claros |
| G12 | Operación | Logs estructurados · manejo de errores uniforme · /health ok · README/docs actualizados |
| G14 | Diseño | Rúbrica visual de `diseno.md` §5: cada criterio ≥8, promedio ≥8.5 |
| G15 | Datos | Fichas de indicador · tests dorados · conciliación dashboard = detalle = export (`estadistica.md` §7) |
| G16 | Fidelidad a imagen | Todos los componentes/anotaciones del boceto presentes y ubicados (`imagen-a-ui.md` §5) |
| G17 | Sitio sin errores | `skill_dey_sitio` (o verificar cierre) en 0: ninguna página 4xx/5xx, consola/red/enlaces/imágenes limpios, sin errores PHP/SQL ni `undefined`/NaN en pantalla |
| G13 | Memoria | `.skill_dey/` actualizada (estado, lecciones, bitácora) |

Compuertas no aplicables → marcar `N/A` con motivo de 3–6 palabras (ej. "sin UI en esta tarea").

## Decisión
- **Todas ✅/N/A** → ir a CIERRE (SKILL.md §3).
- **Algún ❌** →
  1. Registrar en `BITACORA.md`: `iN | fallas: G4,G9 | causa probable`.
  2. Si la iteración empeoró el estado (más ❌ que el checkpoint anterior) → **deshacer** al último checkpoint verde y registrar en `LECCIONES.md` como ❌ "enfoque X falló porque Y".
  3. Si mejoró → conservar y registrar lo que funcionó como ✅.
  4. Volver a **F1** con la lista de fallas como entrada. Iteración `iN+1`.

## Freno de emergencia
- 3 ciclos seguidos sin verde → **ciclo 4 = `diagnostico-sistematico.md`** (no repetir el enfoque). Si el ciclo 4 falla, o 8 iteraciones sin cerrar, o se requiere una acción destructiva/irreversible, o se necesita información que solo el usuario tiene →
  deshaz al último checkpoint verde, y reporta: estado de compuertas, qué se intentó (de `LECCIONES.md`), causa, 2–3 opciones con recomendación. Espera decisión.

## Tabla de salida (en el chat, compacta)
```
i3 · F4 · G1✅ G2✅ G3✅ G4❌(2 tests auth) G5✅ G6✅ G7✅ G8N/A G9✅ G10✅ G11✅ G12✅ G13✅ → vuelve a F1
```
