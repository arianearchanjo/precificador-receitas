import Link from "next/link";
import { Button, CabecalhoPagina, IconPlus, IconSetaDireita } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarMoeda, type ReceitaResumo } from "@/lib/format";
import { carregarResumos } from "@/lib/resumos";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Painel — Doces & Nós",
};

function CartaoStat({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="label">{rotulo}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-brand-marrom">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs font-medium text-ink-muted">{detalhe}</p> : null}
    </div>
  );
}

function LinhaReceita({ receita }: { receita: ReceitaResumo }) {
  return (
    <li>
      <Link
        href={`/receitas/${receita.id}`}
        className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-cream/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-sage"
      >
        <span className="flex min-w-0 items-center gap-2">
          {receita.favorita ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="shrink-0 text-brand-gold-deep"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ) : null}
          <span className="truncate text-sm font-medium text-ink transition-colors group-hover:text-brand-marrom">
            {receita.nome}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-brand-gold-deep">
            {receita.precoVenda === null ? "—" : formatarMoeda(receita.precoVenda)}
          </span>
          <IconSetaDireita className="h-4 w-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </Link>
    </li>
  );
}

export default async function PainelPage() {
  await requireSession();

  const [resumos, totalIngredientes] = await Promise.all([
    carregarResumos(),
    db.ingrediente.count(),
  ]);

  const precos = resumos
    .map((r) => r.precoVenda)
    .filter((preco): preco is number => preco !== null);
  const lucros = resumos
    .map((r) => r.lucroTotal)
    .filter((lucro): lucro is number => lucro !== null);

  const ticketMedio = precos.length > 0 ? precos.reduce((a, b) => a + b, 0) / precos.length : null;
  const lucroMedioLote =
    lucros.length > 0 ? lucros.reduce((a, b) => a + b, 0) / lucros.length : null;
  const favoritas = resumos.filter((r) => r.favorita);

  return (
    <div className="flex flex-col gap-8">
      <CabecalhoPagina
        secao="Painel"
        titulo="Visão geral"
        descricao="Um resumo do seu catálogo: preços médios, receitas em destaque e novidades."
      />

      {resumos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
          <p className="font-display text-3xl font-semibold text-brand-marrom">
            Bem-vindo(a) ao seu precificador
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
            Em dois passos você vê o preço ideal de cada receita: cadastre os ingredientes com o
            preço de compra e monte a primeira receita.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link href="/ingredientes">
              <Button variant="outline">1. Cadastrar ingredientes</Button>
            </Link>
            <Link href="/receitas/nova">
              <Button>
                <IconPlus className="h-4 w-4" />
                2. Criar primeira receita
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <CartaoStat
              rotulo="Receitas"
              valor={String(resumos.length)}
              detalhe={
                favoritas.length > 0
                  ? `${favoritas.length} favorita${favoritas.length === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <CartaoStat rotulo="Ingredientes" valor={String(totalIngredientes)} />
            <CartaoStat
              rotulo="Ticket médio"
              valor={ticketMedio === null ? "—" : formatarMoeda(ticketMedio)}
              detalhe="preço por unidade"
            />
            <CartaoStat
              rotulo="Lucro médio/lote"
              valor={lucroMedioLote === null ? "—" : formatarMoeda(lucroMedioLote)}
              detalhe="por fornada"
            />
          </dl>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3">
                <h2 className="text-sm font-semibold tracking-[0.08em] text-brand-marrom uppercase">
                  Receitas em destaque
                </h2>
                <Link
                  href="/receitas"
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-brand-marrom"
                >
                  Ver todas
                  <IconSetaDireita className="h-3.5 w-3.5" />
                </Link>
              </div>
              <ul className="flex flex-col gap-0.5">
                {(favoritas.length > 0 ? favoritas : resumos).slice(0, 5).map((receita) => (
                  <LinhaReceita key={receita.id} receita={receita} />
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-5">
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <h2 className="label mb-4 border-b border-line pb-3">Ações rápidas</h2>
                <div className="flex flex-col gap-2">
                  <Link href="/receitas/nova">
                    <Button className="w-full justify-start">
                      <IconPlus className="h-4 w-4" />
                      Nova receita
                    </Button>
                  </Link>
                  <Link href="/ingredientes">
                    <Button variant="outline" className="w-full justify-start">
                      Gerenciar ingredientes
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-gold/40 bg-gradient-to-b from-white to-brand-cream/60 p-5 shadow-sm sm:p-6">
                <h2 className="label mb-2">Dica</h2>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Editar o preço de um ingrediente atualiza todas as receitas automaticamente —
                  mantenha a biblioteca em dia para não vender no prejuízo.
                </p>
              </div>
            </section>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-[0.08em] text-brand-marrom uppercase">
                Atualizadas recentemente
              </h2>
              <Link
                href="/receitas"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-brand-marrom"
              >
                Ver todas
                <IconSetaDireita className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-2 shadow-sm">
              <ul className="flex flex-col gap-0.5">
                {resumos.slice(0, 5).map((receita) => (
                  <LinhaReceita key={receita.id} receita={receita} />
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
