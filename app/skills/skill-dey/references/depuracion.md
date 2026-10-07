# Depuración (error, "no funciona", "revisa/corrige errores")

## Método
1. **Error exacto:** mensaje + archivo:línea + dónde (servidor, consola, red, BD, pantalla). Sin detalle → `skill_dey_verificar(todo:true)`; no preguntes.
2. **Reproducir** (mismos pasos y datos). No se reproduce → busca qué difiere (datos, sesión, rol, .env, caché).
3. **Causa raíz:** traza hasta la primera línea propia; "¿por qué?" hasta el origen (dato, consulta, contrato front↔back).
4. **Prueba roja** (N1+) → arreglo mínimo en el origen → verificar con la misma herramienta.
5. **Hermanos:** `grep -n` del patrón culpable y corrige todas las apariciones.
6. **Lección:** `skill_dey_leccion` (síntoma → causa → arreglo).

Prohibido silenciar (`@`, `catch {}`, `error_reporting(0)`, `?.` que esconde un null indebido, `@ts-ignore`, `eslint-disable`), borrar la prueba que falla o subir timeouts sin causa. Warnings también se corrigen. 3 ciclos en rojo → `diagnostico-sistematico.md`.

## Síntoma → causa → dónde
| Síntoma | Causa típica | Dónde |
|---|---|---|
| 404 CSS/JS/imagen | ruta relativa, base URL, mayúsculas | `<link>/<script>/<img>`, `base` de Vite |
| 404/405 API | ruta o verbo distinto, prefijo `/api` | router back vs fetch/axios |
| 500 API | excepción del back | log del servidor |
| CORS | origen no permitido, preflight | middleware CORS, `.env` |
| `Cannot read properties of undefined` | dato no cargado o forma distinta | contrato API, estado inicial |
| `undefined`/`NaN` en pantalla | campo mal nombrado, texto como número | respuesta, `Number()` |
| Hydration mismatch | fecha/aleatorio/`window` en servidor | mover al cliente |
| `Undefined index/array key` | `$_POST` sin `isset`, columna no pedida | validación, `SELECT` |
| `SQLSTATE[42S22/42S02]` | migración pendiente o nombre distinto | migraciones, diccionario |
| `SQLSTATE[23000]` | FK o único violado | orden de inserción |
| `Headers already sent` | salida antes de `header()`/sesión | inicio del include (espacio, BOM) |
| EADDRINUSE | proceso zombi | `skill_dey_procesos(liberar)` |
| `Module not found` | dependencia, alias, mayúsculas | `package.json`, tsconfig/vite |
| Pantalla en blanco | excepción JS al montar | consola |
| Formulario "no hace nada" | error JS, 422 sin mostrar | red + consola |
| Local sí, servidor no | `.env`, mayúsculas, versión, permisos | `.env.example` vs servidor |

## "Revisa / corrige todos los errores"
`skill_dey_verificar(todo:true)` (código + arranque + recorrido del sitio → `.skill_dey/ERRORES-SITIO.md`, agrupado por causa). Orden: rompe (500, excepción, blanco) → seguridad → datos → consola/red → visual. Corrige, marca `[x]`, repite `skill_dey_sitio` hasta 0. Lo que exija decisión del usuario: dilo con la opción recomendada.
