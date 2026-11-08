import { NavLink } from "react-router-dom";
import { Home, Search, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const linkBase =
  "flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 py-2 md:px-4 md:py-3 rounded-2xl md:rounded-full font-bold text-xs md:text-base transition-colors border";

function linkClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${
    isActive
      ? "bg-primary text-on-primary border-primary-line shadow-[0_0_15px_var(--glow)]"
      : "bg-app text-fg border-transparent md:border-fg/30 hover:border-fg hover:bg-raised"
  }`;
}

export function Navbar() {
  return (
    <header className="w-full md:w-60 lg:w-64 border-b md:border-b-0 md:border-r border-fg/30 px-4 py-3 md:p-4 flex md:flex-col items-center md:items-stretch justify-between gap-3 bg-app shrink-0 md:sticky md:top-0 md:h-screen">
      <NavLink to="/" className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight text-fg md:mb-4">
        <span className="bg-primary border border-primary-line p-1.5 rounded-lg text-lg leading-none" aria-hidden="true">
          🎩
        </span>
        <span>
          Curious <span className="text-accent">Hat</span>
        </span>
      </NavLink>

      {/* No celular o menu vira uma barra fixa na parte de baixo da tela. */}
      <nav
        aria-label="Menu principal"
        className="fixed md:static bottom-0 inset-x-0 z-40 grid grid-cols-3 gap-1 md:flex md:flex-col md:gap-2.5 md:flex-1 bg-app border-t md:border-t-0 border-fg/30 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:p-0"
      >
        <NavLink to="/" end className={linkClass}>
          <Home size={20} aria-hidden="true" />
          <span className="md:hidden">Início</span>
          <span className="hidden md:inline">Página Inicial</span>
        </NavLink>
        <NavLink to="/buscar" className={linkClass}>
          <Search size={20} aria-hidden="true" />
          <span>Buscar</span>
        </NavLink>
        {/* O atributo "end" garante que só fica selecionado no SEU perfil (/perfil) e não no de outros (/perfil/:id) */}
        <NavLink to="/perfil" end className={linkClass}>
          <User size={20} aria-hidden="true" />
          <span className="md:hidden">Perfil</span>
          <span className="hidden md:inline">Meu Perfil</span>
        </NavLink>
      </nav>

      <ThemeToggle />
    </header>
  );
}
