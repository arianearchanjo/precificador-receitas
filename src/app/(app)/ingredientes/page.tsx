import { GerenciarIngredientes } from "@/components/gerenciar-ingredientes";
import { CabecalhoPagina } from "@/components/ui";
import { db } from "@/lib/db";
import type { IngredienteDTO } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Ingredientes — Doces & Nós",
};

export default async function IngredientesPage() {
  await requireSession();

  const ingredientes = await db.ingrediente.findMany({
    orderBy: { nome: "asc" },
  });

  const dtos: IngredienteDTO[] = ingredientes.map((i) => ({
    id: i.id,
    nome: i.nome,
    precoPago: Number(i.precoPago),
    quantidadeComprada: Number(i.quantidadeComprada),
    unidade: i.unidade,
  }));

  return (
    <div className="flex flex-col gap-8">
      <CabecalhoPagina
        secao="Biblioteca"
        titulo="Ingredientes"
        descricao="O preço das receitas é sempre calculado a partir daqui — editar um ingrediente atualiza todas as receitas."
      />
      <GerenciarIngredientes ingredientes={dtos} />
    </div>
  );
}
