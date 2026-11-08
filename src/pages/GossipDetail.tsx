import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { HatButton } from "../components/HatButton";
import { IdentityToggle } from "../components/IdentityToggle";
import { mensagemDeErro } from "../lib/errors";
import {
  alternarFogo,
  buscarHat,
  estenderHat,
  excluirHat,
  excluirResposta,
  listarRespostas,
  responderHat,
} from "../services/hats";
import { getCurrentProfile } from "../services/session";
import type { Post, Reply } from "../types";

function formatarHorario(data: string): string {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GossipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [perfil] = useState(getCurrentProfile);
  const [post, setPost] = useState<Post | null>(null);
  const [respostas, setRespostas] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [respostaTexto, setRespostaTexto] = useState("");
  const [respostaAnonima, setRespostaAnonima] = useState(() => perfil?.preferencias.anonimoPorPadrao ?? false);
  const [erroResposta, setErroResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    async function carregarDetalhe(idDoPost: string) {
      try {
        setLoading(true);
        const [dados, lista] = await Promise.all([buscarHat(idDoPost), listarRespostas(idDoPost)]);
        setPost(dados);
        setRespostas(lista);
      } catch (err) {
        setError(mensagemDeErro(err));
      } finally {
        setLoading(false);
      }
    }
    if (id) carregarDetalhe(id);
  }, [id]);

  if (loading) {
    return <p className="p-8 text-center text-fg-soft">Abrindo segredo...</p>;
  }

  if (error || !post) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-danger">💨 Hat Indisponível</h1>
        <p role="alert" className="text-fg-soft">{error}</p>
        <Link
          to="/"
          className="inline-block bg-primary text-on-primary px-5 py-2 rounded-full font-bold border border-accent"
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
      setAviso("");
      setPost(await alternarFogo(postAtual));
    } catch (err) {
      setAviso(mensagemDeErro(err));
    }
  }

  async function handleMaisCincoMinutos() {
    try {
      setAviso("");
      const expiresAt = await estenderHat(postAtual.id);
      setPost({ ...postAtual, expiresAt });
    } catch (err) {
      setAviso(mensagemDeErro(err));
    }
  }

  async function handleEnviarResposta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (respostaTexto.trim().length < 3) {
      setErroResposta("Digite pelo menos 3 caracteres para responder.");
      return;
    }

    try {
      setEnviandoResposta(true);
      setErroResposta("");
      await responderHat(postAtual.id, respostaTexto.trim(), respostaAnonima);
      const lista = await listarRespostas(postAtual.id);
      setRespostas(lista);
      setPost({ ...postAtual, repliesCount: lista.length });
      setRespostaTexto("");
    } catch (err) {
      setErroResposta(mensagemDeErro(err));
    } finally {
      setEnviandoResposta(false);
    }
  }

  async function handleExcluirResposta(resposta: Reply) {
    try {
      setAviso("");
      await excluirResposta(resposta.id);
      const lista = respostas.filter((item) => item.id !== resposta.id);
      setRespostas(lista);
      setPost({ ...postAtual, repliesCount: lista.length });
    } catch (err) {
      setAviso(mensagemDeErro(err));
    }
  }

  async function confirmarExclusao() {
    try {
      await excluirHat(postAtual.id);
      navigate("/");
    } catch (err) {
      setModalAberto(false);
      setAviso(mensagemDeErro(err));
    }
  }

  return (
    <div>
      <div className="border-b border-fg p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Voltar para a Timeline"
            className="p-2 rounded-full border border-fg hover:bg-raised"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1 className="text-xl font-extrabold text-fg">Detalhes do Hat</h1>
        </div>

        {post.isMine && post.isAnonymous && (
          <HatButton variant="purple" onClick={handleMaisCincoMinutos}>
            <Clock size={16} aria-hidden="true" />
            <span>+5 Min de Vida</span>
          </HatButton>
        )}
      </div>

      {aviso && (
        <div role="alert" className="m-4 p-3 border border-danger bg-danger-soft/70 text-fg text-sm rounded-xl">
          {aviso}
        </div>
      )}

      <GossipCard
        post={post}
        onLike={handleDarFogo}
        onDeleteRequest={() => setModalAberto(true)}
        onExpire={() => setError("O tempo acabou enquanto você lia! O hat sumiu.")}
        showDetailsLink={false}
      />

      <div className="p-4 border-b border-fg/40 bg-surface">
        <form onSubmit={handleEnviarResposta} noValidate className="space-y-3">
          <label htmlFor="campo-resposta" className="block font-bold text-sm text-accent">
            Escrever uma resposta:
          </label>
          <textarea
            id="campo-resposta"
            rows={2}
            maxLength={280}
            placeholder="Sabe de mais alguma coisa? Comente aqui..."
            value={respostaTexto}
            onChange={(e) => setRespostaTexto(e.target.value)}
            className="w-full bg-app border border-fg p-3 rounded-lg text-fg text-sm"
          />
          {erroResposta && (
            <p role="alert" className="text-danger text-xs font-bold">{erroResposta}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pl-2">
            <IdentityToggle
              anonimo={respostaAnonima}
              onChange={setRespostaAnonima}
              nome={perfil?.accountName}
              vulgo={perfil?.codename}
              titulo="Clique para alternar entre seu Perfil e seu Vulgo Anônimo"
            />
            <HatButton type="submit" variant="purple" disabled={enviandoResposta}>
              {enviandoResposta ? "Respondendo..." : "Responder"}
            </HatButton>
          </div>
        </form>
      </div>

      <div className="p-4 space-y-3">
        <h2 className="font-bold text-fg text-base">Respostas ({respostas.length})</h2>

        {respostas.length === 0 ? (
          <p className="text-muted text-sm">Ninguém comentou ainda. Seja o primeiro!</p>
        ) : (
          respostas.map((resposta) => (
            <div key={resposta.id} className="border border-fg/30 rounded-xl p-3 bg-app">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-1">
                {resposta.authorId ? (
                  <Link to={`/perfil/${resposta.authorId}`} className="text-fg hover:underline min-w-0">
                    {resposta.displayName}
                  </Link>
                ) : (
                  <span className="text-anon min-w-0">🎩 @{resposta.displayName}</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted font-normal">{formatarHorario(resposta.createdAt)}</span>
                  {resposta.isMine && (
                    <button
                      type="button"
                      onClick={() => handleExcluirResposta(resposta)}
                      aria-label="Excluir sua resposta"
                      title="Excluir sua resposta"
                      className="p-1 rounded text-danger hover:bg-danger-soft/40 cursor-pointer transition"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-fg-soft text-sm [overflow-wrap:anywhere]">{resposta.content}</p>
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
