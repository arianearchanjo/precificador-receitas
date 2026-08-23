import { notFound } from "next/navigation";
import { EditorReceita } from "@/components/editor-receita";
import { CabecalhoPagina } from "@/components/ui";
import { db } from "@/lib/db";
import type { IngredienteDTO, ReceitaDTO } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Editar receita — Doces & Nós",
};

export default async function EditarReceitaPage(props: PageProps<"/receitas/[id]/editar">) {
  await requireSession();
  const { id } = await props.params;

  const [receita, ingredientes] = await Promise.all([
    db.receita.findUnique({
      where: { id },
      include: {
        ingredientes: {
          include: { ingrediente: true },
        },
      },
    }),
    db.ingrediente.findMany({ orderBy: { nome: "asc" } }),
  ]);

  if (!receita) {
    notFound();
  }

  const dtosIngrediente: IngredienteDTO[] = ingredientes.map((i) => ({
    id: i.id,
    nome: i.nome,
    precoPago: Number(i.precoPago),
    quantidadeComprada: Number(i.quantidadeComprada),
    unidade: i.unidade,
  }));

  const dtoReceita: ReceitaDTO = {
    id: receita.id,
    nome: receita.nome,
    rendimento: receita.rendimento,
    horasTrabalho: Number(receita.horasTrabalho),
    valorHora: Number(receita.valorHora),
    custoEmbalagem: Number(receita.custoEmbalagem),
    custoGasEnergia: Number(receita.custoGasEnergia),
    custosAdicionais: Number(receita.custosAdicionais),
    taxaCartao: Number(receita.taxaCartao),
    margemLucro: Number(receita.margemLucro),
    favorita: receita.favorita,
    itens: receita.ingredientes.map((item) => ({
      ingredienteId: item.ingredienteId,
      quantidade: Number(item.quantidade),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        secao="Editando"
        titulo={receita.nome}
        voltar={{ href: `/receitas/${receita.id}`, rotulo: "Voltar à receita" }}
      />
      <EditorReceita ingredientes={dtosIngrediente} receita={dtoReceita} />
    </div>
  );
}
