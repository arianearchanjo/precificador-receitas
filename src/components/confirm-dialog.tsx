"use client";

import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui";

export const overlayClass = "fixed inset-0 z-40 bg-brand-marrom/40 backdrop-blur-[2px]";

export const dialogContentClass =
  "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-6 shadow-xl focus:outline-none";

export function ConfirmDialog({
  titulo,
  descricao,
  confirmarRotulo,
  aberto,
  onMudouAbertura,
  onConfirmar,
  carregando,
  erro,
}: {
  titulo: string;
  descricao: string;
  confirmarRotulo: string;
  aberto: boolean;
  onMudouAbertura: (aberto: boolean) => void;
  onConfirmar: () => void;
  carregando?: boolean;
  erro?: string | null;
}) {
  return (
    <AlertDialog.Root open={aberto} onOpenChange={onMudouAbertura}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlayClass} />
        <AlertDialog.Content className={dialogContentClass}>
          <AlertDialog.Title className="font-display text-2xl font-semibold text-brand-marrom">
            {titulo}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sm text-ink-muted">
            {descricao}
          </AlertDialog.Description>
          {erro ? <p className="mt-3 text-sm text-red-700">{erro}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              onClick={onConfirmar}
              disabled={carregando}
              variant="primary"
              className="bg-red-800 hover:bg-red-900"
            >
              {carregando ? "Excluindo..." : confirmarRotulo}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
