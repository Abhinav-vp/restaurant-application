"use client"

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; price: number; image?: string | null };
type Order = { id: string; customer_name: string; customer_email: string; product_name: string; quantity: number; price: number; status: string; created_at: string };

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Load products from localStorage as primary (admin-managed in this simplified panel)
    const local = localStorage.getItem("orderflow_products");
    if (local) setProducts(JSON.parse(local));
    else {
      const sample: Product[] = [
        { id: "p1", name: "Sample Dish", price: 99.0 },
      ];
      setProducts(sample);
      localStorage.setItem("orderflow_products", JSON.stringify(sample));
    }

    const localOrders = localStorage.getItem("orderflow_orders");
    if (localOrders) setOrders(JSON.parse(localOrders));
    else setOrders([]);
  }, []);

  const addProduct = () => {
    const name = prompt("Product name") || "New Product";
    const price = parseFloat(prompt("Price") || "0") || 0;
    const p = { id: Math.random().toString(36).slice(2,9), name, price };
    const next = [p, ...products];
    setProducts(next);
    localStorage.setItem("orderflow_products", JSON.stringify(next));
    window.dispatchEvent(new Event('orderflow_products_updated'));
  };

  const deleteProduct = (id: string) => {
    if (!confirm("Delete product?")) return;
    const next = products.filter(p => p.id !== id);
    setProducts(next);
    localStorage.setItem("orderflow_products", JSON.stringify(next));
    window.dispatchEvent(new Event('orderflow_products_updated'));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="text-sm text-slate-500">Signed in as {userEmail || 'dev-admin'}</div>
        </header>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Products</h2>
            <button onClick={addProduct} className="btn-primary">Add Product</button>
          </div>
          <div className="bg-surface-900 rounded-xl p-4">
            {products.length === 0 ? (
              <div className="text-slate-400">No products</div>
            ) : (
              <ul className="space-y-3">
                {products.map(p => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-400">₹{p.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <button onClick={() => deleteProduct(p.id)} className="text-danger">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
          <div className="bg-surface-900 rounded-xl p-4">
            {orders.length === 0 ? (
              <div className="text-slate-400">No orders yet</div>
            ) : (
              <ul className="space-y-2">
                {orders.map(o => (
                  <li key={o.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{o.product_name}</div>
                      <div className="text-xs text-slate-400">{o.customer_name} — {o.customer_email}</div>
                    </div>
                    <div className="text-sm">₹{(o.price*o.quantity).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
