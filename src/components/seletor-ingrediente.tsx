"use client";

import { useId, useMemo, useState } from "react";
import { inputClass } from "@/components/ui";
import type { IngredienteDTO } from "@/lib/format";
import { formatarMoeda, normalizarParaBusca } from "@/lib/format";
import { custoUnitarioIngrediente } from "@/lib/pricing";

/**
 * Campo de seleção de ingrediente com busca integrada — substitui o <select>
 * tradicional, que fica inutilizável quando a biblioteca tem muitos itens.
 */
export function SeletorIngrediente({
  ingredientes,
  selecionado,
  aoSelecionar,
  className,
}: {
  ingredientes: IngredienteDTO[];
  selecionado: IngredienteDTO | null;
  aoSelecionar: (ingredienteId: string) => void;
  /** Classes extras aplicadas ao input (ex.: estilo embutido numa linha). */
  className?: string;
}) {
  const idLista = useId();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [destaque, setDestaque] = useState(0);

  const opcoes = useMemo(() => {
    const termo = normalizarParaBusca(busca.trim());
    if (termo === "") return ingredientes;
    return ingredientes.filter((i) => normalizarParaBusca(i.nome).includes(termo));
  }, [ingredientes, busca]);

  function abrir() {
    setAberto(true);
    setBusca("");
    setDestaque(0);
  }

  function selecionar(ingrediente: IngredienteDTO) {
    aoSelecionar(ingrediente.id);
    setAberto(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => Math.min(d + 1, Math.max(opcoes.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Escape") {
      setAberto(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opcao = opcoes[destaque];
      if (opcao) selecionar(opcao);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        autoComplete="off"
        value={aberto ? busca : (selecionado?.nome ?? "")}
        onChange={(e) => {
          setBusca(e.target.value);
          setDestaque(0);
          if (!aberto) setAberto(true);
        }}
        onFocus={abrir}
        onKeyDown={handleKeyDown}
        onBlur={() => setAberto(false)}
        placeholder="Buscar ingrediente..."
        aria-label="Ingrediente"
        className={`${inputClass} ${className ?? ""} ${selecionado && !aberto ? "font-medium" : ""}`}
      />

      {aberto ? (
        <div
          id={idLista}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-line-strong bg-white py-1 shadow-lg"
        >
          {opcoes.map((opcao, indice) => {
            const custo = custoUnitarioIngrediente(opcao);
            return (
              <button
                key={opcao.id}
                type="button"
                tabIndex={-1}
                /* mousedown prevenido mantém o foco no input: o clique
                   registra antes do blur fechar a lista. */
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selecionar(opcao)}
                onMouseEnter={() => setDestaque(indice)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  indice === destaque ? "bg-brand-sage/10" : ""
                }`}
              >
                <span className={`truncate ${selecionado?.id === opcao.id ? "font-semibold" : ""}`}>
                  {opcao.nome}
                </span>
                <span className="shrink-0 font-mono text-xs whitespace-nowrap text-ink-muted">
                  {Number.isNaN(custo) ? "—" : formatarMoeda(custo)}/{opcao.unidade}
                </span>
              </button>
            );
          })}
          {opcoes.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-ink-muted" role="status">
              Nenhum ingrediente encontrado para “{busca.trim()}”.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
