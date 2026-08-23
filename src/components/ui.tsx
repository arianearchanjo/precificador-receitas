import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const baseButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage disabled:cursor-not-allowed disabled:opacity-50";

export const buttonVariants = {
  primary:
    `${baseButton} bg-brand-sage text-white shadow-sm hover:bg-brand-marrom hover:shadow-md active:scale-[0.99]`,
  outline: `${baseButton} border border-brand-sage/60 text-brand-sage hover:border-brand-sage hover:bg-brand-sage/10 hover:text-brand-marrom`,
  ghost: `${baseButton} text-ink-muted hover:bg-brand-sage/10 hover:text-brand-marrom`,
} as const;

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-muted/50 focus:border-brand-sage focus:outline-none focus:ring-4 focus:ring-brand-sage/15";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: associação implícita — o input é filho direto da label */}
      <label>
        <span className="label">{label}</span>
        {children}
      </label>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Button({
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return <button {...props} className={`${buttonVariants[variant]} ${props.className ?? ""}`} />;
}

/** Cabeçalho padrão das páginas internas. */
export function CabecalhoPagina({
  secao,
  titulo,
  descricao,
  acoes,
}: {
  secao: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label">{secao}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-brand-marrom sm:text-4xl">
          {titulo}
        </h1>
        {descricao ? <p className="mt-2 max-w-xl text-sm text-ink-muted">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex items-center gap-2">{acoes}</div> : null}
    </div>
  );
}
