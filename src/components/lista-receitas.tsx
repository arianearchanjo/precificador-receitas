"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { alternarFavorita, excluirReceita } from "@/app/actions/receitas";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BuscaInput, Button, IconLixeira, IconPlus, Paginacao } from "@/components/ui";
import type { ReceitaResumo } from "@/lib/format";
import { formatarMoeda, normalizarParaBusca } from "@/lib/format";

const ITENS_POR_PAGINA = 9;

const acaoSobreposta =
  "relative z-10 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage disabled:cursor-not-allowed disabled:opacity-50";

function BotaoFavorita({ receita }: { receita: ReceitaResumo }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    await alternarFavorita(receita.id);
    setCarregando(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={carregando}
      title={receita.favorita ? "Remover dos favoritos" : "Marcar como favorita"}
      aria-label={receita.favorita ? "Remover dos favoritos" : "Marcar como favorita"}
      className={`${acaoSobreposta} -m-1.5 rounded-full p-1.5 ${
        receita.favorita ? "text-brand-gold-deep" : "text-ink-muted/50 hover:text-brand-gold-deep"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={receita.favorita ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-cream px-2.5 py-1 text-xs font-medium text-ink-muted ring-1 ring-line">
      {children}
    </span>
  );
}

function CartaoReceita({
  receita,
  aoExcluir,
}: {
  receita: ReceitaResumo;
  aoExcluir: (receita: ReceitaResumo) => void;
}) {
  return (
    <li
      className={`group relative flex flex-col rounded-2xl border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        receita.favorita
          ? "border-brand-gold/60 ring-1 ring-brand-gold/25"
          : "border-line hover:border-brand-sage/40"
      }`}
    >
      {/* O cartão inteiro abre a receita; ações ficam acima do link (z-10). */}
      <Link
        href={`/receitas/${receita.id}`}
        aria-label={`Abrir receita ${receita.nome}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-sage"
      />

      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-xl leading-snug font-semibold text-ink transition-colors group-hover:text-brand-marrom">
          {receita.nome}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5">
          <BotaoFavorita receita={receita} />
          <button
            type="button"
            onClick={() => aoExcluir(receita)}
            title="Excluir receita"
            aria-label={`Excluir receita ${receita.nome}`}
            className={`${acaoSobreposta} -m-1.5 rounded-full p-1.5 text-ink-muted/60 hover:bg-red-50 hover:text-red-700`}
          >
            <IconLixeira className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <dl className="mt-4">
        <div>
          <dt className="label mb-1">Preço sugerido</dt>
          <dd
            className={`font-mono text-[1.55rem] leading-none font-semibold tracking-tight sm:text-[1.7rem] ${
              receita.precoVenda === null ? "text-ink-muted/50" : "text-brand-gold-deep"
            }`}
          >
            {receita.precoVenda === null ? "—" : formatarMoeda(receita.precoVenda)}
          </dd>
        </div>
        <div className="mt-3 flex items-end justify-between gap-4 border-t border-line pt-3">
          <div>
            <dt className="label mb-1">Custo/un.</dt>
            <dd className="font-mono text-sm leading-snug font-medium text-ink">
              {receita.custoPorUnidade === null ? "—" : formatarMoeda(receita.custoPorUnidade)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="label mb-1">Lucro lote</dt>
            <dd
              className={`font-mono text-sm leading-snug font-semibold ${
                receita.lucroTotal === null
                  ? "text-ink-muted/50"
                  : (receita.lucroTotal ?? 0) >= 0
                    ? "text-brand-marrom"
                    : "text-red-700"
              }`}
            >
              {receita.lucroTotal === null ? "—" : formatarMoeda(receita.lucroTotal)}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <Chip>
          Rende {receita.rendimento} {receita.rendimento === 1 ? "unidade" : "unidades"}
        </Chip>
        <Chip>margem {receita.margemLucro}%</Chip>
        <Chip>taxa {receita.taxaCartao}%</Chip>
      </div>
    </li>
  );
}

export function ListaReceitas({ receitas }: { receitas: ReceitaResumo[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [excluindo, setExcluindo] = useState<ReceitaResumo | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  async function confirmarExclusao() {
    if (!excluindo) return;
    setErroExclusao(null);
    setExcluindoId(excluindo.id);
    const resultado = await excluirReceita(excluindo.id);
    setExcluindoId(null);
    if (!resultado.ok) {
      setErroExclusao(resultado.erro);
      return;
    }
    setExcluindo(null);
    router.refresh();
  }

  const termo = normalizarParaBusca(busca.trim());
  const filtradas = useMemo(
    () =>
      termo === "" ? receitas : receitas.filter((r) => normalizarParaBusca(r.nome).includes(termo)),
    [receitas, termo],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const [pagina, setPagina] = useState(1);
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );

  if (receitas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-brand-marrom">Comece pelo básico</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Cadastre seus ingredientes e monte a primeira receita para ver o preço sugerido.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link href="/ingredientes">
            <Button variant="outline">Cadastrar ingredientes</Button>
          </Link>
          <Link href="/receitas/nova">
            <Button>
              <IconPlus className="h-4 w-4" />
              Criar primeira receita
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <BuscaInput
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar receita..."
          aria-label="Buscar receita por nome"
          className="w-full sm:max-w-xs"
        />
        {termo !== "" ? (
          <p className="text-sm text-ink-muted" role="status">
            {filtradas.length === 0
              ? "Nenhuma receita encontrada"
              : `${filtradas.length} de ${receitas.length}`}
          </p>
        ) : null}
        <Button onClick={() => router.push("/receitas/nova")} className="ml-auto w-full sm:w-auto">
          <IconPlus className="h-4 w-4" />
          Nova receita
        </Button>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Nenhuma receita encontrada para “{busca.trim()}”
          </p>
          <Button variant="ghost" onClick={() => setBusca("")} className="mt-3">
            Limpar busca
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visiveis.map((receita) => (
              <CartaoReceita key={receita.id} receita={receita} aoExcluir={setExcluindo} />
            ))}
          </ul>
          <Paginacao
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            aoMudar={(p) => {
              setPagina(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}

      <ConfirmDialog
        titulo="Excluir receita?"
        descricao={excluindo ? `"${excluindo.nome}" será excluída definitivamente.` : ""}
        confirmarRotulo="Excluir"
        aberto={Boolean(excluindo)}
        onMudouAbertura={(aberto) => {
          if (!aberto) {
            setExcluindo(null);
            setErroExclusao(null);
          }
        }}
        onConfirmar={confirmarExclusao}
        carregando={excluindoId !== null}
        erro={erroExclusao}
      />
    </div>
  );
}
