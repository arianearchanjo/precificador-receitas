"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    setLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="cursor-pointer rounded-full border border-brand-cream/40 px-2.5 py-1.5 text-[13px] font-medium text-brand-cream transition-colors hover:border-brand-cream hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream disabled:opacity-50 sm:px-3.5 sm:text-sm"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
