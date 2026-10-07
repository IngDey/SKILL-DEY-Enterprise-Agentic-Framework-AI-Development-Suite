# Checklist de olvidos — lo que casi toda app necesita y nadie pide

Uso: en F1 de la iteración 1 y al cierre. Marca [x] aplica / [-] no aplica. Bajo riesgo → implementar y reportar. Alto impacto (cambia arquitectura, costos o datos) → proponer al usuario.

## Seguridad y acceso
- [ ] Login seguro, recuperación de contraseña por correo con token de un solo uso y expiración
- [ ] Roles y permisos (RBAC) administrables desde la app, no hardcode
- [ ] Rate limit + bloqueo por intentos fallidos · cierre de sesión en todos los dispositivos
- [ ] 2FA opcional (TOTP) para administradores
- [ ] Política de contraseñas · expiración de sesión por inactividad
- [ ] Auditoría (quién hizo qué, cuándo, valor anterior/nuevo) en entidades críticas

## Administración y configuración
- [ ] Panel de administración: usuarios, roles, parámetros, catálogos
- [ ] Tabla de parámetros del sistema editable (umbrales, correos, textos)
- [ ] Feature flags · modo mantenimiento
- [ ] Multi-empresa/sede (tenant) si puede crecer a eso — decidir desde el inicio
- [ ] Zona horaria configurable (guardar UTC, mostrar local) · formato de moneda/número/fecha por locale

## Datos
- [ ] Soft delete + papelera/restauración en entidades importantes
- [ ] Importar/exportar (CSV/Excel/PDF) en listados
- [ ] Búsqueda, filtros, ordenamiento y paginación del lado servidor
- [ ] Respaldos automáticos de BD + script de restauración probado
- [ ] Seeds: admin inicial, catálogos base, datos demo (separados)
- [ ] Validación de unicidad y concurrencia (bloqueo optimista con `version`/`updated_at`)

## Operación y observabilidad
- [ ] `/health` y `/ready` · logs estructurados con request-id · rotación de logs
- [ ] Captura de errores (Sentry o equivalente, por env) · métricas básicas
- [ ] Docker + docker-compose (app, BD, caché) · Makefile/scripts: `dev`, `test`, `lint`, `build`, `migrate`, `seed`
- [ ] CI (GitHub Actions/GitLab CI): lint + tests + build + audit en cada push
- [ ] Graceful shutdown · timeouts · reintentos con backoff
- [ ] Jobs programados (cron) con registro de ejecución y alertas de fallo

## Comunicación
- [ ] Notificaciones (en app / correo / push) configurables por usuario
- [ ] Plantillas de correo editables · cola de envío

## Frontend / UX
- [ ] Tema claro/oscuro · i18n preparado aunque haya un solo idioma
- [ ] Página 404/500 amigables · manejo de sesión expirada (redirigir y volver)
- [ ] Confirmación en acciones destructivas · deshacer en acciones reversibles
- [ ] Estados vacíos con llamada a la acción · skeletons de carga
- [ ] PWA / funcionamiento offline si el usuario trabaja en campo o con red inestable
- [ ] Favicon, título por página, meta tags

## Calidad y documentación
- [ ] README: requisitos, instalación, variables de entorno, comandos, despliegue
- [ ] Documentación de API (OpenAPI/Swagger) generada del código
- [ ] Versionado de API (`/api/v1`) · CHANGELOG
- [ ] Pre-commit hooks (formato + lint + escaneo de secretos)
- [ ] Licencias de dependencias compatibles

## Legal / cumplimiento (Colombia y general)
- [ ] Política de tratamiento de datos personales (Ley 1581 de 2012) · consentimiento · derecho a eliminar/exportar datos del titular
- [ ] Retención de datos y logs definida
