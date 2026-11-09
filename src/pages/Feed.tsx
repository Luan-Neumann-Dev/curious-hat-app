import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Abas, PainelDaAba } from "../components/Abas";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { HatButton } from "../components/HatButton";
import { IdentityToggle } from "../components/IdentityToggle";
import { useAnuncio } from "../hooks/useAnuncio";
import { useCommunities } from "../hooks/useCommunities";
import { mensagemDeErro } from "../lib/errors";
import { comPlural } from "../lib/plural";
import { alternarFogo, criarHat, excluirHat, listarHats } from "../services/hats";
import { getCurrentProfile } from "../services/session";
import { EVENTO_SEGUIDORES } from "../services/social";
import type { AbaDoFeed, Post } from "../types";

const ABAS: { id: AbaDoFeed; rotulo: string; vazio: string }[] = [
  { id: "paraVoce", rotulo: "Para você", vazio: "Nenhuma publicação ativa no momento." },
  {
    id: "seguindo",
    rotulo: "Seguindo",
    vazio: "Nada por aqui. Siga pessoas para ver os hats com nome delas.",
  },
  { id: "anonimos", rotulo: "Só anônimos", vazio: "Nenhum hat anônimo ativo no momento." },
];

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [aba, setAba] = useState<AbaDoFeed>("paraVoce");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [perfil] = useState(getCurrentProfile);
  const [textoNovidade, setTextoNovidade] = useState("");
  const [modoAnonimo, setModoAnonimo] = useState(() => perfil?.preferencias.anonimoPorPadrao ?? false);
  const { comunidades, minhasIds } = useCommunities();
  const [comunidadeEscolhida, setComunidadeEscolhida] = useState("");
  const [erroPostRapido, setErroPostRapido] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    // Ignora a resposta antiga se a pessoa trocar de aba antes de ela chegar
    let ativa = true;

    async function carregarFofocas() {
      try {
        const dados = await listarHats(aba);
        if (!ativa) return;
        setPosts(dados);
        setError("");
      } catch (err) {
        if (ativa) setError(mensagemDeErro(err));
      } finally {
        if (ativa) setLoading(false);
      }
    }
    carregarFofocas();

    return () => {
      ativa = false;
    };
  }, [aba, recargas]);

  // Seguir alguém pelas sugestões muda o que a aba Seguindo mostra
  useEffect(() => {
    function recarregarSeguindo() {
      if (aba === "seguindo") setRecargas((total) => total + 1);
    }
    window.addEventListener(EVENTO_SEGUIDORES, recarregarSeguindo);
    return () => window.removeEventListener(EVENTO_SEGUIDORES, recarregarSeguindo);
  }, [aba]);

  function trocarAba(novaAba: AbaDoFeed) {
    setLoading(true);
    setAba(novaAba);
  }

  function atualizar() {
    setLoading(true);
    setRecargas((total) => total + 1);
  }

  async function handlePublicarRapido(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!perfil) return;
    if (textoNovidade.trim().length < 3) {
      setErroPostRapido("Escreva uma mensagem antes de postar!");
      return;
    }
    try {
      setPublicando(true);
      setErroPostRapido("");
      const novo = await criarHat(textoNovidade.trim(), modoAnonimo, comunidadeValida || null);
      const apareceNaAba = aba === "paraVoce" || (aba === "anonimos" && novo.isAnonymous);
      if (apareceNaAba) setPosts((listaAtual) => [novo, ...listaAtual]);
      setTextoNovidade("");
    } catch (err) {
      setErroPostRapido(mensagemDeErro(err));
    } finally {
      setPublicando(false);
    }
  }

  async function handleDarFogo(post: Post) {
    try {
      const atualizado = await alternarFogo(post);
      setPosts((listaAtual) =>
        listaAtual.map((item) => (item.id === post.id ? atualizado : item))
      );
    } catch (err) {
      setError(mensagemDeErro(err));
    }
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    try {
      setDeletando(true);
      await excluirHat(postParaDeletar.id);
      setPosts((listaAtual) =>
        listaAtual.filter((item) => item.id !== postParaDeletar.id)
      );
      setPostParaDeletar(null);
    } catch (err) {
      setError(mensagemDeErro(err));
      setPostParaDeletar(null);
    } finally {
      setDeletando(false);
    }
  }

  function handleExpirar(idExpirado: string) {
    setPosts((listaAtual) => listaAtual.filter((item) => item.id !== idExpirado));
  }

  const abaAtual = ABAS.find((item) => item.id === aba);
  const minhasComunidades = comunidades.filter((item) => minhasIds.includes(item.id));
  // Se a pessoa saiu da comunidade escolhida, volta para "sem comunidade"
  const comunidadeValida = minhasIds.includes(comunidadeEscolhida) ? comunidadeEscolhida : "";

  let status = comPlural(posts.length, "hat", "hats");
  if (loading) status = "Carregando novidades...";
  else if (error) status = "";
  else if (posts.length === 0) status = abaAtual?.vazio ?? "";
  useAnuncio(status);

  return (
    <div>
      <div className="border-b border-fg/40 p-4 flex items-center justify-between bg-app sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-fg">Página Inicial</h1>
        <HatButton variant="outline" onClick={atualizar} ariaLabel="Atualizar timeline">
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
                aria-invalid={erroPostRapido ? true : undefined}
                aria-describedby={erroPostRapido ? "erro-novidades" : undefined}
                className="w-full bg-app border border-fg/30 focus:border-accent p-3 rounded-xl text-fg placeholder-muted resize-none text-base"
              />
            </div>
          </div>
          {erroPostRapido && (
            <p id="erro-novidades" role="alert" className="text-danger text-xs font-bold mt-2">
              ⚠️ {erroPostRapido}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-2 pl-2">
            <IdentityToggle
              anonimo={modoAnonimo}
              onChange={setModoAnonimo}
              nome={perfil?.accountName}
              vulgo={perfil?.codename}
              titulo="Clique para alternar entre seu Perfil e seu Vulgo Anônimo (24h)"
            />

            <div className="flex flex-wrap items-center gap-3 ml-auto min-w-0">
              {minhasComunidades.length > 0 && (
                <div className="min-w-0">
                  <label htmlFor="comunidade-do-hat" className="sr-only">
                    Publicar em uma comunidade
                  </label>
                  <select
                    id="comunidade-do-hat"
                    value={comunidadeValida}
                    onChange={(e) => setComunidadeEscolhida(e.target.value)}
                    className="max-w-full bg-app border border-fg/40 text-fg px-3 py-2 rounded-full text-sm"
                  >
                    <option value="">Sem comunidade</option>
                    {minhasComunidades.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <HatButton type="submit" variant="purple" disabled={publicando}>
              <Send size={15} aria-hidden="true" />
              <span>{publicando ? "Postando..." : "Postar"}</span>
              </HatButton>
            </div>
          </div>
        </form>
      </div>
      <Abas base="feed" rotulo="Filtrar hats" abas={ABAS} ativa={aba} onChange={trocarAba} />
      <PainelDaAba base="feed" ativa={aba}>
        {error && (
          <div role="alert" className="m-4 p-4 border border-danger bg-danger-soft/70 text-fg rounded-xl">
            {error}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-muted">Carregando novidades...</div>
        ) : posts.length === 0 ? (
          !error && <div className="p-12 text-center text-muted">{abaAtual?.vazio}</div>
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
      </PainelDaAba>
      <ConfirmModal
        post={postParaDeletar}
        onCancel={() => setPostParaDeletar(null)}
        onConfirm={confirmarExclusao}
        isDeleting={deletando}
      />
    </div>
  );
}
