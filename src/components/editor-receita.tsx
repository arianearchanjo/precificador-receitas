"use client";

import { atom, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/react/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { salvarReceita } from "@/app/actions/receitas";
import { Button, Field, SelectInput, TextInput } from "@/components/ui";
import type { IngredienteDTO, ReceitaDTO } from "@/lib/format";
import { formatarMoeda, formatarNumero } from "@/lib/format";
import { custoItemNaReceita, precificar } from "@/lib/pricing";

interface EstadoItem {
  chave: number;
  ingredienteId: string;
  quantidade: string;
}

interface EstadoFormulario {
  nome: string;
  rendimento: string;
  horasTrabalho: string;
  valorHora: string;
  custoEmbalagem: string;
  custoGasEnergia: string;
  custosAdicionais: string;
  taxaCartao: string;
  margemLucro: string;
  favorita: boolean;
  itens: EstadoItem[];
}

function estadoInicial(receita: ReceitaDTO | null): EstadoFormulario {
  return {
    nome: receita?.nome ?? "",
    rendimento: receita ? String(receita.rendimento) : "",
    horasTrabalho: receita ? String(receita.horasTrabalho) : "",
    valorHora: receita ? String(receita.valorHora) : "",
    custoEmbalagem: receita ? String(receita.custoEmbalagem) : "",
    custoGasEnergia: receita ? String(receita.custoGasEnergia) : "",
    custosAdicionais: receita ? String(receita.custosAdicionais) : "",
    taxaCartao: receita ? String(receita.taxaCartao) : "",
    margemLucro: receita ? String(receita.margemLucro) : "",
    favorita: receita?.favorita ?? false,
    itens:
      receita?.itens.map((item, indice) => ({
        chave: indice,
        ingredienteId: item.ingredienteId,
        quantidade: String(item.quantidade),
      })) ?? [],
  };
}

const formularioAtom = atom<EstadoFormulario>(estadoInicial(null));

let proximaChave = 1;

function numero(valor: string): number {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="label mb-4 border-b border-line pb-3">{titulo}</h2>
      {children}
    </section>
  );
}

export function EditorReceita({
  ingredientes,
  receita,
}: {
  ingredientes: IngredienteDTO[];
  receita: ReceitaDTO | null;
}) {
  useHydrateAtoms([[formularioAtom, estadoInicial(receita)]]);
  const [formulario, setFormulario] = useAtom(formularioAtom);
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mapaIngredientes = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  function atualizarCampo<K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]) {
    setFormulario((f) => ({ ...f, [campo]: valor }));
  }

  function atualizarItem(chave: number, mudancas: Partial<EstadoItem>) {
    setFormulario((f) => ({
      ...f,
      itens: f.itens.map((item) => (item.chave === chave ? { ...item, ...mudancas } : item)),
    }));
  }

  function adicionarItem() {
    const primeiro = ingredientes[0];
    if (!primeiro) return;
    setFormulario((f) => ({
      ...f,
      itens: [...f.itens, { chave: proximaChave++, ingredienteId: primeiro.id, quantidade: "" }],
    }));
  }

  function removerItem(chave: number) {
    setFormulario((f) => ({ ...f, itens: f.itens.filter((item) => item.chave !== chave) }));
  }

  // Cálculo em tempo real com a MESMA função usada no servidor.
  const resultado = useMemo(() => {
    const itens = formulario.itens.map((item) => {
      const ingrediente = mapaIngredientes.get(item.ingredienteId);
      if (!ingrediente || item.quantidade.trim() === "") {
        return null;
      }
      return {
        ingrediente: {
          precoPago: ingrediente.precoPago,
          quantidadeComprada: ingrediente.quantidadeComprada,
        },
        quantidade: numero(item.quantidade),
      };
    });

    return precificar({
      itens: itens.filter((i) => i !== null),
      rendimento: numero(formulario.rendimento),
      horasTrabalho: numero(formulario.horasTrabalho),
      valorHora: numero(formulario.valorHora),
      custoEmbalagem: numero(formulario.custoEmbalagem),
      custoGasEnergia: numero(formulario.custoGasEnergia),
      custosAdicionais: numero(formulario.custosAdicionais),
      margemPercentual: numero(formulario.margemLucro),
      taxaPercentual: numero(formulario.taxaCartao),
    });
  }, [formulario, mapaIngredientes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const res = await salvarReceita(receita?.id ?? null, {
      nome: formulario.nome,
      rendimento: numero(formulario.rendimento),
      horasTrabalho: numero(formulario.horasTrabalho),
      valorHora: numero(formulario.valorHora),
      custoEmbalagem: numero(formulario.custoEmbalagem),
      custoGasEnergia: numero(formulario.custoGasEnergia),
      custosAdicionais: numero(formulario.custosAdicionais),
      taxaCartao: numero(formulario.taxaCartao),
      margemLucro: numero(formulario.margemLucro),
      favorita: formulario.favorita,
      itens: formulario.itens
        .filter((item) => item.quantidade.trim() !== "")
        .map((item) => ({
          ingredienteId: item.ingredienteId,
          quantidade: numero(item.quantidade),
        })),
    });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
    router.refresh();
  }

  const temIngredientesNaBiblioteca = ingredientes.length > 0;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* No mobile o resultado vem primeiro: o preço acompanha cada digitação. */}
      <aside className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-brand-sage/40 bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="label mb-3">Resultado em tempo real</h2>
          {resultado.valido ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Ingredientes</dt>
                <dd className="font-mono">{formatarMoeda(resultado.custoIngredientes)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Mão de obra</dt>
                <dd className="font-mono">{formatarMoeda(resultado.custoMaoDeObra)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Custos fixos</dt>
                <dd className="font-mono">{formatarMoeda(resultado.custosFixos)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-line pt-2 font-medium">
                <dt>Custo total</dt>
                <dd className="font-mono">{formatarMoeda(resultado.custoTotal)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Custo por unidade</dt>
                <dd className="font-mono">{formatarMoeda(resultado.custoPorUnidade)}</dd>
              </div>
              <div className="mt-2 rounded-xl bg-gradient-to-br from-brand-sage to-brand-marrom px-4 py-4 shadow-md">
                <p className="label !text-brand-cream/80">Preço de venda sugerido</p>
                <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-white">
                  {formatarMoeda(resultado.precoVenda)}
                </p>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <dt className="text-ink-muted">Taxa cobrada</dt>
                <dd className="font-mono">{formatarMoeda(resultado.taxaValor)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Lucro por unidade</dt>
                <dd
                  className={`font-mono ${resultado.lucroPorUnidade >= 0 ? "text-brand-marrom" : "text-red-700"}`}
                >
                  {formatarMoeda(resultado.lucroPorUnidade)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Lucro total da receita</dt>
                <dd
                  className={`font-mono ${resultado.lucroTotal >= 0 ? "text-brand-marrom" : "text-red-700"}`}
                >
                  {formatarMoeda(resultado.lucroTotal)}
                </dd>
              </div>
            </dl>
          ) : (
            <ul className="list-disc space-y-1 pl-4 text-sm text-red-700">
              {resultado.erros.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}

          {erro ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{erro}</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : receita ? "Salvar alterações" : "Criar receita"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/")}>
              Cancelar
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col gap-5">
        <Secao titulo="Dados da receita">
          <div className="flex flex-col gap-4">
            <Field label="Nome">
              <TextInput
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                required
                placeholder="Bolo de chocolate"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Rendimento (unidades)">
                <TextInput
                  inputMode="numeric"
                  value={formulario.rendimento}
                  onChange={(e) => atualizarCampo("rendimento", e.target.value)}
                  required
                  placeholder="10"
                />
              </Field>
              <Field label="Favorita">
                <label className="flex h-[46px] cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 text-sm transition-colors hover:border-brand-sage/60 has-checked:border-brand-sage has-checked:bg-brand-sage/5">
                  <input
                    type="checkbox"
                    checked={formulario.favorita}
                    onChange={(e) => atualizarCampo("favorita", e.target.checked)}
                    className="h-4 w-4 accent-brand-sage"
                  />
                  Mostrar em destaque
                </label>
              </Field>
            </div>
          </div>
        </Secao>

        <Secao titulo="Ingredientes">
          {!temIngredientesNaBiblioteca ? (
            <p className="text-sm text-ink-muted">
              Cadastre ingredientes na biblioteca antes de montar a receita.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {formulario.itens.map((item) => {
                  const ingrediente = mapaIngredientes.get(item.ingredienteId);
                  const custo =
                    ingrediente && item.quantidade.trim() !== ""
                      ? custoItemNaReceita({
                          ingrediente: {
                            precoPago: ingrediente.precoPago,
                            quantidadeComprada: ingrediente.quantidadeComprada,
                          },
                          quantidade: numero(item.quantidade),
                        })
                      : null;
                  return (
                    <li key={item.chave} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="sr-only">Ingrediente</span>
                        <SelectInput
                          value={item.ingredienteId}
                          onChange={(e) =>
                            atualizarItem(item.chave, { ingredienteId: e.target.value })
                          }
                        >
                          {ingredientes.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nome} ({formatarNumero(i.quantidadeComprada)} {i.unidade})
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <div className="hidden w-24 pb-2 text-right font-mono text-sm text-ink-muted sm:block">
                        {custo !== null && Number.isNaN(custo) === false
                          ? formatarMoeda(custo)
                          : "—"}
                      </div>
                      <div className="w-24 shrink-0 sm:w-28">
                        <span className="sr-only">Quantidade</span>
                        <TextInput
                          inputMode="decimal"
                          value={item.quantidade}
                          onChange={(e) =>
                            atualizarItem(item.chave, { quantidade: e.target.value })
                          }
                          placeholder={`qtd. ${ingrediente?.unidade ?? ""}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removerItem(item.chave)}
                        aria-label="Remover ingrediente"
                        className="shrink-0 px-2.5"
                      >
                        ✕
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                variant="outline"
                onClick={adicionarItem}
                className="mt-4 w-full sm:w-auto"
              >
                Adicionar ingrediente
              </Button>
            </>
          )}
        </Secao>

        <Secao titulo="Mão de obra e custos fixos">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Horas de trabalho">
              <TextInput
                inputMode="decimal"
                value={formulario.horasTrabalho}
                onChange={(e) => atualizarCampo("horasTrabalho", e.target.value)}
                placeholder="1,5"
              />
            </Field>
            <Field label="Valor da hora (R$)">
              <TextInput
                inputMode="decimal"
                value={formulario.valorHora}
                onChange={(e) => atualizarCampo("valorHora", e.target.value)}
                placeholder="20,00"
              />
            </Field>
            <Field label="Embalagem (R$)">
              <TextInput
                inputMode="decimal"
                value={formulario.custoEmbalagem}
                onChange={(e) => atualizarCampo("custoEmbalagem", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Gás / energia (R$)">
              <TextInput
                inputMode="decimal"
                value={formulario.custoGasEnergia}
                onChange={(e) => atualizarCampo("custoGasEnergia", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Outros custos (R$)">
              <TextInput
                inputMode="decimal"
                value={formulario.custosAdicionais}
                onChange={(e) => atualizarCampo("custosAdicionais", e.target.value)}
                placeholder="0,00"
              />
            </Field>
          </div>
        </Secao>

        <Secao titulo="Precificação">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Margem de lucro (%)"
              error={
                formulario.margemLucro !== "" &&
                formulario.taxaCartao !== "" &&
                numero(formulario.margemLucro) + numero(formulario.taxaCartao) >= 100
                  ? "Margem + taxa devem somar menos de 100%."
                  : undefined
              }
            >
              <TextInput
                inputMode="decimal"
                value={formulario.margemLucro}
                onChange={(e) => atualizarCampo("margemLucro", e.target.value)}
                required
                placeholder="30"
              />
            </Field>
            <Field label="Taxa cartão/marketplace (%)">
              <TextInput
                inputMode="decimal"
                value={formulario.taxaCartao}
                onChange={(e) => atualizarCampo("taxaCartao", e.target.value)}
                required
                placeholder="3,49"
              />
            </Field>
          </div>
        </Secao>
      </div>
    </form>
  );
}
