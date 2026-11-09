# Matriz de verificación (la ejecuta `skill_dey_verificar`; esta tabla es para hacerlo a mano si la tool no existe)


`skill_dey_verificar` implementa esta matriz automáticamente; lo que un script no puede juzgar (rúbricas visuales, tests dorados, migraciones) te lo devuelve como **PENDIENTE (tú)** y debes hacerlo.

`●` obligatorio · `○` si existe en el proyecto · vacío = se omite

| Área tocada | Lint/tipos archivo | Tests relacionados | Suite completa | API/integración | E2E flujo | Screenshot vista | a11y | Migración up/down | Audit deps/secretos | Build prod |
|---|---|---|---|---|---|---|---|---|---|---|
| Texto/label UI (N0) | ● | | | | | | | | | |
| Estilos/CSS | ● | | | | | ● | ○ | | | |
| Componente/lógica front | ● | ● | | | ○ | ● | ○ | | | |
| Lógica backend | ● | ● | | ○ | | | | | | |
| Contrato API | ● | ● | ● | ● | ○ | | | | | ● |
| BD/esquema | ● | ● | ● | ● | | | | ● | | |
| Auth/permisos/seguridad | ● | ● | ● | ● | ● | | | | ● | ● |
| Config/env | ● | ○ | | | | | | | ● | ● |
| Dependencias | | ● | ● | | | | | | ● | ● |
| Vista nueva / rediseño | ● | ● | | | ○ | ● rúbrica G14 | ● | | | |
| Maqueta desde imagen | ● | ● | | ○ | ○ | ● original vs resultado G16 | ● | | | |
| Cálculos/KPI/reportes/gráficas | ● | ● tests dorados | | ● conciliación | | ● | | | | |
| Solo docs/comentarios | | | | | | | | | | |
| Docker/CI/infra | ● | | ○ | | | | | | ● | ● |
| Fin de N2/N3 (cierre) | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ● | ● |

**Tests relacionados = solo los afectados** (manual si no hay tool): `vitest related <archivos>` · `jest --findRelatedTests <archivos>` · `pytest <ruta_test> -k <nombre>` · `phpunit --filter <Clase>` · `go test ./<paquete>`. Suite completa solo donde la matriz lo pide.

