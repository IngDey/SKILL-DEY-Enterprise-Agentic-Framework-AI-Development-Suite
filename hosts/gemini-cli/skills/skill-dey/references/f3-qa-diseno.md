# F3 — VERIFICAR (tester robusto + diseñador profesional)

Ejecuta SOLO los bloques que la matriz de verificación (`matriz.md`, la aplica `skill_dey_verificar`) marca para las áreas tocadas; el resto se reporta N/A. Todo se EJECUTA. Lo no ejecutado se reporta como "no verificado", nunca como ✅.

## A. Verificación funcional (en este orden, parar y volver a F1 al primer bloque rojo)
1. **Estático:** formateo, lint (0 errores), typecheck (0 errores).
2. **Unitarios** del área tocada → luego **suite completa** (regresión).
3. **Integración/API:** levantar servicio (con BD de test/Docker) y probar endpoints reales (curl/httpie/supertest/pytest-httpx). Revisar códigos, cuerpo, headers, tiempos.
4. **E2E** de flujos críticos (Playwright/Cypress): login, CRUD principal, permisos, flujo de negocio clave.
5. **Build de producción** sin warnings nuevos.
6. **Seguridad:** auditoría de dependencias + escaneo de secretos + prueba manual de: inyección en campos, acceso sin token, acceso a recurso ajeno (IDOR), input gigante, caracteres especiales/unicode/emoji.
7. **Casos borde obligatorios:** vacío, nulo, un elemento, muchos (paginación), duplicado, concurrencia (doble clic/doble envío), zona horaria/fechas, decimales/moneda, textos largos, red lenta/caída, sesión expirada.
8. **Migraciones:** `up` → `down` → `up` sobre BD de prueba.
9. **Cobertura:** ≥80% en código nuevo/modificado (si el repo tiene umbral mayor, ese).

Comandos con salida filtrada; si falla, leer solo el bloque del error.

## B. Verificación visual y UX (si hay interfaz)
Tomar **screenshots reales** con Playwright en 3 anchos: 375 (móvil), 768 (tablet), 1440 (escritorio), modo claro y oscuro si existe. Revisar la imagen, no suponer.

Script mínimo (adaptar ruta/URL):
```js
// tests/visual/snap.mjs  → node tests/visual/snap.mjs http://localhost:5173/ruta
import { chromium } from 'playwright';
const url = process.argv[2]; const b = await chromium.launch();
for (const w of [375, 768, 1440]) { const p = await b.newPage({ viewport:{ width:w, height:900 } });
  const errs=[]; p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto(url, { waitUntil:'networkidle' }); await p.screenshot({ path:`.skill_dey/shots/${w}.png`, fullPage:true });
  console.log(w, errs.length ? 'CONSOLE ERRORS: '+errs.join(' | ') : 'ok'); await p.close(); }
await b.close();
```
`.skill_dey/shots/` va en `.gitignore`.

### Checklist de diseño profesional
- **Sistema de diseño:** tokens (colores, tipografía, espaciado en escala 4/8, radios, sombras) centralizados; nada de colores/px sueltos repetidos.
- **Jerarquía:** un foco principal por pantalla; títulos, subtítulos y cuerpo claramente distintos; alineación a grilla; espacio en blanco consistente.
- **Consistencia:** mismos componentes para mismas acciones (botón primario/secundario/peligro), iconografía de una sola familia.
- **Estados de cada vista/componente:** cargando (skeleton), vacío (mensaje + acción), error (mensaje útil + reintentar), éxito (feedback), deshabilitado, hover/focus/active.
- **Formularios:** labels visibles, validación en línea y en servidor, mensajes específicos, no perder datos al fallar, botón bloqueado durante envío, confirmación en acciones destructivas.
- **Responsive:** sin scroll horizontal, tablas → tarjetas o scroll contenido en móvil, targets táctiles ≥44px.
- **Accesibilidad (WCAG 2.2 AA):** contraste ≥4.5:1, navegación completa con teclado, foco visible, `alt`, roles/aria correctos, `lang`, no depender solo del color. Ejecutar axe (`@axe-core/playwright`) → 0 violaciones serias/críticas.
- **Microcopy:** claro, en el idioma del usuario, sin jerga técnica ni errores crudos.
- **Rendimiento percibido:** Lighthouse (o equivalente) en páginas clave: Performance ≥85, Accessibility ≥95, Best Practices ≥95; LCP <2.5s, CLS <0.1.
- **Consola del navegador:** 0 errores, 0 warnings nuevos; red sin 4xx/5xx inesperados.

## C. Salida de F3
Tabla corta: prueba | comando | resultado | evidencia (ruta de log/screenshot). Pasa a F4.
