# Guía para Agentes de IA en Mercadata

## Convenciones de Código
- Usar TypeScript estricto.
- Componentes en `src/components/` con React Server Components por defecto o `'use client'` cuando se use estado o interactividad.
- Scrapers y conectores en `src/lib/scrapers/`.
- Todos los precios deben calcularse con IVA incluido.
- No modificar endpoints sin actualizar `specs/` y `docs/architecture.md`.
