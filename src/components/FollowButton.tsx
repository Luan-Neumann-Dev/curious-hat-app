import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { deixarDeSeguir, seguir } from "../services/social";

interface FollowButtonProps {
  userId: string;
  seguindo: boolean;
  onChange?: (seguindo: boolean) => void;
  compacto?: boolean;
}

export function FollowButton({ userId, seguindo, onChange, compacto = false }: FollowButtonProps) {
  const [salvando, setSalvando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function alternar() {
    try {
      setSalvando(true);
      setFalhou(false);
      if (seguindo) {
        await deixarDeSeguir(userId);
      } else {
        await seguir(userId);
      }
      onChange?.(!seguindo);
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
      aria-pressed={seguindo}
      title={falhou ? "Não deu certo. Tente de novo." : undefined}
      className={`rounded-full font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-wait ${
        compacto ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm"
      } ${
        seguindo
          ? "bg-app text-fg border border-fg/60 hover:border-danger hover:text-danger"
          : "bg-fg text-app border border-fg hover:opacity-85"
      }`}
    >
      {seguindo ? (
        <Check size={compacto ? 13 : 16} aria-hidden="true" />
      ) : (
        <UserPlus size={compacto ? 13 : 16} aria-hidden="true" />
      )}
      <span>{falhou ? "Tentar de novo" : seguindo ? "Seguindo" : "Seguir"}</span>
    </button>
  );
}
