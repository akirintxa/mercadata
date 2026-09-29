# Spec 003: Lista de Compras y Comparación de Carrito

## Objetivo
La lista de compras es el centro de la app (ruta `/`). El usuario arma lo que necesita comprar, afina cada producto por marca y presentación, y ve en cada supermercado qué producto concreto encontramos (con foto y nombre completo), cuánto cuesta y cuál es el total de su compra. La búsqueda de un solo producto sigue disponible en `/buscar`.

## Modelo de la lista
- Cada ítem (`ShoppingListItem`) tiene `id`, `name` (genérico, ej. "leche descremada"), `brand?` (ej. "La Pastoreña"), `presentation?` (ej. "1L") y `quantity` (1 a 99).
- La consulta que se envía a las tiendas es `name + brand + presentation`, así el matcher (spec 002) exige marca y tamaño en cada resultado. Un ítem sin marca ni presentación se muestra como "Sin afinar" y cada tienda aporta su opción más barata que coincida, aunque sea de otra marca.
- Persistencia en `localStorage` (`mercadata_shopping_list_v2`), sin cuenta ni backend de usuarios. Las listas guardadas en el formato anterior (`_v1`, arreglo de textos) se migran automáticamente.
- Límite de 25 productos por lista.

## Afinar un producto
- El usuario puede editar marca, presentación y cantidad de un ítem a mano, o tocar "Usar este" sobre un producto encontrado en cualquier tienda. Eso abre el editor prellenado con la marca del producto (salvo Gama, cuyo campo `brand` trae la categoría) y la presentación extraída del nombre (`extractPresentation()`), mostrando la foto y el nombre completo para que el usuario confirme.
- Al guardar un cambio que altera la consulta, solo ese ítem se vuelve a buscar. Cambiar la cantidad no requiere buscar de nuevo.

## Supermercado favorito
- El usuario puede marcar una tienda favorita (`mercadata_favorite_store_v1`). Marcarla la incluye en la selección; quitarla de la selección borra el favorito.
- El favorito aparece siempre primero y es la pestaña que se abre por defecto. Para cada producto que le falte, se indica en qué otra tienda se consigue más barato.

## API
- `POST /api/compare-list` recibe `{ items, stores?: StoreId[] }`, donde `items` es un arreglo de `{ id, query, quantity? }` o, por compatibilidad, de textos. Para cada ítem reutiliza `searchAllStores()` y devuelve en `itemResults[].options[store]` hasta 4 productos en stock por tienda, del más barato al más caro. El primero es el que se usa para el total.
- `storeTotals` suma `precio × cantidad` solo de los productos que cada tienda tiene (`foundCount`/`totalCount`, `missingItems`). Una tienda incompleta no se excluye del ranking.
- `cheapestStoreId` es la tienda que encontró más productos y, entre ellas, la de menor `totalUsd`, para no premiar a una tienda solo por tener menos productos.
- El cálculo de totales vive en `src/lib/listTotals.ts` y lo usan tanto el servidor como el cliente.

## UI (mobile-first)
- Selector compacto "Mi lista" / "Buscar producto".
- Panel plegable de supermercados con selección y estrella de favorito.
- Lista con ajuste de cantidad y edición en una hoja inferior.
- Botón fijo abajo "Comparar precios" / "Actualizar N productos".
- Resultados: tarjetas deslizables con el total por tienda (favorito primero, "Más barata" marcada) y dos vistas:
  - **Por supermercado**: la lista completa en esa tienda, con miniatura, nombre completo, precio (× cantidad) y enlace al producto.
  - **Por producto**: cada ítem con sus opciones por tienda deslizables lado a lado.
- Si un producto mostrado no coincide estrictamente con la consulta (resultado de respaldo por puntaje), se avisa "Puede no ser la misma marca o tamaño".
