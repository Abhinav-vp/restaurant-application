"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItem, Offer, Enquiry, Coupon, MENU_ITEMS, DEFAULT_COUPONS } from "@/lib/restaurant-data";

type AdminMenuItem = MenuItem & { id: string };

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'enquiries' | 'offers' | 'coupons'>('menu');

  // Menu Items State
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', category: 'mains' as MenuItem['category'], description: '', image: ''
  });

  // Enquiries State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: '', description: '', discountType: 'percentage' as Offer['discountType'],
    discountValue: '', applicableProducts: [] as string[], active: true
  });

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '', description: '', discountType: 'percentage' as Coupon['discountType'],
    discountValue: '', minOrderAmount: '', maxDiscountAmount: '', active: true
  });

  // Load data
  useEffect(() => {
    // Load menu items
    const stored = localStorage.getItem('orderflow_menu_items');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMenuItems(parsed);
      } else {
        setMenuItems(MENU_ITEMS);
        localStorage.setItem('orderflow_menu_items', JSON.stringify(MENU_ITEMS));
      }
    } else {
      setMenuItems(MENU_ITEMS);
      localStorage.setItem('orderflow_menu_items', JSON.stringify(MENU_ITEMS));
    }

    // Load enquiries
    const storedEnq = localStorage.getItem('orderflow_enquiries');
    if (storedEnq) setEnquiries(JSON.parse(storedEnq));

    // Load offers
    const storedOffers = localStorage.getItem('orderflow_offers');
    if (storedOffers) setOffers(JSON.parse(storedOffers));

    // Load coupons
    const storedCoupons = localStorage.getItem('orderflow_coupons');
    if (storedCoupons) {
      setCoupons(JSON.parse(storedCoupons));
    } else {
      setCoupons(DEFAULT_COUPONS);
      localStorage.setItem('orderflow_coupons', JSON.stringify(DEFAULT_COUPONS));
    }
  }, []);

  // Menu CRUD
  const saveMenuItems = (items: AdminMenuItem[]) => {
    setMenuItems(items);
    localStorage.setItem('orderflow_menu_items', JSON.stringify(items));
    window.dispatchEvent(new Event('orderflow_products_updated'));
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'mains', description: '', image: '' });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleAddItem = () => {
    if (!formData.name || !formData.price) return;
    const newItem: AdminMenuItem = {
      id: `admin-${Date.now()}`,
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description,
      image: formData.image || undefined,
    };
    saveMenuItems([newItem, ...menuItems]);
    resetForm();
  };

  const handleEditItem = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return;
    setFormData({
      name: item.name, price: item.price.toString(), category: item.category,
      description: item.description, image: item.image || ''
    });
    setEditingItem(id);
    setShowAddForm(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !formData.name || !formData.price) return;
    const updated = menuItems.map(m => m.id === editingItem ? {
      ...m, name: formData.name, price: parseFloat(formData.price),
      category: formData.category, description: formData.description,
      image: formData.image || undefined
    } : m);
    saveMenuItems(updated);
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    saveMenuItems(menuItems.filter(m => m.id !== id));
  };

  // Enquiry management
  const handleDeleteEnquiry = (id: string) => {
    const updated = enquiries.filter(e => e.id !== id);
    setEnquiries(updated);
    localStorage.setItem('orderflow_enquiries', JSON.stringify(updated));
  };

  const handleClearEnquiries = () => {
    if (!confirm('Clear all enquiries?')) return;
    setEnquiries([]);
    localStorage.setItem('orderflow_enquiries', JSON.stringify([]));
  };

  // Offer management
  const saveOffers = (items: Offer[]) => {
    setOffers(items);
    localStorage.setItem('orderflow_offers', JSON.stringify(items));
  };

  const resetOfferForm = () => {
    setOfferForm({ title: '', description: '', discountType: 'percentage', discountValue: '', applicableProducts: [], active: true });
    setShowAddOffer(false);
    setEditingOffer(null);
  };

  const handleAddOffer = () => {
    if (!offerForm.title || !offerForm.discountValue) return;
    const newOffer: Offer = {
      id: `offer-${Date.now()}`,
      title: offerForm.title,
      description: offerForm.description,
      discountType: offerForm.discountType,
      discountValue: parseFloat(offerForm.discountValue),
      applicableProducts: offerForm.applicableProducts,
      active: offerForm.active,
      createdAt: new Date().toISOString(),
    };
    saveOffers([newOffer, ...offers]);
    resetOfferForm();
  };

  const handleEditOffer = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (!offer) return;
    setOfferForm({
      title: offer.title, description: offer.description,
      discountType: offer.discountType, discountValue: offer.discountValue.toString(),
      applicableProducts: offer.applicableProducts, active: offer.active
    });
    setEditingOffer(id);
    setShowAddOffer(false);
  };

  const handleUpdateOffer = () => {
    if (!editingOffer || !offerForm.title || !offerForm.discountValue) return;
    const updated = offers.map(o => o.id === editingOffer ? {
      ...o, title: offerForm.title, description: offerForm.description,
      discountType: offerForm.discountType, discountValue: parseFloat(offerForm.discountValue),
      applicableProducts: offerForm.applicableProducts, active: offerForm.active
    } : o);
    saveOffers(updated);
    resetOfferForm();
  };

  const handleDeleteOffer = (id: string) => {
    if (!confirm('Delete this offer?')) return;
    saveOffers(offers.filter(o => o.id !== id));
  };

  const toggleOfferActive = (id: string) => {
    const updated = offers.map(o => o.id === id ? { ...o, active: !o.active } : o);
    saveOffers(updated);
  };

  const handleToggleProduct = (productId: string) => {
    setOfferForm(prev => ({
      ...prev,
      applicableProducts: prev.applicableProducts.includes(productId)
        ? prev.applicableProducts.filter(p => p !== productId)
        : [...prev.applicableProducts, productId]
    }));
  };

  // Coupon management
  const saveCoupons = (items: Coupon[]) => {
    setCoupons(items);
    localStorage.setItem('orderflow_coupons', JSON.stringify(items));
    window.dispatchEvent(new Event('orderflow_coupons_updated'));
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '', description: '', discountType: 'percentage', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', active: true
    });
    setShowAddCoupon(false);
    setEditingCoupon(null);
  };

  const handleAddCoupon = () => {
    if (!couponForm.code || !couponForm.discountValue) return;
    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: couponForm.code.trim().toUpperCase(),
      description: couponForm.description,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : undefined,
      maxDiscountAmount: couponForm.maxDiscountAmount ? parseFloat(couponForm.maxDiscountAmount) : undefined,
      active: couponForm.active,
      createdAt: new Date().toISOString(),
    };
    saveCoupons([newCoupon, ...coupons]);
    resetCouponForm();
  };

  const handleEditCoupon = (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount ? coupon.minOrderAmount.toString() : '',
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      active: coupon.active
    });
    setEditingCoupon(id);
    setShowAddCoupon(false);
  };

  const handleUpdateCoupon = () => {
    if (!editingCoupon || !couponForm.code || !couponForm.discountValue) return;
    const updated = coupons.map(c => c.id === editingCoupon ? {
      ...c,
      code: couponForm.code.trim().toUpperCase(),
      description: couponForm.description,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : undefined,
      maxDiscountAmount: couponForm.maxDiscountAmount ? parseFloat(couponForm.maxDiscountAmount) : undefined,
      active: couponForm.active
    } : c);
    saveCoupons(updated);
    resetCouponForm();
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm('Delete this coupon code?')) return;
    saveCoupons(coupons.filter(c => c.id !== id));
  };

  const toggleCouponActive = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c);
    saveCoupons(updated);
  };

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/login');
  };

  const tabs = [
    { id: 'menu' as const, label: 'Menu Items', icon: '🍽️', count: menuItems.length },
    { id: 'enquiries' as const, label: 'Enquiries', icon: '📋', count: enquiries.length },
    { id: 'offers' as const, label: 'Offers', icon: '🏷️', count: offers.length },
    { id: 'coupons' as const, label: 'Coupons', icon: '🎟️', count: coupons.length },
  ];

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="glass-light sticky top-0 z-30 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-lg">
            🔐
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-none">Admin Dashboard</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">ABR Asma Restaurant</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden md:inline">Signed in as <span className="text-amber-400 font-bold">{userEmail || 'admin'}</span></span>
          <button onClick={handleLogout} className="btn-secondary text-xs px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-800/30 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-smooth flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950'
                : 'glass text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              activeTab === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* ====== MENU ITEMS TAB ====== */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Menu Items</h2>
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Item
              </button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingItem) && (
              <div className="glass rounded-2xl p-6 mb-6 border border-amber-500/20 animate-fadeIn">
                <h3 className="font-bold text-white text-base mb-4">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dish name" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price (₹)</label>
                    <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as MenuItem['category']})} className="text-sm">
                      <option value="biriyani">Mandi & Biriyani</option>
                      <option value="mains">Mains & Grills</option>
                      <option value="breads">Breads & Curries</option>
                      <option value="beverages">Beverages</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Image URL (optional)</label>
                    <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="/image.png or https://..." className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Dish description" rows={2} className="text-sm bg-surface-800/50 border border-surface-700 text-surface-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-smooth placeholder:text-surface-500" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={resetForm} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                  <button
                    onClick={editingItem ? handleUpdateItem : handleAddItem}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-smooth"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="glass rounded-2xl p-5 border border-slate-800 hover:border-slate-700/60 transition-smooth group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80">{item.category}</span>
                    </div>
                    <span className="text-amber-400 font-extrabold text-lg ml-2">₹{item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.description}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/40">
                    <button onClick={() => handleEditItem(item.id)} className="flex-1 text-center text-xs font-bold text-slate-300 hover:text-amber-400 py-2 rounded-lg hover:bg-slate-800/50 transition-smooth">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="flex-1 text-center text-xs font-bold text-slate-400 hover:text-red-400 py-2 rounded-lg hover:bg-red-500/10 transition-smooth">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {menuItems.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <p className="text-sm font-semibold">No menu items yet</p>
                <p className="text-xs mt-1">Add your first menu item to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* ====== ENQUIRIES TAB ====== */}
        {activeTab === 'enquiries' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Customer Enquiries</h2>
              {enquiries.length > 0 && (
                <button onClick={handleClearEnquiries} className="btn-danger text-xs px-4 py-2 flex items-center gap-2">
                  🗑️ Clear All
                </button>
              )}
            </div>

            {enquiries.length === 0 ? (
              <div className="text-center py-20 text-slate-500 glass rounded-2xl">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm font-semibold">No enquiries yet</p>
                <p className="text-xs mt-1">Customer enquiries will appear here when they place orders via WhatsApp.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enquiries.map(enq => (
                  <div key={enq.id} className="glass rounded-2xl p-5 border border-slate-800 hover:border-slate-700/60 transition-smooth">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-extrabold text-white">{enq.customerName}</span>
                          <a href={`tel:${enq.customerPhone}`} className="text-xs text-amber-400 font-bold hover:underline">📞 {enq.customerPhone}</a>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{enq.items}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Qty: {enq.totalQuantity}</span>
                          <span className="font-bold text-amber-400/80">₹{enq.totalPrice.toFixed(2)}</span>
                          <span>{new Date(enq.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteEnquiry(enq.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-smooth shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== OFFERS TAB ====== */}
        {activeTab === 'offers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Offer Management</h2>
              <button
                onClick={() => { resetOfferForm(); setShowAddOffer(true); }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Offer
              </button>
            </div>

            {/* Add/Edit Offer Form */}
            {(showAddOffer || editingOffer) && (
              <div className="glass rounded-2xl p-6 mb-6 border border-amber-500/20 animate-fadeIn">
                <h3 className="font-bold text-white text-base mb-4">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Offer Title</label>
                    <input value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} placeholder="e.g. 20% OFF on Biriyani!" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <input value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} placeholder="Offer details" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Discount Type</label>
                    <select value={offerForm.discountType} onChange={e => setOfferForm({...offerForm, discountType: e.target.value as Offer['discountType']})} className="text-sm">
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {offerForm.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                    </label>
                    <input type="number" step="0.01" value={offerForm.discountValue} onChange={e => setOfferForm({...offerForm, discountValue: e.target.value})} placeholder="0" className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Applicable Products <span className="text-slate-600">(leave empty = all products)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {menuItems.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleProduct(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth border ${
                            offerForm.applicableProducts.includes(item.id)
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'glass border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</label>
                    <button
                      type="button"
                      onClick={() => setOfferForm({...offerForm, active: !offerForm.active})}
                      className={`relative w-12 h-6 rounded-full transition-smooth ${offerForm.active ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth ${offerForm.active ? 'left-6' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs text-slate-400">{offerForm.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={resetOfferForm} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                  <button
                    onClick={editingOffer ? handleUpdateOffer : handleAddOffer}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-smooth"
                  >
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                  </button>
                </div>
              </div>
            )}

            {/* Offers List */}
            {offers.length === 0 ? (
              <div className="text-center py-20 text-slate-500 glass rounded-2xl">
                <p className="text-4xl mb-3">🏷️</p>
                <p className="text-sm font-semibold">No offers yet</p>
                <p className="text-xs mt-1">Create offers to display on the website and apply discounts to products.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map(offer => (
                  <div key={offer.id} className={`glass rounded-2xl p-5 border transition-smooth ${offer.active ? 'border-amber-500/30' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-extrabold text-white">{offer.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${offer.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                            {offer.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{offer.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="font-bold text-amber-400/80">
                            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                          </span>
                          <span>
                            {offer.applicableProducts.length === 0
                              ? 'All Products'
                              : `${offer.applicableProducts.length} product(s)`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleOfferActive(offer.id)} className={`p-2 rounded-lg transition-smooth ${offer.active ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-800'}`} title="Toggle active">
                          {offer.active ? '✅' : '⏸️'}
                        </button>
                        <button onClick={() => handleEditOffer(offer.id)} className="text-slate-400 hover:text-amber-400 p-2 rounded-lg hover:bg-slate-800/50 transition-smooth">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteOffer(offer.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-smooth">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== COUPONS TAB ====== */}
        {activeTab === 'coupons' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-white">Coupon Management</h2>
              <button
                onClick={() => { resetCouponForm(); setShowAddCoupon(true); }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:from-amber-500 hover:to-amber-400 transition-smooth shadow-lg shadow-amber-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Coupon
              </button>
            </div>

            {/* Add/Edit Coupon Form */}
            {(showAddCoupon || editingCoupon) && (
              <div className="glass rounded-2xl p-6 mb-6 border border-amber-500/20 animate-fadeIn">
                <h3 className="font-bold text-white text-base mb-4">{editingCoupon ? 'Edit Coupon Code' : 'Create New Coupon Code'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Coupon Code (e.g. SAVE20)</label>
                    <input
                      value={couponForm.code}
                      onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. WELCOME10"
                      className="text-sm font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <input
                      value={couponForm.description}
                      onChange={e => setCouponForm({...couponForm, description: e.target.value})}
                      placeholder="Short promo summary"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={e => setCouponForm({...couponForm, discountType: e.target.value as Coupon['discountType']})}
                      className="text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {couponForm.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={couponForm.discountValue}
                      onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Min Order Amount (₹) <span className="text-slate-600">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={couponForm.minOrderAmount}
                      onChange={e => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Max Discount Cap (₹) <span className="text-slate-600">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={couponForm.maxDiscountAmount}
                      onChange={e => setCouponForm({...couponForm, maxDiscountAmount: e.target.value})}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</label>
                    <button
                      type="button"
                      onClick={() => setCouponForm({...couponForm, active: !couponForm.active})}
                      className={`relative w-12 h-6 rounded-full transition-smooth ${couponForm.active ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth ${couponForm.active ? 'left-6' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs text-slate-400">{couponForm.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={resetCouponForm} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                  <button
                    onClick={editingCoupon ? handleUpdateCoupon : handleAddCoupon}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-smooth"
                  >
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </div>
            )}

            {/* Coupons List */}
            {coupons.length === 0 ? (
              <div className="text-center py-20 text-slate-500 glass rounded-2xl">
                <p className="text-4xl mb-3">🎟️</p>
                <p className="text-sm font-semibold">No coupons created yet</p>
                <p className="text-xs mt-1">Create promotional coupons for customers to use during checkout.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map(c => (
                  <div key={c.id} className={`glass rounded-2xl p-5 border transition-smooth ${c.active ? 'border-amber-500/30' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-extrabold text-amber-400 font-mono text-base px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {c.code}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                            {c.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        {c.description && <p className="text-sm text-slate-300 mb-2">{c.description}</p>}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="font-bold text-amber-400">
                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </span>
                          {c.minOrderAmount ? (
                            <span>Min Order: ₹{c.minOrderAmount.toFixed(2)}</span>
                          ) : (
                            <span>No Min Order</span>
                          )}
                          {c.maxDiscountAmount ? (
                            <span>Max Discount Cap: ₹{c.maxDiscountAmount.toFixed(2)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleCouponActive(c.id)} className={`p-2 rounded-lg transition-smooth ${c.active ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-800'}`} title="Toggle active">
                          {c.active ? '✅' : '⏸️'}
                        </button>
                        <button onClick={() => handleEditCoupon(c.id)} className="text-slate-400 hover:text-amber-400 p-2 rounded-lg hover:bg-slate-800/50 transition-smooth">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteCoupon(c.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-smooth">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
