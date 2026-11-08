import { ArrowLeft } from "lucide-react";
import { ProfileForm } from "../components/profile/ProfileForm";
import type { UserProfile } from "../types";

interface RegisterProps {
  onVoltar: () => void;
  onCadastro: (perfil: UserProfile, mensagem: string) => void;
}

export function Register({ onVoltar, onCadastro }: RegisterProps) {
  return (
    <div className="min-h-screen bg-app text-fg flex flex-col justify-center py-8 px-4">
      <div className="max-w-2xl w-full mx-auto mb-3">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 text-sm text-fg-soft hover:text-accent font-bold cursor-pointer py-1 px-3 rounded-full border border-fg/20"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar para o início</span>
        </button>
      </div>
      <div className="max-w-2xl w-full mx-auto border border-fg/40 rounded-2xl bg-app">
        <ProfileForm perfilAtual={null} onSalvo={onCadastro} />
      </div>
    </div>
  );
}
