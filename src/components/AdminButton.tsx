"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Check if admin-auth cookie is set
        const match = document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith('admin-auth='));
        if (match && match.split('=')[1]) {
          if (mounted) setIsAdmin(true);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const adminListRaw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "");
        const adminList = adminListRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

        if (user && user.email) {
          if (mounted) setIsAdmin(adminList.includes(user.email.toLowerCase()));
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Link href="/dashboard" className="btn-primary px-4 py-3 rounded-full shadow-lg flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18"/></svg>
        Admin
      </Link>
    </div>
  );
}
