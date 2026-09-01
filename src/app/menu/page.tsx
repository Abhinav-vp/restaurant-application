"use client"

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MENU_ITEMS, MenuItem, Offer, getMenuItems, getActiveOffers, getEffectivePrice, saveEnquiry } from "@/lib/restaurant-data";

export default function MenuPage() {
  const [cart, setCart] = useState<{ dish: MenuItem; quantity: number }[]>([]);
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  React.useEffect(() => {
    const loadProducts = () => {
      setProdLoading(true);
      setProducts(getMenuItems());
      setOffers(getActiveOffers());
      setProdLoading(false);
    };

    loadProducts();

    const onProductsUpdated = () => loadProducts();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "orderflow_menu_items" || e.key === "orderflow_offers") loadProducts();
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

  const subtotal = cart.reduce((s, c) => {
    const { price } = getEffectivePrice(c.dish, offers);
    return s + price * c.quantity;
  }, 0);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
      const itemList = cart.map((i) => `${i.quantity}x ${i.dish.name}`).join(", ");
      const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
      const totalPrice = parseFloat(subtotal.toFixed(2));

      // Save enquiry
      saveEnquiry({
        id: `enq-${Date.now()}`,
        customerName,
        customerPhone,
        items: itemList,
        totalQuantity: totalQty,
        totalPrice,
        createdAt: new Date().toISOString(),
      });

      // Save order
      const localOrder = {
        id: Math.random().toString(36).slice(2),
        created_at: new Date().toISOString(),
        customer_name: customerName,
        customer_email: customerPhone,
        product_name: itemList,
        quantity: totalQty,
        price: totalPrice,
        status: "pending"
      };
      const existing = JSON.parse(localStorage.getItem("orderflow_orders") || "[]");
      localStorage.setItem("orderflow_orders", JSON.stringify([localOrder, ...existing]));

      // Open WhatsApp
      try {
        const whatsappNumber = "918113021038";
        const waMessage = encodeURIComponent(`New order from ${customerName} (${customerPhone}): ${itemList}. Qty: ${totalQty}, Total: ₹${totalPrice.toFixed(2)}`);
        const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;
        window.open(waUrl, "_blank");
      } catch (waErr) {
        console.warn("WhatsApp redirect failed", waErr);
      }

      setCart([]);
      setCustomerPhone("");
      setCustomerName("");
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to place order");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-light backdrop-blur-md px-4 md:px-6 py-4 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/20 flex-shrink-0">
            <Image src="/logo.png" alt="ABR Asma Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-white leading-none">Our Menu</h1>
            <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-amber-500">ABR Asma Restaurant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl glass hover:bg-slate-800/80 transition-smooth"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </button>
          <Link href="/" className="text-sm text-amber-400 font-semibold hover:text-amber-300 transition-smooth">
            ← Home
          </Link>
        </div>
      </div>

      {/* Active Offers Banner */}
      {offers.length > 0 && (
        <div className="px-4 md:px-6 py-3 border-b border-slate-800/30">
          {offers.map(offer => (
            <div key={offer.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 mb-2 last:mb-0">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-amber-400 flex-1">{offer.title}</span>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Menu Grid */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {prodLoading ? (
            <div className="col-span-3 text-center text-slate-400 py-20">Loading products...</div>
          ) : (
            products.map((dish) => {
              const priceInfo = getEffectivePrice(dish, offers);
              return (
                <div key={dish.id} className="glass rounded-2xl overflow-hidden flex flex-col hover:scale-[1.01] transition-smooth group">
                  <div className="h-40 w-full relative overflow-hidden bg-slate-900">
                    {dish.image ? (
                      dish.image.startsWith("/") ? (
                        <Image src={dish.image} alt={dish.name} fill className="object-cover group-hover:scale-105 transition-smooth" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No image</div>
                    )}
                    {priceInfo.offerTitle && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-500/90 text-[10px] uppercase font-bold text-white">
                        {offers.find(o => o.title === priceInfo.offerTitle)?.discountType === 'percentage'
                          ? `${offers.find(o => o.title === priceInfo.offerTitle)?.discountValue}% OFF`
                          : `₹${offers.find(o => o.title === priceInfo.offerTitle)?.discountValue} OFF`
                        }
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-base md:text-lg text-white group-hover:text-amber-400 transition-smooth">{dish.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2 flex-1">{dish.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {priceInfo.originalPrice ? (
                          <>
                            <span className="text-sm text-slate-500 line-through">₹{priceInfo.originalPrice.toFixed(2)}</span>
                            <span className="font-extrabold text-amber-400">₹{priceInfo.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="font-extrabold text-amber-400">₹{priceInfo.price.toFixed(2)}</span>
                        )}
                      </div>
                      <button onClick={() => addToCart(dish)} className="btn-secondary px-3 py-2 text-xs font-bold">
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-amber-500 text-slate-950 p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-amber-400 transition-smooth font-extrabold"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Cart ({cartCount})
        </button>
      )}

      {/* Cart Drawer — Products + Quantity only */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 -z-10" onClick={() => setIsCartOpen(false)} />
          <div className="w-full max-w-md bg-slate-900 p-6 border-l border-slate-800 h-full overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Your Cart</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-smooth">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20 text-slate-500 flex-1 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-sm font-semibold">Cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 flex-1 overflow-y-auto mb-4">
                  {cart.map((c) => {
                    const priceInfo = getEffectivePrice(c.dish, offers);
                    return (
                      <div key={c.dish.id} className="flex justify-between items-center py-3 border-b border-slate-800/40">
                        <div>
                          <div className="font-bold text-sm text-white">{c.dish.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {priceInfo.originalPrice ? (
                              <>
                                <span className="text-[10px] text-slate-500 line-through">₹{priceInfo.originalPrice.toFixed(2)}</span>
                                <span className="text-xs text-amber-400 font-medium">₹{priceInfo.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-xs text-amber-400">₹{priceInfo.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQty(c.dish.id, -1)} className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-smooth">-</button>
                          <span className="text-sm font-extrabold text-white w-4 text-center">{c.quantity}</span>
                          <button onClick={() => updateQty(c.dish.id, 1)} className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-smooth">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-slate-400">Total</span>
                    <span className="font-extrabold text-xl text-amber-500">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass rounded-3xl p-6 md:p-8 border-amber-500/20 relative animate-scaleUp">
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1">Checkout</h3>
            <p className="text-sm text-slate-400 mb-6">Complete your order details</p>

            <div className="glass rounded-2xl p-4 mb-6 border border-slate-800 max-h-48 overflow-y-auto">
              {cart.map(c => {
                const priceInfo = getEffectivePrice(c.dish, offers);
                return (
                  <div key={c.dish.id} className="flex justify-between items-center py-2 border-b border-slate-800/30 last:border-0">
                    <span className="text-sm text-white">{c.quantity}x {c.dish.name}</span>
                    <span className="text-sm text-amber-400 font-bold">₹{(priceInfo.price * c.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-700">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-lg font-extrabold text-amber-500">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={placeOrder} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Full Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="Enter your name" className="px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" required placeholder="+91 XXXXX XXXXX" className="px-4 py-3 text-sm" />
              </div>
              <button disabled={isOrdering || cart.length === 0} className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {isOrdering ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Placing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Order via WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
