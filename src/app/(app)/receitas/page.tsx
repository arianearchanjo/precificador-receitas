import { ListaReceitas } from "@/components/lista-receitas";
import { CabecalhoPagina } from "@/components/ui";
import type { ReceitaResumo } from "@/lib/format";
import { carregarResumos } from "@/lib/resumos";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Receitas — Doces & Nós",
};

export default async function ReceitasPage() {
  await requireSession();

  const resumos: ReceitaResumo[] = await carregarResumos();

  return (
    <div className="flex flex-col gap-8">
      <CabecalhoPagina
        secao="Catálogo"
        titulo="Receitas"
        descricao="Preço calculado a partir do custo real de ingredientes, mão de obra e custos fixos."
      />
      <ListaReceitas receitas={resumos} />
    </div>
  );
}
