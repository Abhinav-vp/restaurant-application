'use client'

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MENU_ITEMS, INITIAL_REVIEWS, BUSINESS_PROFILE, MenuItem, Offer, Coupon, getMenuItems, getActiveOffers, getEffectivePrice, saveEnquiry, validateCoupon } from "@/lib/restaurant-data";
import RestaurantProfile from "@/components/RestaurantProfile";

interface CartItem {
  dish: MenuItem;
  quantity: number;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [offers, setOffers] = useState<Offer[]>([]);
  
  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Load menu items, offers, and coupons
  useEffect(() => {
    setMenuItems(getMenuItems());
    setOffers(getActiveOffers());

    // Listen for product/offer/coupon updates from admin
    const onUpdate = () => {
      setMenuItems(getMenuItems());
      setOffers(getActiveOffers());
    };
    window.addEventListener('orderflow_products_updated', onUpdate);
    window.addEventListener('orderflow_coupons_updated', onUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'orderflow_menu_items' || e.key === 'orderflow_offers' || e.key === 'orderflow_coupons') onUpdate();
    });
    return () => {
      window.removeEventListener('orderflow_products_updated', onUpdate);
      window.removeEventListener('orderflow_coupons_updated', onUpdate);
    };
  }, []);

  // Re-validate applied coupon when cart or offers change
  useEffect(() => {
    if (!appliedCoupon) return;
    const subtotal = cart.reduce((sum, item) => {
      const { price } = getEffectivePrice(item.dish, offers);
      return sum + (price * item.quantity);
    }, 0);

    if (subtotal === 0) {
      setAppliedCoupon(null);
      setCouponSuccess("");
      return;
    }

    const res = validateCoupon(appliedCoupon.coupon.code, subtotal);
    if (res.valid && res.coupon) {
      setAppliedCoupon({ coupon: res.coupon, discountAmount: res.discountAmount });
    } else {
      setAppliedCoupon(null);
      setCouponError(res.message || "Applied coupon is no longer valid");
      setCouponSuccess("");
    }
  }, [cart, offers]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    const subtotal = cart.reduce((sum, item) => {
      const { price } = getEffectivePrice(item.dish, offers);
      return sum + (price * item.quantity);
    }, 0);

    const res = validateCoupon(couponInput, subtotal);
    if (!res.valid) {
      setCouponError(res.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } else if (res.coupon) {
      setAppliedCoupon({ coupon: res.coupon, discountAmount: res.discountAmount });
      setCouponSuccess(`Code '${res.coupon.code}' applied! Saved ₹${res.discountAmount.toFixed(2)}`);
      setCouponError("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  const handleAddToCart = (dish: MenuItem) => {
    const existing = cart.find(item => item.dish.id === dish.id);
    if (existing) {
      setCart(cart.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { dish, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const handleUpdateQty = (dishId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.dish.id === dishId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];
    setCart(updated);
  };

  // Calculations
  const filteredDishes = activeCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const { price } = getEffectivePrice(item.dish, offers);
    return sum + (price * item.quantity);
  }, 0);
  const cartDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const cartFinalTotal = Math.max(0, cartSubtotal - cartDiscount);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsOrdering(true);
    setOrderError("");

    const itemListString = cart.map(item => `${item.quantity}x ${item.dish.name}`).join(", ");
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    const couponInfo = appliedCoupon ? ` (Coupon ${appliedCoupon.coupon.code}: -₹${cartDiscount.toFixed(2)})` : '';
    const fullItemsDescription = `${itemListString}${couponInfo}`;

    try {
      // Save enquiry to localStorage
      saveEnquiry({
        id: `enq-${Date.now()}`,
        customerName,
        customerPhone,
        items: fullItemsDescription,
        totalQuantity,
        totalPrice: parseFloat(cartFinalTotal.toFixed(2)),
        createdAt: new Date().toISOString(),
      });

      // Also save as order for dashboard
      const localOrder = {
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        customer_name: customerName,
        customer_email: customerPhone,
        product_name: fullItemsDescription,
        quantity: totalQuantity,
        price: parseFloat(cartFinalTotal.toFixed(2)),
        status: "pending"
      };
      const existingLocal = JSON.parse(localStorage.getItem("orderflow_orders") || "[]");
      localStorage.setItem("orderflow_orders", JSON.stringify([localOrder, ...existingLocal]));

      // Open WhatsApp
      try {
        const whatsappNumber = "918113021038";
        const waMessage = encodeURIComponent(
          `New order from ${customerName} (${customerPhone}): ${itemListString}. Qty: ${totalQuantity}${couponInfo}, Total: ₹${cartFinalTotal.toFixed(2)}`
        );
        const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;
        window.open(waUrl, "_blank");
      } catch (waErr) {
        console.warn("WhatsApp redirect failed", waErr);
      }

      setOrderPlaced(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError("");
      setCouponSuccess("");
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
    } catch (err: any) {
      console.error(err);
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 relative selection:bg-amber-500 selection:text-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-3 md:px-12 md:py-4 glass-light sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/20 flex-shrink-0">
            <Image src="/logo.png" alt="ABR Asma Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-extrabold tracking-tight text-white leading-none">ABR ASMA RESTAURANT</span>
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-amber-500">Peringathur</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#menu" className="hover:text-amber-400 transition-smooth">Menu</a>
          <a href="#reviews" className="hover:text-amber-400 transition-smooth">Reviews</a>
          <a href="#location" className="hover:text-amber-400 transition-smooth">Location</a>
          <span className="w-[1px] h-4 bg-slate-700"></span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl glass hover:bg-slate-800/80 transition-smooth"
            aria-label="Toggle Shopping Cart"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 md:px-6 md:py-20 text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-red-600/5 rounded-full blur-[90px] pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto z-10 flex flex-col items-center">
          {/* Active Offers Banner */}
          {offers.length > 0 && (
            <div className="w-full max-w-2xl mb-8 space-y-3">
              {offers.map(offer => (
                <div key={offer.id} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 backdrop-blur-sm animate-fadeIn">
                  <span className="text-xl">🔥</span>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-extrabold text-amber-400">{offer.title}</span>
                    {offer.description && <span className="text-xs text-slate-400 ml-2">{offer.description}</span>}
                  </div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full whitespace-nowrap">
                    {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-7xl font-extrabold text-white mb-4 md:mb-6 tracking-tight leading-tight slide-up">
            Savor Authentic <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-orange-400">
              Malabar Delicacies
            </span>
          </h1>

          <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 fade-in px-2">
            From slow-cooked Thalassery Chicken Biriyani and juicy Tandoori grills to spicy local Kerala Beef Fry, experience the true spice legacy of Peringathur.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 fade-in">
            <a href="#menu" className="btn-primary text-sm px-6 py-3 md:px-8 md:py-4 bg-gradient-to-tr from-amber-600 to-amber-500 shadow-amber-500/20">
              Explore Our Menu
            </a>
            <a href="#location" className="btn-secondary text-sm px-6 py-3 md:px-8 md:py-4">
              Find Restaurant
            </a>
          </div>

          {/* Quick Info Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-5xl mt-10 md:mt-16 text-left">
            {[
              {
                title: "Opening Hours",
                desc: "9:00 AM – 11:00 PM",
                sub: "Monday – Sunday",
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: "Call Direct Order",
                desc: "+91 74477 63003",
                sub: "Instant takeaway/delivery",
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )
              },
              {
                title: "Dining Address",
                desc: "Gurujimukku, Peringathur",
                sub: "Kerala, India 670104",
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                title: "Fast Delivery",
                desc: "Home & Office drop-off",
                sub: "Peringathur & nearby areas",
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )
              }
            ].map((info, idx) => (
              <div key={idx} className="glass rounded-2xl p-4 md:p-5 hover:scale-[1.01] transition-smooth border border-slate-800 hover:border-slate-700/60 flex items-start gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 border border-slate-700/40">
                  {info.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1 md:mb-1.5">{info.title}</h4>
                  <p className="text-xs md:text-sm font-bold text-white leading-tight">{info.desc}</p>
                  <p className="text-[10px] md:text-[11px] text-slate-400/80 mt-0.5 md:mt-1">{info.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu" className="py-16 md:py-24 px-4 md:px-12 bg-slate-950/40 relative z-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white text-left">Explore Chef&apos;s Specials</h2>
              <p className="text-sm text-slate-405 mt-2">Curated selection of our best and freshest menu items.</p>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: "all", label: "Full Menu" },
                { id: "biriyani", label: "Mandi & Biriyani" },
                { id: "mains", label: "Mains & Grills" },
                { id: "breads", label: "Breads & Curries" },
                { id: "beverages", label: "Beverages" }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-smooth border uppercase tracking-wider ${
                    activeCategory === category.id
                      ? "bg-amber-500 border-amber-500/20 text-slate-950 font-extrabold"
                      : "glass border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredDishes.map((dish) => {
              const priceInfo = getEffectivePrice(dish, offers);
              return (
                <div 
                  key={dish.id} 
                  className="glass rounded-3xl overflow-hidden hover:scale-[1.01] hover:border-slate-700/50 transition-smooth group flex flex-col"
                >
                  {/* Image Container */}
                  <div className="h-44 md:h-52 relative w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    {dish.image ? (
                      dish.image.startsWith("/") ? (
                        <Image 
                          src={dish.image} 
                          alt={dish.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-smooth"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                      )
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-500/60 mb-2 border border-slate-700/20">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ABR Asma Specialties</span>
                      </div>
                    )}
                    {/* Category Tag */}
                    <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-amber-500 border border-slate-800">
                      {dish.category}
                    </span>
                    {/* Offer Badge */}
                    {priceInfo.offerTitle && (
                      <span className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-white">
                        {offers.find(o => o.title === priceInfo.offerTitle)?.discountType === 'percentage' 
                          ? `${offers.find(o => o.title === priceInfo.offerTitle)?.discountValue}% OFF`
                          : `₹${offers.find(o => o.title === priceInfo.offerTitle)?.discountValue} OFF`
                        }
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 md:p-6 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold text-white text-base md:text-lg group-hover:text-amber-400 transition-smooth">{dish.name}</h3>
                        <div className="text-right shrink-0">
                          {priceInfo.originalPrice ? (
                            <>
                              <span className="text-slate-500 line-through text-sm mr-1.5">₹{priceInfo.originalPrice.toFixed(2)}</span>
                              <span className="text-amber-400 font-extrabold text-lg">₹{priceInfo.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-amber-400 font-extrabold text-lg">₹{priceInfo.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4 md:mb-6 line-clamp-3">{dish.description}</p>
                    </div>

                    <button 
                      onClick={() => handleAddToCart(dish)}
                      className="w-full btn-secondary text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:border-transparent transition-smooth"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Info & Reviews Split Section */}
      <section id="reviews" className="py-16 md:py-24 px-4 md:px-12 bg-slate-950/80 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7 flex flex-col text-left">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">Google Guest Reviews</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-amber-400">3.7 out of 5 stars</span>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    <span className="text-slate-600">★</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">({INITIAL_REVIEWS.length} reviews)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a 
                  href={BUSINESS_PROFILE.googleReviewUrl || BUSINESS_PROFILE.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-2 bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold border-transparent flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <span>Leave a Google Review</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {INITIAL_REVIEWS.map((rev) => (
                <div key={rev.id} className="glass p-5 rounded-2xl border-slate-800 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-white">{rev.author}</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-semibold uppercase">{rev.date}</span>
                    </div>
                    <div className="flex items-center text-amber-500 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < rev.rating ? "text-amber-500" : "text-slate-800"}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed font-light">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <RestaurantProfile />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 text-center text-slate-500 border-t border-slate-900 bg-slate-950/60 text-xs px-4">
        <p className="mb-2">ABR Asma Restaurant &copy; {new Date().getFullYear()} – Traditional Taste of Malabar.</p>
        <p className="text-slate-600/80">Powered by Next.js and integrated with OrderFlow Dashboard.</p>
      </footer>

      {/* Floating Cart Button (mobile) */}
      {cartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-amber-500 text-slate-950 p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-smooth font-extrabold"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Cart ({cartCount})</span>
        </button>
      )}

      {/* Cart Drawer — Only shows products + quantity */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 -z-10" onClick={() => setIsCartOpen(false)} />
          
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl relative animate-slideLeft h-full overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-lg text-left">Your Order Basket</h3>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-amber-500 font-bold">{cartCount} items</span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-slate-450 hover:text-white rounded-lg transition-smooth"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-sm font-semibold">Your basket is empty</p>
                  <p className="text-xs mt-1">Explore our specials and add dishes to begin.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const priceInfo = getEffectivePrice(item.dish, offers);
                    return (
                      <div key={item.dish.id} className="flex justify-between items-center py-3 border-b border-slate-800/40">
                        <div className="text-left max-w-[200px]">
                          <h4 className="font-bold text-sm text-white">{item.dish.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {priceInfo.originalPrice ? (
                              <>
                                <span className="text-[10px] text-slate-500 line-through">₹{priceInfo.originalPrice.toFixed(2)}</span>
                                <span className="text-xs text-amber-400 font-medium">₹{priceInfo.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-xs text-amber-400 font-medium">₹{priceInfo.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleUpdateQty(item.dish.id, -1)}
                            className="w-7 h-7 rounded bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-350 hover:bg-slate-700/80 hover:text-white transition-smooth"
                          >
                            -
                          </button>
                          <span className="text-sm font-extrabold text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQty(item.dish.id, 1)}
                            className="w-7 h-7 rounded bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-350 hover:bg-slate-700/80 hover:text-white transition-smooth"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proceed to Checkout Button */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 mt-6">
                {/* Coupon Section */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Have a Coupon?</label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎟️</span>
                        <div>
                          <span className="font-extrabold text-xs text-amber-400 font-mono">{appliedCoupon.coupon.code}</span>
                          <p className="text-[10px] text-green-400 font-semibold">Saved ₹{appliedCoupon.discountAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME10"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        className="px-3 py-2 text-xs font-mono tracking-wider uppercase flex-1 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                      <button type="submit" className="px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-smooth">
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-[10px] text-red-400 mt-1.5">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-green-400 mt-1.5">{couponSuccess}</p>}
                </div>

                <div className="space-y-1.5 mb-4 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-xs text-green-400 font-semibold">
                      <span>Coupon ({appliedCoupon.coupon.code})</span>
                      <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total Bill</span>
                    <span className="text-amber-500">₹{cartFinalTotal.toFixed(2)}</span>
                  </div>
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
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal — Name + Phone Number */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass rounded-3xl p-6 md:p-8 border-amber-500/20 relative animate-scaleUp">
            {/* Close */}
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1">Checkout</h3>
            <p className="text-sm text-slate-400 mb-6">Complete your order details to place via WhatsApp</p>

            {/* Order Summary */}
            <div className="glass rounded-2xl p-4 mb-6 border border-slate-800 max-h-56 overflow-y-auto">
              {cart.map(item => {
                const priceInfo = getEffectivePrice(item.dish, offers);
                return (
                  <div key={item.dish.id} className="flex justify-between items-center py-2 border-b border-slate-800/30 last:border-0">
                    <span className="text-sm text-white">{item.quantity}x {item.dish.name}</span>
                    <span className="text-sm text-amber-400 font-bold">₹{(priceInfo.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="pt-3 mt-2 border-t border-slate-700 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs text-green-400 font-semibold">
                    <span>Coupon ({appliedCoupon.coupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-lg font-extrabold text-amber-500">₹{cartFinalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {orderError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {orderError}
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Your Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+91 XXXXX XXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-4 py-3 text-sm"
                />
              </div>

              <button 
                type="submit" 
                disabled={isOrdering}
                className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm border-transparent select-none mt-2 hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isOrdering ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Order via WhatsApp
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center leading-normal mt-2">
                You&apos;ll be redirected to WhatsApp to confirm your order directly with the restaurant.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass rounded-3xl p-6 text-center border-amber-500/20 relative animate-scaleUp glow">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 text-amber-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-2">Order Dispatched successfully!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Our kitchen has started assembling your Malabar spices. Estimated delivery is around 35 minutes!
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Arrival</span>
                <span className="text-xs font-bold text-amber-500">35 min</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-3">
                <span className="text-slate-400">Order Delivery Status</span>
                <span className="text-success font-extrabold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success status-pulse"></span>
                  Processing
                </span>
              </div>
            </div>

            <button 
              onClick={() => setOrderPlaced(false)}
              className="w-full btn-primary py-3.5 bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold border-transparent"
            >
              Explore More Dishes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
