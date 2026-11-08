import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { RefreshCw, Send } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { HatButton } from "../components/HatButton";
import { mensagemDeErro } from "../lib/errors";
import { getPosts, createPost, togglePostLike, deletePost } from "../services/api";
import { getStoredProfile } from "../services/session";
import type { Post } from "../types";

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [perfil] = useState(getStoredProfile);
  const [textoNovidade, setTextoNovidade] = useState("");
  const [modoAnonimo, setModoAnonimo] = useState(false);
  const [erroPostRapido, setErroPostRapido] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    carregarFofocas();
  }, []);

  async function carregarFofocas() {
    try {
      setLoading(true);
      setError("");
      const dados = await getPosts();
      setPosts(dados);
    } catch (err) {
      setError(mensagemDeErro(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePublicarRapido(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!perfil) return;
    if (!textoNovidade.trim() || textoNovidade.trim().length < 3) {
      setErroPostRapido("Escreva uma mensagem antes de postar!");
      return;
    }
    try {
      setPublicando(true);
      setErroPostRapido("");
      const agora = Date.now();
      const expiresAt = modoAnonimo
        ? agora + 24 * 60 * 60 * 1000
        : agora + 100 * 365 * 24 * 60 * 60 * 1000;
      const novo = await createPost({
        authorId: modoAnonimo ? null : perfil.userId,
        authorAvatar: modoAnonimo ? null : perfil.avatarUrl,
        authorBanner: modoAnonimo ? null : perfil.bannerImage,
        authorBio: modoAnonimo ? null : perfil.bio,
        authorHandle: modoAnonimo
          ? null
          : perfil.publicHandle || perfil.accountName.toLowerCase().replace(/\s+/g, ""),
        authorJoinedAt: modoAnonimo ? null : perfil.joinedAt,
        codename: modoAnonimo ? perfil.codename : perfil.accountName,
        isAnonymous: modoAnonimo,
        title: "",
        category: "Geral",
        spiciness: modoAnonimo ? "Quente" : "Leve",
        content: textoNovidade.trim(),
        likes: 0,
        createdAt: agora,
        expiresAt: expiresAt,
        replies: [],
      });
      setPosts((listaAtual) => [novo, ...listaAtual]);
      setTextoNovidade("");
    } catch (err) {
      setErroPostRapido(mensagemDeErro(err));
    } finally {
      setPublicando(false);
    }
  }

  async function handleDarFogo(post: Post) {
    try {
      const atualizado = await togglePostLike(post);
      setPosts((listaAtual) =>
        listaAtual.map((item) => (item.id === post.id ? atualizado : item))
      );
    } catch {
      setError("Não foi possível curtir agora.");
    }
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    try {
      setDeletando(true);
      await deletePost(postParaDeletar.id);
      setPosts((listaAtual) =>
        listaAtual.filter((item) => item.id !== postParaDeletar.id)
      );
      setPostParaDeletar(null);
    } catch (err) {
      setError(mensagemDeErro(err));
    } finally {
      setDeletando(false);
    }
  }

  function handleExpirar(idExpirado: string) {
    setPosts((listaAtual) => listaAtual.filter((item) => item.id !== idExpirado));
  }

  return (
    <div>
      <div className="border-b border-fg/40 p-4 flex items-center justify-between bg-app sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-fg">Página Inicial</h1>
        <HatButton variant="outline" onClick={carregarFofocas} ariaLabel="Atualizar timeline">
          <RefreshCw size={16} aria-hidden="true" />
          <span>Atualizar</span>
        </HatButton>
      </div>
      <div className="p-4 border-b border-fg/40 bg-surface/50">
        <form onSubmit={handlePublicarRapido} noValidate>
          <div className="flex gap-3">
            {perfil?.avatarUrl && !modoAnonimo ? (
              <img
                src={perfil.avatarUrl}
                alt={perfil.accountName}
                className="w-11 h-11 rounded-full object-cover border border-fg/30 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-anon-soft border border-anon flex items-center justify-center text-lg shrink-0">
                🎩
              </div>
            )}
            <div className="flex-1 min-w-0">
              <label htmlFor="caixa-novidades" className="sr-only">
                Qual as novidades
              </label>
              <textarea
                id="caixa-novidades"
                rows={3}
                maxLength={280}
                placeholder="Qual as novidades..."
                value={textoNovidade}
                onChange={(e) => {
                  setTextoNovidade(e.target.value);
                  if (erroPostRapido) setErroPostRapido("");
                }}
                className="w-full bg-app border border-fg/30 focus:border-accent p-3 rounded-xl text-fg placeholder-muted resize-none text-base"
              />
            </div>
          </div>
          {erroPostRapido && (
            <p role="alert" className="text-danger text-xs font-bold mt-2">
              ⚠️ {erroPostRapido}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-2 pl-2">
            <button
              type="button"
              onClick={() => setModoAnonimo(!modoAnonimo)}
              title="Clique para alternar entre seu Perfil e seu Vulgo Anônimo (24h)"
              className="relative inline-flex items-center py-1 px-1 bg-transparent border-0 cursor-pointer select-none group"
            >
              <span
                className={`relative inline-block text-base font-extrabold tracking-wide transition-colors ${
                  modoAnonimo
                    ? "text-anon"
                    : "text-fg group-hover:text-fg-soft"
                }`}
              >
                {modoAnonimo && (
                  <span
                    className="absolute -top-3.5 -left-2 text-sm leading-none transform -rotate-12 pointer-events-none select-none drop-shadow"
                    aria-hidden="true"
                  >
                    🎩
                  </span>
                )}
                {modoAnonimo ? perfil?.codename : perfil?.accountName}
              </span>
            </button>

            <HatButton type="submit" variant="purple" disabled={publicando}>
              <Send size={15} aria-hidden="true" />
              <span>{publicando ? "Postando..." : "Postar"}</span>
            </HatButton>
          </div>
        </form>
      </div>
      {error && (
        <div role="alert" className="m-4 p-4 border border-danger bg-danger-soft/70 text-fg rounded-xl">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-12 text-center text-muted">Carregando novidades...</div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center text-muted">
          Nenhuma publicação ativa no momento.
        </div>
      ) : (
        posts.map((post) => (
          <GossipCard
            key={post.id}
            post={post}
            onLike={handleDarFogo}
            onDeleteRequest={setPostParaDeletar}
            onExpire={handleExpirar}
          />
        ))
      )}
      <ConfirmModal
        post={postParaDeletar}
        onCancel={() => setPostParaDeletar(null)}
        onConfirm={confirmarExclusao}
        isDeleting={deletando}
      />
    </div>
  );
}
