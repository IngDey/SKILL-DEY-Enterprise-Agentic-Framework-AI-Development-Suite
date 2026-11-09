# Seguridad (cargar en N3 o cuando el pedido toque auth, datos sensibles o dinero)

`skill_dey_qa` accion:seguridad y el cierre detectan por código: página sin verificar sesión, contraseñas sin hash, formularios sin CSRF, acceso a un registro por id sin validar el dueño, subidas sin validar tipo/tamaño, debug encendido, CORS abierto a `*`, cookies sin HttpOnly/Secure, login sin límite de intentos. `skill_dey_qa` accion:probar ataca la app encendida (SQL, XSS, acceso sin sesión).

Al construir, inclúyelo de una vez (no esperes a que lo marque):
- **Sesión/permisos**: cada página o endpoint privado verifica sesión Y que el recurso pertenezca al usuario (no confíes en el id de la URL).
- **Contraseñas**: `password_hash`/`bcrypt`/`argon2`; nunca md5/sha1 ni texto plano.
- **Entradas**: validar y tipar en el servidor; consultas preparadas (parámetros), nunca concatenar datos del usuario en SQL.
- **Salida**: escapar todo lo que viene del usuario antes de imprimirlo (htmlspecialchars / escape de plantilla).
- **Formularios que cambian datos**: token CSRF.
- **Subidas**: validar tipo real (mime), tamaño y extensión; guardar fuera de la raíz web si se puede.
- **Config**: debug apagado en producción; CORS solo a los orígenes necesarios; cookies HttpOnly+Secure+SameSite; secretos en `.env`.
- **Login**: límite de intentos o espera tras varios fallos.
Nunca desactives una protección para que algo "pase". Si algo exige decisión del usuario (p. ej. abrir CORS), proponlo con la opción recomendada.
