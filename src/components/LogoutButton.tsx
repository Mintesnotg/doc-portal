"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function LogoutButton() {
  const router = useRouter();
  const { setPermissions } = useAuth();

  const handleLogout = async () => {
    localStorage.removeItem("user");
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // ignore network errors on logout
    }
    setPermissions([]);
    router.replace("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      Logout
    </button>
  );
}
