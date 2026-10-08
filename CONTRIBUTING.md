# Contributing / Contribuir

SKILL DEY is created and maintained by **Ing. Dey** ([@IngDey](https://github.com/IngDey)). Thanks for helping make it better! / ¡Gracias por ayudar a mejorar SKILL DEY!

## Report a bug / Reportar un error

Open an [issue](../../issues) and include: / Abre un [issue](../../issues) e incluye:

- Your OS and versions of OpenCode and Node (`opencode --version`, `node --version`).
- What you asked, what you expected and what happened. / Qué pediste, qué esperabas y qué pasó.
- Any lines from `errores-guardian.log`, if it exists. / Líneas de ese archivo, si existe.

## Propose a change / Proponer un cambio

1. Fork the repo and create a branch: `git checkout -b my-improvement`.
2. Make a focused change (one idea per PR). / Un cambio enfocado (una idea por PR).
3. Run the project review on your changes before opening the PR: / Corre la revisión del proyecto sobre tus cambios antes de abrir el PR:
   ```bash
   node ~/.config/opencode/skill_dey/skill_dey.mjs revisar .
   ```
4. If you add a feature, add a row to [`docs/PRUEBAS-REALIZADAS.md`](docs/PRUEBAS-REALIZADAS.md) describing how you tested it.
5. Open the Pull Request and explain *why*, not only *what*. / Explica el *por qué*, no solo el *qué*.

## Ground rules / Reglas básicas

- Never commit secrets, `.env` files or personal paths. / Nunca subas secretos, `.env` ni rutas personales.
- Installers must stay non-destructive: back up before changing user config. / Los instaladores deben seguir siendo no destructivos: respalda antes de cambiar la configuración del usuario.
- Be kind. Spanish and English are both welcome. / Sé amable. Español e inglés son bienvenidos.
