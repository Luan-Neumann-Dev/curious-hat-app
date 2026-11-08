import { useState } from "react";
import { entrarNaComunidade, sairDaComunidade } from "../services/communities";

interface JoinButtonProps {
  comunidadeId: string;
  nome: string;
  membro: boolean;
}

export function JoinButton({ comunidadeId, nome, membro }: JoinButtonProps) {
  const [salvando, setSalvando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function alternar() {
    try {
      setSalvando(true);
      setFalhou(false);
      if (membro) {
        await sairDaComunidade(comunidadeId);
      } else {
        await entrarNaComunidade(comunidadeId);
      }
    } catch {
      setFalhou(true);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={salvando}
      aria-pressed={membro}
      aria-label={`${membro ? "Sair de" : "Entrar em"} ${nome}`}
      className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-wait ${
        membro
          ? "bg-app text-fg border border-fg/60 hover:border-danger hover:text-danger"
          : "bg-fg text-app border border-fg hover:opacity-85"
      }`}
    >
      {falhou ? "Tentar de novo" : membro ? "Sair" : "Entrar"}
    </button>
  );
}
