import { garantirUsuarioInicial } from "@/lib/usuario-inicial";
import { FormularioLogin } from "./formulario-login";

export const metadata = {
  title: "Entrar — Doces & Nós",
};

export default async function LoginPage() {
  await garantirUsuarioInicial();
  return <FormularioLogin />;
}
