# inventory-admin `api/` — planned private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Planned endpoints (to be implemented in the next phase):

- `GET /api/products` + `POST /api/products` + `PATCH /api/products/:id` —
  catalogue CRUD (pricing, variants, `isActive`).
- `POST /api/products/:id/adjust` — overwrite / increment stock safely
  (atomic `$inc` or `$set` + `StockMovement` with reason
  `manual-adjust` / `restock` / `correction`).
- `GET /api/orders?status=pending` + `POST /api/orders/:id/close` —
  manually match up and close completed WhatsApp orders (decrements stock,
  flips invoice to `paid`, writes `whatsapp-order-closeout` movements).
- `GET /api/reports/*` — stock / sales summaries.

All handlers import connection + atomic primitives from `@bqm/db`
and types from `@bqm/types`. No shared HTTP layer.
