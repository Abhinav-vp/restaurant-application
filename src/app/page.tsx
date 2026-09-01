'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MENU_ITEMS, INITIAL_REVIEWS, MenuItem, Review } from "@/lib/restaurant-data";
import { createClient } from "@/lib/supabase/client";
import RestaurantProfile from "@/components/RestaurantProfile";

interface CartItem {
  dish: MenuItem;
  quantity: number;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  
  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");

  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);

  // Load custom reviews from localStorage if available
  useEffect(() => {
    const savedReviews = localStorage.getItem("abrama_custom_reviews");
    if (savedReviews) {
      setReviews([...INITIAL_REVIEWS, ...JSON.parse(savedReviews)]);
    }
  }, []);

  // Determine admin status from NEXT_PUBLIC_ADMIN_EMAILS (comma-separated)
  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const adminListRaw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "");
        const adminList = adminListRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
        if (mounted && user?.email) {
          setIsAdmin(adminList.includes(user.email.toLowerCase()));
        }
      } catch (err) {
        // silently ignore
      }
    }
    checkAdmin();
    return () => { mounted = false };
  }, [supabase]);

  const handleAddToCart = (dish: MenuItem) => {
    const existing = cart.find(item => item.dish.id === dish.id);
    if (existing) {
      setCart(cart.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { dish, quantity: 1 }]);
    }
    // Automatically open cart when item is added
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsOrdering(true);
    setOrderError("");

    // Calculate aggregated information to match Dashboard expects
    const itemListString = cart.map(item => `${item.quantity}x ${item.dish.name}`).join(", ");
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);

    const newOrderPayload = {
      customer_name: customerName,
      customer_email: customerEmail,
      product_name: itemListString,
      quantity: totalQuantity,
      price: parseFloat(totalPrice.toFixed(2)),
      status: "pending" as const,
    };

    try {
      // 1. Try to fetch user authentication from client
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // If an admin is testing the storefront while logged in, save to the real Supabase DB
        const { error } = await supabase
          .from("orders")
          .insert({
            ...newOrderPayload,
            user_id: user.id
          });
        if (error) throw error;
      } else {
        // 2. Demo fallback / Guest Checkout: Save to LocalStorage
        const localOrder = {
          ...newOrderPayload,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        const existingLocal = JSON.parse(localStorage.getItem("orderflow_orders") || "[]");
        localStorage.setItem("orderflow_orders", JSON.stringify([localOrder, ...existingLocal]));
      }

      // Success sequence
      // Open WhatsApp with order details
      try {
        const whatsappNumber = "918113021038"; // country code +91
        const waMessage = encodeURIComponent(`New order from ${newOrderPayload.customer_name} (${newOrderPayload.customer_email}): ${itemListString}. Qty: ${newOrderPayload.quantity}, Total: ₹${newOrderPayload.price.toFixed(2)}`);
        const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;
        window.open(waUrl, "_blank");
      } catch (waErr) {
        console.warn("WhatsApp redirect failed", waErr);
      }

      setOrderPlaced(true);
      setCart([]);
      setCustomerName("");
      setCustomerEmail("");
      setIsCartOpen(false);
    } catch (err: any) {
      console.error(err);
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor || !reviewComment) return;

    const newReview: Review = {
      id: `custom-${Date.now()}`,
      author: reviewAuthor,
      comment: reviewComment,
      rating: reviewRating,
      date: "Just now"
    };

    const newReviewsList = [newReview, ...reviews];
    setReviews(newReviewsList);

    // Save custom reviews
    const customOnly = newReviewsList.filter(r => r.id.startsWith("custom-"));
    localStorage.setItem("abrama_custom_reviews", JSON.stringify(customOnly));

    // Reset Form
    setReviewAuthor("");
    setReviewComment("");
    setReviewRating(5);
    setIsReviewOpen(false);
  };

  // Calculations
  const filteredDishes = activeCategory === "all" 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);

  return (
    <div className="min-h-screen flex flex-col text-slate-100 relative selection:bg-amber-500 selection:text-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 glass-light sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white leading-none">ABR Asma</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Peringathur</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#menu" className="hover:text-amber-400 transition-smooth">Menu</a>
          <a href="#reviews" className="hover:text-amber-400 transition-smooth">Reviews</a>
          <a href="#location" className="hover:text-amber-400 transition-smooth">Location</a>
          <span className="w-[1px] h-4 bg-slate-700"></span>
          {isAdmin && (
            <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-smooth">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Manager Panel
            </Link>
          )}
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
          
          <Link href="/login" className="btn-primary text-xs px-4 py-2 border border-amber-500/10">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        {/* Background Gradients & Accents */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-red-600/5 rounded-full blur-[90px] pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto z-10 flex flex-col items-center">
          <a
            href="https://www.google.com/maps/place/ABR+ASMA+RESTAURANT/@11.7142064,75.5820788,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba429f23edab745:0x855a37d028d53ecf!8m2!3d11.7142064!4d75.5820788!16s%2Fg%2F11rjz53ljm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-slate-800/40 transition-smooth mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            ⭐ 3.7 Google Business Rating
          </a>

          <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight slide-up">
            Savor Authentic <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-orange-400">
              Malabar Delicacies
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 fade-in">
            From slow-cooked Thalassery Chicken Biriyani and juicy Tandoori grills to spicy local Kerala Beef Fry, experience the true spice legacy of Peringathur.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 fade-in">
            <a href="#menu" className="btn-primary text-sm px-8 py-4 bg-gradient-to-tr from-amber-600 to-amber-500 shadow-amber-500/20">
              Explore Our Menu
            </a>
            <a href="#location" className="btn-secondary text-sm px-8 py-4">
              Find Restaurant
            </a>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mt-16 text-left">
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
              <div key={idx} className="glass rounded-2xl p-5 hover:scale-[1.01] transition-smooth border border-slate-800 hover:border-slate-700/60 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 border border-slate-700/40">
                  {info.icon}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{info.title}</h4>
                  <p className="text-sm font-bold text-white leading-tight">{info.desc}</p>
                  <p className="text-[11px] text-slate-400/80 mt-1">{info.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu" className="py-24 px-6 md:px-12 bg-slate-950/40 relative z-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-white text-left">Explore Chef's Specials</h2>
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-smooth border uppercase tracking-wider ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <div 
                key={dish.id} 
                className="glass rounded-3xl overflow-hidden hover:scale-[1.01] hover:border-slate-700/50 transition-smooth group flex flex-col"
              >
                {/* Image Container with Fallback */}
                <div className="h-52 relative w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                  {dish.image ? (
                    <Image 
                      src={dish.image} 
                      alt={dish.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-smooth"
                    />
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
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-smooth">{dish.name}</h3>
                      <span className="text-amber-400 font-extrabold text-lg">${dish.price.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">{dish.description}</p>
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
            ))}
          </div>
        </div>
      </section>

      {/* Info & Reviews Split Section */}
      <section id="reviews" className="py-24 px-6 md:px-12 bg-slate-950/80 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Reviews List & Write Form - 7 Cols */}
          <div className="lg:col-span-7 flex flex-col text-left">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Google Guest Reviews</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-amber-400">3.7 out of 5 stars</span>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    <span className="text-slate-600">★</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">({reviews.length} reviews)</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsReviewOpen(true)}
                className="btn-primary text-xs py-2 bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold border-transparent"
              >
                Write a Review
              </button>
            </div>

            {/* Custom Review Form (collapsible) */}
            {isReviewOpen && (
              <form onSubmit={handleAddReview} className="glass p-6 rounded-2xl border-amber-500/20 mb-8 animate-fadeIn">
                <h3 className="font-bold text-white text-base mb-4">Post Guest Feedback</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Rahul Murali"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Rating</label>
                    <select 
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="px-4 py-2.5 text-sm"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellence)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                      <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                      <option value={2}>⭐⭐ (2/5 Needs Improvement)</option>
                      <option value={1}>⭐ (1/5 Unsatisfactory)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Comment</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="What did you order and how was the experience?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-surface-800/50 border border-surface-700 text-surface-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm placeholder:text-surface-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsReviewOpen(false)}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-smooth"
                    >
                      Publish Review
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Scrollable Reviews Area */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="glass p-5 rounded-2xl border-slate-800 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-white">{rev.author}</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-semibold uppercase">{rev.date}</span>
                    </div>
                    {/* Stars */}
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

          {/* Location details & Map Embed - 5 Cols */}
          <RestaurantProfile />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-500 border-t border-slate-900 bg-slate-950/60 text-xs">
        <p className="mb-2">ABR Asma Restaurant &copy; {new Date().getFullYear()} – Traditional Taste of Malabar.</p>
        <p className="text-slate-600/80">Powered by Next.js and integrated with OrderFlow Dashboard client mapping.</p>
      </footer>

      {/* Floating Cart Button (visible on mobile if cart is closed) */}
      {cartCount > 0 && !isCartOpen && (
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

      {/* Sliding Cart Sidebar Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop Click */}
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

              {orderError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {orderError}
                </div>
              )}

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
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="flex justify-between items-center py-3 border-b border-slate-800/40">
                      <div className="text-left max-w-[200px]">
                        <h4 className="font-bold text-sm text-white">{item.dish.name}</h4>
                        <p className="text-xs text-amber-400 font-medium mt-0.5">${item.dish.price.toFixed(2)}</p>
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
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-slate-400">Total Bill</span>
                  <span className="text-xl font-extrabold text-amber-500">${cartSubtotal.toFixed(2)}</span>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Enter email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="px-4 py-2.5 text-sm"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isOrdering}
                    className="w-full btn-primary py-3.5 bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold border-transparent select-none mt-2"
                  >
                    {isOrdering ? "Processing order..." : "Submit Malabar Order"}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center leading-normal mt-2">
                    Orders placed will instantly synchronize with the local admin tracking system.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
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

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setOrderPlaced(false)}
                className="w-full btn-primary py-3.5 bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold border-transparent"
              >
                Explore More Dishes
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
