"use client";

import React from "react";

export default function LoginPlaceholder() {
  const adminRaw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const firstAdmin = adminRaw.split(",").map(s => s.trim()).filter(Boolean)[0] || "admin@example.com";

  const signInAsAdmin = () => {
    // Set demo cookie expected by the dashboard server page and redirect
    document.cookie = `demo-user=${encodeURIComponent(firstAdmin)}; path=/`;
    window.location.href = "/dashboard";
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Sign in (dev)</h1>
      <p>The production sign-in flow is disabled. Use the button below to access the dashboard during development.</p>
      <div style={{ marginTop: 20 }}>
        <button onClick={signInAsAdmin} style={{ padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "white", border: "none" }}>
          Sign in as {firstAdmin}
        </button>
      </div>
      <p style={{ marginTop: 12, color: "#9ca3af" }}>
        Note: This is a dev-only shortcut. Remove before production.
      </p>
    </div>
  );
}
