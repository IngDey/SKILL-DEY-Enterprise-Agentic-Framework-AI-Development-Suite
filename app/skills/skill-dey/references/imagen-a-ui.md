# IMAGEN → INTERFAZ FUNCIONAL (bocetos en papel, Paint, Excel, capturas, mockups)

Cargar cuando el usuario menciona una imagen, boceto, dibujo, foto, captura, "el diseño que está en el proyecto", "como en la imagen", o adjunta/pega una imagen. Meta: entender el dibujo como lo haría un diseñador humano y convertirlo en una vista **profesional y funcional**, no en una copia torpe.

## 0. Regla de oro
**Prohibido decir "no puedo leer imágenes".** Siempre `skill_dey_imagen` primero. Si falla, aplica la cadena de respaldo (§2) y solo después informa.

## 1. Localizar la imagen (sin preguntar si se puede deducir)
1. Si la pegó/adjuntó en el chat → úsala directamente.
2. Si dice un nombre → búscalo. Si no, busca en el proyecto:
   `find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.gif" -o -iname "*.svg" -o -iname "*.pdf" -o -iname "*.xlsx" -o -iname "*.xls" -o -iname "*.heic" \) -not -path "*/node_modules/*" -not -path "*/vendor/*" -not -path "*/dist/*" -not -path "*/.git/*" -printf "%T@ %p\n" | sort -rn | head -15`
3. Elige por coincidencia con lo pedido (nombre, carpeta `diseños/`, `mockups/`, `bocetos/`, `docs/`) o la más reciente. Solo pregunta si hay empate real, mostrando la lista numerada.

## 2. Leer la imagen
**Paso único obligatorio:** `skill_dey_imagen(ruta)`. Sabe si tu modelo ve imágenes (según OpenCode), y si no, te indica delegar al subagente `skill_dey-vision` (modelo con visión elegido por el instalador) o te entrega el Excel leído exacto / OCR. Lo de abajo es respaldo manual.

### Respaldo manual
1. `read <ruta>` (OpenCode entrega la imagen al modelo si tiene visión).
2. Si el formato no es compatible (bmp, heic, tiff, gif animado) o pesa mucho → convertir y reducir, luego `read` de nuevo:
   `python -c "from PIL import Image; im=Image.open('IN'); im.thumbnail((1600,1600)); im.convert('RGB').save('.skill_dey/maquetas/tmp.png')"` (o `magick IN -resize 1600x1600\> .skill_dey/maquetas/tmp.png`).
   PDF → `pdftoppm -png -r 110 IN .skill_dey/maquetas/pag`.
3. Foto de papel torcida/oscura → mejorar antes de leer: escala de grises, contraste, enderezar (`magick IN -colorspace gray -normalize -deskew 40% OUT`).
4. **Excel (.xlsx) no necesita visión:** leer estructura con `openpyxl`: celdas con texto, celdas combinadas (= bloques/áreas), colores de relleno (= zonas/colores), bordes (= cajas/tablas), anchos de columna (= proporciones). Convertirlo en una grilla de layout.
5. Si el modelo **no tiene visión** (la lectura devuelve error de modalidad o nada útil): dilo en 1 línea — *"El modelo actual no ve imágenes; cambia a uno con visión con `/models` (Claude, GPT-4o/4.1/5, Gemini)"* — y mientras tanto extrae lo posible: OCR `tesseract IN - -l spa` (textos/labels) + detección de rectángulos con OpenCV para la estructura. Marca el resultado como "aproximado".

## 3. Interpretar como diseñador (no copiar literal)
Detecta el **tipo de fuente**:
- **Boceto/Paint/Excel/papel** → es un *wireframe*: las líneas torcidas son cajas rectas, los garabatos son texto de relleno, los colores de Paint son intención, no el color final. **Profesionaliza** con el sistema de diseño (`diseno.md`, `.skill_dey/MARCA.md`).
- **Mockup de alta fidelidad / Figma / captura de otra app** → **fidelidad alta**: respetar distribución, proporciones, colores y tipografía lo más exacto posible.

Escribe la **especificación** en `.skill_dey/maquetas/<nombre>.md` (breve):
```
Fuente: ruta · Tipo: boceto | alta fidelidad · Pantalla: …
Regiones (arriba→abajo, izq→der): encabezado[logo, título, usuario] · menú lateral[…] · contenido[…]
Componentes: #  | tipo (input, select, tabla, tarjeta KPI, gráfica, botón…) | texto/label | dato (tipo, obligatorio) | acción
Anotaciones del usuario (flechas, notas "aquí va…", tachones): …
Navegación/acciones: botón X → abre/guarda/filtra …
Dudas resueltas con supuesto: …
```
Reglas de interpretación: flechas y notas al margen son **instrucciones**, no elementos visibles · tachado = no va · "x" en una caja = imagen/ícono · líneas onduladas = texto · cuadros con líneas internas = tabla · círculo relleno/vacío = radio/check · caja con ▼ = select · números sueltos = KPI/contador.

## 4. Construir funcional (no solo visual)
- Componentes del sistema de diseño, responsive (el boceto suele ser de escritorio: diseña también la versión móvil).
- Cada campo con tipo, validación y conexión real al backend/BD; cada botón con su acción; tablas con datos reales, paginación y estados (cargando/vacío/error).
- Lo que el dibujo no especifica → decide con criterio profesional y anótalo en "supuestos".

## 5. Verificar fidelidad (compuerta G16)
1. Screenshot de la vista construida (1440 y 375).
2. Mira **original y resultado juntos** y recorre la lista de componentes de la especificación: cada uno presente, en el orden/ubicación correcta, con su texto.
3. **G16 Fidelidad:** 100% de los componentes y anotaciones cumplidos · orden y distribución equivalentes en escritorio · (alta fidelidad) colores/tipografía/espaciados equivalentes · + rúbrica de diseño G14.
4. Reporte: tabla corta componente → ✅/ajustado (motivo) y rutas de las capturas `.skill_dey/shots/`.
