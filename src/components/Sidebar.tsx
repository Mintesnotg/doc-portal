"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { sidebarConfig, type SidebarItem } from "@/config/sidebar.config";
import { filterSidebar } from "@/lib/sidebar";
import { useAuth } from "@/context/auth-context";

type OpenState = Record<string, boolean>;

const itemKey = (trail: string[]) => trail.join(" > ");

export function Sidebar() {
  const pathname = usePathname();
  const { permissions } = useAuth();

  const filteredItems = useMemo(
    () => filterSidebar(sidebarConfig, permissions),
    [permissions],
  );

  const [open, setOpen] = useState<OpenState>({});

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

  const renderItems = (items: SidebarItem[], trail: string[] = []) =>
    items.map((item) => {
      const key = itemKey([...trail, item.name]);
      const hasChildren = Boolean(item.children?.length);
      const isOpen = open[key] ?? true;
      const isActive =
        item.route && (pathname === item.route || pathname.startsWith(item.route + "/"));
      const Icon = item.icon;

      if (hasChildren) {
        return (
          <div key={key} className="space-y-1">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="w-full inline-flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200/90 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span className="inline-flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.name}
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden />
              )}
            </button>
            {isOpen ? (
              <div className="ml-4 border-l border-white/10 pl-3 space-y-1">
                {renderItems(item.children ?? [], [...trail, item.name])}
              </div>
            ) : null}
          </div>
        );
      }

      return (
        <Link
          key={key}
          href={item.route || "#"}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-200/90 hover:bg-white/5"
          }`}
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{item.name}</span>
        </Link>
      );
    });

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <aside className="hidden md:flex w-72 min-h-screen flex-col bg-slate-900 text-slate-100 border-r border-white/10 shadow-xl">
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Doc Portal</p>
        <p className="text-lg font-semibold text-white">Navigation</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {renderItems(filteredItems)}
      </nav>
    </aside>
  );
}

export default Sidebar;
