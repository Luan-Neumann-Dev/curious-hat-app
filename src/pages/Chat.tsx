import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useAnuncio } from "../hooks/useAnuncio";
import { avatarPorSemente } from "../lib/avatar";
import { mensagemDeErro } from "../lib/errors";
import {
  assinarMensagens,
  enviarMensagem,
  listarConversas,
  listarMensagens,
  listarParticipantes,
} from "../services/chat";
import type { Conversa, Mensagem, ParticipanteDoChat } from "../types";

function AvatarDaConversa({ conversa }: { conversa: Conversa }) {
  if (conversa.tipo === "group") {
    return (
      <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent flex items-center justify-center shrink-0">
        <Users size={18} className="text-accent" aria-hidden="true" />
      </div>
    );
  }
  if (conversa.outroAnonimo) {
    return (
      <div className="w-10 h-10 rounded-full bg-anon-soft border border-anon flex items-center justify-center text-lg shrink-0">
        <span aria-hidden="true">🎩</span>
      </div>
    );
  }
  return (
    <img
      src={conversa.avatar || avatarPorSemente(conversa.titulo)}
      alt=""
      className="w-10 h-10 rounded-full object-cover border border-fg/30 shrink-0"
    />
  );
}

function adicionarSemRepetir(lista: Mensagem[], nova: Mensagem): Mensagem[] {
  return lista.some((item) => item.id === nova.id) ? lista : [...lista, nova];
}

export function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteDoChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimDaLista = useRef<HTMLLIElement>(null);
  // A assinatura de mensagens vive enquanto a tela está aberta, então lê a conversa atual por aqui
  const conversaAberta = useRef(id);

  const ativa = conversas.find((conversa) => conversa.id === id) ?? null;
  useAnuncio(loading ? "Carregando conversas..." : "");

  useEffect(() => {
    let montado = true;

    async function carregarLista() {
      try {
        const lista = await listarConversas();
        if (montado) setConversas(lista);
      } catch (err) {
        if (montado) setErro(mensagemDeErro(err));
      } finally {
        if (montado) setLoading(false);
      }
    }
    carregarLista();

    // O banco só entrega mensagens de conversas de que a pessoa participa
    const cancelar = assinarMensagens(async (nova) => {
      carregarLista();
      if (nova.conversaId !== conversaAberta.current) return;

      setMensagens((atuais) => adicionarSemRepetir(atuais, nova));
      try {
        // Alguém pode ter acabado de entrar no grupo
        const pessoas = await listarParticipantes(nova.conversaId);
        if (montado) setParticipantes(pessoas);
      } catch {
        // Sem a lista atualizada, o nome aparece como Participante
      }
    });

    return () => {
      montado = false;
      cancelar();
    };
  }, []);

  useEffect(() => {
    conversaAberta.current = id;
    if (!id) return;
    let montado = true;

    async function carregarConversa(conversaId: string) {
      try {
        const [lista, pessoas] = await Promise.all([
          listarMensagens(conversaId),
          listarParticipantes(conversaId),
        ]);
        if (!montado) return;
        setMensagens(lista);
        setParticipantes(pessoas);
        setErro("");
      } catch (err) {
        if (montado) setErro(mensagemDeErro(err));
      }
    }
    carregarConversa(id);

    return () => {
      montado = false;
    };
  }, [id]);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ block: "nearest" });
  }, [mensagens]);

  async function handleEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const texto = rascunho.trim();
    if (!ativa || !texto) return;

    try {
      setEnviando(true);
      setErro("");
      const nova = await enviarMensagem(ativa.id, ativa.meuMembroId, texto);
      setMensagens((atuais) => adicionarSemRepetir(atuais, nova));
      setRascunho("");
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  function nomeDoRemetente(mensagem: Mensagem): string {
    const pessoa = participantes.find((item) => item.membroId === mensagem.membroId);
    if (!pessoa || pessoa.anonimo) return "Anônimo";
    return pessoa.nome ?? "Participante";
  }

  // Abaixo de 768 px, a lista e a conversa ocupam a tela uma de cada vez.
  const lista = (
    <nav
      aria-label="Conversas"
      className={`md:w-72 md:shrink-0 md:border-r border-fg/30 min-w-0 md:overflow-y-auto ${id ? "hidden md:block" : "block"}`}
    >
      {conversas.length === 0 ? (
        !erro && <div className="p-6 text-center text-sm text-muted space-y-2">
          <p>Nenhuma conversa ainda.</p>
          <p>
            Abra o perfil de alguém para conversar ou entre em uma{" "}
            <Link to="/comunidades" className="text-accent underline">comunidade</Link> para ver o chat dela.
          </p>
        </div>
      ) : (
        <ul>
          {conversas.map((conversa) => (
            <li key={conversa.id}>
              <button
                type="button"
                onClick={() => navigate(`/chat/${conversa.id}`)}
                aria-current={conversa.id === id ? "true" : undefined}
                className={`w-full flex items-center gap-3 p-3 text-left border-b border-fg/15 hover:bg-raised/60 transition cursor-pointer ${
                  conversa.id === id ? "bg-raised" : ""
                }`}
              >
                <AvatarDaConversa conversa={conversa} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-bold truncate ${conversa.outroAnonimo ? "text-anon" : "text-fg"}`}>
                    {conversa.titulo}
                  </span>
                  <span className="block text-xs text-muted truncate">
                    {conversa.ultimaMensagem ?? conversa.subtitulo}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] min-h-96 md:h-screen">
      <div className="border-b border-fg/40 p-4 bg-app shrink-0">
        <h1 className="text-xl font-extrabold text-fg">Chat</h1>
      </div>

      {erro && (
        <div role="alert" className="m-3 p-3 border border-danger bg-danger-soft/70 text-fg text-sm rounded-xl shrink-0">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-muted">Carregando conversas...</p>
      ) : (
        <div className="flex flex-1 min-h-0">
          {lista}

          <section
            aria-label={ativa ? `Conversa com ${ativa.titulo}` : "Conversa"}
            className={`flex-1 min-w-0 flex-col ${id ? "flex" : "hidden md:flex"}`}
          >
            {!ativa ? (
              !erro && (
                <p className="m-auto p-8 text-center text-sm text-muted">
                  {id ? "Esta conversa não está disponível." : "Escolha uma conversa para começar."}
                </p>
              )
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 border-b border-fg/30 shrink-0 min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate("/chat")}
                    aria-label="Voltar para as conversas"
                    className="md:hidden p-1.5 rounded-full hover:bg-raised text-fg cursor-pointer"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    {ativa.pessoaId ? (
                      <Link to={`/perfil/${ativa.pessoaId}`} className="block font-extrabold text-fg truncate hover:underline">
                        {ativa.titulo}
                      </Link>
                    ) : (
                      <p className={`font-extrabold truncate ${ativa.outroAnonimo ? "text-anon" : "text-fg"}`}>
                        {ativa.titulo}
                      </p>
                    )}
                    <p className="text-xs text-muted truncate">{ativa.subtitulo}</p>
                  </div>
                </div>

                <ol aria-live="polite" className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2">
                  {mensagens.length === 0 && (
                    <li className="m-auto text-sm text-muted">Nenhuma mensagem ainda. Diga oi!</li>
                  )}
                  {mensagens.map((mensagem) => {
                    const minha = mensagem.membroId === ativa.meuMembroId;
                    return (
                      <li
                        key={mensagem.id}
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm [overflow-wrap:anywhere] whitespace-pre-wrap ${
                          minha
                            ? "self-end bg-primary text-on-primary"
                            : "self-start bg-raised text-fg"
                        }`}
                      >
                        {!minha && ativa.tipo === "group" && (
                          <span className="block text-xs font-bold text-accent mb-0.5">
                            {nomeDoRemetente(mensagem)}
                          </span>
                        )}
                        {mensagem.texto}
                      </li>
                    );
                  })}
                  <li ref={fimDaLista} aria-hidden="true" />
                </ol>

                <form onSubmit={handleEnviar} className="flex gap-2 p-3 border-t border-fg/30 shrink-0">
                  <label htmlFor="campo-mensagem" className="sr-only">
                    Escreva uma mensagem
                  </label>
                  <input
                    id="campo-mensagem"
                    type="text"
                    autoComplete="off"
                    maxLength={2000}
                    placeholder="Escreva uma mensagem"
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    className="flex-1 min-w-0 bg-app border border-fg/60 text-fg px-4 py-2.5 rounded-full text-sm"
                  />
                  <button
                    type="submit"
                    disabled={enviando || !rascunho.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm border border-accent cursor-pointer transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={15} aria-hidden="true" />
                    <span>Enviar</span>
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
