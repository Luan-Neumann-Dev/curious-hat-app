import { useEffect, useRef } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { Ban, CheckCircle2 } from "lucide-react";
import { Admin } from "../pages/Admin";
import { Chat } from "../pages/Chat";
import { Communities } from "../pages/Communities";
import { Feed } from "../pages/Feed";
import { GossipDetail } from "../pages/GossipDetail";
import { Help } from "../pages/Help";
import { Profile } from "../pages/Profile";
import { SearchPage } from "../pages/SearchPage";
import { Settings } from "../pages/Settings";
import { getCurrentProfile } from "../services/session";
import type { UserProfile } from "../types";
import { Navbar } from "./Navbar";
import { SideRail } from "./SideRail";

const TITULOS: [RegExp, string][] = [
  [/^\/$/, "Página Inicial"],
  [/^\/buscar/, "Buscar"],
  [/^\/comunidades/, "Comunidades"],
  [/^\/chat/, "Chat"],
  [/^\/config/, "Config"],
  [/^\/ajuda/, "Ajuda"],
  [/^\/admin/, "Administração"],
  [/^\/fofoca/, "Detalhes do Hat"],
  [/^\/perfil\/.+/, "Perfil"],
  [/^\/perfil/, "Meu Perfil"],
];

function tituloDaRota(caminho: string): string {
  const titulo = TITULOS.find(([rota]) => rota.test(caminho))?.[1];
  return titulo ? `${titulo} | Curious Hat` : "Curious Hat";
}

interface AppLayoutProps {
  aviso: string;
  focarAoAbrir: boolean;
  onFecharAviso: () => void;
  onProfileSaved: (perfil: UserProfile) => void;
  onLogout: () => void;
}

export function AppLayout({ aviso, focarAoAbrir, onFecharAviso, onProfileSaved, onLogout }: AppLayoutProps) {
  const perfil = getCurrentProfile();
  const paginaDePerfil = <Profile onProfileSaved={onProfileSaved} onLogout={onLogout} />;
  const { pathname } = useLocation();
  const conteudoRef = useRef<HTMLElement>(null);
  const caminhoAnterior = useRef(focarAoAbrir ? "" : pathname);

  // Trocar de rota não recarrega a página: o título e o foco precisam acompanhar a tela nova
  useEffect(() => {
    document.title = tituloDaRota(pathname);
    if (caminhoAnterior.current === pathname) return;
    caminhoAnterior.current = pathname;
    conteudoRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col md:flex-row max-w-7xl w-full mx-auto md:border-x border-fg/30 pb-20 md:pb-0">
      <a
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault();
          conteudoRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary focus:font-bold"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      {/* Abaixo de 1024 px o painel lateral fica depois do conteúdo; acima disso, ao lado. */}
      <div className="flex-1 min-w-0 flex flex-col lg:flex-row">
        <main ref={conteudoRef} id="conteudo" tabIndex={-1} className="flex-1 min-w-0 min-h-screen bg-app">
          {perfil?.bloqueado && (
            <div role="status" className="m-4 p-4 rounded-xl bg-danger-soft/70 border border-danger text-fg flex items-center gap-2.5 text-xs sm:text-sm">
              <Ban size={20} className="text-danger shrink-0" aria-hidden="true" />
              <span>Sua conta foi bloqueada por um administrador. Você pode ler, mas não pode publicar, responder ou enviar mensagens.</span>
            </div>
          )}
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
            <Route path="/comunidades" element={<Communities />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/config" element={<Settings onLogout={onLogout} />} />
            <Route path="/ajuda" element={<Help />} />
            {/* Só esconde a tela: quem protege os dados são as regras do banco. */}
            <Route path="/admin" element={perfil?.admin ? <Admin /> : <Navigate to="/" replace />} />
            <Route path="/fofoca/:id" element={<GossipDetail />} />
            <Route path="/perfil" element={paginaDePerfil} />
            <Route path="/perfil/:id" element={paginaDePerfil} />
          </Routes>
        </main>
        <SideRail />
      </div>
    </div>
  );
}
