# API contract — storefront, account, payments (for admin integration)

**Branch ownership**

| Area | Branch | Do not edit in the other branch |
| --- | --- | --- |
| Storefront, cart/checkout, `/account/*`, payment callbacks, Torob/Snapp feeds | `cursor/store-first-rebuild-04aa` | `app/admin/**` |
| Admin UI (`/admin/*`), admin server actions | `codex/admin-panel` | Storefront-only flows unless coordinating here |

This document describes **shared schema**, **HTTP routes**, and **TypeScript modules** the admin panel should call instead of reimplementing business rules.

---

## Money and forms

- **Database amounts** are stored in **Rial** (`BigInt` on `Order`, `StoreProduct`, `Payment`, etc.).
- **Staff/admin forms** typically accept **Toman** (integer strings); use `tomanToRial` / `rialToToman` from `lib/money.ts`.
- **Customer-facing UI** shows Toman via `formatToman()`.
- **Product JSON fields** (`images`, `specs`, `options`, `tags`, `blocks`) use `lib/store/catalog.ts` readers (`readSpecs`, `readOptions`, `asStringArray`) when rendering or exporting.

---

## Prisma models (commerce)

Defined in `prisma/schema.prisma` (migration `20261121000100_commerce_cms`).

### Catalog

| Model | Purpose |
| --- | --- |
| `StoreCategory` | Shop categories (`slug`, `torobName` for feeds) |
| `StoreProduct` | Products; `code` = public numeric id for Snapp; flags `torobEnabled`, `snappEnabled`, `installments` |
| `ProductVariant` | Variant rows (`values` JSON map, per-variant price/stock) |
| `ProductAttribute` | Global attribute definitions (optional admin UI) |
| `Coupon` | `type`: `percent` \| `fixed`; amounts in Rial |
| `ShippingZone` / `ShippingMethod` | Province lists + flat/per_kg/courier costs |
| `TaxRate` | `rateBp` = basis points (e.g. 900 → 9%) |

### Customers & account

| Model | Purpose |
| --- | --- |
| `Customer` | `mobile` unique; `walletRial`; `blocked` |
| `CustomerSession` | Cookie session (`ds_customer`) |
| `OtpCode` | SMS OTP hashes (not plain codes) |
| `Address`, `WishlistItem`, `WalletTransaction`, `Notification` |
| `Ticket` / `TicketMessage` | Support (`fromStaff` on messages) |
| `Comment` | Reviews; `status`: `pending` \| `approved` \| `spam` \| `trash`; `targetType` + `targetId` |

### Orders & payments

| Model | Purpose |
| --- | --- |
| `Order` | `number`, `accessKey` (guest result/invoice), `paymentStatus`, `status`, shipping snapshot fields |
| `OrderItem` | Snapshot title/price; optional `productId` / `variantId` |
| `OrderNote` | Staff/system/customer-visible notes |
| `Payment` | One row per gateway attempt; `transactionId` unique; `authority` for redirect gateways |
| `Refund` | Partial/full refunds |
| `DownloadGrant` | Digital downloads; `token` for `GET /api/download/[token]` |

**Status enums** (labels for UI): `lib/store/status.ts` — `ORDER_STATUSES`, `PAYMENT_STATUSES`, `TXN_STATUSES`, `GATEWAY_LABELS`, `TICKET_STATUSES`, `COMMENT_STATUSES`.

---

## HTTP routes (store-facing)

| Method | Path | Module | Notes |
| --- | --- | --- | --- |
| GET/POST | `/api/pay/{gateway}/callback` | `lib/payments.handleCallback` | `gateway`: `zarinpal`, `snapppay`, `torobpay`, `mock` |
| GET | `/api/download/{token}` | `app/api/download/[token]/route.ts` | Decrements `DownloadGrant.remaining` |
| POST | `/torob_api/v3/products` | `lib/feeds/torob.torobProducts` | Header `X-Torob-Token` (JWT EdDSA) |
| GET/POST | `/api/snappshop/v1/...` | `lib/feeds/snappshop` | Bearer token if `snappshop.requireToken` |

Checkout result page: `/checkout/result/{number}?k={accessKey}` (not an API).

Mock pay UI: `/pay/mock/{transactionId}` → `mockPayDecisionAction` then callback.

---

## Payment runtime (`lib/payments/index.ts`)

Admin should **not** duplicate verify/settle logic.

| Export | Use |
| --- | --- |
| `availableGateways(ctx)` | Build checkout gateway list (storefront) |
| `startPayment(order, gateway)` | Redirect URL after order created |
| `handleCallback(gateway, query)` | Callback handler (already wired to route) |
| `adminPaymentOp(paymentId, op)` | **Admin:** `settle` \| `revert` \| `cancel` \| `status` for Snapp/Torob Pay |
| `creditConfig(gateway)` | Read merged options for `snapppay` / `torobpay` |
| `recordMockDecision(tx, approved)` | Mock gateway only |

Credit gateway client: `lib/payments/credit.ts` (`CreditClient`). Zarinpal: `lib/payments/zarinpal.ts`.

**Payment row lifecycle:** `initiated` → `redirected` → `verifying` → `verified` | `settled` | `failed` | `cancelled` | `reverted`.

**Order paid path:** `markOrderPaid` in `lib/store/orders.ts` (stock reduction, download grants, notifications).

---

## Order operations (`lib/store/orders.ts`)

| Function | Admin use |
| --- | --- |
| `setOrderStatus(orderId, to, opts)` | Validates transitions via `canTransition`; optional `trackingCode`, `carrier`; may restock on cancel |
| `recordRefund(orderId, amountRial, opts)` | Updates `refundedRial`, `paymentStatus`; optional wallet credit |
| `addOrderNote(orderId, body, opts)` | `toCustomer`, `system`, `authorName` |
| `reduceStockOnce` / `restockOnce` | Usually invoked by `markOrderPaid` / cancel — avoid double calls |
| `sweepStalePendingOrders()` | Cron-style cleanup (unpaid pending) |

---

## Pricing & checkout (`lib/store/pricing.ts`, `lib/store/checkout.ts`)

- `priceOrder(input)` — subtotal, coupon, tax, shipping, wallet, total (all Rial).
- `shippingMethodsForProvince(zones, province)` — quote shipping options.
- `computeQuote` / `createOrder` — used by `placeOrderAction` in `lib/actions/shop.ts`.

**Storefront server actions** (`lib/actions/shop.ts`):

- `quoteAction`, `placeOrderAction`, `retryPaymentAction`
- `requestOtpAction`, `verifyOtpAction`, `logoutCustomerAction`
- `toggleWishlistAction`, `mockPayDecisionAction`

**Account server actions** (`lib/actions/account.ts`):

- Profile/addresses, tickets, reviews, notifications, `accountDashboardData()`

Admin panel should add its own `"use server"` actions under `lib/actions/admin/` (on `codex/admin-panel`), wrapping Prisma + the functions above.

---

## Catalog queries (`lib/store/catalog.ts`)

| Function | Purpose |
| --- | --- |
| `queryCatalog`, `getProduct`, `storeCategories` | Storefront listing/detail |
| `toCard` / `toDetail` | DTOs for UI |
| `catalogOrder(sort)` | Sort keys: `new`, `price_asc`, `price_desc`, `sales` |

**Admin list filters (suggested):** `OR` on `title`, `slug`, `sku`; paginate with `published` filter.

---

## Product feeds

### Torob (`lib/feeds/torob.ts`)

- **Options group** `torob`: `enabled`, `audience`, `publicKey` (optional override), webhook URL in admin copy.
- **POST body** (v3): pagination `page`, `sort` ∈ `TOROB_SORTS`, optional `page_unique` filters.
- **Prices** in API: **Toman** as integer (`current_price` = `Number(priceRial)/10`).
- Only `published && torobEnabled` products.
- `verifyTorobToken` — JWT `aud` must match site host.

### Snapp Shop (`lib/feeds/snappshop.ts`)

- **Options group** `snappshop`: `enabled`, `token`, `requireToken`.
- **Product id** = `StoreProduct.code` (autoincrement).
- Endpoints mirror connector: `status`, `products`, `products/{code}`, `categories`, `attributes`, `resolve?url=`.
- Only `published && snappEnabled`; stock from variants or `manageStock`.

---

## Settings groups (admin panel already uses `lib/options-schema.ts`)

Configure in **Settings**, not `.env`:

| Group id | Purpose |
| --- | --- |
| `pay_zarinpal` | `merchantId`, `sandbox`, `enabled`, titles |
| `pay_snapppay` | Credit API credentials, `mode` live/stage/mock |
| `pay_torobpay` | Same shape as Snapp Pay |
| `pay_bank`, `pay_cod`, `pay_mock` | Offline / test |
| `torob` | Feed + JWT audience |
| `snappshop` | Bearer token for catalog API |
| `sms` | OTP; use `console` in dev for visible dev codes |
| `templates` | OTP SMS template with `{code}`, `{site}` |

Read/write via existing admin settings UI (`getGroup` / `setGroup` in `lib/options.ts`).

---

## Admin implementation checklist (Codex)

1. **Products/categories/variants/coupons/shipping/taxes** — Prisma CRUD; revalidate paths `/store`, `/admin/products`, feed caches as needed.
2. **Orders** — `setOrderStatus`, `recordRefund`, `addOrderNote`; show `Payment` rows; `adminPaymentOp` for installment gateways.
3. **Customers** — `Customer` edit; wallet via `WalletTransaction` + `walletRial` consistency.
4. **Comments/tickets** — moderate `Comment.status`; ticket replies with `fromStaff: true` on `TicketMessage`.
5. **Reports** — aggregate `Order` where `paymentStatus = paid`; CSV can mirror storefront columns.
6. **Do not fork** callback URLs or Torob/Snapp route handlers — extend options only.

---

## Tests (regression on this branch)

- `tests/payments-callback.test.ts` — Zarinpal / credit / mock callbacks
- `tests/torob-pricing.test.ts` — Torob JWT + pricing mapping

Run: `npm test`, `npm run typecheck`, `npm run build`.

---

## Changelog

| Date | Branch | Note |
| --- | --- | --- |
| 2026-11-21 | `cursor/store-first-rebuild-04aa` | Initial contract after scope split; admin UI reverted from this branch |