interface IdentityToggleProps {
  anonimo: boolean;
  onChange: (anonimo: boolean) => void;
  nome?: string;
  vulgo?: string;
  titulo: string;
}

/** Alterna entre publicar com o nome no site ou com o vulgo anônimo. */
export function IdentityToggle({ anonimo, onChange, nome, vulgo, titulo }: IdentityToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!anonimo)}
      aria-pressed={anonimo}
      title={titulo}
      className="relative inline-flex items-center py-1 px-1 bg-transparent border-0 cursor-pointer select-none group"
    >
      <span
        className={`relative inline-block text-base font-extrabold tracking-wide transition-colors ${
          anonimo ? "text-anon" : "text-fg group-hover:text-fg-soft"
        }`}
      >
        {anonimo && (
          <span
            className="absolute -top-3.5 -left-2 text-sm leading-none transform -rotate-12 pointer-events-none select-none drop-shadow"
            aria-hidden="true"
          >
            🎩
          </span>
        )}
        {anonimo ? vulgo : nome}
      </span>
    </button>
  );
}
