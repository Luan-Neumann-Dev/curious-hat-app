import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Trash2, Clock, MessageSquare } from "lucide-react";
import { avatarPorSemente } from "../lib/avatar";
import { hasUserLiked } from "../services/api";
import type { Post } from "../types";

interface GossipCardProps {
  post: Post;
  onLike: (post: Post) => void | Promise<void>;
  onDeleteRequest?: ((post: Post) => void) | null;
  onExpire?: (id: string) => void;
  showDetailsLink?: boolean;
}

export function GossipCard({ post, onLike, onDeleteRequest, onExpire, showDetailsLink = true }: GossipCardProps) {
  const [tempoRestante, setTempoRestante] = useState("");
  // Enquanto a curtida é salva, mostra o resultado esperado; depois volta a seguir o post.
  const [curtidaOtimista, setCurtidaOtimista] = useState<boolean | null>(null);
  const [processandoLike, setProcessandoLike] = useState(false);
  const jaCurtiu = curtidaOtimista ?? hasUserLiked(post);

  useEffect(() => {
    function calcularTempo() {
      const diferenca = Number(post.expiresAt) - Date.now();
      const cinquentaAnosEmMs = 50 * 365 * 24 * 60 * 60 * 1000;
      if (!post.isAnonymous || diferenca > cinquentaAnosEmMs) {
        setTempoRestante("");
        return;
      }
      if (diferenca <= 0) {
        setTempoRestante("Expirado!");
        if (onExpire) onExpire(post.id);
        return;
      }
      const horas = Math.floor(diferenca / (1000 * 60 * 60));
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

      if (horas > 0) {
        setTempoRestante(`${horas}h ${minutos}m ${segundos}s`);
      } else {
        setTempoRestante(`${minutos}m ${segundos < 10 ? "0" : ""}${segundos}s`);
      }
    }
    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);
    return () => clearInterval(intervalo);
  }, [post.expiresAt, post.id, post.isAnonymous, onExpire]);

  async function handleCliqueFogo() {
    if (processandoLike) return;

    try {
      setProcessandoLike(true);
      setCurtidaOtimista(!hasUserLiked(post));
      await onLike(post);
    } finally {
      setCurtidaOtimista(null);
      setProcessandoLike(false);
    }
  }

  const perfilDestino = post.authorId || encodeURIComponent(post.codename);
  return (
    <article className="border-b border-white/30 p-4 sm:p-5 bg-black hover:bg-zinc-950 transition-colors">
      <div className="flex items-start gap-3">
        {post.isAnonymous ? (
          <div
            className="w-10 h-10 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-lg shrink-0 select-none"
            title="Identidade Anônima Oculta"
          >
            🎩
          </div>
        ) : (
          <Link
            to={`/perfil/${perfilDestino}`}
            title={`Ver perfil de ${post.codename}`}
            className="shrink-0 group"
          >
            <img
              src={post.authorAvatar || avatarPorSemente(post.codename)}
              alt={post.codename}
              className="w-10 h-10 rounded-full object-cover border border-white/30 group-hover:border-purple-400 transition"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              {post.isAnonymous ? (
                <>
                  <span className="font-extrabold text-purple-300 text-sm sm:text-base">
                    @{post.codename}
                  </span>
                  <span className="text-[11px] bg-purple-950/80 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded-full font-semibold">
                    Anônimo
                  </span>
                </>
              ) : (
                <Link
                  to={`/perfil/${perfilDestino}`}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="font-extrabold text-white group-hover:underline text-sm sm:text-base">
                    {post.codename}
                  </span>
                  <span className="text-xs text-zinc-400">
                    @{post.authorHandle || post.codename?.toLowerCase().replace(/\s+/g, "")}
                  </span>
                </Link>
              )}
            </div>
            {tempoRestante && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-red-400 bg-red-950/40 border border-red-400/60">
                <Clock size={13} aria-hidden="true" />
                <span>{tempoRestante}</span>
              </div>
            )}
          </div>
          {post.title && <h2 className="text-base font-bold text-white mb-1">{post.title}</h2>}
          <p className="text-zinc-100 whitespace-pre-wrap leading-relaxed mb-3 text-sm sm:text-base">
            {post.content}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs sm:text-sm">
            <button
              type="button"
              onClick={handleCliqueFogo}
              disabled={processandoLike}
              aria-pressed={jaCurtiu}
              title={jaCurtiu ? "Clique para remover seu Fogo" : "Dar Fogo"}
              className={`flex items-center gap-1.5 font-bold py-1 px-3 rounded-full transition cursor-pointer ${
                jaCurtiu
                  ? "bg-purple-950/90 text-purple-300 border border-purple-400 hover:bg-red-950/60 hover:border-red-400 hover:text-red-300"
                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 border border-transparent"
              }`}
            >
              <Flame
                size={17}
                aria-hidden="true"
                className={jaCurtiu ? "fill-purple-400 text-purple-300" : ""}
              />
              <span>{post.likes || 0} Fogos</span>
            </button>
            {showDetailsLink && (
              <Link
                to={`/fofoca/${post.id}`}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-purple-400 font-semibold py-1 px-2 rounded hover:bg-zinc-900 transition"
              >
                <MessageSquare size={16} aria-hidden="true" />
                <span>
                  Respostas ({Array.isArray(post.replies) ? post.replies.length : 0})
                </span>
              </Link>
            )}
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(post)}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-red-950/40 transition"
              >
                <Trash2 size={16} aria-hidden="true" />
                <span>Queimar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
