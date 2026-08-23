export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarNumero(valor: number, casas = 2): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(valor);
}

export interface IngredienteDTO {
  id: string;
  nome: string;
  precoPago: number;
  quantidadeComprada: number;
  unidade: string;
}

export interface ItemReceitaDTO {
  ingredienteId: string;
  quantidade: number;
}

export interface ReceitaDTO {
  id: string;
  nome: string;
  rendimento: number;
  horasTrabalho: number;
  valorHora: number;
  custoEmbalagem: number;
  custoGasEnergia: number;
  custosAdicionais: number;
  taxaCartao: number;
  margemLucro: number;
  favorita: boolean;
  itens: ItemReceitaDTO[];
}

/** Resumo precificado de uma receita, pronto para exibição em listagens. */
export interface ReceitaResumo extends ReceitaDTO {
  custoPorUnidade: number | null;
  precoVenda: number | null;
  lucroTotal: number | null;
}
