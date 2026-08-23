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
    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-md shadow-brand-marrom/5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="E-mail">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
        <Button type="submit" disabled={loading} className="mt-1 w-full py-3">
          {loading ? <Spinner /> : null}
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
