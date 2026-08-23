"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { type ItemReceita, precificar } from "@/lib/pricing";
import { getSession } from "@/lib/session";

export interface ItemReceitaPayload {
  ingredienteId: string;
  quantidade: number;
}

export interface DadosReceitaPayload {
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
  itens: ItemReceitaPayload[];
}

export type ResultadoMutacao = { ok: true } | { ok: false; erro: string };

async function garantirAutenticado(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session);
}

export async function salvarReceita(
  id: string | null,
  dados: DadosReceitaPayload,
): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  if (!dados.nome || dados.nome.trim().length === 0) {
    return { ok: false, erro: "Informe o nome da receita." };
  }
  if (!Number.isInteger(dados.rendimento) || dados.rendimento <= 0) {
    return { ok: false, erro: "O rendimento deve ser um número inteiro maior que zero." };
  }

  // Valida a precificação com os preços REAIS da biblioteca (fonte da verdade),
  // garantindo consistência com o que foi exibido no formulário.
  const ids = dados.itens.map((i) => i.ingredienteId);
  const ingredientes =
    ids.length > 0 ? await db.ingrediente.findMany({ where: { id: { in: ids } } }) : [];

  if (ingredientes.length !== ids.length) {
    return { ok: false, erro: "Há ingrediente inválido na lista. Remova-o e salve novamente." };
  }

  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  const itensParaPrecificar: ItemReceita[] = dados.itens.map((item) => {
    const ingrediente = porId.get(item.ingredienteId);
    if (!ingrediente) {
      throw new Error("Ingrediente não encontrado");
    }
    return {
      ingrediente: {
        precoPago: Number(ingrediente.precoPago),
        quantidadeComprada: Number(ingrediente.quantidadeComprada),
      },
      quantidade: item.quantidade,
    };
  });

  const resultado = precificar({
    itens: itensParaPrecificar,
    rendimento: dados.rendimento,
    horasTrabalho: dados.horasTrabalho,
    valorHora: dados.valorHora,
    custoEmbalagem: dados.custoEmbalagem,
    custoGasEnergia: dados.custoGasEnergia,
    custosAdicionais: dados.custosAdicionais,
    margemPercentual: dados.margemLucro,
    taxaPercentual: dados.taxaCartao,
  });

  if (!resultado.valido) {
    return { ok: false, erro: resultado.erros.join(" ") };
  }

  const dataBase = {
    nome: dados.nome.trim(),
    rendimento: dados.rendimento,
    horasTrabalho: dados.horasTrabalho,
    valorHora: dados.valorHora,
    custoEmbalagem: dados.custoEmbalagem,
    custoGasEnergia: dados.custoGasEnergia,
    custosAdicionais: dados.custosAdicionais,
    taxaCartao: dados.taxaCartao,
    margemLucro: dados.margemLucro,
    favorita: dados.favorita,
  };

  if (id === null) {
    await db.receita.create({
      data: {
        ...dataBase,
        ingredientes: {
          create: dados.itens.map((item) => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
          })),
        },
      },
    });
  } else {
    await db.$transaction([
      db.receita.update({ where: { id }, data: dataBase }),
      db.receitaIngrediente.deleteMany({ where: { receitaId: id } }),
      db.receitaIngrediente.createMany({
        data: dados.itens.map((item) => ({
          receitaId: id,
          ingredienteId: item.ingredienteId,
          quantidade: item.quantidade,
        })),
      }),
    ]);
  }

  revalidatePath("/");
  revalidatePath("/receitas");
  if (id !== null) {
    revalidatePath(`/receitas/${id}`);
  }
  return { ok: true };
}

export async function alternarFavorita(id: string): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  try {
    const receita = await db.receita.findUnique({
      where: { id },
      select: { favorita: true },
    });
    if (!receita) {
      return { ok: false, erro: "Receita não encontrada." };
    }
    await db.receita.update({
      where: { id },
      data: { favorita: !receita.favorita },
    });
  } catch {
    return { ok: false, erro: "Não foi possível atualizar a receita." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function excluirReceita(id: string): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  try {
    await db.receita.delete({ where: { id } });
  } catch {
    return { ok: false, erro: "Não foi possível excluir a receita." };
  }

  revalidatePath("/");
  return { ok: true };
}
