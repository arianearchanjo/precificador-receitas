"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, IconAlerta, Spinner, TextInput } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (authError) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col gap-1.5 text-left sm:text-center">
        <h1 className="font-display text-3xl leading-tight font-medium text-brand-marrom sm:text-4xl">
          Bom te ver por aqui
        </h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Entre para acessar suas receitas e preços.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 sm:gap-5 sm:rounded-2xl sm:border sm:border-line sm:bg-surface sm:p-7 sm:shadow-md sm:shadow-brand-marrom/5"
      >
        <Field label="E-mail">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            placeholder="voce@email.com"
          />
        </Field>
        <Field label="Senha">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            <IconAlerta className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={loading} className="mt-2 w-full py-3.5 sm:mt-1 sm:py-3">
          {loading ? <Spinner /> : null}
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
