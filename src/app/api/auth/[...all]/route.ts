import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

// Não há cadastro pela UI nem pela API: a conta de acesso é única e nasce do .env.
async function bloquearSignUp(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname.includes("/sign-up")) {
    return Response.json({ message: "Cadastro desabilitado." }, { status: 403 });
  }
  return handlers.POST(request);
}

export const POST = bloquearSignUp;
export const GET = handlers.GET;
