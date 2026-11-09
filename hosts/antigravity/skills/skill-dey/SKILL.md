---
name: skill-dey
description: Método SKILL DEY para crear, cambiar, corregir, revisar o adoptar código sin romper la app y con cero errores. Úsala en trabajo de varias capas, base de datos, autenticación, dinero, API pública, apps nuevas, bocetos o imágenes a pantallas, apps existentes que hay que estabilizar, o cuando algo "no funciona".
license: MIT
compatibility: Claude Code, Gemini CLI, Antigravity CLI, OpenCode y cualquier agente compatible con Agent Skills. Requiere Node 20+ para las herramientas MCP skill_dey_*.
metadata:
  version: "40.0.0"
  author: Ing. Dey (@IngDey)
  idioma: es
---

# SKILL DEY

Cargar `references/*.md` solo cuando se necesiten, una vez cada uno.

## Leyes
1. **Entender:** sigue el dato de punta a punta (captura → validación → guardado → consultas → reportes → permisos). Si el pedido choca con la lógica de la app, dilo antes de cambiar nada.
2. **Evidencia:** "funciona" = `skill_dey_verificar` en ✅. Confianza baja → prueba mínima y re-verificar.
3. **No romper:** antes de cambiar algo existente, `grep -rn` de cada símbolo que tocas; un contrato compartido se cambia en todos sus usos.
4. **Cero errores:** cierre = `skill_dey_verificar` ✅ + revisión independiente (subagente `skill-dey-revisor`). Errores → `references/depuracion.md`.
5. **Seguro:** secretos solo en `.env`; validación y permisos en servidor; CSRF; contraseñas con hash; respaldo de BD antes de migrar. Respeta `.skill_dey/PRINCIPIOS.md` y `.skill_dey/CONGELADO.txt`.
6. **Legible:** sin TODOs ni `catch {}` vacíos; archivos ≤400 líneas; encabezado en archivos nuevos; docblock en funciones públicas.
7. **Proactivo:** revisa `references/checklist-olvidos.md`. Lo de bajo riesgo lo haces; lo de alto impacto lo propones.

## Nivel
| N | Qué | Proceso |
|---|---|---|
| N2 | Funcionalidad en varias capas | Plan en `.skill_dey/PLAN.md` (requisitos como checklist) → si toca negocio, espera "sí" → prueba roja → código → marca cada requisito → ciclo |
| N3 | BD, auth, dinero, API pública, borrado | ≤7 preguntas → plan aprobado → prueba roja → ciclo + suite completa. El cierre exige el plan al 100 % |

"Rápido" = mínimo verificado. "A fondo" = ciclo completo.

## Ciclo (N2/N3)
Analizar → Construir → Verificar → Auditar (`references/f1-analisis.md` … `f4-ciclo-compuertas.md`).
❌ → causa raíz y reintenta solo lo fallido. Partes independientes → subagentes en paralelo con contratos claros; integras tú.
Migración: ensayo en copia → respaldo en `.skill_dey/respaldos-bd/` → real.
Cierre: `skill_dey_verificar` ✅ → subagente `skill-dey-revisor` (pedido + archivos; corrige lo que marque) → lección en `.skill_dey/LECCIONES.md` → reporte ≤8 líneas.

## Especialistas
Seguridad/auth/dinero → `references/seguridad.md` · Diseño → `references/diseno.md` · KPI/reportes → `references/estadistica.md` · Imagen/boceto/Excel → `references/imagen-a-ui.md` (si tu modelo no ve imágenes: subagente `skill-dey-vision`) · App nueva → `references/plantilla-base.md` · App existente sin `.skill_dey/ADOPCION.md` → `references/adopcion.md` · "Revisa" sin cambio → solo hallazgos archivo:línea.

## Herramientas (MCP `skill_dey`, 0 tokens del modelo)
| Necesitas | Usa |
|---|---|
| Verificar / cerrar | `skill_dey_verificar` |
| Deshacer / rehacer / ver copias | `skill_dey_deshacer` · `skill_dey_rehacer` · `skill_dey_historial` |
| Seguridad · validación en servidor | `skill_dey_seguridad` · `skill_dey_validar` |
| Documentar · organizar | `skill_dey_documentar` · `skill_dey_organizar` |
| Errores de producción · móvil | `skill_dey_produccion` · `skill_dey_movil` |
| Pruebas pro · video (solo si lo piden) | `skill_dey_pruebas` · `skill_dey_capacitar` |
| Zona intocable | `skill_dey_congelar` (solo si el usuario lo pide) |

Las referencias nombran herramientas de la edición OpenCode. Equivalencias: `skill_dey_impacto`/`skill_dey_mapa` → `grep -rn` · `skill_dey_plan` → `.skill_dey/PLAN.md` · `skill_dey_leccion`/`skill_dey_recordar` → `.skill_dey/LECCIONES.md` · `skill_dey_qa` y `skill_dey_sitio` → `skill_dey_verificar` / `skill_dey_seguridad` / `skill_dey_pruebas` · `skill_dey_imagen` → subagente `skill-dey-vision`.

## Tokens
`grep -n` antes de abrir archivos; lee por rangos; no releas; no corras lint/tests a mano si `skill_dey_verificar` ya lo hace. "Sigue" → lee `.skill_dey/ESTADO.md`.
