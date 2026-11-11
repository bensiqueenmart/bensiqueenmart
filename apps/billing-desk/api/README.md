# billing-desk `api/` — planned private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Planned endpoints (to be implemented in the next phase):

- `GET /api/products` — searchable product list for the scan/search box
  (reads live `stockBaseQty` via `@bqm/db`).
- `POST /api/checkout` — creates an `Invoice` (source: `billing-desk`,
  status: `paid`) and atomically decrements stock via `$inc`, writing one
  `StockMovement` (reason: `sale`) per line item.
- `GET /api/invoices/:id` — reprint a digital bill.

All handlers import connection + atomic primitives from `@bqm/db`
and types from `@bqm/types`. No shared HTTP layer.
