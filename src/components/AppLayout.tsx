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
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row max-w-7xl w-full mx-auto border-x border-white/30">
      <Navbar />
      <main className="flex-1 min-w-0 min-h-screen bg-black">
        {aviso && (
          <div
            role="status"
            className="m-4 p-4 rounded-xl bg-purple-950/90 border border-purple-400 text-white flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <CheckCircle2 size={20} className="text-purple-300 shrink-0" aria-hidden="true" />
              <span>{aviso}</span>
            </div>
            <button
              type="button"
              onClick={onFecharAviso}
              className="text-xs font-bold underline text-purple-300 cursor-pointer shrink-0"
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
  );
}
