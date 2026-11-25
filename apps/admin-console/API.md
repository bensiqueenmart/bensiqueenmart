# admin-console `api/` — private suite

This app owns its API surface. Its UI calls ONLY these same-origin
endpoints. No other app may call them.

Every endpoint except `POST /api/auth/login` requires the admin session
cookie (see `api/_auth.ts`): single user from `ADMIN_USER`, password hash
in `ADMIN_PASS_SHA256`, cookie HMAC-signed with `AUTH_SECRET` (30min expiry).

Inventory:

- `GET /api/products` — whole catalog (products + combos, incl. inactive).
- `POST /api/products` — create a product. Non-zero opening stock writes
  one `create` movement.
- `PATCH /api/products/:slug` — edit display/pricing data. `stock` and
  `isQuantized` are rejected (stock moves only via adjust below).
- `DELETE /api/products/:slug` — hard-delete. Refused while any combo
  references the product. Orders/movements keep id-keyed history, so a
  later product reusing the slug can never inherit old rows.
- `POST /api/products/:slug/adjust` — `{ delta, reason }` with reason
  `restock` | `adjust` (`adjust` covers hand-count fixes and mistake
  corrections). Exactly one movement.
- `PATCH /api/combos/:slug` — edit display data, components, totalPrice,
  isActive.
- `POST /api/combos` — create a combo (components validated against live
  products).

Images (Cloudinary, signed uploads only — no unsigned presets):

- `POST /api/images/sign` — `{ folder?: 'products' | 'combos' }` →
  `{ cloudName, apiKey, folder, timestamp, signature }` for a direct
  browser → Cloudinary upload. Requires the admin session cookie. The
  API secret never leaves the server. Needs `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in env.

Orders (identical semantics to billing-desk):

- `GET /api/orders` + `POST /api/orders` — list newest-first / create
  (`unconfirmed`, no stock moves). Wire lines are slug-keyed
  (`productSlug` / `comboSlug`); the server resolves them to product/combo
  ids and snapshots display data at write time.
- `GET /api/orders/:id` + `PATCH /api/orders/:id` + `DELETE /api/orders/:id`
  — fetch / status+items patch with `sale`/`restore` / delete with optional
  `delete-restore`. Confirming snapshots the per-line deduction onto the
  order; unconfirming/deleting replays the snapshot (immune to later combo
  edits). Results include `missingProducts` — deducted slugs whose product
  was deleted (movement written, stock write skipped). Movements are never
  deleted.

Auth:

- `POST /api/auth/login` — `{ username, password }` → session cookie.
- `POST /api/auth/logout` — clears the session cookie.
- `GET /api/auth/me` — session probe for the lock screen.

Not yet built (dashboard spec pending): `GET /api/analytics/*`,
`GET /api/reports/*`.

All handlers import composed methods from `@bqm/db` and types from
`@bqm/types`. No shared HTTP layer.
