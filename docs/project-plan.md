# Bensi Queen Mart — project plan & app architecture

Source of truth for how the three apps interact. Read this before touching
any app code so we don't re-explain the system each time.

Data model lives in `packages/er_diagram.md` (3 collections only). DB access
rules live at the bottom of that same file — do not divert.

## The core working

1. All three apps read and use the **same underlying `products` entity**.
2. The website and the billing software **generate and use the same `orders`
   entity** — same record shape behind both UIs.
3. The admin console manages everything: products, orders, status updates,
   analytics.

So there is one database, one set of collections, and three UIs over it.
Nothing is synced between apps — they simply talk to the same DB.

## The three apps

### 1. Website (`apps/public-website`) — simplest of the three

- Fetches **Products and Combos**, displays them for ordering, runs the
  order-establishment pipeline.
- Behind the scenes this pipeline is *the same thing* the billing software
  does — only the UI and way of operating differ; both create the same
  exact record.
- Flow:
  1. User browses products/combos, adds to cart.
  2. Hits **proceed** → backend creates an `Order` with status `pending`.
  3. User then places the order **via WhatsApp** — that is the official
     placement of the order.
  4. Shop admin sees the order id / order in their portal (admin console).
  5. Once payment is received and the order ships for delivery, the owner
     marks the status as such in the portal — **stock deduction happens
     accordingly at that point**.
- The actual website UI is being built by the partner — we don't worry
  about it for a while. We own the backend/order pipeline it will call.

### 2. Billing Software (`apps/billing-desk`) — in-store POS

- Primary use: in-store billing at the desk.
- Flow:
  1. Desk biller creates a **new order**, adds products/combos the customer
     orders.
  2. Sees their price — can use the **default price**, or add **custom
     quantity / custom price**, or **modify the price in the bill** later.
  3. Generates the bill. (It's called a bill, but it's really an order
     receipt / price-audit order thing — same `Order` record.)
  4. Once the bill is generated and brought (payment taken), the desk
     assistant **updates the status** so the backend inventory updates
     correctly (same status-driven stock deduction as the website).
- Same record creation as the website, different UI and operation style.

### 3. Admin Console (currently `apps/inventory-admin`) — owner's control room

- **Needs renaming** — it won't be just inventory. It's the software the
  shop owner uses to control *everything*:
  - Products (create, maintain, edit)
  - Combos
  - Inventory / stock
  - Order status management
  - Analytics and monthly sales reports
  - Basically any kind of edit or backend task
- This app directly handles DB data: creating and maintaining products and
  combos, managing orders, updating statuses.
- With sales + order data we build clean analytics and monthly sales report
  style outputs.
- This will be the **complex one** of the three.

## Shared order lifecycle (both website + billing desk)

```
create Order (status: pending)
        │
        ▼
  placed / paid / shipped  ← owner or desk assistant updates status
        │
        ▼
  stock deduction + StockMovement written (per the DB access rules)
```

- Website: created `pending` → official placement via WhatsApp → owner marks
  payment + shipped → stock deducts.
- Billing desk: bill generated → assistant updates status → stock deducts.
- Both write the **same `Order` record shape**; only `source` and the UI
  differ. Stock math never lives in app code — only through the shared
  `applyStockChange`-style composed methods in `packages/db`.

## Build order & goals

1. **Billing Software first** — then the **Admin Console**.
2. Primary goal up front: **solidify the backend and logical components and
   make sure the APIs work reliably first.** UI polish comes after.
3. Website backend pipeline follows the same order-creation logic once the
   partner needs it — it reuses what we've already proven with billing.

## Open items (flag, don't silently decide)

- **Combos** are referenced by all three apps but are not in the ER diagram
  yet — needs a data-model decision before coding them.
- **Exact `Order.status` values** (pending / paid / shipped / …) need
  pinning before we write the status-update endpoints.
- **Stock deduction timing** per status — confirm exactly which status flip
  triggers the deduction (currently: payment + shipped, per above).
- **Admin console folder rename** (`inventory-admin` → something like
  `admin-console`) — directory/Vercel project rename to do when green-lit.
