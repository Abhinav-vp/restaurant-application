"use client"

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MENU_ITEMS, MenuItem } from "@/lib/restaurant-data";
import { createClient } from "@/lib/supabase/client";

export default function MenuPage() {
  const [cart, setCart] = useState<{ dish: MenuItem; quantity: number }[]>([]);
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [prodLoading, setProdLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const supabase = createClient();

  React.useEffect(() => {
    const loadProducts = async () => {
      setProdLoading(true);
      // LocalStorage override (admin created products in dashboard)
      try {
        const local = localStorage.getItem("orderflow_products");
        if (local) {
          const parsed = JSON.parse(local);
          // map to MenuItem shape
          const mapped: MenuItem[] = parsed.map((p: any, idx: number) => ({
            id: p.id || `local-${idx}`,
            name: p.name || "Untitled",
            category: (p.category as MenuItem["category"]) || "mains",
            price: Number(p.price) || 0,
            description: p.description || "",
            image: p.image || undefined,
          }));
          setProducts(mapped);
          setProdLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to read local products", err);
      }

      // Try Supabase products table if configured
      try {
        const { data, error } = await supabase.from("products").select("*");
        if (error || !data) {
          setProducts(MENU_ITEMS);
        } else {
          const mapped: MenuItem[] = data.map((p: any, idx: number) => ({
            id: p.id || `prod-${idx}`,
            name: p.name || "Untitled",
            category: (p.category as MenuItem["category"]) || "mains",
            price: Number(p.price) || 0,
            description: p.description || "",
            image: p.image || undefined,
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch products from Supabase", err);
        setProducts(MENU_ITEMS);
      } finally {
        setProdLoading(false);
      }
    };

    loadProducts();

    const onProductsUpdated = () => {
      loadProducts();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "orderflow_products") loadProducts();
    };

    window.addEventListener("orderflow_products_updated", onProductsUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("orderflow_products_updated", onProductsUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const addToCart = (dish: MenuItem) => {
    const existing = cart.find((c) => c.dish.id === dish.id);
    if (existing) {
      setCart(cart.map((c) => (c.dish.id === dish.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { dish, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQty = (dishId: string, delta: number) => {
    const updated = cart
      .map((c) => (c.dish.id === dishId ? { ...c, quantity: c.quantity + delta } : c))
      .filter((c) => c.quantity > 0);
    setCart(updated);
  };

  const subtotal = cart.reduce((s, c) => s + c.dish.price * c.quantity, 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
      const itemList = cart.map((i) => `${i.quantity}x ${i.dish.name}`).join(", ");
      const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
      const totalPrice = parseFloat(subtotal.toFixed(2));

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("orders").insert({
          customer_name: customerName,
          customer_email: customerEmail,
          product_name: itemList,
          quantity: totalQty,
          price: totalPrice,
          status: "pending",
          user_id: user.id,
        });
        if (error) throw error;
      } else {
        const localOrder = { id: Math.random().toString(36).slice(2), created_at: new Date().toISOString(), customer_name: customerName, customer_email: customerEmail, product_name: itemList, quantity: totalQty, price: totalPrice, status: "pending" };
        const existing = JSON.parse(localStorage.getItem("orderflow_orders") || "[]");
        localStorage.setItem("orderflow_orders", JSON.stringify([localOrder, ...existing]));
      }

      // Open WhatsApp with order details
      try {
        const whatsappNumber = "918113021038"; // +91 country code
        const waMessage = encodeURIComponent(`New order from ${customerName} (${customerEmail}): ${itemList}. Qty: ${totalQty}, Total: ₹${totalPrice.toFixed(2)}`);
        const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;
        window.open(waUrl, "_blank");
      } catch (waErr) {
        console.warn("WhatsApp redirect failed", waErr);
      }

      // success
      setCart([]);
      setCustomerEmail("");
      setCustomerName("");
      setIsCartOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to place order");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold">Our Menu</h1>
          <Link href="/" className="text-amber-400 font-semibold">Back Home</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prodLoading ? (
            <div className="col-span-3 text-center text-slate-400">Loading products...</div>
          ) : (
            products.map((dish) => (
              <div key={dish.id} className="glass rounded-2xl p-4 flex flex-col">
              <div className="h-40 w-full relative rounded-lg overflow-hidden mb-4 bg-slate-900">
                {dish.image ? (
                  // Use Next/Image for local static assets, fallback to native <img> for external/admin URLs
                  dish.image.startsWith("/") ? (
                    <Image src={dish.image} alt={dish.name} fill className="object-cover" />
                  ) : (
                    // plain img avoids Next host allowlist issues for admin-provided URLs
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">No image</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{dish.name}</h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-3">{dish.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-extrabold text-amber-400">${dish.price.toFixed(2)}</span>
                <button onClick={() => addToCart(dish)} className="btn-secondary px-3 py-2">Add</button>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Cart drawer */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm p-6">
            <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400">Close</button>
              </div>

              {cart.length === 0 ? (
                <p className="text-slate-500">Cart is empty</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {cart.map((c) => (
                    <div key={c.dish.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">{c.dish.name}</div>
                        <div className="text-xs text-slate-400">${c.dish.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.dish.id, -1)} className="px-2">-</button>
                        <span>{c.quantity}</span>
                        <button onClick={() => updateQty(c.dish.id, 1)} className="px-2">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-800 pt-4">
                <form onSubmit={placeOrder} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Name</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Email</label>
                    <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" required className="w-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="font-extrabold text-amber-400">${subtotal.toFixed(2)}</span>
                  </div>
                  <button disabled={isOrdering || cart.length === 0} className="w-full btn-primary py-3">{isOrdering ? "Placing..." : "Place Order"}</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
