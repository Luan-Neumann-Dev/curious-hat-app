import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { mensagemDeErro } from "../lib/errors";
import { entrar } from "../services/session";
import type { UserProfile } from "../types";

interface LoginProps {
  onVoltar: () => void;
  onLogin: (perfil: UserProfile) => void;
}

export function Login({ onVoltar, onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      onLogin(await entrar(email, senha));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col justify-center py-8 px-4">
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 text-sm text-fg-soft hover:text-accent font-bold cursor-pointer py-1.5 px-4 rounded-full border border-fg/20"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto p-6 sm:p-8 border border-fg/40 rounded-2xl bg-surface">
        <div className="text-center mb-6">
          <span className="text-3xl" aria-hidden="true">🎩</span>
          <h1 className="text-2xl font-black text-fg mt-2">Entrar no Curious Hat</h1>
          <p className="text-xs text-muted mt-1">
            Informe apenas seu e-mail e senha cadastrados.
          </p>
        </div>

        {erro && (
          <div role="alert" className="mb-4 p-3 rounded-xl border border-danger bg-danger-soft/60 text-danger text-xs font-bold">
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold text-fg mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-muted" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app border border-fg pl-10 pr-4 py-3 rounded-xl text-fg text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-bold text-fg mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-muted" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                required
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-app border border-fg pl-10 pr-4 py-3 rounded-xl text-fg text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-bold border border-accent cursor-pointer transition mt-2 disabled:opacity-60 disabled:cursor-wait"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
