import { ListaReceitas } from "@/components/lista-receitas";
import { CabecalhoPagina } from "@/components/ui";
import { db } from "@/lib/db";
import type { ReceitaResumo } from "@/lib/format";
import { precificar } from "@/lib/pricing";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Receitas — Doces & Nós",
};

export default async function ReceitasPage() {
  await requireSession();

  const [receitas] = await Promise.all([
    db.receita.findMany({
      orderBy: [{ atualizadoEm: "desc" }],
      include: {
        ingredientes: {
          include: { ingrediente: true },
        },
      },
    }),
  ]);

  const resumos: ReceitaResumo[] = receitas.map((receita) => {
    const dto = {
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

    const resultado = precificar({
      itens: receita.ingredientes.map((item) => ({
        ingrediente: {
          precoPago: Number(item.ingrediente.precoPago),
          quantidadeComprada: Number(item.ingrediente.quantidadeComprada),
        },
        quantidade: Number(item.quantidade),
      })),
      rendimento: receita.rendimento,
      horasTrabalho: Number(receita.horasTrabalho),
      valorHora: Number(receita.valorHora),
      custoEmbalagem: Number(receita.custoEmbalagem),
      custoGasEnergia: Number(receita.custoGasEnergia),
      custosAdicionais: Number(receita.custosAdicionais),
      margemPercentual: Number(receita.margemLucro),
      taxaPercentual: Number(receita.taxaCartao),
    });

    return {
      ...dto,
      custoPorUnidade: resultado.valido ? resultado.custoPorUnidade : null,
      precoVenda: resultado.valido ? resultado.precoVenda : null,
      lucroTotal: resultado.valido ? resultado.lucroTotal : null,
    };
  });

  const ordenadas = [...resumos].sort((a, b) => Number(b.favorita) - Number(a.favorita));

  return (
    <div className="flex flex-col gap-8">
      <CabecalhoPagina
        secao="Painel"
        titulo="Receitas"
        descricao="Preço calculado a partir do custo real de ingredientes, mão de obra e custos fixos."
      />
      <ListaReceitas receitas={ordenadas} />
    </div>
  );
}
