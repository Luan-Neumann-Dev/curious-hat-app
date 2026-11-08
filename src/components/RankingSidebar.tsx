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
      className="w-full lg:w-80 xl:w-88 border-t lg:border-t-0 lg:border-l border-fg/30 p-4 bg-app shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
    >
      <div className="border border-fg/30 rounded-2xl bg-surface p-4">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-fg/20">
          <Trophy size={20} className="text-accent shrink-0" aria-hidden="true" />
          <h2 className="text-base font-extrabold text-fg tracking-tight">
            Ranking de Fogos 🔥
          </h2>
        </div>

        {loading ? (
          <p className="text-xs text-muted py-4 text-center">Carregando ranking...</p>
        ) : topPosts.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">
            Nenhuma publicação ativa no ranking ainda.
          </p>
        ) : (
          <ol className="space-y-3">
            {topPosts.map((post, index) => (
              <li key={post.id}>
                <Link
                  to={`/fofoca/${post.id}`}
                  className="block p-3 rounded-xl bg-app border border-fg/20 hover:border-accent transition group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                          index === 0
                            ? "bg-primary text-on-primary border border-accent"
                            : index === 1
                            ? "bg-accent-soft text-accent border border-accent/50"
                            : "bg-raised text-fg-soft border border-fg/20"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-fg-soft truncate group-hover:text-fg">
                        {post.isAnonymous ? `🎩 @${post.codename}` : post.codename}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-extrabold text-accent bg-accent-soft/60 border border-accent/40 px-2 py-0.5 rounded-full shrink-0">
                      <Flame size={13} className="fill-accent" aria-hidden="true" />
                      {post.likes || 0}
                    </span>
                  </div>

                  <p className="text-xs text-fg-soft line-clamp-2 [overflow-wrap:anywhere] leading-relaxed mt-1">
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
