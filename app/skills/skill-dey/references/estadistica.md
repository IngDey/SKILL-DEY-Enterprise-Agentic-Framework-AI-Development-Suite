# ESTADÍSTICA, INDICADORES Y VISUALIZACIÓN DE DATOS — analista de datos senior

Cargar cuando la tarea incluye: dashboard, indicador/KPI, reporte, gráfica, promedio, tendencia, porcentaje, meta, proyección, consolidado, exportación de datos. Un número mal calculado es peor que no tener número.

## 1. Ficha de cada indicador (en código como constante/config + en `docs/indicadores.md`)
```
Nombre · Objetivo (qué decisión apoya) · Fórmula exacta · Unidad · Fuente (tabla/campos/filtros)
Periodicidad · Meta y umbrales (verde/amarillo/rojo, configurables) · Responsable · Tratamiento de nulos/excluidos
```
Sin ficha no se implementa el KPI. Metas y umbrales en BD/config, nunca hardcode.

## 2. Exactitud de cálculo (errores clásicos a evitar)
- **Promedio de promedios** → prohibido; usar promedio ponderado o recalcular desde el detalle.
- **Porcentajes:** definir denominador explícito; variación % = (actual − anterior) / |anterior|; si anterior = 0 → "N/A", no infinito.
- **Nulos vs ceros:** no son lo mismo; decidir y documentar. `COUNT(col)` ≠ `COUNT(*)`.
- **Fechas:** agrupar en la zona horaria del negocio (guardar UTC, convertir al agregar). Periodos semiabiertos `[inicio, fin)`. Semanas ISO. Cuidar meses incompletos al comparar.
- **Duplicados por JOIN** inflan sumas → agregar antes de unir o usar `DISTINCT` con cuidado.
- **Redondeo** solo al mostrar, nunca en pasos intermedios. Dinero en decimal/enteros, nunca float.
- **Unidades** homogéneas (litros vs galones, kg vs t) con conversión centralizada.
- **Tamaño de muestra:** mostrar `n`; con n pequeño, advertir.

## 3. Estadística a elegir según la pregunta
| Pregunta | Medida |
|---|---|
| Valor típico | Mediana (robusta) + media; con sesgo, preferir mediana |
| Dispersión | Desv. estándar, rango intercuartílico (IQR), CV |
| Atípicos | Regla IQR (Q1−1.5·IQR, Q3+1.5·IQR) o z-score >3; marcar, no borrar |
| Tiempos de respuesta/servicio | Percentiles p50/p90/p95, no solo promedio |
| Tendencia | Media móvil (7/30), regresión lineal con pendiente, comparación MoM/YoY |
| Estacionalidad/proyección | Holt-Winters o regresión con estacionalidad; mostrar intervalo, no un número exacto |
| Estabilidad de un proceso | Gráfica de control (media ± 3σ), reglas de Western Electric |
| Comparar grupos | Diferencia de medias/medianas + tamaño de muestra; pruebas (t/Mann-Whitney) solo si la decisión lo requiere |
| Relación entre variables | Correlación (Pearson/Spearman) + dispersión; nunca afirmar causalidad |
| Disponibilidad/confiabilidad | Disponibilidad %, MTBF, MTTR con definición exacta de "falla" y "tiempo operativo" |

Calcula en la BD cuando sea posible (funciones de ventana, `percentile_cont`, `GROUP BY` con índices); para análisis complejos usa la librería del stack (pandas/numpy/scipy, simple-statistics, math.js, MathPHP).

## 4. Elegir la gráfica correcta
| Mensaje | Gráfica |
|---|---|
| Evolución en el tiempo | Línea (área si es acumulado) |
| Comparar categorías | Barras horizontales ordenadas (verticales si ≤7 y hay orden natural) |
| Parte de un todo | Barras apiladas 100%; torta/dona solo con ≤5 partes |
| Distribución | Histograma / boxplot |
| Relación | Dispersión (scatter) |
| Cumplimiento vs meta | Bullet chart, barra con línea de meta, gauge solo si es 1 KPI |
| Pareto de causas | Barras ordenadas + línea acumulada % |
| Intensidad por día/hora | Heatmap |
| Un número clave | Tarjeta KPI: valor, unidad, variación vs periodo anterior (▲▼ con color semántico), sparkline, meta |

## 5. Reglas de visualización profesional
- Barras siempre desde 0. Ejes con unidad. Títulos que dicen la conclusión ("Consumo subió 12% en marzo"), subtítulo con periodo y fuente.
- Máx. 5–7 colores categóricos, paleta consistente y accesible para daltónicos; semánticos (verde/rojo) solo para bueno/malo.
- Etiquetas directas en vez de leyendas cuando sea posible. Tooltips con valor exacto, unidad y fecha.
- Formato de números por locale (es-CO: `1.234.567,89`), abreviar grandes (1,2 M), decimales consistentes.
- Sin 3D, sin sombras en gráficas, sin doble eje salvo justificación clara.
- Estados: cargando, sin datos para el filtro ("No hay registros entre 01/03 y 31/03"), error.
- Interacción: filtro de periodo global, comparar vs periodo anterior, drill-down de KPI → detalle → registro, exportar (CSV/Excel con datos crudos, PDF con la vista).
- Librerías: Apache ECharts o Chart.js (general), Recharts (React), ApexCharts; tablas grandes con virtualización.

## 6. Rendimiento de datos
Índices en columnas de fecha y filtros · vistas materializadas o tablas de resumen para históricos grandes (refresco programado) · caché con TTL por periodo · paginación y límites en consultas de detalle · nunca traer millones de filas al front para agregarlas ahí.

## 7. Pruebas de exactitud (compuerta G15)
- **Tests dorados:** dataset pequeño con resultado calculado a mano (o en hoja de cálculo) → el KPI debe dar exactamente eso.
- Casos: periodo sin datos, un solo registro, nulos, valores extremos, cambio de mes/año, zona horaria en el borde de medianoche, división por cero.
- **Conciliación:** el total del dashboard = suma del detalle = total del export.
- **G15 Datos:** fichas completas · tests dorados verdes · conciliación ok · gráficas cumplen §5.
