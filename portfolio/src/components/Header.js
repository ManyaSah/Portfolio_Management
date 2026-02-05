"use client";

export default function Header() {
  const isDark = true;

  return (
    <header
      className={`${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      } shadow-sm h-16 flex items-center justify-between px-8 z-10 border-b`}
    >
      <h2 className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-700"}`}>
        Portfolio Overview
      </h2>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            Charlie
          </p>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Investor
          </p>
        </div>
        <div
          className={`${
            isDark ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-600"
          } h-10 w-10 rounded-full flex items-center justify-center font-bold`}
        >
          CK
        </div>
      </div>
    </header>
  );
}