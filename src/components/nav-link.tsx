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
      className={`label rounded-lg px-2.5 py-2 transition-colors sm:px-3.5 ${
        ativo
          ? "bg-white/15 text-white"
          : "text-brand-cream/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
