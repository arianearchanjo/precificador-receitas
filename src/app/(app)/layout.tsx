import Image from "next/image";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { requireSession } from "@/lib/session";
import logoFundoVerde from "../../../logos/logo-fundo-verde.png";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-marrom/20 bg-brand-sage shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 sm:gap-4">
            <Image
              src={logoFundoVerde}
              alt="Doces & Nós"
              priority
              className="h-14 w-auto sm:h-20"
            />
            <span className="hidden flex-col leading-none md:flex">
              <span className="font-display text-2xl font-semibold tracking-wide text-white">
                Doces <span className="font-accent italic">&amp;</span> Nós
              </span>
              <span className="mt-1 text-[11px] font-medium tracking-[0.14em] uppercase text-brand-cream/90">
                Precificador
              </span>
            </span>
          </Link>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto sm:gap-1.5">
            <NavLink href="/">Painel</NavLink>
            <NavLink href="/receitas">Receitas</NavLink>
            <NavLink href="/ingredientes">Ingredientes</NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
      <footer className="border-t border-line py-4">
        <p className="text-center text-xs text-ink-muted">
          Doces <span className="font-accent italic">&amp;</span> Nós — uso interno
        </p>
      </footer>
    </div>
  );
}
