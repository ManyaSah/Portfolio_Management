"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;

  const linkClass = (href) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
      isActive(href)
        ? "bg-slate-800 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  const iconClass = (href) =>
    `w-5 h-5 ${isActive(href) ? "text-emerald-400" : "text-slate-400"}`;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-emerald-400">
          Charlie Portfolio
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/"
          className={linkClass("/")}
        >
          <svg className={iconClass("/")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </Link>

        <Link
          href="/stocks"
          className={linkClass("/stocks")}
        >
          <svg className={iconClass("/stocks")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          <span>Stocks</span>
        </Link>

        <Link
          href="/alerts"
          className={linkClass("/alerts")}
        >
          <svg className={iconClass("/alerts")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Alerts</span>
        </Link>
      </nav>
    </aside>
  );
}