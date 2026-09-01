'use client'

import React, { useState, useEffect } from "react";
import { signout } from "../auth/actions";
import { createClient } from "@/lib/supabase/client";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: "1",
    customer_name: "Alice Johnson",
    customer_email: "alice@example.com",
    product_name: "MacBook Pro M3",
    quantity: 1,
    price: 1999.00,
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "2",
    customer_name: "Bob Smith",
    customer_email: "bob@example.com",
    product_name: "iPhone 15 Pro",
    quantity: 2,
    price: 999.00,
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "3",
    customer_name: "Charlie Brown",
    customer_email: "charlie@example.com",
    product_name: "iPad Air",
    quantity: 1,
    price: 599.00,
    status: "processing",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
];

export default function DashboardClient({
  userEmail,
  isConfigured,
}: {
  userEmail: string;
  isConfigured: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  
  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Order Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(9.99);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setProdLoading(true);
    if (!isConfigured) {
      const local = localStorage.getItem("orderflow_products");
      if (local) {
        setProducts(JSON.parse(local));
      } else {
        localStorage.setItem("orderflow_products", JSON.stringify(INITIAL_MOCK_PRODUCTS));
        setProducts(INITIAL_MOCK_PRODUCTS);
      }
      setProdLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch products error:", error);
        const local = localStorage.getItem("orderflow_products") || "[]";
        setProducts(JSON.parse(local));
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProdLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    if (!isConfigured) {
      // Local storage support
      const local = localStorage.getItem("orderflow_orders");
      if (local) {
        setOrders(JSON.parse(local));
      } else {
        localStorage.setItem("orderflow_orders", JSON.stringify(INITIAL_MOCK_ORDERS));
        setOrders(INITIAL_MOCK_ORDERS);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        // Fallback to local storage
        const local = localStorage.getItem("orderflow_orders") || "[]";
        setOrders(JSON.parse(local));
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const newOrder = {
      customer_name: customerName,
      customer_email: customerEmail,
      product_name: productName,
      quantity,
      price: Number(price),
      status: "pending" as const,
    };

    if (!isConfigured) {
      // Save locally
      const fullOrder: Order = {
        ...newOrder,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      const updated = [fullOrder, ...orders];
      setOrders(updated);
      localStorage.setItem("orderflow_orders", JSON.stringify(updated));
      setIsModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("orders")
        .insert({
          ...newOrder,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setOrders([data, ...orders]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!isConfigured) {
      const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      setOrders(updated);
      localStorage.setItem("orderflow_orders", JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update status in Database");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    if (!isConfigured) {
      const updated = orders.filter(o => o.id !== orderId);
      setOrders(updated);
      localStorage.setItem("orderflow_orders", JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete order in Database");
    }
  };

  // --- Product handlers ---
  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName("");
    setProdPrice(9.99);
    setProdImage("");
    setProdActionError(null);
    setProdSubmitting(false);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdImage(p.image || "");
    setIsProdModalOpen(true);
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdSubmitting(true);
    setProdActionError(null);

    const payload = {
      name: prodName,
      price: Number(prodPrice),
      image: prodImage || null,
    };

    if (!isConfigured) {
      if (editingProductId) {
        const updated = products.map(p => p.id === editingProductId ? { ...p, ...payload } : p);
        setProducts(updated);
        localStorage.setItem("orderflow_products", JSON.stringify(updated));
      } else {
        const newProd: Product = { id: Math.random().toString(36).slice(2, 9), ...payload, created_at: new Date().toISOString() } as Product;
        const updated = [newProd, ...products];
        setProducts(updated);
        localStorage.setItem("orderflow_products", JSON.stringify(updated));
      }
      setIsProdModalOpen(false);
      resetProductForm();
      return setProdSubmitting(false);
    }

    try {
      if (editingProductId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProductId);
        if (error) throw error;
        await fetchProducts();
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setProducts([data, ...products]);
      }
      setIsProdModalOpen(false);
      resetProductForm();
    } catch (err: any) {
      setProdActionError(err.message || "Failed to save product");
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    if (!isConfigured) {
      const updated = products.filter(p => p.id !== productId);
      setProducts(updated);
      localStorage.setItem("orderflow_products", JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete product in Database");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setProductName("");
    setQuantity(1);
    setPrice(9.99);
  };

  // --- Products (Admin) ---
  interface Product {
    id: string;
    name: string;
    price: number;
    image?: string | null;
    created_at?: string;
  }

  const INITIAL_MOCK_PRODUCTS: Product[] = [
    { id: "p1", name: "Sample Pizza", price: 9.99, image: "", created_at: new Date().toISOString() },
    { id: "p2", name: "Sample Burger", price: 6.99, image: "", created_at: new Date().toISOString() },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(9.99);
  const [prodImage, setProdImage] = useState("");
  const [prodActionError, setProdActionError] = useState<string | null>(null);
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Calculations
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "processing").length;
  const completedRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (o.price * o.quantity), 0);
  const pendingRevenue = orders
    .filter(o => o.status === "pending" || o.status === "processing")
    .reduce((sum, o) => sum + (o.price * o.quantity), 0);

  return (
    <div className="min-h-screen flex flex-col pb-12">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 glass-light sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">
            Order<span className="text-primary-400">Flow</span>
          </span>
        </div>

        {/* Products Management Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Products</h3>
            <div className="flex items-center gap-3">
              <button onClick={() => { resetProductForm(); setIsProdModalOpen(true); }} className="btn-primary text-sm">Add Product</button>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            {prodLoading ? (
              <div className="py-12 text-center text-surface-400">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-surface-400">No products yet. Create one to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-800 text-xs font-semibold uppercase tracking-wider text-surface-400 bg-surface-900/35">
                      <th className="py-3 px-4">Image</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-800/50">
                    {products.map((p) => (
                      <tr key={p.id} className="group hover:bg-surface-800/20 transition-smooth">
                        <td className="py-3 px-4 w-24">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-20 h-12 object-cover rounded-md" />
                          ) : (
                            <div className="w-20 h-12 bg-surface-800 rounded-md flex items-center justify-center text-xs text-surface-500">No Image</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.name}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">${p.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditProduct(p)} className="p-2 text-surface-400 hover:text-white rounded-lg">Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs text-surface-400">Logged in as</span>
            <span className="text-sm font-semibold text-white">{userEmail}</span>
          </div>
          <button 
            onClick={async () => {
              await signout();
            }} 
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-8 mt-8 flex-1">
        {/* Banner Alert for Demo Mode */}
        {!isConfigured && (
          <div className="mb-8 p-6 rounded-2xl glass-light border border-indigo-500/20 text-surface-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                  Running in Demo Mode
                </h3>
                <p className="text-sm text-surface-400 mt-1">
                  Database keys are not fully set. Save actions will write to browser LocalStorage. Get full persistence by connecting Supabase.
                </p>
              </div>
              <button 
                onClick={() => setIsSetupGuideOpen(!isSetupGuideOpen)} 
                className="btn-primary text-sm whitespace-nowrap self-start md:self-center"
              >
                {isSetupGuideOpen ? "Hide Setup Instructions" : "Connect Production Supabase"}
              </button>
            </div>

            {isSetupGuideOpen && (
              <div className="mt-6 border-t border-surface-700/50 pt-6 animate-fadeIn">
                <h4 className="font-bold text-white mb-2">Step 1: Run SQL in Supabase Dashboard</h4>
                <p className="text-xs text-surface-400 mb-3">
                  Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary-400 underline">Database SQL Editor</a>, paste and run:
                </p>
                <pre className="p-4 rounded-xl bg-surface-900/80 border border-surface-800 text-[11px] text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed mb-6">
{`create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  customer_name text not null,
  customer_email text not null,
  product_name text not null,
  quantity integer not null,
  price numeric(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table orders enable row level security;

create policy "Users can modify their own orders"
  on orders for all
  using (auth.uid() = user_id);`}
                </pre>

                <h4 className="font-bold text-white mb-2">Step 2: Add Keys to .env.local</h4>
                <p className="text-xs text-surface-400 mb-2">
                  Open `.env.local` in your root project folder and set your credentials:
                </p>
                <pre className="p-4 rounded-xl bg-surface-900/80 border border-surface-800 text-xs text-indigo-300 font-mono overflow-x-auto mb-4">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-project-anon-key`}
                </pre>
                <p className="text-xs text-warning">
                  * Note: After updating environment variables, you must restart your dev server.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Orders",
              value: totalOrders,
              change: "All orders listed",
              icon: (
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              ),
            },
            {
              title: "Active Orders",
              value: activeOrders,
              change: "Pending & processing",
              icon: (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: "Completed Revenue",
              value: `$${completedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: "Cleared earnings",
              icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m3.499-1.996A12.03 12.03 0 0012 18c-3.325 0-6.137-2.316-6.499-5.496a12.03 12.03 0 0011.998 0zm0 0c.362-3.18 3.174-5.496 6.499-5.496a12.03 12.03 0 00-11.998 0z" />
                </svg>
              ),
            },
            {
              title: "Pending Revenue",
              value: `$${pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: "Awaiting resolution",
              icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
            },
          ].map((stat, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 hover:scale-[1.01] transition-smooth cursor-default">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-surface-400">{stat.title}</span>
                <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stat.value}</h3>
              <p className="text-xs text-surface-500">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Toolbar Section */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 glass rounded-2xl p-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
            {["all", "pending", "processing", "completed", "cancelled"].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-smooth ${
                  statusFilter === filter
                    ? "bg-primary-600 text-white"
                    : "glass text-surface-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search and Action Button */}
          <div className="flex items-center gap-3 w-full md:w-auto self-stretch">
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 py-2 text-sm"
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Order
            </button>
          </div>
        </div>

        {/* Table/List View */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></span>
              <span className="text-sm text-surface-400">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h3 className="text-lg font-bold text-white">No Orders Found</h3>
              <p className="text-sm text-surface-500 mt-1 max-w-xs mx-auto">
                No orders match your filter criteria or search. Create a new one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-800 text-xs font-semibold uppercase tracking-wider text-surface-400 bg-surface-900/35">
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6 text-center">Qty</th>
                    <th className="py-4 px-6">Total Price</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-800/20 transition-smooth group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{order.customer_name}</div>
                        <div className="text-xs text-surface-550">{order.customer_email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white">{order.product_name}</span>
                      </td>
                      <td className="py-4 px-6 text-center text-white font-medium">
                        {order.quantity}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        ${(order.price * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm text-surface-450">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                          className={`text-xs font-bold rounded-lg px-2 py-1 bg-transparent cursor-pointer border focus:ring-0 ${
                            order.status === "completed"
                              ? "text-success border-success/30 bg-success/5"
                              : order.status === "processing"
                              ? "text-indigo-400 border-indigo-400/30 bg-indigo-500/5"
                              : order.status === "pending"
                              ? "text-warning border-warning/30 bg-warning/5"
                              : "text-danger border-danger/30 bg-danger/5"
                          }`}
                        >
                          <option value="pending" className="bg-surface-900 text-warning font-bold">Pending</option>
                          <option value="processing" className="bg-surface-900 text-indigo-400 font-bold">Processing</option>
                          <option value="completed" className="bg-surface-900 text-success font-bold">Completed</option>
                          <option value="cancelled" className="bg-surface-900 text-danger font-bold">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-surface-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-smooth"
                          title="Delete Order"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Drawer: Create Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass rounded-3xl p-8 glow relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-surface-400 hover:text-white rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Create New Order</h3>
            <p className="text-sm text-surface-400 mb-6">Fill in details to place a customer request.</p>

            {actionError && (
              <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Customer Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Pro"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-3.5"
                >
                  {isSubmitting ? "Creating..." : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Drawer: Create / Edit Product */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass rounded-3xl p-8 glow relative">
            <button
              onClick={() => { setIsProdModalOpen(false); resetProductForm(); }}
              className="absolute top-6 right-6 p-2 text-surface-400 hover:text-white rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-2">{editingProductId ? "Edit Product" : "Create Product"}</h3>
            <p className="text-sm text-surface-400 mb-6">Provide product details to display in the menu.</p>

            {prodActionError && (
              <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                {prodActionError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Image URL</label>
                <input type="url" placeholder="https://...jpg" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
                {prodImage && (
                  <div className="mt-3">
                    <img src={prodImage} alt="preview" className="w-40 h-24 object-cover rounded-md" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Name</label>
                <input type="text" required placeholder="Product name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Price ($)</label>
                <input type="number" step="0.01" min="0.01" required value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsProdModalOpen(false); resetProductForm(); }} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={prodSubmitting} className="flex-1 btn-primary py-3.5">{prodSubmitting ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
