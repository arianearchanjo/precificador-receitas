import { EditorReceita } from "@/components/editor-receita";
import { CabecalhoPagina } from "@/components/ui";
import { db } from "@/lib/db";
import type { IngredienteDTO } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Nova receita — Doces & Nós",
};

export default async function NovaReceitaPage() {
  await requireSession();

  const ingredientes = await db.ingrediente.findMany({ orderBy: { nome: "asc" } });

  const dtosIngrediente: IngredienteDTO[] = ingredientes.map((i) => ({
    id: i.id,
    nome: i.nome,
    precoPago: Number(i.precoPago),
    quantidadeComprada: Number(i.quantidadeComprada),
    unidade: i.unidade,
  }));

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        secao="Receitas"
        titulo="Nova receita"
        descricao="O preço sugerido é recalculado em tempo real enquanto você preenche."
        voltar={{ href: "/receitas", rotulo: "Receitas" }}
      />
      <EditorReceita ingredientes={dtosIngrediente} receita={null} />
    </div>
  );
}
