# Protocolo de memoria y deshacer

Objetivo: continuar cualquier tarea en otra sesión leyendo ≤150 líneas, nunca repetir un error, y poder revertir cualquier iteración.

## Archivos (`.skill_dey/` en la raíz del proyecto, versionado en git salvo `shots/`)

| Archivo | Tipo | Límite | Cuándo se escribe |
|---|---|---|---|
| `ESTADO.md` | Se sobrescribe | ≤80 líneas | Inicio de tarea, fin de cada fase |
| `LECCIONES.md` | Acumulativo, deduplicado | ≤200 líneas (condensar al pasar) | Fin de cada iteración |
| `BITACORA.md` | Solo agregar | 1 línea/iteración | Inicio (checkpoint) y fin de iteración |
| `DECISIONES.md` | Solo agregar | 3 líneas/decisión | Cuando se elige entre alternativas |

## Formato de LECCIONES.md (una línea por lección, con etiquetas para `grep`)
```
✅ [auth][jwt] Refresh rotativo con tabla refresh_tokens + revocación funcionó; tests en auth.int.test.ts
❌ [db][migracion] Renombrar columna directo rompió reportes → usar columna nueva + backfill + borrar después
❌ [ui][tabla] Tabla con 12 columnas desborda en 375px → vista tarjetas en móvil
```
Reglas: antes de agregar, `grep` la etiqueta; si existe una similar, actualízala en lugar de duplicar. Solo lecciones reutilizables (no "arreglé typo").

## Checkpoints (git)
```bash
# inicio de iteración
git add -A && git commit -qm "skill_dey: checkpoint i3" --allow-empty && git rev-parse --short HEAD
# → escribir en BITACORA: i3 | 2026-09-29 | inicio | a1b2c3d | -
```
- Primera vez: si hay cambios del usuario sin commit → `git stash push -u -m "skill_dey-user-<fecha>"` y avisar, o commit `skill_dey: baseline` si el usuario lo autoriza.
- Si no hay repo: `git init && git add -A && git commit -qm "skill_dey: baseline"`.

## Deshacer
| Situación | Acción |
|---|---|
| Iteración empeoró todo | `git reset --hard <hash checkpoint iN>` |
| Un archivo quedó mal | `git checkout <hash> -- ruta/archivo` |
| Cambio ya commiteado y compartido | `git revert <hash>` (nunca reset en ramas publicadas) |
| Migración aplicada mala | ejecutar `down` de esa migración, luego revert del código |

Tras deshacer: registrar en LECCIONES ❌ con causa y en BITACORA `iN | revertido a <hash>`.

## Guardar lo que salió bien
- Al cerrar con todas las compuertas ✅: commit `skill_dey: <resumen>` + tag opcional `skill_dey/ok-<fecha>`. Ese hash es el "último verde" para futuros deshacer.
- Patrones reutilizables (utilidades, componentes, configuraciones que funcionaron) → ✅ en LECCIONES con la ruta, para reutilizarlos en otras tareas.

## Reanudar una sesión
1. `cat .skill_dey/ESTADO.md` · `tail -5 .skill_dey/BITACORA.md` · `git log --oneline -5`
2. Continuar desde la fase/iteración registrada. No re-analizar lo ya cerrado.

## Herramientas y memoria global
- `skill_dey_leccion(tipo, etiquetas, texto, alcance?)` guarda y deduplica (si existe una lección parecida con la misma etiqueta, la actualiza). Tipos: `ok` ✅, `error` ❌, `modo` 🧭, `preferencia` ⭐.
- `skill_dey_recordar(tema)` devuelve ≤20 líneas: lecciones del proyecto, decisiones, lecciones globales y preferencias.
- Global: `~/.config/opencode/skill_dey/LECCIONES-GLOBALES.md` y `PREFERENCIAS.md`. El instalador nunca los sobrescribe: lo aprendido se conserva entre versiones.
- Promover a global: si una lección del proyecto sirve para otras apps (patrón de stack, error de librería, gusto de diseño), guárdala con alcance `ambos`/`global`.
- Condensar: cuando la tool avise "archivo largo", fusiona lecciones parecidas en una sola línea más general.
