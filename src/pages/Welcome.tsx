import { LogIn, UserPlus } from "lucide-react";
import { HatLogo } from "../components/HatLogo";

interface WelcomeProps {
  onCriarPerfil: () => void;
  onEntrar: () => void;
}

export function Welcome({ onCriarPerfil, onEntrar }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-app text-fg flex flex-col md:flex-row items-center justify-center p-6 md:p-16 relative overflow-hidden">
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-anon/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left select-none">
          <div className="relative group mb-6">
            <div
              className="absolute inset-0 bg-accent/30 blur-2xl rounded-full scale-90 group-hover:scale-105 transition-transform duration-500"
              aria-hidden="true"
            />
            <HatLogo />
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none">
            <span className="block font-serif italic font-light text-fg-soft tracking-normal text-4xl sm:text-5xl mb-1">
              Curious
            </span>
            <span className="bg-gradient-to-r from-accent via-anon to-danger bg-clip-text text-transparent">
              HAT
            </span>
          </h1>
          <p className="mt-4 text-muted text-sm sm:text-base max-w-sm font-medium">
            Sua rede de publicações e segredos anônimos em tempo real.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end justify-center">
          <div className="w-full max-w-sm p-8 rounded-3xl border border-fg/25 bg-surface/90 shadow-2xl text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-fg">Acontecendo agora</h2>
              <p className="text-xs text-fg-soft">
                Inscreva-se hoje ou acesse sua conta existente.
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={onCriarPerfil}
                className="w-full py-3.5 px-6 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-black text-base border-2 border-accent shadow-[0_0_20px_var(--glow)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus size={20} aria-hidden="true" />
                <span>Criar Perfil</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-muted">
                <div className="h-px bg-fg/20 flex-1" />
                <span>ou</span>
                <div className="h-px bg-fg/20 flex-1" />
              </div>

              <button
                type="button"
                onClick={onEntrar}
                className="w-full py-3 px-6 rounded-full bg-app hover:bg-raised text-accent font-bold text-sm border border-accent/60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn size={18} aria-hidden="true" />
                <span>Entrar na Conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
