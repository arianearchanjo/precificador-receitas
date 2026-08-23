import Image from "next/image";
import Link from "next/link";
import logoFundoVerde from "../../../logos/logo-fundo-verde.png";
import { NavLink } from "@/components/nav-link";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-marrom/15 bg-brand-sage shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Image
              src={logoFundoVerde}
              alt="Doces & Nós"
              priority
              className="h-10 w-auto rounded-full sm:h-12"
            />
            <span className="hidden font-display text-xl font-semibold tracking-wide text-white sm:inline">
              Doces <span className="font-accent italic">&amp;</span> Nós
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <NavLink href="/">Receitas</NavLink>
            <NavLink href="/ingredientes">Ingredientes</NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden max-w-52 truncate text-xs text-brand-cream/70 lg:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
      <footer className="border-t border-line py-4">
        <p className="text-center text-xs text-ink-muted/70">
          Doces <span className="font-accent italic">&amp;</span> Nós — uso interno
        </p>
      </footer>
    </div>
  );
}
