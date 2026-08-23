import { describe, expect, it } from "vitest";
import {
  calcularPrecoVenda,
  custoItemNaReceita,
  custoUnitarioIngrediente,
  type DadosReceita,
  precificar,
  validarDadosReceita,
} from "./pricing";

const manteiga = { precoPago: 10, quantidadeComprada: 200 }; // R$ 0,05/g
const acucar = { precoPago: 4.5, quantidadeComprada: 1000 }; // R$ 0,0045/g

function dadosValidos(sobrescrita: Partial<DadosReceita> = {}): DadosReceita {
  return {
    itens: [
      { ingrediente: manteiga, quantidade: 100 }, // 5,00
      { ingrediente: acucar, quantidade: 500 }, // 2,25
    ],
    rendimento: 10,
    horasTrabalho: 1.5,
    valorHora: 20, // 30,00
    custoEmbalagem: 3,
    custoGasEnergia: 2,
    custosAdicionais: 0.75, // fixos 5,75
    margemPercentual: 30,
    taxaPercentual: 3.49,
    ...sobrescrita,
  };
}

describe("custoUnitarioIngrediente", () => {
  it("deriva o custo unitário a partir do preço pago e da quantidade comprada", () => {
    expect(custoUnitarioIngrediente(manteiga)).toBeCloseTo(0.05);
    expect(custoUnitarioIngrediente(acucar)).toBeCloseTo(0.0045);
  });

  it("retorna NaN quando a quantidade comprada é zero ou negativa", () => {
    expect(Number.isNaN(custoUnitarioIngrediente({ precoPago: 10, quantidadeComprada: 0 }))).toBe(
      true,
    );
    expect(Number.isNaN(custoUnitarioIngrediente({ precoPago: 10, quantidadeComprada: -1 }))).toBe(
      true,
    );
  });
});

describe("custoItemNaReceita", () => {
  it("multiplica o custo unitário pela quantidade usada", () => {
    expect(custoItemNaReceita({ ingrediente: manteiga, quantidade: 100 })).toBeCloseTo(5);
  });
});

describe("calcularPrecoVenda", () => {
  it("aplica a fórmula preco = custo / (1 - margem% - taxa%)", () => {
    // 1 - 0.30 - 0.0349 = 0.6651
    expect(calcularPrecoVenda(10, 30, 3.49)).toBeCloseTo(10 / 0.6651, 6);
    expect(calcularPrecoVenda(10, 0, 0)).toBeCloseTo(10, 6);
  });
});

describe("validarDadosReceita", () => {
  it("não aponta erros para dados válidos", () => {
    expect(validarDadosReceita(dadosValidos())).toEqual([]);
  });

  it("rejeita margem + taxa >= 100%", () => {
    const erros = validarDadosReceita(dadosValidos({ margemPercentual: 97, taxaPercentual: 3 }));
    expect(erros.join(" ")).toMatch(/menos de 100%/i);

    const errosLimite = validarDadosReceita(
      dadosValidos({ margemPercentual: 99.9, taxaPercentual: 0.1 }),
    );
    expect(errosLimite.join(" ")).toMatch(/menos de 100%/i);
  });

  it("rejeita rendimento zero ou negativo", () => {
    expect(validarDadosReceita(dadosValidos({ rendimento: 0 })).join(" ")).toMatch(/rendimento/i);
    expect(validarDadosReceita(dadosValidos({ rendimento: -2 })).join(" ")).toMatch(/rendimento/i);
  });

  it("rejeita margem ou taxa negativas", () => {
    expect(validarDadosReceita(dadosValidos({ margemPercentual: -1 })).join(" ")).toMatch(
      /margem/i,
    );
    expect(validarDadosReceita(dadosValidos({ taxaPercentual: -0.5 })).join(" ")).toMatch(/taxa/i);
  });

  it("rejeita quantidades de ingredientes menores ou iguais a zero", () => {
    const erros = validarDadosReceita(
      dadosValidos({ itens: [{ ingrediente: manteiga, quantidade: 0 }] }),
    );
    expect(erros.join(" ")).toMatch(/quantidades/i);
  });
});

describe("precificar", () => {
  it("calcula custos, preço e lucro corretamente", () => {
    const resultado = precificar(dadosValidos());

    if (!resultado.valido) throw new Error("deveria ser válido");

    // ingredientes 7,25 + mão de obra 30 + fixos 5,75
    expect(resultado.custoIngredientes).toBeCloseTo(7.25);
    expect(resultado.custoMaoDeObra).toBeCloseTo(30);
    expect(resultado.custosFixos).toBeCloseTo(5.75);
    expect(resultado.custoTotal).toBeCloseTo(43);

    expect(resultado.custoPorUnidade).toBeCloseTo(4.3);

    const esperadoPreco = 4.3 / (1 - 0.3 - 0.0349);
    expect(resultado.precoVenda).toBeCloseTo(esperadoPreco, 2);

    const taxaValor = esperadoPreco * 0.0349;
    const lucroUnidade = esperadoPreco - 4.3 - taxaValor;
    expect(resultado.taxaValor).toBeCloseTo(taxaValor, 2);
    expect(resultado.lucroPorUnidade).toBeCloseTo(lucroUnidade, 2);
    expect(resultado.lucroTotal).toBeCloseTo(lucroUnidade * 10, 2);
  });

  it("confere a invariante: preco - taxa - custo = lucro por unidade", () => {
    const resultado = precificar(
      dadosValidos({
        itens: [],
        horasTrabalho: 0,
        valorHora: 15,
        rendimento: 24,
        margemPercentual: 45,
        taxaPercentual: 5.5,
      }),
    );
    if (!resultado.valido) throw new Error("deveria ser válido");
    // tolerância de centavos: cada campo é arredondado individualmente
    expect(
      Math.abs(
        resultado.lucroPorUnidade -
          (resultado.precoVenda - resultado.custoPorUnidade - resultado.taxaValor),
      ),
    ).toBeLessThanOrEqual(0.02);
  });

  it("retorna erro claro quando não existe preço válido (margem + taxa >= 100%)", () => {
    const resultado = precificar(dadosValidos({ margemPercentual: 70, taxaPercentual: 35 }));
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.erros.some((e) => e.includes("100%"))).toBe(true);
    }
  });

  it("nunca divide por zero nem devolve preço infinito", () => {
    const resultado = precificar(dadosValidos({ margemPercentual: 100, taxaPercentual: 0 }));
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      for (const erro of resultado.erros) {
        expect(erro.length).toBeGreaterThan(0);
      }
    }
  });

  it("receita sem ingredientes e sem custos extras tem preço zero", () => {
    const resultado = precificar(
      dadosValidos({
        itens: [],
        horasTrabalho: 0,
        valorHora: 0,
        custoEmbalagem: 0,
        custoGasEnergia: 0,
        custosAdicionais: 0,
      }),
    );
    if (!resultado.valido) throw new Error("deveria ser válido");
    expect(resultado.custoTotal).toBe(0);
    expect(resultado.precoVenda).toBe(0);
    expect(resultado.lucroTotal).toBe(0);
  });
});
