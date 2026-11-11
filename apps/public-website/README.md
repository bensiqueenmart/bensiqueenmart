# public-website — RESERVED SLOT

Partner-owned React + Vite storefront lands here.

Expected shape (mirror the other apps when it arrives):

```
apps/public-website/
├── api/            # its own private serverless suite
│   ├── products.ts # GET catalogue (live stock, isActive only)
│   └── orders.ts   # POST WhatsApp/manual order (status: pending)
├── src/
├── index.html
├── package.json    # depends on @bqm/types (+ @bqm/db in api/)
├── tsconfig.json
└── vite.config.ts
```

Planned API needs (for later):

- `GET /api/products` — public catalogue, only `isActive` products with
  live `stockBaseQty` for availability display.
- `POST /api/orders` — create a `pending` website/WhatsApp order;
  stock is decremented later at close-out by inventory-admin,
  NOT at order creation.

Until the code arrives, this folder stays intentionally empty so there
is no throwaway scaffold to reconcile.
