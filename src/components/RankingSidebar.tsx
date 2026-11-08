import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy } from "lucide-react";
import { getPosts } from "../services/api";
import type { Post } from "../types";

export function RankingSidebar() {
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarRanking() {
      try {
        const todos = await getPosts();
        const ordenadosPorFogo = [...todos]
          .sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0))
          .slice(0, 5);
        setTopPosts(ordenadosPorFogo);
      } catch {
        // Silencioso caso a API falhe
      } finally {
        setLoading(false);
      }
    }

    carregarRanking();

    // Atualiza o ranking automaticamente sempre que alguém der ou tirar Fogo
    window.addEventListener("curiousHat_postsUpdated", carregarRanking);
    return () => window.removeEventListener("curiousHat_postsUpdated", carregarRanking);
  }, []);

  return (
    <aside
      aria-label="Ranking de publicações com mais fogos"
      className="w-full lg:w-80 xl:w-88 border-t lg:border-t-0 lg:border-l border-white/30 p-4 bg-black shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
    >
      <div className="border border-white/30 rounded-2xl bg-zinc-950 p-4">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/20">
          <Trophy size={20} className="text-purple-400 shrink-0" aria-hidden="true" />
          <h2 className="text-base font-extrabold text-white tracking-tight">
            Ranking de Fogos 🔥
          </h2>
        </div>

        {loading ? (
          <p className="text-xs text-zinc-400 py-4 text-center">Carregando ranking...</p>
        ) : topPosts.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Nenhuma publicação ativa no ranking ainda.
          </p>
        ) : (
          <ol className="space-y-3">
            {topPosts.map((post, index) => (
              <li key={post.id}>
                <Link
                  to={`/fofoca/${post.id}`}
                  className="block p-3 rounded-xl bg-black border border-white/20 hover:border-purple-400 transition group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                          index === 0
                            ? "bg-purple-600 text-white border border-purple-300"
                            : index === 1
                            ? "bg-purple-900 text-purple-200 border border-purple-400/50"
                            : "bg-zinc-900 text-zinc-300 border border-white/20"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-300 truncate group-hover:text-white">
                        {post.isAnonymous ? `🎩 @${post.codename}` : post.codename}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-extrabold text-purple-400 bg-purple-950/60 border border-purple-400/40 px-2 py-0.5 rounded-full shrink-0">
                      <Flame size={13} className="fill-purple-400" aria-hidden="true" />
                      {post.likes || 0}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed mt-1">
                    {post.content}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
