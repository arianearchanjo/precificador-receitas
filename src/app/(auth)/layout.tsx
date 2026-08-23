import type { Metadata } from "next";
import Image from "next/image";
import logoFundoClaro from "../../../logos/logo-fundo-claro.png";
import logoFundoVerde from "../../../logos/logo-fundo-verde.png";

export const metadata: Metadata = {
  title: "Entrar — Doces & Nós",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Painel da marca — visível apenas em telas grandes */}
      <aside className="relative hidden items-center justify-center overflow-hidden bg-brand-sage lg:flex">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[26rem] w-[26rem] rounded-full border border-brand-cream/15" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-[22rem] w-[22rem] rounded-full border border-brand-cream/10" />
        <div className="pointer-events-none absolute -right-36 -bottom-44 h-[30rem] w-[30rem] rounded-full border border-brand-cream/10" />
        <div className="pointer-events-none absolute -right-28 -bottom-36 h-96 w-96 rounded-full border border-brand-cream/15" />

        <div className="relative flex flex-col items-center gap-8 px-14 text-center">
          <div className="rounded-full border border-brand-cream/25 p-4">
            <Image
              src={logoFundoVerde}
              alt="Logotipo Doces & Nós"
              priority
              className="h-60 w-auto rounded-full"
            />
          </div>
          <p className="max-w-sm font-display text-4xl leading-tight font-medium text-brand-cream">
            Cada receita com o <span className="font-accent italic">seu</span> preço justo.
          </p>
          <p className="label !text-brand-cream/90">Precificador de receitas</p>
        </div>
      </aside>

      {/* Detalhes decorativos — eco do painel verde, apenas no mobile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden lg:hidden"
      >
        <div className="absolute -top-24 -left-24 h-60 w-60 rounded-full border border-brand-sage/20" />
        <div className="absolute -top-16 right-8 h-40 w-40 rounded-full border border-brand-gold/25" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full border border-brand-sage/10" />
      </div>

      {/* Formulário */}
      <main className="relative flex flex-col items-center justify-center px-6 pt-20 pb-14 sm:px-8">
        <div className="mb-9 flex flex-col items-center gap-4 text-center lg:hidden">
          <Image
            src={logoFundoClaro}
            alt="Logotipo Doces & Nós"
            priority
            className="h-28 w-auto drop-shadow-sm sm:h-32"
          />
          <p className="max-w-xs font-display text-[1.7rem] leading-snug font-medium text-brand-marrom">
            Cada receita com o <span className="font-accent italic text-brand-sage">seu</span> preço
            justo.
          </p>
          <p className="label">Precificador de receitas</p>
        </div>
        {children}
      </main>
    </div>
  );
}
