import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { HatButton } from "../components/HatButton";
import { mensagemDeErro } from "../lib/errors";
import { getPostById, updatePost, deletePost } from "../services/api";
import type { Post, Reply } from "../types";

export function GossipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [respostaTexto, setRespostaTexto] = useState("");
  const [erroResposta, setErroResposta] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    async function carregarDetalhe(idDoPost: string) {
      try {
        setLoading(true);
        const dados = await getPostById(idDoPost);
        setPost(dados);
      } catch (err) {
        setError(mensagemDeErro(err));
      } finally {
        setLoading(false);
      }
    }
    if (id) carregarDetalhe(id);
  }, [id]);

  if (loading) {
    return <p className="p-8 text-center text-zinc-300">Abrindo segredo...</p>;
  }

  if (error || !post) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">💨 Fofoca Indisponível</h1>
        <p role="alert" className="text-zinc-200">{error}</p>
        <Link
          to="/"
          className="inline-block bg-purple-700 text-white px-5 py-2 rounded-full font-bold border border-purple-400"
        >
          Voltar para a Timeline
        </Link>
      </div>
    );
  }

  // A partir daqui o post já foi carregado.
  const postAtual = post;

  async function handleDarFogo() {
    try {
      const atualizado = await updatePost(postAtual.id, {
        ...postAtual,
        likes: (Number(postAtual.likes) || 0) + 1,
      });
      setPost(atualizado);
    } catch {
      setError("Erro ao reagir à fofoca.");
    }
  }

  async function handleMaisCincoMinutos() {
    try {
      const atualizado = await updatePost(postAtual.id, {
        ...postAtual,
        expiresAt: Number(postAtual.expiresAt) + 5 * 60 * 1000,
      });
      setPost(atualizado);
    } catch {
      setError("Não foi possível estender o tempo desta fofoca.");
    }
  }

  async function handleEnviarResposta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (respostaTexto.trim().length < 3) {
      setErroResposta("Digite pelo menos 3 caracteres para responder.");
      return;
    }

    try {
      setErroResposta("");
      const listaRespostas = Array.isArray(postAtual.replies) ? postAtual.replies : [];
      const novaResposta: Reply = {
        id: Date.now().toString(),
        text: respostaTexto.trim(),
        createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      const atualizado = await updatePost(postAtual.id, {
        ...postAtual,
        replies: [...listaRespostas, novaResposta],
      });

      setPost(atualizado);
      setRespostaTexto("");
    } catch {
      setErroResposta("Erro ao publicar sua resposta.");
    }
  }

  async function confirmarExclusao() {
    try {
      await deletePost(postAtual.id);
      navigate("/");
    } catch {
      setError("Erro ao queimar fofoca.");
    }
  }

  return (
    <div>
      <div className="border-b border-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar para a Timeline"
            className="p-2 rounded-full border border-white hover:bg-zinc-900"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1 className="text-xl font-extrabold text-white">Detalhes do Segredo</h1>
        </div>

        <HatButton variant="purple" onClick={handleMaisCincoMinutos}>
          <Clock size={16} aria-hidden="true" />
          <span>+5 Min de Vida</span>
        </HatButton>
      </div>

      <GossipCard
        post={post}
        onLike={handleDarFogo}
        onDeleteRequest={() => setModalAberto(true)}
        onExpire={() => setError("O tempo acabou enquanto você lia! A fofoca sumiu.")}
        showDetailsLink={false}
      />

      <div className="p-4 border-b border-white/40 bg-zinc-950">
        <form onSubmit={handleEnviarResposta} className="space-y-3">
          <label htmlFor="campo-resposta" className="block font-bold text-sm text-purple-400">
            Sussurrar uma resposta anônima:
          </label>
          <textarea
            id="campo-resposta"
            rows={2}
            placeholder="Sabe de mais alguma coisa? Comente aqui..."
            value={respostaTexto}
            onChange={(e) => setRespostaTexto(e.target.value)}
            className="w-full bg-black border border-white p-3 rounded-lg text-white text-sm"
          />
          {erroResposta && (
            <p role="alert" className="text-red-400 text-xs font-bold">{erroResposta}</p>
          )}
          <div className="flex justify-end">
            <HatButton type="submit" variant="purple">
              Responder Anonimamente
            </HatButton>
          </div>
        </form>
      </div>

      <div className="p-4 space-y-3">
        <h2 className="font-bold text-white text-base">
          Sussurros nos comentários ({Array.isArray(post.replies) ? post.replies.length : 0})
        </h2>

        {!Array.isArray(post.replies) || post.replies.length === 0 ? (
          <p className="text-zinc-400 text-sm">Ninguém comentou ainda. Seja o primeiro!</p>
        ) : (
          post.replies.map((reply) => (
            <div key={reply.id} className="border border-white/30 rounded-xl p-3 bg-black">
              <div className="flex justify-between text-xs text-purple-400 font-bold mb-1">
                <span>@AnônimoDoChapéu</span>
                <span className="text-zinc-400">{reply.createdAt}</span>
              </div>
              <p className="text-zinc-100 text-sm">{reply.text}</p>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        post={modalAberto ? post : null}
        onCancel={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
