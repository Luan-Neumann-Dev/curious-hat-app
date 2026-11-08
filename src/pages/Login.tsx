import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { login } from "../services/session";
import type { UserProfile } from "../types";

interface LoginProps {
  onVoltar: () => void;
  onLogin: (perfil: UserProfile) => void;
}

export function Login({ onVoltar, onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    const usuario = login(email, senha);
    if (!usuario) {
      setErro("E-mail ou senha incorretos. Verifique seus dados ou crie um perfil.");
      return;
    }
    onLogin(usuario);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center py-8 px-4">
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-purple-400 font-bold cursor-pointer py-1.5 px-4 rounded-full border border-white/20"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto p-6 sm:p-8 border border-white/40 rounded-2xl bg-zinc-950">
        <div className="text-center mb-6">
          <span className="text-3xl" aria-hidden="true">🎩</span>
          <h1 className="text-2xl font-black text-white mt-2">Entrar no Curious Hat</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Informe apenas seu e-mail e senha cadastrados.
          </p>
        </div>

        {erro && (
          <div role="alert" className="mb-4 p-3 rounded-xl border border-red-400 bg-red-950/60 text-red-200 text-xs font-bold">
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold text-white mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-zinc-400" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white pl-10 pr-4 py-3 rounded-xl text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-bold text-white mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-zinc-400" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                required
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-black border border-white pl-10 pr-4 py-3 rounded-xl text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-purple-700 hover:bg-purple-600 text-white font-bold border border-purple-400 cursor-pointer transition mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
