# admin-console `api/` — private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Every endpoint except `POST /api/auth/login` requires the admin session
cookie (see `api/_auth.ts`): single user from `ADMIN_USER`, password hash
in `ADMIN_PASS_SHA256`, cookie HMAC-signed with `AUTH_SECRET`.

Inventory:

- `GET /api/products` — whole catalog (products + combos, incl. inactive).
- `POST /api/products` — create a product. Non-zero opening stock writes
  one `create` movement.
- `PATCH /api/products/:slug` — edit display/pricing data. `stock` and
  `isQuantized` are rejected (stock moves only via adjust below).
- `POST /api/products/:slug/adjust` — `{ delta, reason }` with reason
  `restock` | `manual-adjust` | `correction`. Exactly one movement.
- `PATCH /api/combos/:slug` — edit display data, components, totalPrice,
  isActive.

Orders (identical semantics to billing-desk):

- `GET /api/orders` + `POST /api/orders` — list newest-first / create
  (`unconfirmed`, no stock moves).
- `GET /api/orders/:id` + `PATCH /api/orders/:id` + `DELETE /api/orders/:id`
  — fetch / status+items patch with `sale`/`restore` / delete with optional
  `delete-restore`. Movements are never deleted.

Auth:

- `POST /api/auth/login` — `{ username, password }` → session cookie.
- `POST /api/auth/logout` — clears the session cookie.
- `GET /api/auth/me` — session probe for the lock screen.

Not yet built (dashboard spec pending): `GET /api/analytics/*`,
`GET /api/reports/*`.

All handlers import composed methods from `@bqm/db` and types from
`@bqm/types`. No shared HTTP layer.
