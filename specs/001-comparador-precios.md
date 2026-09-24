# Spec 001: Comparador de Precios Multi-Tienda

## Objetivo
Permitir a los usuarios buscar un producto en 6 supermercados de Venezuela y ordenar los resultados de menor a mayor precio con IVA incluido.

## Requerimientos
- Integrar Central Madeirense, Gama, Plaza's, Kalea, Farmatodo y Rio Market.
- Estandarizar IVA (16%) y exenciones (0%).
- Obtener tasa oficial del BCV.
- Ordenar por defecto por `price-asc`.
- Un producto sin stock (`inStock: false`) nunca debe ganar como "más barato" ni aparecer por encima de uno disponible en ningún criterio de orden (`price-asc`, `price-desc`, `relevance`): se ordena siempre disponibilidad primero, y el criterio elegido como desempate. Esto evita mostrar como "mejor precio" un precio de catálogo que en la práctica no se puede comprar (ej. productos agotados de Farmatodo con precios desactualizados).
- Si una tienda falla al buscar (error de red, bloqueo del sitio, etc.), debe reportarse en `SearchResponse.errors` y mostrarse en la UI (filtro de tiendas) en lugar de mostrarse silenciosamente como "0 resultados", para no confundir "la tienda no tiene el producto" con "no se pudo consultar la tienda".
