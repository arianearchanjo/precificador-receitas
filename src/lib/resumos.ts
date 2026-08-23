import { db } from "@/lib/db";
import type { ReceitaResumo } from "@/lib/format";
import { precificar } from "@/lib/pricing";

/**
 * Carrega todas as receitas com o preço recalculado no servidor,
 * favoritas primeiro e depois pelas mais recentes.
 */
export async function carregarResumos(): Promise<ReceitaResumo[]> {
  const receitas = await db.receita.findMany({
    orderBy: [{ atualizadoEm: "desc" }],
    include: {
      ingredientes: {
        include: { ingrediente: true },
      },
    },
  });

  const resumos: ReceitaResumo[] = receitas.map((receita) => {
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
      custoPorUnidade: resultado.valido ? resultado.custoPorUnidade : null,
      precoVenda: resultado.valido ? resultado.precoVenda : null,
      lucroTotal: resultado.valido ? resultado.lucroTotal : null,
    };
  });

  return [...resumos].sort((a, b) => Number(b.favorita) - Number(a.favorita));
}
