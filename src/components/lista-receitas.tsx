"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { alternarFavorita, excluirReceita } from "@/app/actions/receitas";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui";
import type { ReceitaResumo } from "@/lib/format";
import { formatarMoeda } from "@/lib/format";

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
      className={`-m-1.5 shrink-0 rounded-full p-1.5 transition-colors hover:bg-brand-sage/10 disabled:opacity-50 ${
        receita.favorita ? "text-brand-gold" : "text-ink-muted/40 hover:text-brand-gold/70"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={receita.favorita ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </button>
  );
}

export function ListaReceitas({ receitas }: { receitas: ReceitaResumo[] }) {
  const router = useRouter();
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

  const favoritas = receitas.filter((r) => r.favorita).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {receitas.length === 0
            ? "Nenhuma receita ainda"
            : `${receitas.length} ${receitas.length === 1 ? "receita" : "receitas"}${
                favoritas > 0 ? ` · ${favoritas} favorita${favoritas === 1 ? "" : "s"}` : ""
              }`}
        </p>
        <Button onClick={() => router.push("/receitas/nova")} className="w-full sm:w-auto">
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          Nova receita
        </Button>
      </div>

      {receitas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl text-ink">Comece pelo básico</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Cadastre seus ingredientes e monte a primeira receita para ver o preço sugerido.
          </p>
          <Link href="/ingredientes" className="mt-5 inline-block">
            <Button variant="outline">Cadastrar ingredientes</Button>
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {receitas.map((receita) => (
            <li
              key={receita.id}
              className={`group flex flex-col rounded-2xl border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                receita.favorita
                  ? "border-brand-gold/70 bg-gradient-to-b from-white to-brand-cream/50"
                  : "border-line hover:border-brand-sage/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl leading-snug font-semibold text-ink">
                  <Link
                    href={`/receitas/${receita.id}`}
                    className="transition-colors group-hover:text-brand-marrom"
                  >
                    {receita.nome}
                  </Link>
                </h2>
                <BotaoFavorita receita={receita} />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="label mb-0.5">Preço sugerido</p>
                  <p
                    className={`font-mono text-2xl font-semibold tracking-tight ${
                      receita.precoVenda === null ? "text-ink-muted/40" : "text-brand-gold"
                    }`}
                  >
                    {receita.precoVenda === null ? "—" : formatarMoeda(receita.precoVenda)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="label mb-0.5">Custo/un.</p>
                  <p className="font-mono text-sm text-ink-muted">
                    {receita.custoPorUnidade === null ? "—" : formatarMoeda(receita.custoPorUnidade)}
                  </p>
                </div>
              </div>

              <dl className="mt-4 flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-ink-muted">
                    Lucro total do lote
                  </dt>
                  <dd
                    className={`font-mono font-medium ${
                      receita.lucroTotal === null
                        ? "text-ink-muted/40"
                        : (receita.lucroTotal ?? 0) >= 0
                          ? "text-brand-marrom"
                          : "text-red-700"
                    }`}
                  >
                    {receita.lucroTotal === null ? "—" : formatarMoeda(receita.lucroTotal)}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-ink-muted">
                <span>
                  Rende <span className="font-mono">{receita.rendimento}</span>{" "}
                  {receita.rendimento === 1 ? "unidade" : "unidades"}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  margem <span className="font-mono">{receita.margemLucro}%</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  taxa <span className="font-mono">{receita.taxaCartao}%</span>
                </span>
              </p>

              <div className="mt-auto flex gap-2 pt-5">
                <Link href={`/receitas/${receita.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => setExcluindo(receita)}
                  className="hover:bg-red-50 hover:text-red-700"
                >
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
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
