"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={`rounded-full px-2.5 py-1.5 text-[13px] font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream sm:px-3.5 sm:text-sm ${
        ativo
          ? "bg-brand-cream text-brand-marrom shadow-sm"
          : "text-brand-cream hover:bg-white/15 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
