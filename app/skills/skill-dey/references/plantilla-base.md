# App nueva — base estándar (cargar solo en modo NUEVO)

1. Stack: usa el de `PREFERENCIAS.md` (`[stack]`). Si no existe, pregunta UNA vez (backend, frontend, BD) y guárdalo con `skill_dey_leccion(tipo:"preferencia", etiquetas:"[stack]")`.
2. Entrevista breve (SKILL §3b: una ronda, máx. 7 preguntas con opciones y recomendación) → `.skill_dey/NEGOCIO.md` + "Especificación acordada" en ESTADO. Identidad visual → `.skill_dey/MARCA.md`.
3. Esqueleto mínimo que TODA app trae desde el día 1 (antes de la primera funcionalidad):
   - Config validada al arrancar + `.env.example` (base: `assets/env.example.plantilla`) + `.gitignore`.
   - Estructura por módulos (`f2-construccion.md` §1), manejo de errores y logs uniformes, `/health`.
   - Login seguro + roles/permisos administrables + usuario admin por seed (credenciales desde env).
   - Layout con sistema de diseño (tokens), estados cargando/vacío/error, responsive, modo oscuro si MARCA lo pide.
   - Pruebas: runner configurado + 1 prueba de humo por capa (API responde, login funciona, vista principal carga sin errores de consola).
   - Scripts: dev · test · lint · build · migrate · seed. README corto (instalar, variables, comandos).
   - Opcional si aplica: Docker/compose, CI (lint + test + build).
4. Verifica el esqueleto (`skill_dey_verificar(N2, cierre:true)`) ANTES de construir la primera funcionalidad pedida.
