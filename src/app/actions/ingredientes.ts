"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const UNIDADES = ["g", "ml", "un", "kg", "l"] as const;
export type Unidade = (typeof UNIDADES)[number];

export interface DadosIngrediente {
  nome: string;
  precoPago: number;
  quantidadeComprada: number;
  unidade: Unidade;
}

export type ResultadoMutacao = { ok: true } | { ok: false; erro: string };

function validarDados(dados: DadosIngrediente): string | null {
  if (!dados.nome || dados.nome.trim().length === 0) {
    return "Informe o nome do ingrediente.";
  }
  if (!Number.isFinite(dados.precoPago) || dados.precoPago < 0) {
    return "O preço pago deve ser um número maior ou igual a zero.";
  }
  if (!Number.isFinite(dados.quantidadeComprada) || dados.quantidadeComprada <= 0) {
    return "A quantidade comprada deve ser maior que zero.";
  }
  if (!UNIDADES.includes(dados.unidade)) {
    return "Selecione uma unidade válida.";
  }
  return null;
}

async function garantirAutenticado(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session);
}

export async function criarIngrediente(dados: DadosIngrediente): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }
  const erro = validarDados(dados);
  if (erro) return { ok: false, erro };

  await db.ingrediente.create({
    data: {
      nome: dados.nome.trim(),
      precoPago: dados.precoPago,
      quantidadeComprada: dados.quantidadeComprada,
      unidade: dados.unidade,
    },
  });

  revalidatePath("/ingredientes");
  revalidatePath("/");
  return { ok: true };
}

export async function atualizarIngrediente(
  id: string,
  dados: DadosIngrediente,
): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }
  const erro = validarDados(dados);
  if (erro) return { ok: false, erro };

  try {
    await db.ingrediente.update({
      where: { id },
      data: {
        nome: dados.nome.trim(),
        precoPago: dados.precoPago,
        quantidadeComprada: dados.quantidadeComprada,
        unidade: dados.unidade,
      },
    });
  } catch {
    return { ok: false, erro: "Não foi possível salvar o ingrediente." };
  }

  revalidatePath("/ingredientes");
  revalidatePath("/");
  return { ok: true };
}

export async function excluirIngrediente(id: string): Promise<ResultadoMutacao> {
  if (!(await garantirAutenticado())) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  try {
    await db.ingrediente.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      erro: "Este ingrediente é usado em uma ou mais receitas e não pode ser excluído.",
    };
  }

  revalidatePath("/ingredientes");
  revalidatePath("/");
  return { ok: true };
}
