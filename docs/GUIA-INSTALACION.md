# SKILL_DEY para OpenCode — v26

## Instalar / actualizar (detecta tu sistema operativo solo)
| Sistema | Qué hacer |
|---|---|
| **Windows** | Extrae el zip → doble clic en `INSTALAR.bat` |
| **macOS** | Extrae el zip → doble clic en `INSTALAR.command`. **Si macOS no deja** ("no se puede abrir"): abre la app *Terminal*, entra a la carpeta extraída (`cd` + ruta) y ejecuta: `bash INSTALAR.command` |
| **Linux** | En la carpeta extraída: `bash INSTALAR.command` |

Usa Node si está instalado (instalador principal) y, si no, un instalador de respaldo (PowerShell en Windows, bash en macOS/Linux).
Reinstalar es seguro: actualiza todo y **conserva lo aprendido** (`~/.config/opencode/skill_dey/`).

## Qué se instala (en `~/.config/opencode/`)
| Parte | Para qué |
|---|---|
| `skills/skill-dey/` | El cerebro: enrutador, niveles, ciclo, diseño, estadística, imágenes |
| `tools/skill_dey.ts` | `skill_dey_verificar`, `_impacto`, `_mapa`, `_deshacer`, `_leccion`, `_recordar` (+ `skill_dey_estado` del plugin) |
| `skill_dey-lib/` | Motor de fotos y deshacer |
| `plugins/skill_dey-guardian.ts` | Reglas obligatorias (secretos, comandos peligrosos, .env fuera de git, commit solo verificado, sintaxis al editar) |
| `agents/skill_dey.md` | Agente principal (queda por defecto) |
| `agents/skill_dey-explorador.md` | Subagente de solo lectura para búsquedas grandes |
| `skill_dey/LECCIONES-GLOBALES.md`, `skill_dey/PREFERENCIAS.md` | Memoria para todas tus apps |

## Comandos y pedidos normales (v20)
No necesitas comandos: escribe normal. Los comandos son atajos. En OpenCode escribe **`/skill_dey ayuda`** (lista en 6 grupos, con lo que hace cada uno y cómo pedirlo sin comando) o **`/skill_dey que-hace`**.
- Encender/apagar: `/skill_dey iniciar` · `/skill_dey finalizar` (o "iniciar skill dey" / "finalizar skill dey").
- "documenta la app", "prepara el empalme", "¿cuántos tokens me quedan?", "¿qué modelos tengo?", "deshaz", "¿skill dey funciona?" se ejecutan por código (casi sin tokens).
- Nuevo: vacunas contra errores, reglas de negocio verificadas contra la BD, copia de prueba de la BD, revisor independiente, paquete de empalme, memoria comprimida.
Sin OpenCode (terminal): `node ~/.config/opencode/skill_dey/skill_dey.mjs documentar|empalme|reglas|revisar /ruta/de/tu/app`

## Encender y apagar
- Escribe **iniciar skill dey** → todo lo que sigue usa SKILL_DEY.
- Escribe **finalizar skill dey** → la IA vuelve a su comportamiento por defecto (sin reglas, sin bloqueos, sin gastar tokens de la skill).
- El estado se recuerda entre sesiones.

## App que ya existe (modo adopción)
La primera vez en un proyecto con código, SKILL_DEY lo adopta: copia de seguridad, revisión de todo el código, arranque back+front, análisis de seguridad y lógica de negocio, documentación e informe priorizado en `.skill_dey/ADOPCION.md`. Corrige solo lo que rompe y los riesgos graves; los cambios de lógica de negocio te los propone y espera tu OK.

## Uso
Abre OpenCode en tu proyecto y escribe normal. Para volver atrás: escribe "deshaz". Al final de cada respuesta verás los tokens, costo y tiempo usados.

## Recomendado
git · Node 20+ · PHP/Python si tus apps los usan. El navegador de pruebas (Playwright) se instala solo la primera vez en `~/.config/opencode/skill_dey/playwright` (no toca tus proyectos).

## Cero errores en el sitio (nuevo en v13)
Escribe **"revisa que no haya errores"** (o "corrige los errores"). skill_dey levanta back+front, recorre **todas** las páginas y detecta: páginas 404/500, errores y warnings de consola, fallas de JavaScript, API/CSS/JS/imágenes que no cargan, enlaces rotos, errores PHP/SQL visibles y `undefined`/NaN en pantalla. Corrige cada uno por su causa raíz y repite hasta 0. La lista queda en `.skill_dey/ERRORES-SITIO.md`. Nunca sigue enlaces de "salir/eliminar/borrar".
Si tu app tiene login, agrega en `.env` un usuario **de prueba**: `SKILL_DEY_TEST_USER=` y `SKILL_DEY_TEST_PASS=` para revisar también las páginas internas.

## Procesos y arranque
- Si un proceso ocupa el puerto o queda colgado, skill_dey lo detiene (solo procesos de desarrollo; nunca del sistema ni bases de datos).
- Los servidores (`npm run dev`, `php artisan serve`, `php -S`…) se lanzan en segundo plano para que el agente no se congele.
- Tras cada cambio de front o back verifica que el **backend suba sin errores** y luego el frontend sin errores de consola.
- Revisa todo el proyecto (no solo lo cambiado) al cerrar cada tarea grande.

## Documentación viva (automática)
En cada proyecto, tras cada cambio, se regeneran solos: `docs/MANUAL-TECNICO.md`, `docs/DICCIONARIO-DATOS.md`, `docs/MANUAL-USUARIO.md` (el agente redacta solo la pantalla que cambió) y `database/instalacion.sql` (script para instalar la BD en otro servidor). Lo que escribas fuera de los bloques AUTO se respeta.

## ¿Funciona todo?
Al abrir OpenCode, skill_dey revisa sus protecciones y solo te avisa si algo falla. También puedes escribir "¿skill_dey está funcionando?".

## Medir si es mejor que la IA directa
`node ~/.config/opencode/skills/skill-dey/evals/comparar.mjs --modelos gratis` → compara skill_dey vs IA directa en TODOS tus modelos gratuitos y te da un ranking (`RESULTADOS-COMPARATIVO.md`).

## Modelos
Se adapta a cualquier modelo: el instalador registra las capacidades de todos (`skill_dey/MODELOS.json`). Si tu modelo no ve imágenes (Big Pickle, Ling, Nemotron), los bocetos se leen con un modelo gratuito que sí ve (p. ej. Muse Spark) mediante el subagente `skill_dey-vision`; los Excel se leen exactos sin visión. Reinstala si agregas modelos nuevos.

**Límite de uso:** si un modelo gratis llega a su límite, skill_dey lo detecta al primer error, te avisa y continúa tu tarea con el siguiente modelo libre (según el ranking del comparador si lo corriste; si no, el mejor gratuito disponible). Los modelos agotados se evitan durante 1 hora. Queda anotado en `.skill_dey/CONSUMO.md`.

## Pruebas
- `PRUEBAS-REALIZADAS.md`: lo que ya se probó dentro de OpenCode.
- `skills/skill-dey/evals/BANCO-DE-PRUEBAS.md`: 10 casos para medir con tu modelo real.
