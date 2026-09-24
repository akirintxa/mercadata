# Spec 003: Lista de Compras y Comparación de Carrito

## Objetivo
Permitir a los usuarios armar una lista de varios productos y saber en qué supermercado conviene más comprarla, tanto en conjunto (total por tienda) como producto por producto.

## Requerimientos
- El usuario puede agregar/quitar productos de una lista, persistida en `localStorage` del navegador (sin cuenta ni backend de usuarios).
- `POST /api/compare-list` recibe `{ items: string[], stores?: StoreId[] }` y, para cada producto, reutiliza el mismo pipeline de búsqueda y emparejamiento (`searchAllStores` / `evaluateProductMatch`) que `/api/search`, tomando el resultado más barato en stock por tienda. Si no se envía `stores`, se comparan todas.
- La selección de tiendas se comparte y persiste (vía `src/lib/storeSelection.ts`, `localStorage`) entre la búsqueda individual (`/`) y la lista de compras (`/lista`): ambas páginas muestran el mismo `StoreFilter` y restauran la última selección al montar.
- En la tabla de desglose por producto, cada precio encontrado es un link al producto real en la tienda (`product.productUrl`), igual que el botón "Ver" de la búsqueda individual.
- Por cada tienda se calcula un total (`totalUsd`/`totalVes`) sumando únicamente los productos que esa tienda sí tiene (`foundCount`/`totalCount` y `missingItems` para transparencia). Una tienda que no tiene todos los productos **no** se excluye del ranking de "más barata": todas compiten con lo que sí tienen disponible.
- La tienda con el `totalUsd` más bajo entre las que encontraron al menos un producto se marca como `cheapestStoreId`.
- La UI (`/lista`) muestra el ranking de totales por tienda y una tabla de desglose por producto indicando el precio en cada tienda y cuál es el más barato para ese producto puntual.
- Límite de 25 productos por lista para evitar listas abusivas (se recorta silenciosamente).
