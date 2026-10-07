# F2 — CONSTRUIR (óptimo, seguro, eficiente, reutilizable)

## 0. Antes de editar
- Checkpoint hecho (`skill_dey: checkpoint iN`). Si no → hazlo ahora.
- Re-verifica usos del símbolo con `grep` (el código pudo cambiar en la iteración previa).

## 1. Arquitectura base (adaptar al stack, respetar la existente)
```
backend/  src/{config, modules/<dominio>/{controller|routes, service, repository, dto|schema, tests}, shared/{errors, middleware, utils, logger}, db/{migrations, seeds}}
frontend/ src/{app|pages, components/{ui, domain}, hooks|composables, services/api, store, styles/tokens, i18n, utils, tests}
```
- Separación: transporte (HTTP) → servicio (reglas de negocio) → repositorio (datos). Sin SQL en controladores, sin lógica de negocio en componentes UI.
- Config centralizada en UN módulo `config` que lee y **valida** env al arrancar (zod/joi/pydantic-settings/envalid/viper…). Si falta una variable obligatoria → la app no arranca y dice cuál.

## 2. Variables de entorno (siempre)
- `.env` (ignorado en git) · `.env.example` (versionado, sin valores reales, con comentario por variable) · opcional `.env.test`.
- Verifica `.gitignore` incluye `.env`, `.env.*` excepto `.env.example`.
- Parametriza: puertos, URLs, credenciales BD, secretos JWT, CORS, niveles de log, límites (rate, tamaño upload, paginación), feature flags, zona horaria, idioma por defecto, SMTP, almacenamiento, URLs de servicios externos.
- Base: `assets/env.example.plantilla`.

## 3. Estándares de código
- Nombres descriptivos; funciones cortas con una responsabilidad; sin números mágicos (constantes o config).
- Tipado estricto (TS `strict`, type hints + mypy/pyright, PHP `declare(strict_types=1)`).
- Errores: jerarquía de errores de dominio → middleware global → respuesta uniforme `{error:{code,message,details}}`. Nunca tragar excepciones; nunca exponer stack al cliente en prod.
- Logs estructurados (JSON) con nivel, request-id, sin datos sensibles.
- Idempotencia en operaciones reintentables; transacciones en escrituras múltiples.
- DRY con criterio: extrae a `shared/` cuando se usa 2+ veces; no abstraigas lo que se usa 1 vez.
- Comentarios solo para el "por qué". Docstrings en funciones públicas.
- Sigue el formateador/linter del repo; si no existe, configúralo (prettier+eslint / ruff+black / php-cs-fixer / gofmt).

## 4. Seguridad (OWASP Top 10 mínimo)
- Validación de TODA entrada en servidor (schema). Salida escapada. Consultas parametrizadas/ORM (nunca concatenar SQL).
- AuthN: hash `argon2id`/`bcrypt`; JWT corto + refresh rotativo o sesión httpOnly+Secure+SameSite. AuthZ: RBAC verificado en backend por endpoint y por recurso (evitar IDOR).
- Rate limiting en login y endpoints públicos; bloqueo tras intentos fallidos.
- CORS por lista blanca desde env. Headers de seguridad (helmet/CSP, HSTS, X-Content-Type-Options).
- Uploads: validar tipo real (magic bytes), tamaño, nombre aleatorio, fuera del webroot.
- Secretos solo en env; revisa con `git grep -nE "(password|secret|api[_-]?key|token)\s*[:=]\s*['\"][^'\"]{6,}"`.
- Dependencias: auditar (`npm audit --omit=dev`, `pip-audit`, `composer audit`, `govulncheck`). Sin vulnerabilidades altas/críticas.
- CSRF si hay cookies de sesión. Nada sensible en localStorage.

## 5. Rendimiento y escalabilidad
- BD: índices para filtros/joins/orden frecuentes; evitar N+1 (eager loading / joins); paginación obligatoria en listados (cursor o limit/offset con máximo); seleccionar solo columnas necesarias.
- Caché donde el dato se lee mucho y cambia poco (con invalidación clara).
- Tareas lentas → cola/job en segundo plano. Timeouts y reintentos con backoff en llamadas externas.
- Stateless en backend (escala horizontal); sesiones/caché en Redis si hay múltiples instancias.
- Front: code-splitting por ruta, lazy de imágenes, memo donde haya re-render costoso, debounce en búsquedas, bundle vigilado.

## 6. Base de datos
- Todo cambio de esquema = **migración versionada con up y down**. Nunca editar migraciones ya aplicadas.
- Seeds para datos de catálogo y usuario admin inicial (credenciales desde env).
- Campos estándar: `id`, `created_at`, `updated_at`, `created_by`, `deleted_at` (soft delete donde aplique).
- Restricciones en BD (NOT NULL, FK, UNIQUE, CHECK), no solo en código.

## 7. Configurable y administrable
- Parámetros de negocio que cambian (umbrales, textos, catálogos, correos destino) → tabla de configuración + pantalla de administración, no hardcode.
- Feature flags para funciones nuevas riesgosas.
- Endpoints `/health` (vivo) y `/ready` (BD y dependencias ok).

## 8. Tests PRIMERO (TDD en N2/N3)
- Orden: prueba que describe el comportamiento → ejecutarla y verla fallar (rojo) → código mínimo que la pasa (verde) → limpiar. `skill_dey_verificar` marca ❌ un N2/N3 sin prueba nueva o actualizada.
- Cada función de negocio nueva/modificada → test unitario (camino feliz + bordes + error).
- Cada endpoint → test de integración (200/201, 400 validación, 401, 403, 404, 409/422).
- Bug corregido → test que lo reproduce PRIMERO (rojo) y luego verde.

## 9. Salida de F2
Lista breve de archivos tocados (ruta + qué) → pasa a F3. Sin pegar el código en el chat.
