"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { atualizarIngrediente, criarIngrediente } from "@/app/actions/ingredientes";
import { dialogContentClass, overlayClass } from "@/components/confirm-dialog";
import { Button, Field, IconAlerta, IconX, SelectInput, Spinner, TextInput } from "@/components/ui";
import type { IngredienteDTO } from "@/lib/format";
import { UNIDADES, type Unidade } from "@/lib/unidades";

interface FormularioIngrediente {
  nome: string;
  precoPago: string;
  quantidadeComprada: string;
  unidade: Unidade;
}

const formularioVazio: FormularioIngrediente = {
  nome: "",
  precoPago: "",
  quantidadeComprada: "",
  unidade: "g",
};

function paraFormulario(ingrediente: IngredienteDTO | null): FormularioIngrediente {
  if (!ingrediente) return formularioVazio;
  return {
    nome: ingrediente.nome,
    precoPago: String(ingrediente.precoPago),
    quantidadeComprada: String(ingrediente.quantidadeComprada),
    unidade: (ingrediente.unidade as Unidade) ?? "g",
  };
}

export function IngredienteDialog({
  aberto,
  onMudouAbertura,
  inicial,
}: {
  aberto: boolean;
  onMudouAbertura: (aberto: boolean) => void;
  inicial: IngredienteDTO | null;
}) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioIngrediente>(() =>
    paraFormulario(inicial),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo<K extends keyof FormularioIngrediente>(
    campo: K,
    valor: FormularioIngrediente[K],
  ) {
    setFormulario((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const dados = {
      nome: formulario.nome,
      precoPago: Number(formulario.precoPago.replace(",", ".")),
      quantidadeComprada: Number(formulario.quantidadeComprada.replace(",", ".")),
      unidade: formulario.unidade,
    };

    const resultado = inicial
      ? await atualizarIngrediente(inicial.id, dados)
      : await criarIngrediente(dados);

    setSalvando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    onMudouAbertura(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={onMudouAbertura}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass} />
        <Dialog.Content className={dialogContentClass}>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar"
              className="absolute top-3.5 right-3.5 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-brand-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage"
            >
              <IconX className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <Dialog.Title className="font-display text-2xl leading-tight font-semibold text-brand-marrom">
            {inicial ? "Editar ingrediente" : "Novo ingrediente"}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Preço pago pela embalagem de compra — o custo por grama/ml/unidade é calculado
            automaticamente.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <Field label="Nome">
              <TextInput
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                required
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <Field label="Preço (R$)">
                <TextInput
                  inputMode="decimal"
                  value={formulario.precoPago}
                  onChange={(e) => atualizarCampo("precoPago", e.target.value)}
                  required
                  placeholder="10,00"
                />
              </Field>
              <Field label="Quantidade">
                <TextInput
                  inputMode="decimal"
                  value={formulario.quantidadeComprada}
                  onChange={(e) => atualizarCampo("quantidadeComprada", e.target.value)}
                  required
                  placeholder="500"
                />
              </Field>
              <Field label="Unid.">
                <SelectInput
                  value={formulario.unidade}
                  onChange={(e) => atualizarCampo("unidade", e.target.value as Unidade)}
                  className="w-20"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            {erro ? (
              <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-red-700">
                <IconAlerta className="mt-0.5 h-4 w-4 shrink-0" />
                {erro}
              </p>
            ) : null}
            <div className="mt-1 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" disabled={salvando}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Spinner /> : null}
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
