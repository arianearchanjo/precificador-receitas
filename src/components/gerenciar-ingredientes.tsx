"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { excluirIngrediente } from "@/app/actions/ingredientes";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { IngredienteDialog } from "@/components/ingrediente-dialog";
import { BuscaInput, Button, IconLapis, IconLixeira, IconPlus, Paginacao } from "@/components/ui";
import {
  formatarMoeda,
  formatarNumero,
  type IngredienteDTO,
  normalizarParaBusca,
} from "@/lib/format";
import { custoUnitarioIngrediente } from "@/lib/pricing";

const ITENS_POR_PAGINA = 10;

const botaoIcone =
  "grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-ink-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage disabled:cursor-not-allowed disabled:opacity-50";

export function GerenciarIngredientes({ ingredientes }: { ingredientes: IngredienteDTO[] }) {
  const router = useRouter();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState<IngredienteDTO | null>(null);
  const [excluindo, setExcluindo] = useState<IngredienteDTO | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const termo = normalizarParaBusca(busca.trim());
  const filtrados = useMemo(
    () =>
      termo === ""
        ? ingredientes
        : ingredientes.filter((i) => normalizarParaBusca(i.nome).includes(termo)),
    [ingredientes, termo],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  const [pagina, setPagina] = useState(1);
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );

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
      <div className="flex flex-wrap items-center gap-3">
        <BuscaInput
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar ingrediente..."
          aria-label="Buscar ingrediente por nome"
          className="w-full sm:max-w-xs"
        />
        <p className="text-sm text-ink-muted" role="status">
          {ingredientes.length === 0
            ? "Nenhum ingrediente ainda"
            : termo !== ""
              ? filtrados.length === 0
                ? "Nenhum ingrediente encontrado"
                : `${filtrados.length} de ${ingredientes.length}`
              : `${ingredientes.length} ${ingredientes.length === 1 ? "ingrediente" : "ingredientes"}`}
        </p>
        <Button onClick={abrirNovo} className="ml-auto w-full sm:w-auto">
          <IconPlus className="h-4 w-4" />
          Novo ingrediente
        </Button>
      </div>

      {ingredientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold text-brand-marrom">
            Sua despensa está vazia
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Cadastre o preço pago e a quantidade de cada ingrediente para calcular o custo real das
            receitas.
          </p>
          <Button onClick={abrirNovo} className="mt-6">
            <IconPlus className="h-4 w-4" />
            Adicionar primeiro ingrediente
          </Button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Nenhum ingrediente encontrado para “{busca.trim()}”
          </p>
          <Button variant="ghost" onClick={() => setBusca("")} className="mt-3">
            Limpar busca
          </Button>
        </div>
      ) : (
        <>
          <div className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-line sm:bg-surface sm:shadow-sm">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de ingredientes com custo unitário</caption>
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-line bg-brand-cream/60 text-left">
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
                {visiveis.map((ingrediente) => {
                  const custoUnitario = custoUnitarioIngrediente(ingrediente);
                  return (
                    <tr
                      key={ingrediente.id}
                      className="mb-3 block rounded-xl border border-line bg-surface p-4 shadow-sm transition-shadow last:mb-0 hover:shadow-md sm:table-row sm:border-0 sm:border-b sm:border-line/60 sm:bg-transparent sm:p-0 sm:shadow-none sm:last:border-0 sm:transition-colors sm:hover:bg-brand-cream/50 sm:hover:shadow-none"
                    >
                      <td className="flex items-center justify-between gap-3 py-1 font-medium sm:table-cell sm:px-4 sm:py-3.5">
                        <span className="label sm:sr-only">Ingrediente</span>
                        <span className="text-right text-ink sm:text-left">{ingrediente.nome}</span>
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
                        <span className="font-mono font-semibold text-brand-marrom">
                          {Number.isNaN(custoUnitario)
                            ? "—"
                            : `${formatarMoeda(custoUnitario)}/${ingrediente.unidade}`}
                        </span>
                      </td>
                      <td className="mt-2 flex justify-end gap-1 border-t border-dashed border-line pt-2 sm:table-cell sm:mt-0 sm:border-0 sm:px-2 sm:py-2.5 sm:text-right">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(ingrediente)}
                          title={`Editar ${ingrediente.nome}`}
                          aria-label={`Editar ${ingrediente.nome}`}
                          className={`${botaoIcone} hover:bg-brand-sage/10 hover:text-brand-marrom`}
                        >
                          <IconLapis />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluindo(ingrediente)}
                          title={`Excluir ${ingrediente.nome}`}
                          aria-label={`Excluir ${ingrediente.nome}`}
                          className={`${botaoIcone} hover:bg-red-50 hover:text-red-700`}
                        >
                          <IconLixeira />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
