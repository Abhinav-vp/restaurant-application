'use client'

import React, { useState } from "react";
import Link from "next/link";
import { login } from "../auth/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 relative selection:bg-amber-500 selection:text-slate-900">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 glass-light sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-red-500 flex items-center justify-center shadow-lg">
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
          <a href="/" className="hover:text-amber-400 transition-smooth">Home</a>
          <a href="/signup" className="hover:text-amber-400 transition-smooth">Sign Up</a>
          <a href="/login" className="hover:text-amber-400 transition-smooth">Sign In</a>
        </div>

        <div />
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md glass rounded-3xl p-8 glow fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-surface-400 text-sm text-center mb-8">
          Log in with your credentials to access your dashboard.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex gap-3 items-start">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-surface-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold">
            Create Account
          </Link>
        </p>
        </div>
      </div>

      <footer className="py-12 text-center text-slate-500 border-t border-slate-900 bg-slate-950/60 text-xs">
        <p className="mb-2">ABR Asma Restaurant &copy; {new Date().getFullYear()} – Traditional Taste of Malabar.</p>
        <p className="text-slate-600/80">Powered by Next.js and integrated with OrderFlow Dashboard client mapping.</p>
      </footer>
    </div>
  );
}
