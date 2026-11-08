import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Trash2, Clock, MessageSquare } from "lucide-react";
import { avatarPorSemente } from "../lib/avatar";
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
  const jaCurtiu = curtidaOtimista ?? post.likedByMe;

  useEffect(() => {
    function calcularTempo() {
      if (!post.expiresAt) {
        setTempoRestante("");
        return;
      }
      const diferenca = new Date(post.expiresAt).getTime() - Date.now();
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
  }, [post.expiresAt, post.id, onExpire]);

  async function handleCliqueFogo() {
    if (processandoLike) return;

    try {
      setProcessandoLike(true);
      setCurtidaOtimista(!post.likedByMe);
      await onLike(post);
    } finally {
      setCurtidaOtimista(null);
      setProcessandoLike(false);
    }
  }

  const perfilDestino = post.authorId ?? "";
  return (
    <article className="border-b border-fg/30 p-4 sm:p-5 bg-app hover:bg-surface transition-colors">
      <div className="flex items-start gap-3">
        {post.isAnonymous ? (
          <div
            className="w-10 h-10 rounded-full bg-anon-soft border border-anon flex items-center justify-center text-lg shrink-0 select-none"
            title="Identidade Anônima Oculta"
          >
            🎩
          </div>
        ) : (
          <Link
            to={`/perfil/${perfilDestino}`}
            title={`Ver perfil de ${post.displayName}`}
            className="shrink-0 group"
          >
            <img
              src={post.authorAvatar || avatarPorSemente(post.authorHandle || post.displayName)}
              alt={post.displayName}
              className="w-10 h-10 rounded-full object-cover border border-fg/30 group-hover:border-accent transition"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {post.isAnonymous ? (
                <>
                  <span className="font-extrabold text-anon text-sm sm:text-base">
                    @{post.displayName}
                  </span>
                  <span className="text-[11px] bg-anon-soft/80 text-anon border border-anon/40 px-2 py-0.5 rounded-full font-semibold">
                    Anônimo
                  </span>
                </>
              ) : (
                <Link
                  to={`/perfil/${perfilDestino}`}
                  className="flex flex-wrap items-center gap-x-1.5 group min-w-0"
                >
                  <span className="font-extrabold text-fg group-hover:underline text-sm sm:text-base">
                    {post.displayName}
                  </span>
                  <span className="text-xs text-muted">
                    @{post.authorHandle}
                  </span>
                </Link>
              )}
            </div>
            {tempoRestante && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-danger bg-danger-soft/40 border border-danger/60">
                <Clock size={13} aria-hidden="true" />
                <span>{tempoRestante}</span>
              </div>
            )}
          </div>
          {post.title && <h2 className="text-base font-bold text-fg mb-1">{post.title}</h2>}
          <p className="text-fg-soft whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed mb-3 text-sm sm:text-base">
            {post.content}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-fg/15 text-xs sm:text-sm">
            <button
              type="button"
              onClick={handleCliqueFogo}
              disabled={processandoLike}
              aria-pressed={jaCurtiu}
              title={jaCurtiu ? "Clique para remover seu Fogo" : "Dar Fogo"}
              className={`flex items-center gap-1.5 font-bold py-1 px-3 rounded-full transition cursor-pointer ${
                jaCurtiu
                  ? "bg-accent-soft/90 text-accent border border-accent hover:bg-danger-soft/60 hover:border-danger hover:text-danger"
                  : "text-accent hover:text-accent hover:bg-accent-soft/40 border border-transparent"
              }`}
            >
              <Flame
                size={17}
                aria-hidden="true"
                className={jaCurtiu ? "fill-accent text-accent" : ""}
              />
              <span>{post.likes} Fogos</span>
            </button>
            {showDetailsLink && (
              <Link
                to={`/fofoca/${post.id}`}
                className="flex items-center gap-1.5 text-fg-soft hover:text-accent font-semibold py-1 px-2 rounded hover:bg-raised transition"
              >
                <MessageSquare size={16} aria-hidden="true" />
                <span>Respostas ({post.repliesCount})</span>
              </Link>
            )}
            {onDeleteRequest && post.isMine && (
              <button
                type="button"
                onClick={() => onDeleteRequest(post)}
                className="flex items-center gap-1.5 text-danger hover:text-danger font-semibold cursor-pointer py-1 px-2 rounded hover:bg-danger-soft/40 transition"
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
