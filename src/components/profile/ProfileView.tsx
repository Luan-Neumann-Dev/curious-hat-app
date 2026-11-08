import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, LogOut, Plus, Users } from "lucide-react";
import { AVATAR_PADRAO } from "../../lib/avatar";
import { mensagemDeErro } from "../../lib/errors";
import { comPlural } from "../../lib/plural";
import { alternarFogo, excluirHat, listarHatsCurtidos } from "../../services/hats";
import { EVENTO_COMUNIDADES, listarComunidadesDaPessoa } from "../../services/communities";
import { carregarEstatisticas, EVENTO_SEGUIDORES } from "../../services/social";
import type { Comunidade, EstatisticasDoPerfil, Post, PublicProfile } from "../../types";
import { ConfirmModal } from "../ConfirmModal";
import { FollowButton } from "../FollowButton";
import { GossipCard } from "../GossipCard";

type AbaDoPerfil = "hats" | "fogos" | "comunidades";

const ABAS: { id: AbaDoPerfil; rotulo: string }[] = [
  { id: "hats", rotulo: "Hats" },
  { id: "fogos", rotulo: "Fogos" },
  { id: "comunidades", rotulo: "Comunidades" },
];

interface ProfileViewProps {
  dados: PublicProfile;
  visitandoOutroUsuario: boolean;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  loading: boolean;
  onEditar: () => void;
  onLogout: () => void;
}

export function ProfileView({
  dados,
  visitandoOutroUsuario,
  posts,
  setPosts,
  loading,
  onEditar,
  onLogout,
}: ProfileViewProps) {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<AbaDoPerfil>("hats");
  const [estatisticas, setEstatisticas] = useState<EstatisticasDoPerfil | null>(null);
  const [curtidos, setCurtidos] = useState<Post[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [carregandoAba, setCarregandoAba] = useState(false);
  const [recargas, setRecargas] = useState(0);
  const [erro, setErro] = useState("");
  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setEstatisticas(await carregarEstatisticas(dados.userId));
      } catch (err) {
        setErro(mensagemDeErro(err));
      }
    }
    carregar();

    // Seguir ou entrar em comunidades pelo painel lateral também muda os números deste perfil
    function recarregar() {
      setRecargas((total) => total + 1);
    }
    window.addEventListener(EVENTO_SEGUIDORES, recarregar);
    window.addEventListener(EVENTO_COMUNIDADES, recarregar);
    return () => {
      window.removeEventListener(EVENTO_SEGUIDORES, recarregar);
      window.removeEventListener(EVENTO_COMUNIDADES, recarregar);
    };
  }, [dados.userId, recargas]);

  function abrirAba(aba: AbaDoPerfil) {
    setAbaAtiva(aba);
    setErro("");
    if (aba === "hats") return;

    async function carregarAba() {
      try {
        setCarregandoAba(true);
        if (aba === "fogos") {
          setCurtidos(await listarHatsCurtidos(dados.userId));
        } else {
          setComunidades(await listarComunidadesDaPessoa(dados.userId));
        }
      } catch (err) {
        setErro(mensagemDeErro(err));
      } finally {
        setCarregandoAba(false);
      }
    }
    carregarAba();
  }

  function aplicarNasListas(atualizar: (lista: Post[]) => Post[]) {
    setPosts(atualizar);
    setCurtidos(atualizar);
  }

  async function handleDarFogo(post: Post) {
    try {
      const atualizado = await alternarFogo(post);
      aplicarNasListas((atuais) => atuais.map((p) => (p.id === post.id ? atualizado : p)));
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    try {
      await excluirHat(postParaDeletar.id);
      aplicarNasListas((atuais) => atuais.filter((p) => p.id !== postParaDeletar.id));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setPostParaDeletar(null);
    }
  }

  const postsExibidos = abaAtiva === "fogos" ? curtidos : posts;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-app/85 backdrop-blur-md px-4 py-2.5 border-b border-fg/25 flex items-center gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 rounded-full hover:bg-raised text-fg transition cursor-pointer"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-fg leading-tight">
            {dados.accountName}
          </h1>
          <p className="text-xs text-muted">{comPlural(posts.length, "hat", "hats")}</p>
        </div>
      </div>

      <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-banner-from via-banner-via to-banner-to overflow-hidden border-b border-fg/20">
        {dados.bannerImage && (
          <img
            src={dados.bannerImage}
            alt="Papel de parede"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 sm:px-6 pb-4">
        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-3">
          {/* Se for meu perfil, posso clicar na foto para editar. Se for de outro, apenas exibe a foto */}
          <div
            onClick={() => !visitandoOutroUsuario && onEditar()}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-app bg-raised overflow-hidden shadow-xl ${
              !visitandoOutroUsuario ? "cursor-pointer group" : ""
            }`}
          >
            <img
              src={dados.avatarUrl || AVATAR_PADRAO}
              alt={dados.accountName}
              className={`w-full h-full object-cover ${
                !visitandoOutroUsuario ? "group-hover:opacity-40 transition-opacity" : ""
              }`}
            />
            {!visitandoOutroUsuario && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Plus size={36} strokeWidth={3} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {visitandoOutroUsuario ? (
              <FollowButton
                userId={dados.userId}
                seguindo={estatisticas?.euSigo ?? false}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEditar}
                  className="px-4 py-1.5 rounded-full border border-fg/50 hover:bg-raised text-fg font-bold text-sm transition cursor-pointer"
                >
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  aria-label="Sair da conta"
                  className="p-2 rounded-full border border-danger/50 hover:bg-danger-soft/50 text-danger transition cursor-pointer"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl font-black text-fg leading-tight">
            {dados.accountName}
          </h2>
          <p className="text-sm text-muted">
            @{dados.publicHandle || dados.accountName?.toLowerCase().replace(/\s+/g, "")}
          </p>
        </div>

        <p className="text-fg text-sm leading-relaxed mb-3 [overflow-wrap:anywhere]">
          {dados.bio}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted mb-3">
          <Calendar size={15} aria-hidden="true" />
          <span>Ingressou em {dados.joinedAt || "Outubro de 2026"}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="text-muted">
            <strong className="text-fg">{estatisticas?.seguidores ?? "–"}</strong>{" "}
            {estatisticas?.seguidores === 1 ? "Seguidor" : "Seguidores"}
          </span>
          <span className="text-muted">
            <strong className="text-fg">{estatisticas?.seguindo ?? "–"}</strong> Seguindo
          </span>
          <span className="text-muted">
            <strong className="text-fg">{estatisticas?.comunidades ?? "–"}</strong>{" "}
            {estatisticas?.comunidades === 1 ? "Comunidade" : "Comunidades"}
          </span>
        </div>
      </div>

      <div role="tablist" aria-label="Conteúdo do perfil" className="grid grid-cols-3 border-b border-fg/30 text-sm font-bold text-center">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.id}
            onClick={() => abrirAba(aba.id)}
            className={`py-3.5 px-1 hover:bg-raised/60 transition cursor-pointer relative ${
              abaAtiva === aba.id ? "text-fg" : "text-muted"
            }`}
          >
            <span>{aba.rotulo}</span>
            {abaAtiva === aba.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {erro && (
        <div role="alert" className="m-4 p-3 border border-danger bg-danger-soft/70 text-fg text-sm rounded-xl">
          {erro}
        </div>
      )}

      {loading || carregandoAba ? (
        <p className="p-8 text-center text-muted text-sm">Carregando...</p>
      ) : abaAtiva === "comunidades" ? (
        comunidades.length === 0 ? (
          <p className="p-10 text-center text-muted text-sm">
            {dados.accountName} ainda não entrou em nenhuma comunidade.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {comunidades.map((comunidade) => (
              <li key={comunidade.id} className="border border-fg/30 rounded-xl p-3 bg-surface min-w-0">
                <p className="font-bold text-fg text-sm truncate">{comunidade.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                  <Users size={13} aria-hidden="true" />
                  <span>{comPlural(comunidade.members, "membro", "membros")}</span>
                </p>
              </li>
            ))}
          </ul>
        )
      ) : postsExibidos.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <p className="text-fg font-bold text-base">
            {abaAtiva === "fogos" ? "Nenhum Fogo por aqui" : "Nenhum hat público encontrado"}
          </p>
          <p className="text-muted text-xs max-w-sm mx-auto">
            {abaAtiva === "fogos"
              ? `Os hats ativos que ${dados.accountName} curtir aparecerão aqui.`
              : `Os hats com nome de ${dados.accountName} aparecerão aqui.`}
          </p>
        </div>
      ) : (
        postsExibidos.map((post) => (
          <GossipCard
            key={post.id}
            post={post}
            onLike={handleDarFogo}
            onDeleteRequest={setPostParaDeletar}
            onExpire={(id) => aplicarNasListas((atuais) => atuais.filter((p) => p.id !== id))}
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
