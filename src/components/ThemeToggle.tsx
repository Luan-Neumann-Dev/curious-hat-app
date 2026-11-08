import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "dark" | "light";

const CHAVE_TEMA = "curiousHat_theme";

function temaAtual(): Tema {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(temaAtual);
  const proximoTema: Tema = tema === "dark" ? "light" : "dark";
  const rotulo = proximoTema === "light" ? "Ativar tema claro" : "Ativar tema escuro";

  function alternarTema() {
    document.documentElement.dataset.theme = proximoTema;
    try {
      localStorage.setItem(CHAVE_TEMA, proximoTema);
    } catch {
      // Sem acesso ao armazenamento, o tema vale só até recarregar a página.
    }
    setTema(proximoTema);
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={rotulo}
      title={rotulo}
      className="flex items-center justify-center gap-2 p-2.5 md:px-4 md:py-2.5 rounded-full border border-fg/30 bg-app text-fg font-bold text-sm hover:bg-raised hover:border-fg transition-colors cursor-pointer"
    >
      {tema === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span className="hidden md:inline">{tema === "dark" ? "Tema claro" : "Tema escuro"}</span>
    </button>
  );
}
