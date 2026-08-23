"use client";

import { AlertDialog } from "radix-ui";
import { Button, IconAlerta, Spinner } from "@/components/ui";

export const overlayClass =
  "fixed inset-0 z-40 bg-brand-marrom/45 backdrop-blur-[2px] animate-fade-in";

export const dialogContentClass =
  "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-brand-marrom/20 focus:outline-none animate-pop-in";

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
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-700"
            >
              <IconAlerta className="h-4.5 w-4.5" />
            </span>
            <div>
              <AlertDialog.Title className="font-display text-2xl leading-tight font-semibold text-brand-marrom">
                {titulo}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {descricao}
              </AlertDialog.Description>
            </div>
          </div>
          {erro ? (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {erro}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="ghost" disabled={carregando}>
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            <Button type="button" onClick={onConfirmar} disabled={carregando} variant="danger">
              {carregando ? <Spinner /> : null}
              {carregando ? "Excluindo..." : confirmarRotulo}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
