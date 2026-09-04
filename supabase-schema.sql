-- ==============================================================================
-- SUPABASE SCHEMA FOR ADMIN & ORDER SYSTEM
-- Run this SQL in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('biriyani', 'mains', 'breads', 'beverages', 'sides', 'desserts')),
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    description TEXT DEFAULT '',
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. ENQUIRIES / ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT,
    delivery_landmark TEXT,
    delivery_notes TEXT,
    items TEXT NOT NULL,
    item_details JSONB,
    coupon_code TEXT,
    coupon_discount NUMERIC(10, 2),
    subtotal_price NUMERIC(10, 2),
    total_quantity INTEGER DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL,
    applicable_products JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2),
    max_discount_amount NUMERIC(10, 2),
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active menu items, offers, and coupons
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view offers" ON public.offers;
CREATE POLICY "Public can view offers" ON public.offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
CREATE POLICY "Public can view coupons" ON public.coupons FOR SELECT USING (true);

-- Allow public insert to enquiries (storefront checkout)
DROP POLICY IF EXISTS "Anyone can create enquiry" ON public.enquiries;
CREATE POLICY "Anyone can create enquiry" ON public.enquiries FOR INSERT WITH CHECK (true);

-- Allow full access for anon & authenticated roles so Next.js server actions can manage records
DROP POLICY IF EXISTS "Full access for menu items" ON public.menu_items;
CREATE POLICY "Full access for menu items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for enquiries" ON public.enquiries;
CREATE POLICY "Full access for enquiries" ON public.enquiries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for offers" ON public.offers;
CREATE POLICY "Full access for offers" ON public.offers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for coupons" ON public.coupons;
CREATE POLICY "Full access for coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA (Default Menu Items & Coupons)
-- ==============================================================================

INSERT INTO public.menu_items (id, name, category, price, description, image) VALUES
('abr-1', 'Malabar Chicken Biriyani', 'biriyani', 6.99, 'Authentic Thalassery-style aromatic Basmati rice slow-cooked with tender chicken and specialized spices.', '/malabar_biriyani.png'),
('abr-2', 'Chicken Mandi (Kuzhimanthi)', 'biriyani', 8.99, 'Fluffy smoked rice cooked over glowing charcoal with spiced chicken halves, served with spicy tomato salsa.', '/malabar_biriyani.png'),
('abr-3', 'Tandoori Grilled Chicken', 'mains', 7.49, 'Juicy, flame-grilled chicken leg quarters marinated in thick spiced yogurt and charred to perfection.', '/tandoori_chicken.png'),
('abr-4', 'Kerala Beef Fry (Ularthiyathu)', 'mains', 5.99, 'Tender beef slices slow-roasted with crushed black pepper, robust spices, and toasted coconut flakes.', '/tandoori_chicken.png'),
('abr-5', 'Classic Malabar Porotta', 'breads', 0.99, 'Flaky, multi-layered golden flatbread made from wheat dough, hand-flipped and grilled with ghee.', NULL),
('abr-6', 'Rich Vegetable Kuruma', 'breads', 3.99, 'Fresh garden vegetables simmered in a creamy, mildly spiced coconut gravy with ground cashews.', NULL),
('abr-7', 'Schezwan Chicken Noodles', 'mains', 6.49, 'Wok-tossed noodles with Shredded chicken breast, fresh cabbage, carrots, and sweet-spicy pepper sauce.', NULL),
('abr-8', 'Fresh Mint Lime Juice', 'beverages', 1.99, 'Invigorating muddled fresh mint leaves, squeezed lime, and chilled club soda.', NULL),
('abr-9', 'Sulaimani Cardamom Tea', 'beverages', 0.99, 'Traditional sweet black tea brewed with cloves, crushed green cardamoms, and a dash of lime juice.', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, active) VALUES
('coupon-1', 'WELCOME10', '10% OFF on all orders', 'percentage', 10, 5, 15, true),
('coupon-2', 'ASMAPRO', 'Flat ₹2 OFF on minimum order ₹10', 'flat', 2, 10, NULL, true)
ON CONFLICT (code) DO NOTHING;
