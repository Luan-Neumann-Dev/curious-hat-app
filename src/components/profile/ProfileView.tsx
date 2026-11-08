import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Check, LogOut, Plus, UserPlus } from "lucide-react";
import { AVATAR_PADRAO } from "../../lib/avatar";
import { deletePost, togglePostLike } from "../../services/api";
import type { Post, PublicProfile } from "../../types";
import { ConfirmModal } from "../ConfirmModal";
import { GossipCard } from "../GossipCard";

interface ProfileViewProps {
  dados: PublicProfile;
  visitandoOutroUsuario: boolean;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  loading: boolean;
  onEditar: () => void;
  onLogout: () => void;
}

export function ProfileView({
  dados,
  visitandoOutroUsuario,
  posts,
  setPosts,
  loading,
  onEditar,
  onLogout,
}: ProfileViewProps) {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<"posts" | "curtidas">("posts");
  const [seguindo, setSeguindo] = useState(false);
  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);

  async function handleDarFogo(post: Post) {
    const atualizado = await togglePostLike(post);
    setPosts((atuais) => atuais.map((p) => (p.id === post.id ? atualizado : p)));
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    await deletePost(postParaDeletar.id);
    setPosts((atuais) => atuais.filter((p) => p.id !== postParaDeletar.id));
    setPostParaDeletar(null);
  }

  const postsExibidos =
    abaAtiva === "curtidas" ? posts.filter((p) => (Number(p.likes) || 0) > 0) : posts;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-app/85 backdrop-blur-md px-4 py-2.5 border-b border-fg/25 flex items-center gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 rounded-full hover:bg-raised text-fg transition cursor-pointer"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-fg leading-tight">
            {dados.accountName}
          </h1>
          <p className="text-xs text-muted">{posts.length} posts</p>
        </div>
      </div>

      <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-banner-from via-banner-via to-banner-to overflow-hidden border-b border-fg/20">
        {dados.bannerImage && (
          <img
            src={dados.bannerImage}
            alt="Papel de parede"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 sm:px-6 pb-4">
        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-3">
          {/* Se for meu perfil, posso clicar na foto para editar. Se for de outro, apenas exibe a foto */}
          <div
            onClick={() => !visitandoOutroUsuario && onEditar()}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-app bg-raised overflow-hidden shadow-xl ${
              !visitandoOutroUsuario ? "cursor-pointer group" : ""
            }`}
          >
            <img
              src={dados.avatarUrl || AVATAR_PADRAO}
              alt={dados.accountName}
              className={`w-full h-full object-cover ${
                !visitandoOutroUsuario ? "group-hover:opacity-40 transition-opacity" : ""
              }`}
            />
            {!visitandoOutroUsuario && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Plus size={36} strokeWidth={3} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {visitandoOutroUsuario ? (
              <button
                type="button"
                onClick={() => setSeguindo(!seguindo)}
                className={`px-5 py-2 rounded-full font-extrabold text-sm transition cursor-pointer flex items-center gap-1.5 ${
                  seguindo
                    ? "bg-app text-fg border border-fg/60 hover:border-danger hover:text-danger"
                    : "bg-fg text-app hover:opacity-85"
                }`}
              >
                {seguindo ? (
                  <>
                    <Check size={16} aria-hidden="true" />
                    <span>Seguindo</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} aria-hidden="true" />
                    <span>Seguir</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEditar}
                  className="px-4 py-1.5 rounded-full border border-fg/50 hover:bg-raised text-fg font-bold text-sm transition cursor-pointer"
                >
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-2 rounded-full border border-danger/50 hover:bg-danger-soft/50 text-danger transition cursor-pointer"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl font-black text-fg leading-tight">
            {dados.accountName}
          </h2>
          <p className="text-sm text-muted">
            @{dados.publicHandle || dados.accountName?.toLowerCase().replace(/\s+/g, "")}
          </p>
        </div>

        <p className="text-fg text-sm leading-relaxed mb-3 [overflow-wrap:anywhere]">
          {dados.bio}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted mb-3">
          <Calendar size={15} aria-hidden="true" />
          <span>Ingressou em {dados.joinedAt || "Outubro de 2026"}</span>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="text-muted">
            <strong className="text-fg">14</strong> Seguindo
          </span>
          <span className="text-muted">
            <strong className="text-fg">{seguindo ? 29 : 28}</strong> Seguidores
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-fg/30 text-sm font-bold text-center">
        <button
          type="button"
          onClick={() => setAbaAtiva("posts")}
          className={`py-3.5 hover:bg-raised/60 transition cursor-pointer relative ${
            abaAtiva === "posts" ? "text-fg" : "text-muted"
          }`}
        >
          <span>Posts</span>
          {abaAtiva === "posts" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("curtidas")}
          className={`py-3.5 hover:bg-raised/60 transition cursor-pointer relative ${
            abaAtiva === "curtidas" ? "text-fg" : "text-muted"
          }`}
        >
          <span>Fogos</span>
          {abaAtiva === "curtidas" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        <p className="p-8 text-center text-muted text-sm">Carregando posts...</p>
      ) : postsExibidos.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <p className="text-fg font-bold text-base">Nenhum post público encontrado</p>
          <p className="text-muted text-xs max-w-sm mx-auto">
            As publicações públicas de {dados.accountName} aparecerão aqui.
          </p>
        </div>
      ) : (
        postsExibidos.map((post) => (
          <GossipCard
            key={post.id}
            post={post}
            onLike={handleDarFogo}
            onDeleteRequest={!visitandoOutroUsuario ? setPostParaDeletar : null}
            onExpire={(id) => setPosts((atuais) => atuais.filter((p) => p.id !== id))}
          />
        ))
      )}

      <ConfirmModal
        post={postParaDeletar}
        onCancel={() => setPostParaDeletar(null)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
