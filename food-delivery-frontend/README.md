# Food Delivery Frontend (Vite + React + MUI)

This project implements a full frontend for your Spring Boot backend (`/api/**`) using the **same stack** as your `frontend_classEDITION` example:
- Vite + React 19 + React Router 7
- Material UI (MUI) for styling
- Axios with JWT bearer auth interceptor

## Run locally

```bash
cd food-delivery-frontend
npm install
npm run dev
```

The app expects your backend on `http://localhost:8080` and will call REST endpoints under `/api`.

## Routes

- `/` — Home (browse dishes/products, add to cart)
- `/products/:id` — Product details (add/remove to current cart)
- `/restaurants/:id` — Restaurant details + reviews (list menu via products filtered by `restaurantId`)
- `/cart` — View pending order (requires login as CUSTOMER)
- `/checkout` — **Stripe TEST ONLY flow** (see below)
- `/login`, `/register` — Auth
- `/owner/products`, `/owner/restaurants` — Basic CRUD (requires OWNER)

## Auth

- Login returns a JWT (`token`), stored in `localStorage`. Requests automatically include `Authorization: Bearer <token>`.
- Protected routes require roles from the decoded token: `CUSTOMER`, `OWNER` (and `ADMIN` if you add admins).

## Payments — Stripe TEST MODE (Simulated)

Your backend exposes payment endpoints that **simulate** a Stripe flow:

- `POST /api/payments/{orderId}/intent` → creates a Payment (status CREATED) and returns a `PaymentDto` with `id` and `provider`.
- `POST /api/payments/{paymentId}/simulate-success` → marks it `CAPTURED`
- `POST /api/payments/{paymentId}/simulate-failure` → marks it `FAILED`

The **Checkout page** calls `createIntent` and shows buttons to *Simulate success* or *Simulate failure*. On success it also calls
`PUT /api/orders/pending/confirm` to finalize the order.

If you wire real Stripe keys in the backend later, the UI can be upgraded to use `@stripe/stripe-js` and `Elements`. For now it is test-mode only.

## Mappings used

- Products (capital **P**): `/api/Products` (list), `/{id}`, `/{id}/details`, `/{id}/add-to-order`, `/{id}/remove-from-order`, `/add`, `/{id}/edit`, `/{id}/delete`
- Restaurants: `/api/restaurants/{id}`, `/add`, `/{id}/edit`, `/{id}/delete`
- Orders: `/api/orders/pending`, `/api/orders/pending/confirm`, `/api/orders/pending/cancel`
- Users: `/api/user/register`, `/api/user/login`, `/api/user/me`
- Reviews: `/api/reviews/{restaurantId}` (GET, POST with `rating` & optional `comment` query params)
- Delivery (not wired in UI): `/api/delivery/assign/{orderId}`

> Note: There's no list-all restaurants endpoint, so the Owner view derives the known restaurants from the set of products, then fetches each by id.

## Environments

- CORS: Backend allows `http://localhost:3000` (see `JwtSecurityWebConfig`). Make sure you run the frontend on port 3000.
- No env vars are required for the frontend.

## Project layout

Mirrors your example's folders (`axios/`, `contexts/`, `providers/`, `hooks/`, `repository/`, `ui/…`).

