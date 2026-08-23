"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { excluirIngrediente } from "@/app/actions/ingredientes";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { IngredienteDialog } from "@/components/ingrediente-dialog";
import { Button } from "@/components/ui";
import { formatarMoeda, formatarNumero, type IngredienteDTO } from "@/lib/format";
import { custoUnitarioIngrediente } from "@/lib/pricing";

export function GerenciarIngredientes({ ingredientes }: { ingredientes: IngredienteDTO[] }) {
  const router = useRouter();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState<IngredienteDTO | null>(null);
  const [excluindo, setExcluindo] = useState<IngredienteDTO | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function abrirNovo() {
    setEditando(null);
    setDialogoAberto(true);
  }

  function abrirEdicao(ingrediente: IngredienteDTO) {
    setEditando(ingrediente);
    setDialogoAberto(true);
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setErroExclusao(null);
    setExcluindoId(excluindo.id);
    const resultado = await excluirIngrediente(excluindo.id);
    setExcluindoId(null);
    if (!resultado.ok) {
      setErroExclusao(resultado.erro);
      return;
    }
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {ingredientes.length === 0
            ? "Nenhum ingrediente ainda"
            : `${ingredientes.length} ${ingredientes.length === 1 ? "ingrediente" : "ingredientes"}`}
        </p>
        <Button onClick={abrirNovo} className="w-full sm:w-auto">
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          Novo ingrediente
        </Button>
      </div>

      {ingredientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl text-ink">Sua despensa está vazia</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Cadastre o preço pago e a quantidade de cada ingrediente para calcular o custo real das
            receitas.
          </p>
          <Button variant="outline" onClick={abrirNovo} className="mt-5">
            Adicionar primeiro ingrediente
          </Button>
        </div>
      ) : (
        <div className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-line sm:bg-surface">
          <table className="w-full text-sm">
            <caption className="sr-only">Lista de ingredientes com custo unitário</caption>
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-line bg-brand-cream/50 text-left">
                <th scope="col" className="label px-4 py-3">
                  Ingrediente
                </th>
                <th scope="col" className="label px-4 py-3">
                  Compra
                </th>
                <th scope="col" className="label px-4 py-3 text-right">
                  Custo unitário
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((ingrediente) => {
                const custoUnitario = custoUnitarioIngrediente(ingrediente);
                return (
                  <tr
                    key={ingrediente.id}
                    className="mb-3 block rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow last:mb-0 hover:shadow-md sm:table-row sm:border-0 sm:border-b sm:border-line/60 sm:bg-transparent sm:p-0 sm:shadow-none sm:last:border-0 sm:hover:shadow-none"
                  >
                    <td className="flex items-center justify-between gap-3 py-1 sm:table-cell sm:px-4 sm:py-3.5">
                      <span className="label sm:sr-only">Ingrediente</span>
                      <span className="text-right font-medium sm:text-left">{ingrediente.nome}</span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-1 whitespace-nowrap sm:table-cell sm:px-4 sm:py-3.5 sm:whitespace-normal">
                      <span className="label sm:sr-only">Compra</span>
                      <span className="text-right text-ink-muted sm:text-left">
                        <span className="font-mono">{formatarMoeda(ingrediente.precoPago)}</span>
                        {" / "}
                        <span className="font-mono">
                          {formatarNumero(ingrediente.quantidadeComprada)}
                        </span>{" "}
                        {ingrediente.unidade}
                      </span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-1 whitespace-nowrap sm:table-cell sm:px-4 sm:py-3.5 sm:text-right">
                      <span className="label sm:sr-only">Custo unitário</span>
                      <span className="font-mono font-medium text-brand-marrom">
                        {Number.isNaN(custoUnitario)
                          ? "—"
                          : `${formatarMoeda(custoUnitario)}/${ingrediente.unidade}`}
                      </span>
                    </td>
                    <td className="mt-2 flex justify-end gap-1 border-t border-dashed border-line pt-2 sm:table-cell sm:mt-0 sm:border-0 sm:px-2 sm:pt-0 sm:text-right">
                      <Button variant="ghost" onClick={() => abrirEdicao(ingrediente)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setExcluindo(ingrediente)}
                        className="hover:bg-red-50 hover:text-red-700"
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogoAberto ? (
        <IngredienteDialog
          key={editando?.id ?? "novo"}
          aberto
          onMudouAbertura={setDialogoAberto}
          inicial={editando}
        />
      ) : null}

      <ConfirmDialog
        titulo="Excluir ingrediente?"
        descricao={
          excluindo
            ? `"${excluindo.nome}" será removido da biblioteca. Receitas que o usam deixam de incluí-lo.`
            : ""
        }
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
