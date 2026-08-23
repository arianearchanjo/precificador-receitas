import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const baseButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const buttonVariants = {
  primary: `${baseButton} bg-brand-sage text-white shadow-sm shadow-brand-sage/30 hover:bg-brand-marrom hover:shadow-md hover:shadow-brand-marrom/20`,
  outline: `${baseButton} border border-line-strong bg-white text-brand-marrom hover:border-brand-sage hover:bg-brand-sage/10`,
  ghost: `${baseButton} text-ink-muted hover:bg-brand-sage/10 hover:text-brand-marrom`,
  danger: `${baseButton} bg-red-800 text-white shadow-sm hover:bg-red-900 active:scale-[0.98]`,
  dangerGhost: `${baseButton} text-red-800 hover:bg-red-50 hover:text-red-900`,
} as const;

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-muted/60 hover:border-ink-muted/40 focus:border-brand-sage focus:outline-none focus:ring-4 focus:ring-brand-sage/15 disabled:cursor-not-allowed disabled:bg-brand-cream/60";

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
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-700">
          <IconAlerta className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function BuscaInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <IconBusca className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input type="search" {...props} className={`${inputClass} pr-3 pl-9`} />
    </div>
  );
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

/** Indicador de carregamento para botões e ações em andamento. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Ícones (traço 1.8, grid 24) compartilhados entre as telas. */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Ícone decorativo: escondido de leitores de tela, o rótulo vem do texto vizinho. */
function Icon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg {...iconProps} aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

export function IconPlus({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconX({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconLixeira({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </Icon>
  );
}

export function IconLapis({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </Icon>
  );
}

export function IconSetaEsquerda({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
    </Icon>
  );
}

export function IconSetaDireita({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 12h14m0 0-6-6m6 6-6 6" />
    </Icon>
  );
}

export function IconBusca({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  );
}

export function IconAlerta({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  );
}

/** Controles de paginação — ocultos quando há uma única página. */
export function Paginacao({
  pagina,
  totalPaginas,
  aoMudar,
}: {
  pagina: number;
  totalPaginas: number;
  aoMudar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        disabled={pagina <= 1}
        onClick={() => aoMudar(pagina - 1)}
        className="px-3 py-2"
      >
        Anterior
      </Button>
      <p className="text-sm text-ink-muted" role="status">
        Página <span className="font-medium text-ink">{pagina}</span> de {totalPaginas}
      </p>
      <Button
        variant="outline"
        disabled={pagina >= totalPaginas}
        onClick={() => aoMudar(pagina + 1)}
        className="px-3 py-2"
      >
        Próxima
      </Button>
    </nav>
  );
}

/** Cabeçalho padrão das páginas internas, com link opcional de volta. */
export function CabecalhoPagina({
  secao,
  titulo,
  descricao,
  acoes,
  voltar,
}: {
  secao: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {voltar ? (
          <Link
            href={voltar.href}
            className="mb-2 inline-flex -ml-1 items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-marrom focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage"
          >
            <IconSetaEsquerda className="h-4 w-4" />
            {voltar.rotulo}
          </Link>
        ) : null}
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
