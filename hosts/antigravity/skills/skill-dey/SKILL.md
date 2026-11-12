---
name: skill-dey
description: Crear, cambiar, corregir o revisar código sin romper la app y con cero errores. Úsala en trabajo de varias capas, base de datos, auth, dinero, API pública, apps nuevas, bocetos a pantallas, adoptar una app existente o cuando algo "no funciona".
license: MIT
compatibility: Claude Code, Gemini CLI, Antigravity CLI y cualquier agente con Agent Skills. Herramientas skill_dey_* por MCP (Node 20+).
metadata:
  version: "41.0.0"
  author: Ing. Dey (@IngDey)
  idioma: es
---

# SKILL_DEY
Para N2/N3. `references/*.md`: carga solo al necesitarla, una vez.

## Leyes (además de las reglas siempre activas)
1. **Entender:** flujo del dato (captura→validación→guardado→consultas→reportes→permisos). Si choca con la app, dilo.
2. **Evidencia:** "funciona" = `skill_dey_verificar` ✅; confianza BAJA → prueba mínima y re-verificar.
3. **No romper:** antes de tocar algo existente, `grep -rn` de cada símbolo; un contrato compartido se cambia en todos sus usos (el guardián te avisa a quién afecta cada edición).
4. **Cero errores:** cierre = `skill_dey_verificar` ✅ + `skill_dey_seguridad` + `skill_dey_validar`; errores → `references/depuracion.md`.
5. **Seguro:** secretos solo en `.env`; validación y permisos en servidor; CSRF; contraseñas con hash; respaldo de BD antes de migrar. **PROHIBIDO** eliminar BD/tablas o vaciar datos: el guardián lo bloquea; si hace falta, que lo haga el usuario. Respeta `.skill_dey/PRINCIPIOS.md` y `.skill_dey/CONGELADO.txt`.
6. **Legible:** sin TODOs ni `catch {}` vacíos; archivos ≤400 líneas; encabezado en archivos nuevos; docblock en funciones públicas. Los docs se generan solos.
7. **Proactivo (N2+):** `references/checklist-olvidos.md`; bajo riesgo lo haces, alto impacto lo propones. Lección útil → `.skill_dey/LECCIONES.md`.

## Nivel
| N | Qué | Proceso |
|---|---|---|
| N2 | varias capas | plan en `.skill_dey/PLAN.md` (requisitos como checklist) → (toca negocio → espera "sí") → prueba roja → código → marca cada requisito → ciclo |
| N3 | BD, auth, dinero, API pública, borrado | ≤7 preguntas → plan aprobado → prueba roja → ciclo + suite completa (el cierre exige el plan al 100 %) |

"rápido" = mínimo verificado; "a fondo" = ciclo completo.

## Ciclo (N2/N3)
Analizar → Construir → Verificar → Auditar (`references/f1`…`f4-*.md`). ❌ → causa raíz, reintenta lo fallido. Partes independientes: contratos claros + subagentes en paralelo. Migración: ensayo en copia → respaldo → real. Cierre: `skill_dey_verificar` → subagente `skill-dey-revisor` (pedido + archivos; corrige lo que marque) → lección → reporte ≤8 líneas.

## Especialistas
Seguridad/auth/dinero → `seguridad.md` · Diseño → `diseno.md` · KPI/reporte → `estadistica.md` · imagen/boceto/Excel → `imagen-a-ui.md` (sin visión: subagente `skill-dey-vision`) · app nueva → `plantilla-base.md` · app existente sin `.skill_dey/ADOPCION.md` → `adopcion.md` · "revisa" sin cambio → solo hallazgos archivo:línea · app grande o en producción → `revision-produccion.md`.

## Herramientas (MCP `skill_dey`, 0 tokens del modelo)
`skill_dey_verificar` · `skill_dey_deshacer` (pasos, archivo, o accion rehacer/historial) · `skill_dey_chrome` · `skill_dey_seguridad` · `skill_dey_validar` · `skill_dey_documentar` · `skill_dey_organizar` · `skill_dey_produccion` · `skill_dey_movil` · `skill_dey_pruebas`/`skill_dey_capacitar` (solo si lo piden) · `skill_dey_congelar` (solo si lo piden).
Las referencias nombran herramientas de la edición OpenCode. Equivalencias: `skill_dey_impacto`/`skill_dey_mapa` → `grep -rn` · `skill_dey_plan` → `.skill_dey/PLAN.md` · `skill_dey_leccion`/`skill_dey_recordar` → `.skill_dey/LECCIONES.md` · `skill_dey_sitio`/`skill_dey_qa` → `skill_dey_chrome`/`skill_dey_pruebas` · `skill_dey_imagen` → subagente `skill-dey-vision` · `skill_dey_procesos` → comando en segundo plano.

## Tokens
`grep -n` antes de abrir; lee rangos; no releas; no corras lint/tests a mano. "Sigue" → `.skill_dey/ESTADO.md` y `.skill_dey/BITACORA.md`.
