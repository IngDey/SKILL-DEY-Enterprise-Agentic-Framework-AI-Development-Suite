# DISEÑO — director de arte + diseñador UI/UX senior

Cargar cuando se crea o rediseña una vista, componente visual, dashboard, reporte imprimible o cuando el usuario habla de cómo se ve algo. Objetivo: que parezca hecho por un estudio profesional, no una plantilla genérica.

## 1. Identidad visual del proyecto (una vez, en `.skill_dey/MARCA.md`)
Si no existe, dedúcela (logo, CSS existente, colores corporativos) o pregunta en 1 mensaje: color principal, logo, tono (sobrio/corporativo, moderno, técnico, amigable). Guarda:
```
Primario: #…  Secundario: #…  Acento: #…   Neutros: escala 50–950
Tipografía: títulos … / cuerpo … / números tabulares …
Radio: …  Densidad: compacta|normal   Tono: …   Modo oscuro: sí/no
Librería UI: …   Iconos: …
```
Todas las vistas usan esto. Nunca inventes una paleta distinta por pantalla.

## 1b. Dirección visual explícita (antes de diseñar)
Elige y declara en 1 línea una dirección coherente con la marca y el negocio, p. ej.: *industrial sobria* (grises cálidos, acento de marca, datos protagonistas), *editorial limpia*, *técnica densa* (paneles compactos), *moderna cálida*. Todo lo visual se decide contra esa dirección.

## 2. Sistema de diseño (tokens centralizados, nada suelto)
- **Color:** primario + 9 tonos (50–900), neutros de 11 pasos, semánticos (éxito, alerta, error, info) con versión fondo suave y texto. Contraste AA verificado. Modo oscuro con tokens propios, no invertido.
- **Tipografía:** escala modular (12/14/16/18/20/24/30/36/48). Máx. 2 familias. Interlineado 1.4–1.6 cuerpo, 1.1–1.25 títulos. Números en tablas/KPIs con `font-variant-numeric: tabular-nums`. Longitud de línea 60–80 caracteres.
- **Espaciado:** escala de 4px (4, 8, 12, 16, 24, 32, 48, 64). Mismo espacio entre elementos del mismo tipo.
- **Elevación:** 3 niveles de sombra como máximo. **Radios:** 1 valor base + completo para píldoras.
- **Movimiento:** 150–250ms, ease-out; respetar `prefers-reduced-motion`.
- Implementar como variables CSS / tema Tailwind / tema de la librería UI.

Librerías sugeridas (respeta la que ya exista): React → shadcn/ui + Tailwind · Vue → PrimeVue/Vuetify/Naive · Angular → Angular Material/PrimeNG · PHP/HTML → Bootstrap 5 o Tailwind con tema propio · Gráficas → ver `estadistica.md`.

## 3. Patrones por tipo de pantalla
- **Login:** centrado, logo, 2 campos, mostrar contraseña, recordar, error claro sin revelar cuál dato falló.
- **Listado/CRUD:** barra superior (título + acción primaria a la derecha) → filtros/búsqueda → tabla con encabezado fijo, orden, paginación, acciones por fila en menú, selección múltiple para acciones masivas, exportar. Móvil: tarjetas.
- **Formulario:** 1 columna (2 en escritorio si son campos cortos relacionados), agrupar en secciones con título, obligatorios marcados, ayuda bajo el campo, botón primario abajo a la derecha, "Cancelar" secundario.
- **Detalle:** encabezado con estado (badge) y acciones; información en secciones/tabs; historial/auditoría al final.
- **Dashboard:** fila de KPIs arriba (máx. 4–6) → gráficas principales → tablas de detalle. Filtro de periodo global visible. Ver `estadistica.md`.
- **Estados:** skeleton al cargar, vacío con ilustración/ícono + texto + acción, error con reintentar, éxito con toast (3–5s), confirmación modal en destructivas.

## 4. Anti-patrones (prohibidos)
**Look genérico de IA:** tipografía por defecto sin intención (Inter/Roboto/Arial/fuentes del sistema como única opción), degradado morado sobre blanco, tarjetas idénticas en grilla sin jerarquía, héroe centrado con botón genérico, íconos decorativos sin función, sombras suaves en todo. Usa una tipografía con carácter para títulos + una legible para cuerpo, un color dominante con un acento fuerte, profundidad en fondos/superficies, y movimiento solo con propósito.
Degradados morados genéricos · emojis como íconos · sombras exageradas · todo centrado · más de 3 pesos tipográficos · colores fuera de tokens · botones primarios múltiples en una vista · texto gris claro ilegible · tablas sin alineación (números a la derecha, texto a la izquierda) · íconos de familias mezcladas · modales sobre modales · placeholders como labels · layouts que saltan al cargar (CLS).

## 5. Revisión visual con rúbrica (obligatoria en vistas nuevas/rediseños)
Screenshots 375/768/1440 (+ oscuro si aplica). Califica 1–10 cada criterio mirando la imagen:

| Criterio | Pregunta |
|---|---|
| Jerarquía | ¿Se entiende en 3 segundos qué es lo principal? |
| Consistencia | ¿Todo usa tokens y componentes del sistema? |
| Espaciado/alineación | ¿Grilla limpia, espacios uniformes, nada desalineado? |
| Tipografía | ¿Escala clara, legible, números tabulares? |
| Color/contraste | ¿Paleta de marca, AA, semánticos correctos? |
| Responsive | ¿Móvil usable sin scroll horizontal ni textos cortados? |
| Estados | ¿Cargando, vacío, error, éxito resueltos? |
| Pulido | ¿Hover/focus, transiciones, íconos, microcopy? |

**Compuerta G14 Diseño:** todos ≥8 y promedio ≥8.5. Lo que baje de 8 vuelve a F2 con la corrección concreta. Guarda la puntuación en BITACORA.
Comparación antes/después: si es rediseño, guarda `shots/antes-*.png` y `shots/despues-*.png` y confirma que no se perdió nada funcional.

## 6. Reportes imprimibles / PDF
Encabezado con logo y datos del reporte (título, periodo, fecha de generación, usuario), pie con numeración "Página X de Y", márgenes 15–20mm, tablas que no se parten a mitad de fila, repetir encabezado de tabla en cada página, `@media print` que oculta navegación y botones.
