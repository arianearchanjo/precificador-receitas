/**
 * Seed de dados de teste para desenvolvimento.
 *
 * Execução: `npm run db:seed`
 *
 * Travas de segurança — a seed se recusa a rodar a menos que TODAS as
 * condições abaixo sejam verdadeiras:
 *   1. `AMBIENTE=desenvolvimento` no .env;
 *   2. `NODE_ENV` não seja "production" (bloqueio incondicional).
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const AMBIENTE = process.env.AMBIENTE?.trim().toLowerCase();

if (process.env.NODE_ENV === "production") {
  console.error(
    '[seed] BLOQUEADO: NODE_ENV é "production". A seed de teste nunca roda em produção.',
  );
  process.exit(1);
}

if (AMBIENTE !== "desenvolvimento") {
  console.error(
    '[seed] BLOQUEADO: adicione AMBIENTE="desenvolvimento" ao .env para permitir a seed de teste.',
  );
  process.exit(1);
}

function criarCliente(): PrismaClient {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  const prisma = criarCliente();

  try {
    // Limpa apenas tabelas de negócio, respeitando a ordem das chaves.
    await prisma.receitaIngrediente.deleteMany();
    await prisma.receita.deleteMany();
    await prisma.ingrediente.deleteMany();
    await prisma.configuracaoConfeitaria.deleteMany();

    await prisma.configuracaoConfeitaria.create({
      data: { id: 1, nome: "Doces & Nós", telefone: "(11) 99999-0000" },
    });

    // ---------- Biblioteca de ingredientes ----------
    const ing = async (
      nome: string,
      precoPago: string,
      quantidadeComprada: string,
      unidade: "g" | "ml" | "un" | "kg" | "l",
    ) =>
      prisma.ingrediente.create({
        data: { nome, precoPago, quantidadeComprada, unidade },
      });

    const farinha = await ing("Farinha de trigo", "6.50", "1000", "g");
    const acucar = await ing("Açúcar refinado", "4.90", "1000", "g");
    const acucarMascavo = await ing("Açúcar mascavo", "9.90", "500", "g");
    const acucarConfeiteiro = await ing("Açúcar de confeiteiro", "12.90", "1", "kg");
    const manteiga = await ing("Manteiga sem sal", "24.90", "500", "g");
    const ovos = await ing("Ovos", "12.00", "12", "un");
    const oleo = await ing("Óleo de soja", "8.49", "900", "ml");
    const leite = await ing("Leite integral", "5.49", "1", "l");
    const cremeDeLeite = await ing("Creme de leite", "6.99", "300", "g");
    const chocolateMeioAmargo = await ing("Chocolate meio amargo", "29.90", "1000", "g");
    const chocolateBranco = await ing("Chocolate branco", "32.90", "1000", "g");
    const cacau = await ing("Cacau em pó", "21.90", "500", "g");
    const leiteCondensado = await ing("Leite condensado", "8.49", "395", "g");
    const fermento = await ing("Fermento em pó", "3.20", "100", "g");
    const baunilha = await ing("Essência de baunilha", "12.90", "100", "ml");
    const morango = await ing("Morango fresco", "14.90", "500", "g");
    const biscoitoMaisena = await ing("Biscoito maisena", "7.80", "400", "g");
    const creamCheese = await ing("Cream cheese", "18.90", "1500", "g");
    const farinhaAmendoa = await ing("Farinha de amêndoas", "39.90", "500", "g");
    const mel = await ing("Mel", "19.90", "500", "g");
    const aveia = await ing("Aveia em flocos", "8.90", "1000", "g");

    // ---------- Receitas ----------
    const rec = async (dados: Parameters<typeof prisma.receita.create>[0]["data"]) => {
      const criada = await prisma.receita.create({ data: dados });
      console.log(`[seed] Receita criada: ${criada.nome}`);
      return criada;
    };

    await rec({
      nome: "Bolo de chocolate",
      rendimento: 12,
      horasTrabalho: "1.50",
      valorHora: "25.00",
      custoEmbalagem: "5.00",
      custoGasEnergia: "2.00",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "30.00",
      favorita: true,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: "300" },
          { ingredienteId: acucar.id, quantidade: "250" },
          { ingredienteId: manteiga.id, quantidade: "100" },
          { ingredienteId: ovos.id, quantidade: "3" },
          { ingredienteId: chocolateMeioAmargo.id, quantidade: "200" },
          { ingredienteId: cacau.id, quantidade: "40" },
          { ingredienteId: fermento.id, quantidade: "15" },
        ],
      },
    });

    await rec({
      nome: "Brigadeiro gourmet",
      rendimento: 30,
      horasTrabalho: "1.00",
      valorHora: "25.00",
      custoEmbalagem: "3.00",
      custoGasEnergia: "0.50",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "40.00",
      favorita: false,
      ingredientes: {
        create: [
          { ingredienteId: leiteCondensado.id, quantidade: "395" },
          { ingredienteId: chocolateMeioAmargo.id, quantidade: "150" },
          { ingredienteId: manteiga.id, quantidade: "20" },
          { ingredienteId: baunilha.id, quantidade: "5" },
          { ingredienteId: acucarConfeiteiro.id, quantidade: "30" },
        ],
      },
    });

    await rec({
      nome: "Bolo de cenoura com cobertura",
      rendimento: 12,
      horasTrabalho: "1.25",
      valorHora: "25.00",
      custoEmbalagem: "5.00",
      custoGasEnergia: "2.00",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "35.00",
      favorita: true,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: "350" },
          { ingredienteId: acucar.id, quantidade: "300" },
          { ingredienteId: oleo.id, quantidade: "180" },
          { ingredienteId: ovos.id, quantidade: "4" },
          { ingredienteId: fermento.id, quantidade: "20" },
          { ingredienteId: chocolateMeioAmargo.id, quantidade: "150" },
          { ingredienteId: cremeDeLeite.id, quantidade: "150" },
        ],
      },
    });

    await rec({
      nome: "Cheesecake de frutas vermelhas",
      rendimento: 10,
      horasTrabalho: "2.00",
      valorHora: "30.00",
      custoEmbalagem: "8.00",
      custoGasEnergia: "3.00",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "35.00",
      favorita: false,
      ingredientes: {
        create: [
          { ingredienteId: biscoitoMaisena.id, quantidade: "200" },
          { ingredienteId: manteiga.id, quantidade: "80" },
          { ingredienteId: creamCheese.id, quantidade: "600" },
          { ingredienteId: acucar.id, quantidade: "150" },
          { ingredienteId: ovos.id, quantidade: "3" },
          { ingredienteId: baunilha.id, quantidade: "10" },
          { ingredienteId: morango.id, quantidade: "250" },
        ],
      },
    });

    await rec({
      nome: "Cookies de chocolate com aveia",
      rendimento: 20,
      horasTrabalho: "1.50",
      valorHora: "25.00",
      custoEmbalagem: "4.00",
      custoGasEnergia: "1.50",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "45.00",
      favorita: false,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: "250" },
          { ingredienteId: aveia.id, quantidade: "100" },
          { ingredienteId: acucarMascavo.id, quantidade: "150" },
          { ingredienteId: manteiga.id, quantidade: "120" },
          { ingredienteId: ovos.id, quantidade: "2" },
          { ingredienteId: chocolateMeioAmargo.id, quantidade: "180" },
          { ingredienteId: fermento.id, quantidade: "5" },
          { ingredienteId: baunilha.id, quantidade: "5" },
        ],
      },
    });

    await rec({
      nome: "Torta holandesa",
      rendimento: 12,
      horasTrabalho: "1.75",
      valorHora: "30.00",
      custoEmbalagem: "7.00",
      custoGasEnergia: "1.00",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "38.00",
      favorita: true,
      ingredientes: {
        create: [
          { ingredienteId: biscoitoMaisena.id, quantidade: "200" },
          { ingredienteId: manteiga.id, quantidade: "100" },
          { ingredienteId: leiteCondensado.id, quantidade: "395" },
          { ingredienteId: cremeDeLeite.id, quantidade: "300" },
          { ingredienteId: chocolateBranco.id, quantidade: "200" },
        ],
      },
    });

    await rec({
      nome: "Bolo de mel e amêndoas",
      rendimento: 10,
      horasTrabalho: "1.25",
      valorHora: "25.00",
      custoEmbalagem: "5.50",
      custoGasEnergia: "2.00",
      custosAdicionais: "0.00",
      taxaCartao: "3.49",
      margemLucro: "32.00",
      favorita: false,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: "280" },
          { ingredienteId: farinhaAmendoa.id, quantidade: "100" },
          { ingredienteId: mel.id, quantidade: "150" },
          { ingredienteId: acucar.id, quantidade: "80" },
          { ingredienteId: manteiga.id, quantidade: "90" },
          { ingredienteId: ovos.id, quantidade: "3" },
          { ingredienteId: leite.id, quantidade: "120" },
          { ingredienteId: fermento.id, quantidade: "12" },
        ],
      },
    });

    const [ingredientes, receitas] = await Promise.all([
      prisma.ingrediente.count(),
      prisma.receita.count(),
    ]);
    console.log(`[seed] Concluída: ${ingredientes} ingredientes e ${receitas} receitas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("[seed] Falhou:", erro);
  process.exit(1);
});
