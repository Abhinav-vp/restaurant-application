'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server-admin';
import { Enquiry } from '@/lib/restaurant-data';

export async function submitOrderAction(order: Enquiry): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const payload = {
      id: order.id || `enq-${Date.now()}`,
      order_id: order.orderId,
      status: order.status || 'pending',
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_address: order.deliveryAddress || null,
      delivery_landmark: order.deliveryLandmark || null,
      delivery_notes: order.deliveryNotes || null,
      items: order.items,
      item_details: order.itemDetails || null,
      coupon_code: order.couponCode || null,
      coupon_discount: order.couponDiscount || null,
      subtotal_price: order.subtotalPrice || null,
      total_quantity: order.totalQuantity || 1,
      total_price: order.totalPrice,
    };

    const { error } = await supabase.from('enquiries').insert([payload]);

    if (error) {
      console.error('submitOrderAction error:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, orderId: order.orderId };
  } catch (err: any) {
    console.error('submitOrderAction exception:', err);
    return { success: false, error: err?.message || 'Failed to submit order' };
  }
}
