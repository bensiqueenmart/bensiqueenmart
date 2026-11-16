# billing-desk `api/` — private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Endpoints (all in `apps/billing-desk/api/`):

- `GET /api/products` — whole catalog (all products + all combos, two
  parallel queries). UI searches/filters locally; refresh button re-fetches.
- `POST /api/orders` — create a new order. Server generates `id` + `orderNo`
  (`BQM-YYYYMMDD-XXXX`), forces `source: 'billing-desk'`, starts at status
  `pending`. No stock moves. Body: `{ orderItems, customerData? }`.
- `PATCH /api/orders/:id` — update specific attributes (`status` /
  `orderItems` / `totalPrice` / `customerData`). Crash-recovery path:
  re-assign items while still `pending` without recreating. Stock deducts
  exactly once on the transition into `paid` (same transaction as the
  status flip); repeat PATCHes are stock no-ops; item edits after
  deduction are rejected.
- `GET /api/orders?page=1&limit=50` — paginated order list, newest first.
- `GET /api/orders/:id` — fetch one order (bill reprint).

Item semantics: `quantity` is in base units (g / pcs), `price` is the line
total in paise. Combo lines (`{ comboSlug, quantity, price }`) deduct each
component product by the line quantity.

All handlers import composed methods from `@bqm/db` and types from
`@bqm/types`. No shared HTTP layer. Stock math never lives here — only in
`@bqm/db` (`applyStockChange` + the order transaction).
