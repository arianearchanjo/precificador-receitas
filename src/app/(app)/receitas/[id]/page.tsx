import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, CabecalhoPagina, IconAlerta, IconLapis } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarMoeda, formatarNumero } from "@/lib/format";
import { custoItemNaReceita, precificar } from "@/lib/pricing";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Receita — Doces & Nós",
};

function CartaoNumero({
  rotulo,
  valor,
  detalhe,
  cor,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  cor?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <p className="label">{rotulo}</p>
      <p className={`mt-1.5 font-mono text-xl font-semibold tracking-tight ${cor ?? "text-ink"}`}>
        {valor}
      </p>
      {detalhe ? <p className="mt-0.5 text-xs text-ink-muted">{detalhe}</p> : null}
    </div>
  );
}

export default async function VisualizarReceitaPage(props: PageProps<"/receitas/[id]">) {
  await requireSession();
  const { id } = await props.params;

  const receita = await db.receita.findUnique({
    where: { id },
    include: {
      ingredientes: {
        include: { ingrediente: true },
      },
    },
  });

  if (!receita) {
    notFound();
  }

  const resultado = precificar({
    itens: receita.ingredientes.map((item) => ({
      ingrediente: {
        precoPago: Number(item.ingrediente.precoPago),
        quantidadeComprada: Number(item.ingrediente.quantidadeComprada),
      },
      quantidade: Number(item.quantidade),
    })),
    rendimento: receita.rendimento,
    horasTrabalho: Number(receita.horasTrabalho),
    valorHora: Number(receita.valorHora),
    custoEmbalagem: Number(receita.custoEmbalagem),
    custoGasEnergia: Number(receita.custoGasEnergia),
    custosAdicionais: Number(receita.custosAdicionais),
    margemPercentual: Number(receita.margemLucro),
    taxaPercentual: Number(receita.taxaCartao),
  });

  const itensDetalhados = receita.ingredientes
    .map((item) => ({
      id: item.ingredienteId,
      nome: item.ingrediente.nome,
      unidade: item.ingrediente.unidade,
      quantidade: Number(item.quantidade),
      custo: custoItemNaReceita({
        ingrediente: {
          precoPago: Number(item.ingrediente.precoPago),
          quantidadeComprada: Number(item.ingrediente.quantidadeComprada),
        },
        quantidade: Number(item.quantidade),
      }),
    }))
    .sort((a, b) => b.custo - a.custo);

  const participacoes = resultado.valido
    ? [
        { rotulo: "Ingredientes", valor: resultado.custoIngredientes, cor: "bg-brand-sage" },
        { rotulo: "Mão de obra", valor: resultado.custoMaoDeObra, cor: "bg-brand-gold" },
        { rotulo: "Custos fixos", valor: resultado.custosFixos, cor: "bg-ink-muted/40" },
      ]
    : [];
  const custoTotal = resultado.valido ? resultado.custoTotal : 0;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        secao="Receitas"
        titulo={receita.nome}
        voltar={{ href: "/receitas", rotulo: "Receitas" }}
        acoes={
          <Link href={`/receitas/${receita.id}/editar`}>
            <Button>
              <IconLapis className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      {!resultado.valido ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-line bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700"
        >
          <IconAlerta className="mt-0.5 h-4 w-4 shrink-0" />
          Não foi possível calcular o preço desta receita: {resultado.erros.join(" ")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="relative col-span-2 rounded-2xl border border-brand-gold/45 bg-brand-cream p-4 shadow-sm sm:p-5 lg:col-span-1">
            {receita.favorita ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="Favorita"
                role="img"
                className="absolute top-4 right-4 text-brand-gold-deep"
              >
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ) : null}
            <p className="label">Preço sugerido</p>
            <p className="mt-1.5 font-mono text-[1.7rem] leading-none font-semibold tracking-tight text-brand-gold-deep">
              {formatarMoeda(resultado.precoVenda)}
              <span className="ml-1 text-xs font-normal tracking-normal text-ink-muted">/un.</span>
            </p>
            <p className="mt-1.5 text-xs text-ink-muted">
              lote inteiro:{" "}
              <span className="font-mono font-medium">
                {formatarMoeda(resultado.precoVenda * receita.rendimento)}
              </span>
            </p>
          </div>
          <CartaoNumero
            rotulo="Custo por unidade"
            valor={formatarMoeda(resultado.custoPorUnidade)}
            detalhe={`rendimento de ${receita.rendimento} un.`}
          />
          <CartaoNumero
            rotulo="Lucro por unidade"
            valor={formatarMoeda(resultado.lucroPorUnidade)}
            cor={resultado.lucroPorUnidade >= 0 ? "text-brand-marrom" : "text-red-700"}
          />
          <CartaoNumero
            rotulo="Lucro do lote"
            valor={formatarMoeda(resultado.lucroTotal)}
            cor={resultado.lucroTotal >= 0 ? "text-brand-marrom" : "text-red-700"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="label mb-1 border-b border-line pb-3">Ingredientes da receita</h2>
          <ul>
            {itensDetalhados.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{item.nome}</p>
                  <p className="text-xs text-ink-muted">
                    {formatarNumero(item.quantidade)} {item.unidade}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-brand-marrom">
                  {Number.isNaN(item.custo) ? "—" : formatarMoeda(item.custo)}
                </p>
              </li>
            ))}
            {itensDetalhados.length === 0 ? (
              <li className="py-6 text-center text-sm text-ink-muted">
                Nenhum ingrediente vinculado.
              </li>
            ) : null}
          </ul>
        </section>

        <div className="flex flex-col gap-5">
          {resultado.valido ? (
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <h2 className="label mb-3 border-b border-line pb-3">De onde vem o custo</h2>
              <div
                aria-hidden="true"
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-brand-cream ring-1 ring-line"
              >
                {participacoes.map((p) =>
                  p.valor > 0 ? (
                    <span
                      key={p.rotulo}
                      className={p.cor}
                      style={{ width: `${(p.valor / custoTotal) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                {participacoes.map((p) => (
                  <div key={p.rotulo} className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${p.cor}`} />
                      {p.rotulo}
                    </dt>
                    <dd className="font-mono text-ink">
                      {formatarMoeda(p.valor)}
                      <span className="ml-1.5 text-xs text-ink-muted">
                        {custoTotal > 0 ? `${Math.round((p.valor / custoTotal) * 100)}%` : ""}
                      </span>
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-2 border-t border-line pt-2 font-semibold text-brand-marrom">
                  <dt>Custo total</dt>
                  <dd className="font-mono">{formatarMoeda(resultado.custoTotal)}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="label mb-3 border-b border-line pb-3">Parâmetros usados</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Margem de lucro</dt>
                <dd className="font-mono text-ink">{Number(receita.margemLucro)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Taxa de cartão</dt>
                <dd className="font-mono text-ink">{Number(receita.taxaCartao)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Mão de obra</dt>
                <dd className="font-mono text-ink">
                  {formatarNumero(Number(receita.horasTrabalho))} h ×{" "}
                  {formatarMoeda(Number(receita.valorHora))}
                </dd>
              </div>
              {Number(receita.custoEmbalagem) > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Embalagem</dt>
                  <dd className="font-mono text-ink">
                    {formatarMoeda(Number(receita.custoEmbalagem))}
                  </dd>
                </div>
              ) : null}
              {Number(receita.custoGasEnergia) > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Gás / energia</dt>
                  <dd className="font-mono text-ink">
                    {formatarMoeda(Number(receita.custoGasEnergia))}
                  </dd>
                </div>
              ) : null}
              {Number(receita.custosAdicionais) > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Outros custos</dt>
                  <dd className="font-mono text-ink">
                    {formatarMoeda(Number(receita.custosAdicionais))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
