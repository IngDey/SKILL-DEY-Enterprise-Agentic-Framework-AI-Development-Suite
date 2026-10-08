---
name: skill-dey
description: Crear, cambiar, corregir o revisar código sin romper la app y con cero errores.
license: MIT
compatibility: opencode
metadata:
  version: "32.0.0"
  idioma: es
  author: IngDey
---

# SKILL_DEY
Para N2/N3. `references/*.md`: cargar solo al necesitarla, una vez.

## Leyes (además de las del agente)
1. **Entender:** flujo del dato (captura→validación→guardado→consultas→reportes→permisos). Si choca con la lógica de la app, dilo (`skill_dey_recordar`).
2. **Evidencia:** "funciona" = `skill_dey_verificar` verde; confianza BAJA → prueba mínima y re-verificar.
3. **No romper:** `skill_dey_impacto` antes de cambiar algo existente; un contrato compartido se cambia en todos sus usos.
4. **Cero errores:** cierre = `verificar(cierre:true)` (corre solo: revisión total + seguridad + probador + formato + rendimiento N+1 + validación de servidor); errores → `depuracion.md`.
5. **Seguro:** secretos solo en `.env`; validación y permisos en servidor; CSRF; contraseñas con hash; respaldo de BD antes de migrar. Huecos los detecta `seguridad.ts`; respeta `.skill_dey/PRINCIPIOS.md` y las zonas de `CONGELADO.txt`.
6. **Legible:** sin TODOs ni `catch {}` vacíos; archivos ≤400 líneas; encabezado en archivos nuevos; docblock en funciones públicas. Docs se generan solos.
7. **Proactivo (N2+):** `checklist-olvidos.md`; bajo riesgo lo haces, alto impacto lo propones. Error corregido detectable → `leccion(vacuna)`; solución reutilizable → `leccion(solucion)`.

## Nivel
| N | Qué | Proceso |
|---|---|---|
| N2 | funcionalidad en varias capas | `skill_dey_plan` (requisitos) → (toca negocio → espera "sí") → prueba roja → código → marca cada requisito → ciclo |
| N3 | BD, auth, dinero, API pública, borrado | ≤7 preguntas → `skill_dey_plan` aprobado → prueba roja → ciclo + suite completa (el cierre verifica que el plan quede 100%) |

"rápido" = mínimo verificado; "a fondo" = ciclo completo.

## Ciclo (N2/N3)
Analizar → Construir → Verificar → Auditar (`references/f1`…`f4-*.md`). ❌ → causa raíz, reintenta lo fallido. Partes independientes: contratos + `task` en paralelo. Migración: `skill_dey_qa` accion:bd (copia) → respaldo → real. Cierre: verificar(cierre) → `task` a `skill_dey-revisor` (pedido + archivos; corrige lo que marque) → lección → reporte ≤8 líneas.

## Especialistas
Seguridad/auth/dinero → `seguridad.md` · Diseño → `diseno.md` · KPI/reporte → `estadistica.md` · imagen/boceto/Excel → `skill_dey_imagen` + `imagen-a-ui.md` · app nueva → `plantilla-base.md` · app existente sin `.skill_dey/ADOPCION.md` → `skill_dey_adoptar` + `adopcion.md` · "revisa" sin cambio → solo hallazgos archivo:línea.

## Tokens
`skill_dey_mapa`/`grep -n` antes de abrir; lee rangos; no releas; no corras lint/tests a mano. "Sigue" → `.skill_dey/ESTADO.md`.
