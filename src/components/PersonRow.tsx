import { Link } from "react-router-dom";
import { avatarPorSemente } from "../lib/avatar";
import type { PublicProfile } from "../types";
import { FollowButton } from "./FollowButton";

interface PersonRowProps {
  pessoa: PublicProfile;
  seguindo: boolean;
  /** Falso quando a linha é a da própria pessoa logada. */
  podeSeguir?: boolean;
  onChange: (seguindo: boolean) => void;
}

export function PersonRow({ pessoa, seguindo, podeSeguir = true, onChange }: PersonRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Link to={`/perfil/${pessoa.userId}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
        <img
          src={pessoa.avatarUrl || avatarPorSemente(pessoa.publicHandle || pessoa.accountName)}
          alt=""
          className="w-9 h-9 rounded-full object-cover border border-fg/30 shrink-0"
        />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-fg truncate group-hover:underline">
            {pessoa.accountName}
          </span>
          <span className="block text-xs text-muted truncate">@{pessoa.publicHandle}</span>
        </span>
      </Link>
      {podeSeguir && (
        <FollowButton userId={pessoa.userId} seguindo={seguindo} onChange={onChange} compacto />
      )}
    </div>
  );
}
