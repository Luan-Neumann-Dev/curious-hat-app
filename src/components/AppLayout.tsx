import { Routes, Route } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Feed } from "../pages/Feed";
import { GossipDetail } from "../pages/GossipDetail";
import { Profile } from "../pages/Profile";
import { SearchPage } from "../pages/SearchPage";
import type { UserProfile } from "../types";
import { Navbar } from "./Navbar";
import { RankingSidebar } from "./RankingSidebar";

interface AppLayoutProps {
  aviso: string;
  onFecharAviso: () => void;
  onProfileSaved: (perfil: UserProfile) => void;
  onLogout: () => void;
}

export function AppLayout({ aviso, onFecharAviso, onProfileSaved, onLogout }: AppLayoutProps) {
  const paginaDePerfil = <Profile onProfileSaved={onProfileSaved} onLogout={onLogout} />;

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col md:flex-row max-w-7xl w-full mx-auto md:border-x border-fg/30 pb-20 md:pb-0">
      <Navbar />
      {/* Abaixo de 1024 px o ranking fica depois do conteúdo; acima disso, ao lado. */}
      <div className="flex-1 min-w-0 flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0 min-h-screen bg-app">
          {aviso && (
            <div
              role="status"
              className="m-4 p-4 rounded-xl bg-accent-soft border border-primary-line text-fg flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 size={20} className="text-accent shrink-0" aria-hidden="true" />
                <span>{aviso}</span>
              </div>
              <button
                type="button"
                onClick={onFecharAviso}
                className="text-xs font-bold underline text-accent cursor-pointer shrink-0"
              >
                Fechar
              </button>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/fofoca/:id" element={<GossipDetail />} />
            <Route path="/perfil" element={paginaDePerfil} />
            <Route path="/perfil/:id" element={paginaDePerfil} />
          </Routes>
        </main>
        <RankingSidebar />
      </div>
    </div>
  );
}
