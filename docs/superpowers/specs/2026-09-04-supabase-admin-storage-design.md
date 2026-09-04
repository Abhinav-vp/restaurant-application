# Supabase Admin Panel Storage Design Spec

**Date:** 2026-09-04  
**Status:** Approved  
**Author:** Antigravity  

## Objective
Migrate the admin panel storage from browser `localStorage` to persistent cloud tables in Supabase (`menu_items`, `enquiries`, `offers`, `coupons`), with Next.js Server Actions handling data mutations, server-side authentication verification, and graceful fallbacks.

## Architecture

### 1. Database Layer (PostgreSQL on Supabase)
Four dedicated tables:
- **`menu_items`**: Menu catalog items (name, price, category, description, image, timestamps).
- **`enquiries`**: Customer orders received via online storefront (order_id, status, customer_name, customer_phone, delivery_address, delivery_landmark, delivery_notes, items, item_details JSONB, coupon_code, coupon_discount, subtotal_price, total_quantity, total_price, created_at).
- **`offers`**: Active discounts applied to menu products (title, description, discount_type, discount_value, applicable_products, active).
- **`coupons`**: Discount vouchers (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, active).

### 2. Security & Access Control
- Tables protected with Row-Level Security (RLS).
- Public Read for `menu_items`, `offers`, and `coupons`.
- Public Insert for `enquiries` so checkout works smoothly.
- Server-side admin operations perform authentication check using `verifyAdminSessionToken` on the `admin-auth` cookie.
- Supabase client on server uses `SUPABASE_SERVICE_ROLE_KEY` if provided in `.env.local` to bypass RLS, or fallback to `NEXT_PUBLIC_SUPABASE_ANON_KEY` with permissive RLS policies.

### 3. Server Actions Layer
- `src/app/actions/admin-actions.ts`:
  - `fetchMenuItemsAction`, `createMenuItemAction`, `updateMenuItemAction`, `deleteMenuItemAction`
  - `fetchEnquiriesAction`, `updateOrderStatusAction`, `deleteEnquiryAction`, `clearAllEnquiriesAction`
  - `fetchOffersAction`, `createOfferAction`, `updateOfferAction`, `deleteOfferAction`, `toggleOfferAction`
  - `fetchCouponsAction`, `createCouponAction`, `updateCouponAction`, `deleteCouponAction`
- `src/app/actions/order-actions.ts`:
  - `submitOrderAction(orderData)`: Public server action for customer checkout on `/` and `/menu`.

### 4. Admin Dashboard UI (`dashboard-client.tsx`)
- Reads initial data asynchronously via Server Actions instead of `localStorage.getItem`.
- Uses React state for instant optimistic updates.
- Executes Server Actions on mutations (Create, Update, Delete).
- Replaces direct `localStorage.setItem` with remote persistence.
- Handles loading and error feedback gracefully.

### 5. Storefront Pages (`/`, `/menu`, `restaurant-data.ts`)
- Loads menu items, offers, and coupons from Supabase.
- When placing orders, sends order data to Supabase `enquiries` table via `submitOrderAction`.
