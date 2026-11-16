# billing-desk `api/` — private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Endpoints (all in `apps/billing-desk/api/`):

- `GET /api/products` — whole catalog (all products + all combos, two
  parallel queries). UI searches/filters locally; refresh button re-fetches.
- `POST /api/orders` — create a new order. Server generates `id` + `orderNo`
  (`BQM-YYYYMMDD-XXXX`), forces `source: 'in-store'` (`OrderSource:
  `'in-store' | 'online'`), starts at status `unconfirmed`. No stock moves.
  Body: `{ orderItems, customerData? }`.
- `PATCH /api/orders/:id` — update specific attributes (`status` /
  `orderItems` / `totalPrice` / `customerData`). Crash-recovery path:
  re-assign items while still `unconfirmed` without recreating. Entering
  `confirmed` deducts stock (`sale`); leaving `confirmed` restores the same
  lines (`restore`) — same transaction as the status flip; repeat PATCHes to
  the current status are stock no-ops; item edits after deduction are
  rejected.
- `DELETE /api/orders/:id` — permanently delete the order. Body:
  `{ restoreStock?: boolean }`. A confirmed order adds its deducted stock
  back first (`delete-restore` movements) only when `restoreStock` is true;
  otherwise stock stays as-is. Unconfirmed orders just delete. Movement rows
  are audit history and are never deleted.
- `GET /api/orders?page=1&limit=50` — paginated order list, newest first.
- `GET /api/orders/:id` — fetch one order (bill reprint).

Item semantics: product-line `quantity` matches the product's stock shape
(loose: base-unit number; quantized: `QuantizedCount[]`); `price` is the
line total in paise. Combo lines (`{ comboSlug, quantity, price }`) carry the
combo-unit count; each component deducts its shape-matched share.

All handlers import composed methods from `@bqm/db` and types from
`@bqm/types`. No shared HTTP layer. Stock math never lives here — only in
`@bqm/db` (the order transaction).
