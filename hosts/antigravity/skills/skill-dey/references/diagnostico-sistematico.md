# CICLO 4 — Diagnóstico sistemático (cargar SOLO tras 3 ciclos sin verde o cuando el guardián lo ordene)
Sirve para cualquier error, lenguaje, framework o entorno: no inicia, no compila, test/deploy falla, resultado incorrecto, pantalla bloqueada, conexión, configuración, datos o integración. Tres intentos fallidos = el enfoque anterior está mal: se abandona. Sin adivinar, sin confundir entorno con código, sin declarar éxito porque compila.

## Anti-vueltas (lo que más tokens quema)
- UNA hipótesis a la vez, con UNA comprobación que la refute. Nunca varios cambios a la vez "a ver si".
- Nunca repitas un comando o lectura sin haber cambiado algo (el guardián lo bloquea a la 3ª vez).
- No releas archivos completos: rango exacto de la traza. No listes carpetas ya vistas.
- Si la comprobación refuta la hipótesis, anótalo en 1 línea y pasa a la siguiente; no insistas.
- Presupuesto: 15 acciones sobre el mismo error → el guardián te detiene; 30 → freno.

## Método
1. **Síntoma exacto.** Qué acción falla, qué se esperaba, qué ocurrió. Literal: mensaje, traza, código de salida, respuesta o resultado incorrecto (`.skill_dey/ERRORES-SITIO.md` si existe).
2. **Reproducir antes de cambiar.** Caso afectado o comprobación más cercana. Si no se reproduce: separa hechos de hipótesis y di qué evidencia falta.
3. **Delimitar la capa.** Código · proceso · configuración · dependencias · SO · red · interfaz · API · almacenamiento · BD · permisos · compilación · pruebas · despliegue · servicio externo. Donde se ve el síntoma no siempre es donde nace.
4. **Estado real del entorno.** Procesos, servicios, rutas, puertos, variables, versiones, permisos y dependencias que intervienen (`skill_dey_procesos listar`). "Código válido" ≠ "servicio activo" ≠ "recorrido completo funciona".
5. **Seguir el flujo.** Logs, trazas, depurador, consola, red, salida de pruebas o datos → hasta el componente que toma la decisión. Amplía solo si la evidencia local no alcanza.
6. **Hipótesis comprobable** (escríbela en 1 línea antes de editar): "Si falla por X, al comprobar Y veré Z". La comprobación más pequeña y discriminante.
7. **Cambio mínimo en la causa raíz**, respaldado por evidencia. Respeta arquitectura, convenciones y contratos; sin refactors ajenos; relee el estado actual y conserva los cambios del usuario.
8. **Validar ya** con la prueba más específica (repetir el caso, test enfocado, compilar el módulo, consultar el servicio). Si falla, misma área y misma comprobación antes de ampliar.
9. **Recorrido completo** desde el usuario o consumidor: entrada → proceso → salida → efectos (`skill_dey_verificar(url)` / `skill_dey_sitio`). Un build o test aislado no lo demuestra.
10. **Comunicar con evidencia** (≤5 líneas): síntoma · causa confirmada o lo incierto · cambio · comprobaciones. No digas "resuelto" sin verificar.
11. **Registrar si puede repetirse:** `skill_dey_leccion(tipo:"falla")` con señales, causa, recuperación y cómo distinguirlo de fallos parecidos (en el proyecto, no en este método).

## Interpretar señales
- Mensajes, códigos y trazas son evidencia a interpretar en contexto, no diagnóstico automático.
- Primero lo simple y verificable: servicio detenido, config incorrecta, dependencia ausente, recurso ocupado, permisos, datos inesperados, estado obsoleto (caché, build viejo, proceso zombi).
- No culpes al código si el proceso, dato o dependencia no están disponibles; no culpes al entorno si una prueba reproducible muestra un defecto de código.
- Distingue error nuevo, fallo preexistente y cambio externo (`git diff`, `skill_dey_deshacer historial`).
- Varias causas posibles → una comprobación que las separe, no varios cambios.
- Referencias rápidas: `EADDRINUSE` → qué proceso ocupa el puerto, detener solo ese si es obsoleto · `ERR_CONNECTION_REFUSED` → ¿escucha? host/puerto/URL, health · `401` → login y perfil con sesión nueva (credencial vs token vencido vs secreto cambiado) · carga infinita → ¿petición pendiente o rechazada? el error debe mostrarse sin datos · tiempo real → HTTP, auth del socket, conexión, transporte, sala, evento · exit `143` → proceso terminado, no error de compilación.

## Seguridad y datos
- No imprimas ni compartas contraseñas, tokens, claves ni secretos; no los pidas por chat.
- No borres, reinicies ni reemplaces datos, procesos o recursos sin entender el efecto y tener autorización.
- No desactives validaciones, permisos, seguridad ni integridad para ocultar el error. Offline-first: no toques `outbox`, reintentos ni idempotencia sin probar la sincronización.
- Protege contratos de datos; agrega o ejecuta pruebas en áreas de alto riesgo. No reviertas cambios del usuario para lograr un estado limpio.

## Cierre
Resuelto SOLO si una comprobación posterior al cambio demuestra el comportamiento esperado. Si el ciclo 4 tampoco queda verde → **freno**: `skill_dey_deshacer` al último verde y reporta **hechos · hipótesis · siguiente paso** (2–3 opciones). No sigas intentando.
