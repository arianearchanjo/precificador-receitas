"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useState } from "react";
import {
  atualizarIngrediente,
  criarIngrediente,
  UNIDADES,
  type Unidade,
} from "@/app/actions/ingredientes";
import { dialogContentClass, overlayClass } from "@/components/confirm-dialog";
import { Button, Field, SelectInput, TextInput } from "@/components/ui";
import type { IngredienteDTO } from "@/lib/format";

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
          <Dialog.Title className="font-display text-2xl font-semibold text-brand-marrom">
            {inicial ? "Editar ingrediente" : "Novo ingrediente"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-ink-muted">
            Preço pago pela embalagem de compra — o custo por grama/ml/unidade é calculado
            automaticamente.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <Field label="Nome">
              <TextInput
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                required
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
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
              <Field label="Unidade">
                <SelectInput
                  value={formulario.unidade}
                  onChange={(e) => atualizarCampo("unidade", e.target.value as Unidade)}
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
