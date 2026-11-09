import type { KeyboardEvent, ReactNode } from "react";

interface AbasProps<T extends string> {
  /** Prefixo dos ids; o mesmo valor vai no `PainelDaAba` correspondente. */
  base: string;
  rotulo: string;
  abas: { id: T; rotulo: string }[];
  ativa: T;
  onChange: (aba: T) => void;
}

/** Abas com navegação por setas: só a aba ativa fica na ordem do Tab. */
export function Abas<T extends string>({ base, rotulo, abas, ativa, onChange }: AbasProps<T>) {
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = abas.length - 1;
    const destinos: Record<string, number> = {
      ArrowRight: indice === ultimo ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    };
    const destino = destinos[e.key];
    if (destino === undefined) return;

    e.preventDefault();
    onChange(abas[destino].id);
    e.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [destino]?.focus();
  }

  return (
    <div role="tablist" aria-label={rotulo} className="grid grid-cols-3 border-b border-fg/30 text-sm font-bold text-center">
      {abas.map((aba, indice) => (
        <button
          key={aba.id}
          id={`${base}-aba-${aba.id}`}
          type="button"
          role="tab"
          aria-selected={ativa === aba.id}
          aria-controls={`${base}-painel`}
          tabIndex={ativa === aba.id ? 0 : -1}
          onClick={() => onChange(aba.id)}
          onKeyDown={(e) => handleKeyDown(e, indice)}
          className={`py-3.5 px-1 hover:bg-raised/60 transition cursor-pointer relative ${
            ativa === aba.id ? "text-fg" : "text-muted"
          }`}
        >
          <span>{aba.rotulo}</span>
          {ativa === aba.id && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

interface PainelDaAbaProps {
  base: string;
  ativa: string;
  children: ReactNode;
}

export function PainelDaAba({ base, ativa, children }: PainelDaAbaProps) {
  return (
    <div id={`${base}-painel`} role="tabpanel" aria-labelledby={`${base}-aba-${ativa}`} tabIndex={0}>
      {children}
    </div>
  );
}
