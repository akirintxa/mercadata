# Arquitectura de Mercadata

## Visión General

Mercadata está construido como una aplicación full-stack en **Next.js 14 (App Router)** con **TypeScript** y **Tailwind CSS**.

```
                           [ Cliente Web / UI ]
                                    │
                                    ▼
                          [ Next.js API Routes ]
                          ├── /api/search
                          └── /api/rate
                                    │
                        [ Orquestador & Matcher ]
                        ├── searchAllStores()
                        └── evaluateProductMatch()
                                    │
       ┌──────────────┬─────────────┼─────────────┬──────────────┐
       ▼              ▼             ▼             ▼              ▼
[ Central ]        [ Gama ]     [ Plaza's ]    [ Kalea ]   [ Farmatodo ]
(WooCommerce)     (SAP OCC)      (Magento)    (Supabase)     (Algolia)
```

## Componentes Clave

1. **`src/lib/searchMatcher.ts`**:
   - Normaliza cadenas, gestiona unidades métricas y evalúa la coincidencia estricta de términos y presentaciones.
2. **`src/lib/scrapers/`**:
   - Conectores individuales por tienda que transforman las respuestas nativas a un modelo unificado `Product`.
3. **`src/lib/scrapers/bcv.ts`**:
   - Proveedor de tasa de cambio oficial BCV con caché en memoria.
4. **`src/components/`**:
   - Componentes modulares interactivos para navegación, filtros, tarjetas de productos y vistas comparativas.
