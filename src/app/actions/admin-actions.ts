'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyAdminSessionToken } from '@/lib/auth-security';
import { getSupabaseServerClient } from '@/lib/supabase/server-admin';
import { MenuItem, Offer, Coupon, Enquiry, OrderStatus, MENU_ITEMS, DEFAULT_COUPONS } from '@/lib/restaurant-data';

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth')?.value;
  return await verifyAdminSessionToken(token);
}

// ==========================================
// MENU ITEMS ACTIONS
// ==========================================

export async function fetchMenuItemsAction(): Promise<{ success: boolean; data: MenuItem[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchMenuItemsAction error:', error.message);
      return { success: false, data: MENU_ITEMS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: MENU_ITEMS };
    }

    const items: MenuItem[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      description: row.description || '',
      image: row.image || undefined,
    }));

    return { success: true, data: items };
  } catch (err: any) {
    return { success: false, data: MENU_ITEMS, error: err?.message || 'Failed to fetch menu items' };
  }
}

export async function createMenuItemAction(item: MenuItem): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized: Admin session required' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('menu_items').insert([{
      id: item.id || `menu-${Date.now()}`,
      name: item.name,
      category: item.category,
      price: item.price,
      original_price: item.originalPrice || null,
      description: item.description || '',
      image: item.image || null,
    }]);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create menu item' };
  }
}

export async function updateMenuItemAction(id: string, item: Partial<MenuItem>): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized: Admin session required' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const updatePayload: Record<string, any> = {};
    if (item.name !== undefined) updatePayload.name = item.name;
    if (item.category !== undefined) updatePayload.category = item.category;
    if (item.price !== undefined) updatePayload.price = item.price;
    if (item.originalPrice !== undefined) updatePayload.original_price = item.originalPrice;
    if (item.description !== undefined) updatePayload.description = item.description;
    if (item.image !== undefined) updatePayload.image = item.image || null;

    const { error } = await supabase
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update menu item' };
  }
}

export async function deleteMenuItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized: Admin session required' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete menu item' };
  }
}

// ==========================================
// ENQUIRIES / ORDERS ACTIONS
// ==========================================

export async function fetchEnquiriesAction(): Promise<{ success: boolean; data: Enquiry[]; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, data: [], error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchEnquiriesAction error:', error.message);
      return { success: false, data: [], error: error.message };
    }

    const enquiries: Enquiry[] = (data || []).map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      status: row.status as OrderStatus,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      deliveryAddress: row.delivery_address || undefined,
      deliveryLandmark: row.delivery_landmark || undefined,
      deliveryNotes: row.delivery_notes || undefined,
      items: row.items,
      itemDetails: row.item_details || undefined,
      couponCode: row.coupon_code || undefined,
      couponDiscount: row.coupon_discount ? Number(row.coupon_discount) : undefined,
      subtotalPrice: row.subtotal_price ? Number(row.subtotal_price) : undefined,
      totalQuantity: row.total_quantity || 1,
      totalPrice: Number(row.total_price),
      createdAt: row.created_at,
    }));

    return { success: true, data: enquiries };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Failed to fetch enquiries' };
  }
}

export async function updateOrderStatusAction(id: string, newStatus: OrderStatus): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('enquiries')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update order status' };
  }
}

export async function deleteEnquiryAction(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('enquiries').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete enquiry' };
  }
}

export async function clearAllEnquiriesAction(): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    // Delete all rows where id is not empty
    const { error } = await supabase.from('enquiries').delete().neq('id', '');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to clear enquiries' };
  }
}

// ==========================================
// OFFERS ACTIONS
// ==========================================

export async function fetchOffersAction(): Promise<{ success: boolean; data: Offer[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchOffersAction error:', error.message);
      return { success: false, data: [], error: error.message };
    }

    const offers: Offer[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      discountType: row.discount_type as 'percentage' | 'flat',
      discountValue: Number(row.discount_value),
      applicableProducts: Array.isArray(row.applicable_products) ? row.applicable_products : [],
      active: !!row.active,
      createdAt: row.created_at,
    }));

    return { success: true, data: offers };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Failed to fetch offers' };
  }
}

export async function createOfferAction(offer: Offer): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('offers').insert([{
      id: offer.id || `offer-${Date.now()}`,
      title: offer.title,
      description: offer.description || '',
      discount_type: offer.discountType,
      discount_value: offer.discountValue,
      applicable_products: offer.applicableProducts || [],
      active: offer.active !== false,
    }]);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create offer' };
  }
}

export async function updateOfferAction(id: string, offer: Partial<Offer>): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, any> = {};
    if (offer.title !== undefined) payload.title = offer.title;
    if (offer.description !== undefined) payload.description = offer.description;
    if (offer.discountType !== undefined) payload.discount_type = offer.discountType;
    if (offer.discountValue !== undefined) payload.discount_value = offer.discountValue;
    if (offer.applicableProducts !== undefined) payload.applicable_products = offer.applicableProducts;
    if (offer.active !== undefined) payload.active = offer.active;

    const { error } = await supabase.from('offers').update(payload).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update offer' };
  }
}

export async function deleteOfferAction(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('offers').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete offer' };
  }
}

export async function toggleOfferActiveAction(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('offers').update({ active }).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle offer' };
  }
}

// ==========================================
// COUPONS ACTIONS
// ==========================================

export async function fetchCouponsAction(): Promise<{ success: boolean; data: Coupon[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchCouponsAction error:', error.message);
      return { success: false, data: DEFAULT_COUPONS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: DEFAULT_COUPONS };
    }

    const coupons: Coupon[] = data.map((row: any) => ({
      id: row.id,
      code: row.code,
      description: row.description || '',
      discountType: row.discount_type as 'percentage' | 'flat',
      discountValue: Number(row.discount_value),
      minOrderAmount: row.min_order_amount ? Number(row.min_order_amount) : undefined,
      maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
      active: !!row.active,
      createdAt: row.created_at,
    }));

    return { success: true, data: coupons };
  } catch (err: any) {
    return { success: false, data: DEFAULT_COUPONS, error: err?.message || 'Failed to fetch coupons' };
  }
}

export async function createCouponAction(coupon: Coupon): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('coupons').insert([{
      id: coupon.id || `coupon-${Date.now()}`,
      code: coupon.code.toUpperCase().trim(),
      description: coupon.description || '',
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderAmount || null,
      max_discount_amount: coupon.maxDiscountAmount || null,
      active: coupon.active !== false,
    }]);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create coupon' };
  }
}

export async function updateCouponAction(id: string, coupon: Partial<Coupon>): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, any> = {};
    if (coupon.code !== undefined) payload.code = coupon.code.toUpperCase().trim();
    if (coupon.description !== undefined) payload.description = coupon.description;
    if (coupon.discountType !== undefined) payload.discount_type = coupon.discountType;
    if (coupon.discountValue !== undefined) payload.discount_value = coupon.discountValue;
    if (coupon.minOrderAmount !== undefined) payload.min_order_amount = coupon.minOrderAmount || null;
    if (coupon.maxDiscountAmount !== undefined) payload.max_discount_amount = coupon.maxDiscountAmount || null;
    if (coupon.active !== undefined) payload.active = coupon.active;

    const { error } = await supabase.from('coupons').update(payload).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update coupon' };
  }
}

export async function deleteCouponAction(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminAuth())) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/menu');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete coupon' };
  }
}
