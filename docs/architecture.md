# Arquitectura de Mercadata

## Visión General

Mercadata está construido como una aplicación full-stack en **Next.js 14 (App Router)** con **TypeScript** y **Tailwind CSS**.

```
                           [ Cliente Web / UI ]
                                    │
                                    ▼
                          [ Next.js API Routes ]
                          ├── /api/search
                          ├── /api/rate
                          └── /api/compare-list
                                    │
                        [ Orquestador & Matcher ]
                        ├── searchAllStores()
                        ├── compareShoppingList()
                        └── evaluateProductMatch()
                                    │
  ┌──────────┬───────────┼───────────┬──────────┬───────────┐
  ▼          ▼           ▼           ▼          ▼           ▼
[Central] [Gama]     [Plaza's]   [Kalea]   [Farmatodo] [Rio Market]
(WooComm) (SAP OCC)  (Magento)   (Supabase) (Algolia)  (Instaleap RSC)
                     ⚠ ver nota
```

> **Nota — Plaza's (`searchPlazas`)**: el sitio activó el "Managed Challenge" de Cloudflare en **todo** el dominio (incluso `robots.txt`), que requiere resolver un desafío JS en un navegador real y no puede pasarse desde un `fetch()` de servidor. El scraper detecta esto (`cf-mitigated` / 403) y lo reporta como error en `SearchResponse.errors.plazas` en lugar de devolver 0 resultados silenciosamente. No se intenta evadir la protección; mientras siga activa, Plaza's no aportará resultados.

> **Nota — Rio Market (`searchRiomarket`)**: corre sobre Instaleap (Next.js App Router) y no expone una API GraphQL pública al navegador — la propia página server-side hace esa llamada. Lo que sí es accesible es el payload de React Server Components ("Flight") de `/search?name=`, pidiéndolo con las cabeceras `rsc: 1` / `next-url: /search` como haría una navegación normal del cliente. Ese payload son líneas `<id>:<json>`; se parsean todas y se quedan los objetos que traen `name`+`price`+`sku`+`slug` juntos. Requiere fijar una sucursal vía cookies (`_IL-storeId`, `_IL-storeReference`), igual que Central/Plaza's están anclados a una sucursal física.

## Componentes Clave

1. **`src/lib/searchMatcher.ts`**:
   - Normaliza cadenas, gestiona unidades métricas y evalúa la coincidencia estricta de términos y presentaciones.
2. **`src/lib/scrapers/`**:
   - Conectores individuales por tienda que transforman las respuestas nativas a un modelo unificado `Product`.
3. **`src/lib/scrapers/bcv.ts`**:
   - Proveedor de tasa de cambio oficial BCV con caché en memoria.
4. **`src/lib/scrapers/compareList.ts`** (`compareShoppingList()`):
   - Resuelve una lista de productos (uno por uno, vía `searchAllStores()`) y calcula el total por tienda tomando el match más barato en stock por producto. Expuesto en `/api/compare-list` y consumido por `src/components/ShoppingList.tsx` (ruta `/lista`).
5. **`src/components/`**:
   - Componentes modulares interactivos para navegación, filtros, tarjetas de productos y vistas comparativas.
