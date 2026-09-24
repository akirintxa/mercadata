# Mercadata

**Mercadata** es un comparador de precios en tiempo real para los principales supermercados y farmacias de Venezuela (**Central Madeirense**, **Gama Supermercados**, **Automercados Plaza's**, **Kalea Market**, **Farmatodo** y **Rio Market**). Permite a los usuarios encontrar rápidamente qué establecimiento ofrece el precio más bajo para cualquier producto, con precios estandarizados con **IVA incluido**, conversión automática de divisas (USD / Bs. a tasa oficial BCV) y filtros inteligentes por presentación y marca.

Este repositorio se desarrolla con **Spec-Driven Development (SDD)**. Los documentos vivos están en `docs/` y `specs/`.

---

## 🚀 Características Principales

- **Comparación Multi-Tienda en Tiempo Real**: Conexión directa a las APIs y catálogos de 6 grandes cadenas de retail en Venezuela.
- **Precios con IVA Incluido**: Estandarización de precios finales al consumidor donde aplica el 16% de IVA y productos exentos (0%).
- **Ordenamiento de Menor a Mayor Precio**: Los resultados se ordenan de forma predeterminada desde el más económico al más costoso.
- **Búsqueda y Emparejamiento Inteligente**:
  - *Multi-término estricto*: `yogurt vainilla` muestra únicamente yogures de vainilla.
  - *Detección de marca*: `harina pan` identifica la marca P.A.N. y descarta panes de panadería y otras marcas.
  - *Filtro de presentación*: `coca cola 1lt` filtra exclusivamente botellas de 1 Litro (descartando 2L, 1.5L y latas).
- **Conversor de Divisas**: Visualización simultánea en **Dólares ($ USD)** y **Bolívares (Bs. VES)** con tasa oficial actualizada del Banco Central de Venezuela (BCV).
- **Vistas Duales**: Vista en cuadrícula general y vista en columnas lado a lado por supermercado.

---

## 🏬 Supermercados Integrados

| Supermercado | Plataforma / Mecanismo de Integración | Moneda Nativa | Tratamiento de IVA |
|---|---|---|---|
| **Central Madeirense** | WooCommerce Store REST API | USD | Precio final al consumidor |
| **Gama Supermercados** | SAP Commerce Cloud (Hybris OCC API) | USD (REF) | `totalWithVatPrice` (con IVA) |
| **Automercados Plaza's** | Catálogo Magento (HTML Parsing) | USD | `finalPrice` (con IVA) |
| **Kalea Market** | Supabase PostgREST API | VES | `inventory.price` (con IVA) |
| **Farmatodo** | Algolia Search Engine API | VES | `fullPrice` / `unitPrice + taxes` (con IVA) |
| **Rio Market** | Instaleap (Next.js RSC payload) | USD | `price` (con IVA) |

---

## 📋 Requisitos previos

- **Node.js**: `v18.0.0` o superior (probado en Node.js v20 / v26)
- **npm**: `v9.0.0` o superior
- Conexión a Internet para consultar las APIs de los supermercados en tiempo real.

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio o ingresar al directorio del proyecto
cd mercadata

# 2. Instalar las dependencias
npm install
```

---

## 💻 Uso

### Modo Desarrollo
Inicia el servidor local con recarga en vivo:
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Modo Producción
Compila y ejecuta el bundle optimizado:
```bash
npm run build
npm run start
```

### Endpoints de API Disponibles
- **`GET /api/search?q={termino}&stores={tiendas}&sortBy={orden}`**:
  - Parámetros:
    - `q`: Término de búsqueda (ej. `harina pan`, `leche completa`, `coca cola 1lt`).
    - `stores`: Lista separada por comas (`central,gama,plazas,kalea,farmatodo`).
    - `sortBy`: `price-asc` (menor a mayor precio, por defecto), `price-desc`, `relevance`.
- **`GET /api/rate`**:
  - Obtiene la tasa oficial BCV del día en formato JSON.

---

## 🧪 Pruebas y Verificación

```bash
# Validar tipos de TypeScript y compilación de producción
npm run build
```

---

## 📚 Documentación SDD

- [Constitución](docs/constitution.md)
- [Arquitectura](docs/architecture.md)
- [AGENTS.md](AGENTS.md)
- [Índice de specs](specs/README.md)

---

## 📄 Licencia

Desarrollado para uso personal y comunitario en Venezuela. Todos los nombres y marcas registradas pertenecen a sus respectivos comercios.
