# Ana2AnaFoodDelivery

Full-stack food delivery web application built for the Macedonian market.
**Stack:** Spring Boot 3 (Java 17) · React + Vite + MUI · PostgreSQL · Python ML Service (Flask)

---

## 🚀 How to Run

### Prerequisites
- Java 17+
- Node 18+
- PostgreSQL running on port 5432 with database `FoodDelivery`
- (Optional) Python 3.11 for ML recommendations

### Backend
```bash
cd food-delivery-backend

# Normal start (no seeding):
./mvnw spring-boot:run

# First-time setup — seed the database ONCE:
cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=seed"
```

After first seed, run normally. The seeder checks `userRepository.count() > 0` and skips if data already exists.

### Frontend
```bash
cd food-delivery-frontend
npm install
npm run dev
# → http://localhost:3000
```

### ML Service (optional)
```bash
cd food-delivery-backend/ml_service
python -m venv venv
venv/Scripts/activate  # Windows
pip install -r requirements.txt
python data_generator.py
python app.py  # runs on port 5002
```

---

## 👤 Default Accounts (after seeding)

| Role | Username | Password |
|------|----------|----------|
| Customer | `customer` | `customer` |
| Courier | `courier` | `courier` |
| Admin | `admin` | `admin` |
| Restaurant Owner | `owner` | `owner` |

---

## 📦 Features

### 1. Courier Assignment Algorithm
- When an order is confirmed, the assignment algorithm runs immediately.
- It ranks all active, eligible couriers by: average rating × 6 pts (max 30) + base 40 pts + small random tiebreaker.
- Couriers blocked by the customer (low rating ≤ 2) are excluded.
- The top 3 ranked couriers receive a `CourierOrderOffer` record.
- **Only those 3 couriers can see and accept the order** — other couriers are completely blind to it.
- The first courier to click "Accept" gets the order; others see it disappear.
- Race condition protection: the accept endpoint is `@Transactional` and re-checks `order.status == CONFIRMED` inside the transaction.

### 2. Customer Rating Restriction
- Customers can rate couriers after delivery: `POST /api/couriers/rate/{orderId}` with `{"rating": 4}`.
- Rating threshold: `CourierRating.LOW_RATING_THRESHOLD = 2`.
- If a customer rates a courier ≤ 2, that courier is **permanently excluded** from that customer's future orders.
- Checked inside the assignment algorithm (step 2 of ranking).

### 3. cPay / CASYS-Style Demo Payment (PRIMARY)
- Based on the official cPay Merchant Integration Specification.
- **This is a demo only — no real cards are processed or stored.**
- The checkout page shows a Macedonian payment form styled like a real cPay page.
- Fields: card number, cardholder name, expiry date, CVV, amount in МКД, merchant info.
- Simulation: any valid card → success. Card ending in `0000` → failure (demo rejection).
- Backend endpoint: `POST /api/payments/{orderId}/cpay-intent` → creates `PaymentProvider.CPAY` record.
- Callback: `POST /api/payments/{id}/cpay-callback?success=true` (simulates cPay redirect).
- In a real integration, the merchant would POST form parameters to:
  `https://www.cpay.com.mk/client/Page/default.aspx?xml_id=/mkMK/.loginToPay/`

### 4. Stripe (ALTERNATIVE)
- Still available as tab 2 on the checkout page.
- Test card: `4242 4242 4242 4242` · any future date · any CVC.
- Requires valid Stripe publishable/secret keys in CheckoutPage.jsx and PaymentServiceImpl.java.

### 5. ROLE_RESTAURANT_OWNER
- New user role added to the `Role` enum.
- Role hierarchy: ADMIN > RESTAURANT_OWNER (admin can do everything an owner can).
- Frontend: "Owner Panel" appears in the header for restaurant owner accounts.

### 6. Restaurant Owner Panel (`/owner`)
- Accessible only with `ROLE_RESTAURANT_OWNER`.
- **Tabs:**
  1. **My Restaurant** — View current info. Submit change requests (restaurant fields, add/edit/delete products).
  2. **Orders** — View anonymized orders for owned restaurants (customer shows as `CUST-xxxx`).
  3. **Change Requests** — Track status of all submitted changes (PENDING / APPROVED / REJECTED).
  4. **Analytics** — Total orders, revenue, avg order value, top products, peak hours, day-of-week breakdown.
  5. **Promotions** — Submit promotion requests (% discount, fixed МКД discount, validity window).

### 7. Admin Approval Workflow
All changes by restaurant owners require admin approval before going live.

**Admin endpoints:**
```
GET  /api/admin/owner-requests/changes/pending       — list pending change requests
POST /api/admin/owner-requests/changes/{id}/approve  — approve (applies changes to DB)
POST /api/admin/owner-requests/changes/{id}/reject   — reject with { "reason": "..." }

GET  /api/admin/owner-requests/promotions/pending    — list pending promotions
POST /api/admin/owner-requests/promotions/{id}/approve
POST /api/admin/owner-requests/promotions/{id}/reject
```

### 8. DataInitializer — Manual Seeding Only
- Changed from `@Profile("!test")` to `@Profile("seed")`.
- No longer runs automatically on normal startup.
- Idempotent: checks `userRepository.count() > 0` and skips if data exists.
- Run once: `./mvnw spring-boot:run -Dspring-boot.run.profiles=seed`

---

## 🗄️ Database Schema (new tables)

| Table | Purpose |
|-------|---------|
| `courier_order_offers` | Records which couriers were offered which orders by the algorithm |
| `courier_ratings` | Customer → courier ratings (used for exclusion logic) |
| `restaurant_owners` | Maps User(RESTAURANT_OWNER) to their list of restaurants |
| `owner_restaurant_map` | Join table for owner ↔ restaurant many-to-many |
| `owner_change_requests` | Pending restaurant/product change requests |
| `promotion_requests` | Pending promotion/discount requests |

---

## 📡 New API Endpoints

### Courier
```
GET  /api/couriers/my-available-orders      — orders offered to this courier by algorithm
POST /api/couriers/rate/{orderId}           — body: {"rating": 4}  — customer rates courier
```

### Payments
```
POST /api/payments/{orderId}/cpay-intent         — create cPay demo payment
POST /api/payments/{id}/cpay-callback?success=   — simulate cPay redirect callback
```

### Restaurant Owner
```
GET  /api/owner/my-restaurants
POST /api/owner/restaurants/{id}/change-request
POST /api/owner/restaurants/{id}/products/add-request
POST /api/owner/restaurants/{id}/products/{pid}/edit-request
DELETE /api/owner/restaurants/{id}/products/{pid}/delete-request
GET  /api/owner/my-change-requests
POST /api/owner/restaurants/{id}/promotions
GET  /api/owner/orders
GET  /api/owner/analytics/{restaurantId}
```

### Admin — Owner Requests
```
GET  /api/admin/owner-requests/changes/pending
POST /api/admin/owner-requests/changes/{id}/approve
POST /api/admin/owner-requests/changes/{id}/reject
GET  /api/admin/owner-requests/promotions/pending
POST /api/admin/owner-requests/promotions/{id}/approve
POST /api/admin/owner-requests/promotions/{id}/reject
```

---

## 🤖 ML Recommendations (existing)
The existing Python service on port 5002 handles:
- Content-based recommendations (TF-IDF on product descriptions)
- RFM customer segmentation
- Cross-sell recommendations
- Time-based recommendations
- Sentiment analysis

---

## 🧪 Testing Scenarios

1. Seed DB: `./mvnw spring-boot:run -Dspring-boot.run.profiles=seed`
2. Login as `customer` → place and confirm an order → check `courier` dashboard only shows that order
3. Login as second courier → verify they also see the order (both were offered)
4. First courier clicks "Accept" → second courier's list empties
5. Customer rates courier ≤ 2 → that courier is excluded from next order's offers
6. Login as `owner` → view restaurant info → submit a change request → login as `admin` → approve it
7. Checkout with cPay form → use card ending in `1234` (success) vs `0000` (failure)
8. Restart app without `seed` profile → DB remains populated
