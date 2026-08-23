import { hashPassword, verifyPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Mantém a única conta de acesso do sistema em sincronia com o .env
 * (ADMIN_EMAIL / ADMIN_PASSWORD), que é a fonte da verdade.
 *
 * - Se ainda não há usuário com o e-mail do .env: remove contas obsoletas de
 *   configurações anteriores e cria a conta atual.
 * - Se a senha do .env mudou: atualiza o hash.
 *
 * Não há cadastro pela UI nem pela API — este é o único caminho de criação.
 */
/**
 * Emissor sintético que o better-auth (v1.7+) associa a contas locais de
 * credencial e exige no sign-in (`account.issuer === "local:credential"`).
 */
const EMISSOR_CREDENCIAL = "local:credential";

export async function garantirUsuarioInicial(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 6) {
    console.error(
      "[usuario-inicial] ADMIN_EMAIL/ADMIN_PASSWORD ausentes ou com menos de 6 caracteres no .env — conta não criada.",
    );
    return;
  }

  try {
    const usuario = await db.user.findFirst({
      where: { email },
      include: { accounts: true },
    });

    if (!usuario) {
      await db.user.deleteMany();
      await auth.api.signUpEmail({
        body: { name: "Doces & Nós", email, password },
      });
      return;
    }

    const credencial = usuario.accounts.find((a) => a.providerId === "credential");
    if (!credencial) {
      // Conta órfã (usuário sem credencial de senha): cria agora.
      await db.account.create({
        data: {
          userId: usuario.id,
          accountId: usuario.id,
          providerId: "credential",
          issuer: EMISSOR_CREDENCIAL,
          password: await hashPassword(password),
        },
      });
      return;
    }

    const reparos: { password?: string; issuer?: string } = {};
    if (!credencial.password) {
      reparos.password = await hashPassword(password);
    } else if (!(await verifyPassword({ hash: credencial.password, password }))) {
      reparos.password = await hashPassword(password);
    }
    if (credencial.issuer !== EMISSOR_CREDENCIAL) {
      reparos.issuer = EMISSOR_CREDENCIAL;
    }
    if (Object.keys(reparos).length > 0) {
      await db.account.update({ where: { id: credencial.id }, data: reparos });
    }
  } catch (erro) {
    console.error("[usuario-inicial] Falha ao sincronizar conta do .env:", erro);
  }
}
