# Spec 002: Búsqueda Inteligente y Filtros de Presentación

## Objetivo
Filtrar los resultados de búsqueda de acuerdo a atributos compuestos (`yogurt vainilla`), marcas (`harina pan`) y unidades de medida (`1lt`, `2l`, `1kg`, `500g`).

## Requerimientos
- Normalizar unidades de volumen y peso.
- Exigir coincidencia de todos los términos clave de la consulta, ignorando preposiciones/artículos comunes (`en`, `de`, `con`, etc.) como término requerido, ya que los nombres de producto los usan de forma inconsistente entre tiendas (ej. "atún **en** agua" también debe encontrar "Atún Agua Robinson").
- El match parcial por prefijo de palabras compuestas (ej. "vainill" → "vainilla") debe anclarse al inicio de una palabra del producto, nunca a mitad de una palabra no relacionada (ej. "agua" no debe matchear dentro de "Paraguaná").
- Si se indica tamaño, filtrar exclusivamente los productos con esa presentación.
- Si la búsqueda que se envía a la API/HTML de una tienda no devuelve resultados para una consulta de varias palabras (algunas tiendas, como el buscador de Central, tratan la consulta como una frase exacta), reintentar esa tienda con solo la palabra clave más distintiva de la consulta y dejar que el filtrado local (`evaluateProductMatch`) siga exigiendo todos los términos.
- En Kalea (`searchKalea`), cada palabra de la consulta debe exigirse (AND) pero puede matchear en cualquiera de las columnas `name`, `brand` o `presentation` y en cualquier orden (OR por palabra). Antes se armaba un único patrón `*palabra1*palabra2*` contra `name` únicamente, lo que perdía productos cuya marca (ej. "P.A.N.") no aparece en el nombre — una causa real de baja cobertura de resultados.
