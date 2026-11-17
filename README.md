# Bensi Queen Mart — retail ecosystem monorepo

Software ecosystem for a retail nuts, spices, and groceries store:
public catalogue website, in-store billing/POS terminal, and owner
admin console — all sharing one MongoDB Atlas database.

## Layout

```
├── apps/
│   ├── public-website/    # RESERVED — partner's React+Vite code lands here
│   ├── billing-desk/      # POS terminal (Vite React-TS scaffold)
│   └── admin-console/     # owner admin console (Vite React-TS scaffold)
└── packages/
    ├── types/             # @bqm/types — Product, Invoice, StockMovement…
    └── db/                # @bqm/db — STUB; connection + $inc primitives next
```

## API ownership model

> Every product owns a private, complete API suite. Nothing is shared
> at the HTTP level. Sharing happens only at the library level.

- Each app's UI calls **only its own same-origin `/api/*`** endpoints in
  its own `apps/<app>/api/` folder.
- Common code — Mongo connection, typed collections, atomic stock
  primitives (`$inc`) — lives in `@bqm/db` as importable library code.
- Shared shapes live in `@bqm/types`.
- See each `apps/<app>/api/README.md` for that app's planned suite.

## Data invariants

- Stock (`stock`) changes ONLY via atomic ops — never read-modify-write.
- Exactly ONE `StockMovement` audit doc per stock change.
- Money is stored in rupees (number, 2-decimal rounded). Quantities stay in base units.

## Local dev

```bash
npm install
npm run build:packages
npm run dev --workspace apps/billing-desk
npm run dev --workspace apps/admin-console   # :5174
```

## Vercel deployment (3 projects, 1 repo)

Create three Vercel projects from this repo, one per app:

| Project | Root Directory | Env vars |
|---|---|---|
| `bqm-website` | `apps/public-website` | `MONGODB_URI`, `MONGODB_DB` |
| `bqm-billing` | `apps/billing-desk` | same |
| `bqm-admin` | `apps/admin-console` | same |

Enable "Include files outside of the Root Directory" (or equivalent)
so `packages/*` workspace deps build. Each project's `api/` dir deploys
as its serverless endpoints automatically.

## Roadmap

1. ✅ Skeleton (this commit): workspaces, types, db stub, app shells.
2. Next: wire `@bqm/db` (Atlas client, typed collections, `$inc` helpers).
3. Next: first real endpoints per `api/README.md` roadmaps.
