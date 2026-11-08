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
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md px-4 py-2.5 border-b border-white/25 flex items-center gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 rounded-full hover:bg-zinc-900 text-white transition cursor-pointer"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-white leading-tight">
            {dados.accountName}
          </h1>
          <p className="text-xs text-zinc-400">{posts.length} posts</p>
        </div>
      </div>

      <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-purple-900 via-zinc-900 to-red-950 overflow-hidden border-b border-white/20">
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
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-zinc-900 overflow-hidden shadow-xl ${
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
                    ? "bg-black text-white border border-white/60 hover:border-red-400 hover:text-red-400"
                    : "bg-white text-black hover:bg-zinc-200"
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
                  className="px-4 py-1.5 rounded-full border border-white/50 hover:bg-zinc-900 text-white font-bold text-sm transition cursor-pointer"
                >
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-2 rounded-full border border-red-500/50 hover:bg-red-950/50 text-red-400 transition cursor-pointer"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl font-black text-white leading-tight">
            {dados.accountName}
          </h2>
          <p className="text-sm text-zinc-400">
            @{dados.publicHandle || dados.accountName?.toLowerCase().replace(/\s+/g, "")}
          </p>
        </div>

        <p className="text-white text-sm leading-relaxed mb-3">
          {dados.bio}
        </p>

        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
          <Calendar size={15} aria-hidden="true" />
          <span>Ingressou em {dados.joinedAt || "Outubro de 2026"}</span>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="text-zinc-400">
            <strong className="text-white">14</strong> Seguindo
          </span>
          <span className="text-zinc-400">
            <strong className="text-white">{seguindo ? 29 : 28}</strong> Seguidores
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-white/30 text-sm font-bold text-center">
        <button
          type="button"
          onClick={() => setAbaAtiva("posts")}
          className={`py-3.5 hover:bg-zinc-900/60 transition cursor-pointer relative ${
            abaAtiva === "posts" ? "text-white" : "text-zinc-400"
          }`}
        >
          <span>Posts</span>
          {abaAtiva === "posts" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-purple-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("curtidas")}
          className={`py-3.5 hover:bg-zinc-900/60 transition cursor-pointer relative ${
            abaAtiva === "curtidas" ? "text-white" : "text-zinc-400"
          }`}
        >
          <span>Fogos</span>
          {abaAtiva === "curtidas" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-purple-500 rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        <p className="p-8 text-center text-zinc-400 text-sm">Carregando posts...</p>
      ) : postsExibidos.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <p className="text-white font-bold text-base">Nenhum post público encontrado</p>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto">
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
