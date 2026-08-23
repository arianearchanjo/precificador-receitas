/**
 * Regras centralizadas de precificação da confeitaria.
 *
 * Fórmula do preço de venda (margem e taxa descontadas sobre o PREÇO final):
 *
 *   preco_venda = custo_por_unidade / (1 - margem% - taxa%)
 *
 * Esta função é pura e é importada tanto no servidor quanto no cliente.
 * Não duplique esta lógica em nenhum outro lugar.
 */

/** Ingrediente da biblioteca, já com valores numéricos resolvidos. */
export interface IngredienteBase {
  precoPago: number;
  quantidadeComprada: number;
}

/** Item da receita: referência a um ingrediente + quantidade usada. */
export interface ItemReceita {
  ingrediente: IngredienteBase;
  quantidade: number;
}

/** Dados de uma receita necessários para precificar. */
export interface DadosReceita {
  itens: ItemReceita[];
  rendimento: number;
  horasTrabalho: number;
  valorHora: number;
  custoEmbalagem: number;
  custoGasEnergia: number;
  custosAdicionais: number;
  /** Margem de lucro desejada sobre o preço de venda, em % (ex.: 30 para 30%). */
  margemPercentual: number;
  /** Taxa de cartão/marketplace sobre o preço de venda, em % (ex.: 3.99). */
  taxaPercentual: number;
}

export type PrecificacaoInvalida = {
  valido: false;
  erros: string[];
};

export type PrecificacaoValida = {
  valido: true;
  erros: string[];
  custoIngredientes: number;
  custoMaoDeObra: number;
  custosFixos: number;
  custoTotal: number;
  custoPorUnidade: number;
  precoVenda: number;
  taxaValor: number;
  lucroPorUnidade: number;
  lucroTotal: number;
};

export type ResultadoPrecificacao = PrecificacaoValida | PrecificacaoInvalida;

/**
 * Custo por unidade da embalagem de compra do ingrediente.
 * Derivado (`preco / quantidade`), nunca armazenado.
 */
export function custoUnitarioIngrediente(ingrediente: IngredienteBase): number {
  if (!Number.isFinite(ingrediente.quantidadeComprada) || ingrediente.quantidadeComprada <= 0) {
    return Number.NaN;
  }
  return ingrediente.precoPago / ingrediente.quantidadeComprada;
}

/** Custo que determinado ingrediente representa na receita, dada a quantidade usada. */
export function custoItemNaReceita(item: ItemReceita): number {
  const custoUnitario = custoUnitarioIngrediente(item.ingrediente);
  if (Number.isNaN(custoUnitario)) {
    return Number.NaN;
  }
  return custoUnitario * item.quantidade;
}

/**
 * Valida os parâmetros de entrada da precificação.
 * Retorna lista de mensagens de erro em pt-BR (vazia quando tudo ok).
 */
export function validarDadosReceita(dados: DadosReceita): string[] {
  const erros: string[] = [];

  if (!Number.isFinite(dados.rendimento) || dados.rendimento <= 0) {
    erros.push("O rendimento deve ser maior que zero.");
  }

  if (!Number.isFinite(dados.margemPercentual) || dados.margemPercentual < 0) {
    erros.push("A margem de lucro deve ser maior ou igual a zero.");
  }

  if (!Number.isFinite(dados.taxaPercentual) || dados.taxaPercentual < 0) {
    erros.push("A taxa deve ser maior ou igual a zero.");
  }

  if (
    Number.isFinite(dados.margemPercentual) &&
    Number.isFinite(dados.taxaPercentual) &&
    dados.margemPercentual >= 0 &&
    dados.taxaPercentual >= 0 &&
    dados.margemPercentual + dados.taxaPercentual >= 100
  ) {
    erros.push("Margem + taxa devem somar menos de 100% — senão não existe preço de venda válido.");
  }

  const camposNaoNegativos: Array<[string, number]> = [
    ["horas de mão de obra", dados.horasTrabalho],
    ["valor da hora", dados.valorHora],
    ["custo com embalagem", dados.custoEmbalagem],
    ["custo com gás/energia", dados.custoGasEnergia],
    ["custos adicionais", dados.custosAdicionais],
  ];
  for (const [rotulo, valor] of camposNaoNegativos) {
    if (!Number.isFinite(valor) || valor < 0) {
      erros.push(`O campo "${rotulo}" deve ser um número maior ou igual a zero.`);
    }
  }

  for (const item of dados.itens) {
    if (!Number.isFinite(item.quantidade) || item.quantidade <= 0) {
      erros.push("As quantidades de ingredientes usadas devem ser maiores que zero.");
      break;
    }
    if (Number.isNaN(custoUnitarioIngrediente(item.ingrediente))) {
      erros.push("Há ingrediente com quantidade comprada inválida na biblioteca.");
      break;
    }
  }

  return erros;
}

function arredondar2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Fórmula direta do preço de venda a partir do custo por unidade.
 * margemPercentual e taxaPercentual em % (0–100).
 * Só é válida quando margem% + taxa% < 100% — valide antes com validarDadosReceita.
 */
export function calcularPrecoVenda(
  custoPorUnidade: number,
  margemPercentual: number,
  taxaPercentual: number,
): number {
  return custoPorUnidade / (1 - margemPercentual / 100 - taxaPercentual / 100);
}

/**
 * Calcula toda a precificação de uma receita.
 * Nunca lança exceção: devolve `valido: false` com mensagens claras quando
 * os dados forem inválidos (inclusive margem + taxa >= 100%, onde não existe
 * preço válido).
 */
export function precificar(dados: DadosReceita): ResultadoPrecificacao {
  const erros = validarDadosReceita(dados);
  if (erros.length > 0) {
    return { valido: false, erros };
  }

  const custoIngredientes = dados.itens.reduce(
    (total, item) => total + custoItemNaReceita(item),
    0,
  );
  const custoMaoDeObra = dados.horasTrabalho * dados.valorHora;
  const custosFixos = dados.custoEmbalagem + dados.custoGasEnergia + dados.custosAdicionais;
  const custoTotal = custoIngredientes + custoMaoDeObra + custosFixos;

  const custoPorUnidade = custoTotal / dados.rendimento;

  const fatorDivisor = 1 - dados.margemPercentual / 100 - dados.taxaPercentual / 100;
  const precoVenda = custoPorUnidade / fatorDivisor;

  const taxaValor = precoVenda * (dados.taxaPercentual / 100);
  const lucroPorUnidade = precoVenda - custoPorUnidade - taxaValor;
  const lucroTotal = lucroPorUnidade * dados.rendimento;

  return {
    valido: true,
    erros,
    custoIngredientes: arredondar2(custoIngredientes),
    custoMaoDeObra: arredondar2(custoMaoDeObra),
    custosFixos: arredondar2(custosFixos),
    custoTotal: arredondar2(custoTotal),
    custoPorUnidade: arredondar2(custoPorUnidade),
    precoVenda: arredondar2(precoVenda),
    taxaValor: arredondar2(taxaValor),
    lucroPorUnidade: arredondar2(lucroPorUnidade),
    lucroTotal: arredondar2(lucroTotal),
  };
}
