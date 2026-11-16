# Bensi Queen Mart — data model

```mermaid
erDiagram
    PRODUCT {
        string id
        string slug
        string name
        string tamilName "optional"
        string image "optional"
        string description
        string category
        boolean isQuantized
        string stockUnit
        object stock "loose: number base units | quantized: json array of {size, count} buckets (the buckets ARE the stock)"
        number pricePerUnit "optional"
        object quantityPrice "json array of quantity and price"
        date createdAt
        date updatedAt
    }

    ORDER {
        string id
        string orderNo
        string source "online, in-store"
        string status
        number totalPrice
        object customerData "{ customerName, mobile, fullAddress }"
        object orderItems "[{ productSlug?, comboSlug?, quantity, price }] — product-line quantity matches the product stock shape (loose: number base units | quantized: [{size, count}]); combo-line quantity is the combo-unit count (number)"
        date createdAt
        date updatedAt
    }

    COMBO {
        string id
        string slug
        string name
        string tamilName "optional"
        string description
        boolean isActive
        array products "array of { productSlug, name, tamilName?, quantity } — productSlug is the join key; names are display snapshots; quantity matches the component stock shape (loose: number base units per combo unit | quantized: [{size, count}])"
        number totalPrice
        date createdAt
        date updatedAt
    }

    STOCK_MOVEMENT {
        string id
        string productSlug
        string reason
        string orderId "optional"
        date createdAt
        number quantity "- to + units"
    }
```

## DB access rules (do not divert)

Cost model: connections are cached per warm function (connect once per cold
start). The real cost is network round-trips (~5–20ms each to Atlas). So:
one button = one composed method, never chatty N-call loops.

Three layers:

1. `packages/db` — composed methods that encode INVARIANTS, not generic CRUD.
   No `createProduct / updateProduct / deleteProduct` zoo. A method lives here
   only if it must be atomic or is needed by 2+ apps
   (e.g. `applyStockChange`, `createOrder`, shared reads like
   `getProductBySlug` / `listActiveProducts`).
2. `apps/*/api/` — endpoint = one button. Calls at most one composed
   write-method plus bulk reads, then shapes the response. App-specific flows
   live here but never reimplement stock/audit math.
3. Rules:
   - Any write touching `stock` goes through `applyStockChange`. Hard rule.
   - Never N+1: no per-item loop of DB calls — `bulkWrite` or one transaction.
   - Fetch lists in one call and filter in memory (hundreds of products, not
     millions) instead of per-item lookups.
