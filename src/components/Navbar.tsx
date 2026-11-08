import { NavLink } from "react-router-dom";
import { Home, Search, User } from "lucide-react";

export function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-full font-bold transition-colors border ${
      isActive
        ? "bg-purple-700 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
        : "bg-black text-white border-white/30 hover:border-white hover:bg-zinc-900"
    }`;
  return (
    <header className="w-full md:w-60 lg:w-64 border-b md:border-b-0 md:border-r border-white/30 p-4 flex flex-col justify-between bg-black shrink-0 md:sticky md:top-0 md:h-screen">
      <div>
        <div className="flex items-center justify-between md:justify-start gap-2 mb-4 md:mb-8">
          <NavLink to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
            <span className="bg-purple-700 border border-purple-400 p-1.5 rounded-lg text-lg" aria-hidden="true">
              🎩
            </span>
            <span>
              Curious <span className="text-purple-400">Hat</span>
            </span>
          </NavLink>
        </div>
        <nav aria-label="Menu principal" className="flex flex-wrap md:flex-col gap-2.5">
          <NavLink to="/" end className={linkClass}>
            <Home size={20} aria-hidden="true" />
            <span>Página Inicial</span>
          </NavLink>
          <NavLink to="/buscar" className={linkClass}>
            <Search size={20} aria-hidden="true" />
            <span>Buscar</span>
          </NavLink>
          {/* O atributo "end" garante que só fica selecionado no SEU perfil (/perfil) e não no de outros (/perfil/:id) */}
          <NavLink to="/perfil" end className={linkClass}>
            <User size={20} aria-hidden="true" />
            <span>Meu Perfil</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
