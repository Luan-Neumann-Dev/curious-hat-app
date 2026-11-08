import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { mensagemDeErro } from "../lib/errors";
import { getPosts, togglePostLike, deletePost } from "../services/api";
import type { Post } from "../types";

const CINQUENTA_ANOS_MS = 50 * 365 * 24 * 60 * 60 * 1000;

export function SearchPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [ordenacao, setOrdenacao] = useState("recentes");

  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const dados = await getPosts();
        setPosts(dados);
      } catch (err) {
        setError(mensagemDeErro(err));
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  async function handleDarFogo(post: Post) {
    try {
      const atualizado = await togglePostLike(post);
      setPosts((atuais) => atuais.map((p) => (p.id === post.id ? atualizado : p)));
    } catch {
      setError("Erro ao dar fogo.");
    }
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    try {
      await deletePost(postParaDeletar.id);
      setPosts((atuais) => atuais.filter((p) => p.id !== postParaDeletar.id));
      setPostParaDeletar(null);
    } catch {
      setError("Erro ao excluir publicação.");
    }
  }

  const postsFiltrados = posts
    .filter((post) => {
      const termo = busca.toLowerCase();
      const bateTexto =
        post.content?.toLowerCase().includes(termo) ||
        post.codename?.toLowerCase().includes(termo) ||
        post.title?.toLowerCase().includes(termo);

      const ehFixo = Number(post.expiresAt) - Number(post.createdAt) > CINQUENTA_ANOS_MS;
      const bateTipo =
        filtroTipo === "Todos" ||
        (filtroTipo === "Temporarios" && !ehFixo) ||
        (filtroTipo === "Fixos" && ehFixo);

      return bateTexto && bateTipo;
    })
    .sort((a, b) => {
      if (ordenacao === "fogos") return (Number(b.likes) || 0) - (Number(a.likes) || 0);
      if (ordenacao === "expirando") return Number(a.expiresAt) - Number(b.expiresAt);
      return Number(b.createdAt) - Number(a.createdAt);
    });

  return (
    <div>
      <div className="border-b border-fg p-4 bg-app">
        <h1 className="text-xl font-extrabold text-fg">Explorar & Buscar Fofocas 🔍</h1>
      </div>

      <div className="p-4 border-b border-fg/60 bg-surface space-y-3">
        <div className="relative">
          <label htmlFor="input-pesquisa" className="sr-only">
            Pesquisar fofocas ou usuários
          </label>
          <SearchIcon
            size={18}
            className="absolute left-3.5 top-3 text-accent"
            aria-hidden="true"
          />
          <input
            id="input-pesquisa"
            type="search"
            placeholder="Pesquisar por palavra-chave, fofoca ou @autor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-app border border-fg text-fg pl-10 pr-4 py-2.5 rounded-full text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="select-tipo" className="block text-xs text-fg-soft mb-1 font-semibold">
              Filtrar por Duração:
            </label>
            <select
              id="select-tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-app border border-accent text-fg px-3 py-2 rounded-lg text-sm"
            >
              <option value="Todos">Todas as Publicações</option>
              <option value="Temporarios">⏳ Apenas Fofocas Temporárias</option>
              <option value="Fixos">💬 Apenas Comentários Fixos</option>
            </select>
          </div>

          <div>
            <label htmlFor="select-ordem" className="block text-xs text-fg-soft mb-1 font-semibold">
              Ordenar Resultados:
            </label>
            <select
              id="select-ordem"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full bg-app border border-fg text-fg px-3 py-2 rounded-lg text-sm"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="fogos">🔥 Mais Bombadas (Fogos)</option>
              <option value="expirando">⏳ Prestes a Sumir</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="m-4 p-4 border border-danger bg-danger-soft text-fg rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-fg-soft">Buscando publicações...</p>
      ) : postsFiltrados.length === 0 ? (
        <p className="p-10 text-center text-fg-soft">
          Nenhum resultado encontrado para sua busca.
        </p>
      ) : (
        postsFiltrados.map((post) => (
          <GossipCard
            key={post.id}
            post={post}
            onLike={handleDarFogo}
            onDeleteRequest={setPostParaDeletar}
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
