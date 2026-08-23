"use client";

import { atom, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/react/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { salvarReceita } from "@/app/actions/receitas";
import { SeletorIngrediente } from "@/components/seletor-ingrediente";
import {
  Button,
  Field,
  IconAlerta,
  IconPlus,
  IconSetaDireita,
  IconX,
  Spinner,
  TextInput,
} from "@/components/ui";
import type { IngredienteDTO, ReceitaDTO } from "@/lib/format";
import { formatarMoeda } from "@/lib/format";
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

/* ---------- blocos visuais reutilizados no formulário ---------- */

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 border-b border-line pb-3 text-sm font-semibold tracking-[0.08em] text-brand-marrom uppercase">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-sage/15 font-mono text-xs text-brand-marrom">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Campo monetário: mostra o prefixo R$ dentro do input. */
function InputMoeda(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-ink-muted"
      >
        R$
      </span>
      <TextInput {...props} className={`pl-10 ${props.className ?? ""}`} />
    </div>
  );
}

/** Campo percentual/tempo: mostra o sufixo (% ou h) dentro do input. */
function InputComSufixo({
  sufixo,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { sufixo: string }) {
  return (
    <div className="relative">
      <TextInput {...props} className={`pr-9 ${props.className ?? ""}`} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-ink-muted"
      >
        {sufixo}
      </span>
    </div>
  );
}

/** Stepper −/+ para números inteiros (rendimento). */
function Stepper({ valor, onMudou }: { valor: string; onMudou: (valor: string) => void }) {
  function ajustar(delta: number) {
    const atual = numero(valor);
    const base = Number.isFinite(atual) ? atual : 0;
    onMudou(String(Math.max(1, base + delta)));
  }

  const botao =
    "grid w-11 shrink-0 cursor-pointer place-items-center text-lg text-ink-muted transition-colors hover:bg-brand-cream hover:text-brand-marrom focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-sage disabled:cursor-not-allowed";
  const semValor = valor.trim() === "";

  return (
    <div className="flex h-[46px] items-stretch overflow-hidden rounded-lg border border-line-strong bg-white transition-colors focus-within:border-brand-sage focus-within:ring-4 focus-within:ring-brand-sage/15">
      <button
        type="button"
        onClick={() => ajustar(-1)}
        disabled={semValor}
        aria-label="Diminuir rendimento"
        className={`${botao} disabled:opacity-40`}
      >
        −
      </button>
      <input
        inputMode="numeric"
        value={valor}
        onChange={(e) => onMudou(e.target.value)}
        required
        placeholder="10"
        aria-label="Rendimento em unidades"
        className="min-w-0 flex-1 border-x border-line bg-transparent text-center font-mono text-sm text-ink outline-none placeholder:text-ink-muted/60"
      />
      <button
        type="button"
        onClick={() => ajustar(1)}
        aria-label="Aumentar rendimento"
        className={botao}
      >
        +
      </button>
    </div>
  );
}

/** Switch estilizado para "favorita". */
function SwitchFavorita({
  marcado,
  onMudou,
}: {
  marcado: boolean;
  onMudou: (marcado: boolean) => void;
}) {
  return (
    <label className="flex h-[46px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-line-strong bg-white px-3 text-sm transition-colors hover:border-brand-sage has-checked:border-brand-sage">
      Mostrar em destaque
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onMudou(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-sage peer-checked:bg-brand-sage peer-checked:after:translate-x-4"
      />
    </label>
  );
}

function LinhaResumo({
  rotulo,
  valor,
  destacado,
  cor,
}: {
  rotulo: string;
  valor: string;
  destacado?: boolean;
  cor?: string;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 ${
        destacado ? "border-t border-line pt-2.5 font-semibold text-brand-marrom" : ""
      }`}
    >
      <dt className={destacado ? undefined : "text-ink-muted"}>{rotulo}</dt>
      <dd className={`font-mono ${cor ?? (destacado ? "" : "text-ink")}`}>{valor}</dd>
    </div>
  );
}

/* ---------- editor ---------- */

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
  // Custos extras ficam recolhidos por padrão; abrem sozinhos ao editar uma
  // receita que já os usa, para não esconder informação existente.
  const [extrasAbertos, setExtrasAbertos] = useState(
    () =>
      receita !== null &&
      [receita.custoEmbalagem, receita.custoGasEnergia, receita.custosAdicionais].some(
        (valor) => valor > 0,
      ),
  );

  const mapaIngredientes = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  // Uma linha vazia já abre pronta: menos um clique para começar.
  const autoAdicionou = useRef(false);
  useEffect(() => {
    if (autoAdicionou.current) return;
    autoAdicionou.current = true;
    if (ingredientes.length > 0) {
      setFormulario((f) =>
        f.itens.length === 0
          ? {
              ...f,
              itens: [{ chave: proximaChave++, ingredienteId: "", quantidade: "" }],
            }
          : f,
      );
    }
  }, [ingredientes.length, setFormulario]);

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
    setFormulario((f) => ({
      ...f,
      itens: [...f.itens, { chave: proximaChave++, ingredienteId: "", quantidade: "" }],
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
        .filter((item) => item.ingredienteId !== "" && item.quantidade.trim() !== "")
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
    router.push(receita ? `/receitas/${receita.id}` : "/receitas");
    router.refresh();
  }

  const temIngredientesNaBiblioteca = ingredientes.length > 0;
  const maoDeObraParcial =
    Number.isFinite(numero(formulario.horasTrabalho)) &&
    Number.isFinite(numero(formulario.valorHora))
      ? numero(formulario.horasTrabalho) * numero(formulario.valorHora)
      : null;
  const precoInvalido = !resultado.valido;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-6 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:grid-cols-[1fr_340px] lg:pb-0"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <Secao numero={1} titulo="Dados da receita">
          <div className="flex flex-col gap-4">
            <Field label="Nome da receita">
              <TextInput
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                required
                placeholder="Bolo de chocolate"
                className="text-base"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Rendimento">
                <Stepper
                  valor={formulario.rendimento}
                  onMudou={(v) => atualizarCampo("rendimento", v)}
                />
              </Field>
              <Field label="Favorita">
                <SwitchFavorita
                  marcado={formulario.favorita}
                  onMudou={(v) => atualizarCampo("favorita", v)}
                />
              </Field>
            </div>
          </div>
        </Secao>

        <Secao numero={2} titulo="Ingredientes">
          {!temIngredientesNaBiblioteca ? (
            <div className="rounded-xl border border-dashed border-line-strong bg-brand-cream/50 px-4 py-5 text-center">
              <p className="text-sm font-medium text-ink">
                Você ainda não tem ingredientes cadastrados.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/ingredientes")}
                className="mt-3"
              >
                Cadastrar agora
                <IconSetaDireita className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-2.5">
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
                    <li
                      key={item.chave}
                      className="group/item flex items-center gap-2 rounded-xl border border-line bg-white p-2 transition-colors focus-within:border-brand-sage hover:border-line-strong"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="sr-only">Ingrediente</span>
                        <SeletorIngrediente
                          ingredientes={ingredientes}
                          selecionado={ingrediente ?? null}
                          aoSelecionar={(id) => atualizarItem(item.chave, { ingredienteId: id })}
                          className="border-transparent bg-transparent hover:border-transparent focus:border-transparent focus:ring-0"
                        />
                      </div>
                      <div className="hidden w-24 pr-1 text-right font-mono text-sm text-ink-muted sm:block">
                        {custo !== null && Number.isNaN(custo) === false
                          ? formatarMoeda(custo)
                          : "—"}
                      </div>
                      <div className="w-28 shrink-0 sm:w-32">
                        <span className="sr-only">Quantidade usada</span>
                        <div className="relative">
                          <TextInput
                            inputMode="decimal"
                            value={item.quantidade}
                            onChange={(e) =>
                              atualizarItem(item.chave, { quantidade: e.target.value })
                            }
                            placeholder="0"
                            aria-label={`Quantidade de ${ingrediente?.nome ?? "ingrediente"}`}
                            className="border-transparent bg-brand-cream/60 pr-10 text-right font-mono placeholder:text-ink-muted/70 focus:bg-white focus:ring-brand-sage/15"
                          />
                          {ingrediente ? (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs text-ink-muted"
                            >
                              {ingrediente.unidade}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItem(item.chave)}
                        aria-label="Remover ingrediente"
                        title="Remover ingrediente"
                        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                variant="outline"
                onClick={adicionarItem}
                className="mt-3 w-full border-dashed"
              >
                <IconPlus className="h-4 w-4" />
                Adicionar ingrediente
              </Button>
            </>
          )}
        </Secao>

        <Secao numero={3} titulo="Mão de obra">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Horas de trabalho">
              <InputComSufixo
                sufixo="h"
                inputMode="decimal"
                value={formulario.horasTrabalho}
                onChange={(e) => atualizarCampo("horasTrabalho", e.target.value)}
                placeholder="1,5"
              />
            </Field>
            <Field label="Valor da sua hora">
              <InputMoeda
                inputMode="decimal"
                value={formulario.valorHora}
                onChange={(e) => atualizarCampo("valorHora", e.target.value)}
                placeholder="20,00"
              />
            </Field>
          </div>
          {maoDeObraParcial !== null && maoDeObraParcial > 0 ? (
            <p className="mt-3 text-sm text-ink-muted" role="status">
              Mão de obra desta fornada:{" "}
              <span className="font-mono font-semibold text-brand-marrom">
                {formatarMoeda(maoDeObraParcial)}
              </span>
            </p>
          ) : null}
        </Secao>

        {/* Custos menos usados ficam recolhidos: a tela enxuta mostra só o
            essencial para precificar. */}
        <details
          open={extrasAbertos}
          onToggle={(e) => setExtrasAbertos(e.currentTarget.open)}
          className="group rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2.5 border-b border-line pb-3 text-sm font-semibold tracking-[0.08em] text-brand-marrom uppercase [&::-webkit-details-marker]:hidden">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-sage/15 font-mono text-xs text-brand-marrom">
              +
            </span>
            Custos extras
            <span className="ml-auto flex items-center gap-1.5 text-xs font-normal normal-case tracking-normal text-ink-muted">
              opcional
              <IconSetaDireita className="h-4 w-4 transition-transform group-open:rotate-90" />
            </span>
          </summary>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
            <Field label="Embalagem">
              <InputMoeda
                inputMode="decimal"
                value={formulario.custoEmbalagem}
                onChange={(e) => atualizarCampo("custoEmbalagem", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Gás / energia">
              <InputMoeda
                inputMode="decimal"
                value={formulario.custoGasEnergia}
                onChange={(e) => atualizarCampo("custoGasEnergia", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Outros custos">
              <InputMoeda
                inputMode="decimal"
                value={formulario.custosAdicionais}
                onChange={(e) => atualizarCampo("custosAdicionais", e.target.value)}
                placeholder="0,00"
              />
            </Field>
          </div>
        </details>

        <Secao numero={4} titulo="Precificação">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Margem de lucro"
              error={
                formulario.margemLucro !== "" &&
                formulario.taxaCartao !== "" &&
                numero(formulario.margemLucro) + numero(formulario.taxaCartao) >= 100
                  ? "Margem + taxa devem somar menos de 100%."
                  : undefined
              }
            >
              <InputComSufixo
                sufixo="%"
                inputMode="decimal"
                value={formulario.margemLucro}
                onChange={(e) => atualizarCampo("margemLucro", e.target.value)}
                required
                placeholder="30"
              />
              <div className="mt-2 flex gap-1.5">
                {[20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => atualizarCampo("margemLucro", String(preset))}
                    className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage ${
                      numero(formulario.margemLucro) === preset
                        ? "bg-brand-sage/15 text-brand-marrom ring-brand-sage/40"
                        : "bg-white text-ink-muted ring-line-strong hover:text-brand-marrom"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Taxa de cartão/marketplace">
              <InputComSufixo
                sufixo="%"
                inputMode="decimal"
                value={formulario.taxaCartao}
                onChange={(e) => atualizarCampo("taxaCartao", e.target.value)}
                required
                placeholder="3,49"
              />
            </Field>
          </div>
        </Secao>

        {/* Painel completo fica após o formulário no mobile; a barra fixa
            inferior já mostra o preço enquanto digita. */}
        <aside className="lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-brand-sage/40 bg-surface shadow-md shadow-brand-marrom/5">
            <h2 className="label flex items-center gap-2 border-b border-line bg-brand-cream/60 px-5 py-3">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-sage" />
              Resultado em tempo real
            </h2>
            <div className="p-5">
              {resultado.valido ? (
                <dl className="flex flex-col gap-2 text-sm">
                  <LinhaResumo
                    rotulo="Custo total"
                    valor={formatarMoeda(resultado.custoTotal)}
                    destacado
                  />
                  <LinhaResumo
                    rotulo="Custo por unidade"
                    valor={formatarMoeda(resultado.custoPorUnidade)}
                  />
                  <LinhaResumo rotulo="Taxa cobrada" valor={formatarMoeda(resultado.taxaValor)} />
                  <LinhaResumo
                    rotulo="Lucro por unidade"
                    valor={formatarMoeda(resultado.lucroPorUnidade)}
                    cor={
                      resultado.lucroPorUnidade >= 0
                        ? "text-brand-marrom font-semibold"
                        : "text-red-700 font-semibold"
                    }
                  />
                  <LinhaResumo
                    rotulo="Lucro total da receita"
                    valor={formatarMoeda(resultado.lucroTotal)}
                    cor={
                      resultado.lucroTotal >= 0
                        ? "text-brand-marrom font-semibold"
                        : "text-red-700 font-semibold"
                    }
                  />
                </dl>
              ) : (
                <div
                  role="status"
                  className="rounded-xl border border-dashed border-line-strong bg-brand-cream/50 px-4 py-3.5"
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <IconAlerta className="h-4 w-4 text-brand-gold-deep" />
                    Preencha os campos para ver o preço
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-7 text-sm text-ink-muted">
                    {resultado.erros.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Resumo lateral fixo — somente desktop */}
      <aside className="order-first hidden lg:order-none lg:sticky lg:top-28 lg:block lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-brand-sage/40 bg-surface shadow-md shadow-brand-marrom/5">
          <h2 className="label flex items-center gap-2 border-b border-line bg-brand-cream/60 px-5 py-3">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-sage" />
            Resultado em tempo real
          </h2>

          <div className="p-5 sm:p-6">
            {resultado.valido ? (
              <dl className="flex flex-col gap-2 text-sm">
                <LinhaResumo
                  rotulo="Ingredientes"
                  valor={formatarMoeda(resultado.custoIngredientes)}
                />
                <LinhaResumo rotulo="Mão de obra" valor={formatarMoeda(resultado.custoMaoDeObra)} />
                <LinhaResumo rotulo="Custos fixos" valor={formatarMoeda(resultado.custosFixos)} />
                <LinhaResumo
                  rotulo="Custo total"
                  valor={formatarMoeda(resultado.custoTotal)}
                  destacado
                />
                <LinhaResumo
                  rotulo="Custo por unidade"
                  valor={formatarMoeda(resultado.custoPorUnidade)}
                />

                <div className="mt-2 rounded-xl border border-brand-gold/45 bg-brand-cream px-4 py-4">
                  <p className="label flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-brand-gold-deep"
                    />
                    Preço de venda sugerido
                  </p>
                  <p className="mt-1.5 font-mono text-[2rem] leading-none font-semibold tracking-tight text-brand-gold-deep">
                    {formatarMoeda(resultado.precoVenda)}
                    <span className="ml-1 text-sm font-normal tracking-normal text-ink-muted">
                      /un.
                    </span>
                  </p>
                </div>

                <div className="mt-1" />
                <LinhaResumo rotulo="Taxa cobrada" valor={formatarMoeda(resultado.taxaValor)} />
                <LinhaResumo
                  rotulo="Lucro por unidade"
                  valor={formatarMoeda(resultado.lucroPorUnidade)}
                  cor={
                    resultado.lucroPorUnidade >= 0
                      ? "text-brand-marrom font-semibold"
                      : "text-red-700 font-semibold"
                  }
                />
                <LinhaResumo
                  rotulo="Lucro total da receita"
                  valor={formatarMoeda(resultado.lucroTotal)}
                  cor={
                    resultado.lucroTotal >= 0
                      ? "text-brand-marrom font-semibold"
                      : "text-red-700 font-semibold"
                  }
                />
              </dl>
            ) : (
              <div
                role="status"
                className="rounded-xl border border-dashed border-line-strong bg-brand-cream/50 px-4 py-3.5"
              >
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <IconAlerta className="h-4 w-4 text-brand-gold-deep" />
                  Preencha os campos para ver o preço
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-7 text-sm text-ink-muted">
                  {resultado.erros.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {erro ? (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                <IconAlerta className="mt-0.5 h-4 w-4 shrink-0" />
                {erro}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? <Spinner /> : null}
                {salvando ? "Salvando..." : receita ? "Salvar alterações" : "Criar receita"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(receita ? `/receitas/${receita.id}` : "/receitas")}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Barra fixa inferior (mobile): preço sempre visível + ação principal */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(39_30_5/0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium tracking-[0.09em] text-ink-muted uppercase">
              Preço sugerido/un.
            </p>
            {precoInvalido ? (
              <p className="truncate text-xs font-medium text-ink-muted">
                Complete os campos acima
              </p>
            ) : (
              <p className="font-mono text-xl leading-tight font-bold text-brand-gold-deep">
                {formatarMoeda(resultado.valido ? resultado.precoVenda : 0)}
              </p>
            )}
          </div>
          {erro ? (
            <span role="alert" aria-label={erro} className="shrink-0 text-red-700">
              <IconAlerta className="h-5 w-5" />
            </span>
          ) : null}
          <Button type="submit" disabled={salvando} className="shrink-0">
            {salvando ? <Spinner /> : null}
            {salvando ? "Salvando..." : receita ? "Salvar" : "Criar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
