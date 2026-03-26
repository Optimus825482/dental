"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "grid_view", label: "Başlat", href: "/" },
  { icon: "calendar_today", label: "Takvim", href: "/appointments" },
  { icon: "person_add", label: "Kabul", href: "/patients" },
  { icon: "person", label: "Profil", href: "/settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 flex md:hidden justify-around items-center px-4 pb-6 h-20 bg-white/95 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[24px]">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-colors ${
              isActive
                ? "text-primary bg-primary/5 rounded-2xl px-4 py-1 -translate-y-0.5"
                : "text-on-surface-variant/50 hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-semibold mt-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}
    </footer>
  );
}
