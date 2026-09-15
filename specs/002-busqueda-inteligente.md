# Spec 002: Búsqueda Inteligente y Filtros de Presentación

## Objetivo
Filtrar los resultados de búsqueda de acuerdo a atributos compuestos (`yogurt vainilla`), marcas (`harina pan`) y unidades de medida (`1lt`, `2l`, `1kg`, `500g`).

## Requerimientos
- Normalizar unidades de volumen y peso.
- Exigir coincidencia de todos los términos clave de la consulta.
- Si se indica tamaño, filtrar exclusivamente los productos con esa presentación.
