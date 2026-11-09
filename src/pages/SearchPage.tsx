import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Users } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { GossipCard } from "../components/GossipCard";
import { PersonRow } from "../components/PersonRow";
import { useAnuncio } from "../hooks/useAnuncio";
import { mensagemDeErro } from "../lib/errors";
import { comPlural } from "../lib/plural";
import { alternarFogo, buscarHats, excluirHat, listarTopHats } from "../services/hats";
import { buscarComunidades } from "../services/communities";
import { getCurrentProfile } from "../services/session";
import { buscarPessoas, idsQueSigo } from "../services/social";
import type { Comunidade, Post, PublicProfile } from "../types";

const ATALHOS = ["Família", "Trabalho", "Amigos", "Madrugada"];
const TAMANHO_MINIMO = 2;
const ESPERA_AO_DIGITAR_MS = 300;

export function SearchPage() {
  const [eu] = useState(getCurrentProfile);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [topHats, setTopHats] = useState<Post[]>([]);
  const [hats, setHats] = useState<Post[]>([]);
  const [pessoas, setPessoas] = useState<PublicProfile[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [seguidos, setSeguidos] = useState<string[]>([]);
  // Último termo com resposta do servidor: enquanto for outro, a busca ainda está em andamento
  const [termoConcluido, setTermoConcluido] = useState("");
  const [postParaDeletar, setPostParaDeletar] = useState<Post | null>(null);

  const termo = busca.trim();
  const buscando = termo.length >= TAMANHO_MINIMO;

  useEffect(() => {
    // Ignora a resposta antiga se a pessoa continuar digitando
    let ativa = true;

    const espera = setTimeout(async () => {
      try {
        setLoading(true);
        if (termo.length >= TAMANHO_MINIMO) {
          const [achadosHats, achadosPessoas, achadasComunidades, ids] = await Promise.all([
            buscarHats(termo),
            buscarPessoas(termo),
            buscarComunidades(termo),
            idsQueSigo(),
          ]);
          if (!ativa) return;
          setHats(achadosHats);
          setPessoas(achadosPessoas);
          setComunidades(achadasComunidades);
          setSeguidos(ids);
          setTermoConcluido(termo);
        } else {
          const lista = await listarTopHats();
          if (!ativa) return;
          setTopHats(lista);
        }
        setError("");
      } catch (err) {
        if (ativa) setError(mensagemDeErro(err));
      } finally {
        if (ativa) setLoading(false);
      }
    }, ESPERA_AO_DIGITAR_MS);

    return () => {
      ativa = false;
      clearTimeout(espera);
    };
  }, [termo]);

  function atualizarNasListas(atualizar: (lista: Post[]) => Post[]) {
    setHats(atualizar);
    setTopHats(atualizar);
  }

  async function handleDarFogo(post: Post) {
    try {
      const atualizado = await alternarFogo(post);
      atualizarNasListas((lista) => lista.map((p) => (p.id === post.id ? atualizado : p)));
    } catch (err) {
      setError(mensagemDeErro(err));
    }
  }

  async function confirmarExclusao() {
    if (!postParaDeletar) return;
    try {
      await excluirHat(postParaDeletar.id);
      atualizarNasListas((lista) => lista.filter((p) => p.id !== postParaDeletar.id));
    } catch (err) {
      setError(mensagemDeErro(err));
    } finally {
      setPostParaDeletar(null);
    }
  }

  function aoMudarSeguindo(id: string, seguindo: boolean) {
    setSeguidos((atuais) =>
      seguindo ? [...atuais, id] : atuais.filter((item) => item !== id)
    );
  }

  function renderizarHats(lista: Post[]) {
    return lista.map((post) => (
      <GossipCard
        key={post.id}
        post={post}
        onLike={handleDarFogo}
        onDeleteRequest={setPostParaDeletar}
        onExpire={(id) => atualizarNasListas((atuais) => atuais.filter((p) => p.id !== id))}
      />
    ));
  }

  const totalDeResultados = hats.length + pessoas.length + comunidades.length;
  const buscaConcluida = buscando && !loading && termoConcluido === termo;
  const semResultados = buscaConcluida && !error && totalDeResultados === 0;

  let status = "";
  if (loading || (buscando && !buscaConcluida && !error)) status = "Buscando...";
  else if (semResultados) status = `Nada encontrado para "${termo}".`;
  else if (buscaConcluida && !error) status = comPlural(totalDeResultados, "resultado", "resultados");
  useAnuncio(status);

  return (
    <div>
      <div className="border-b border-fg/40 p-4 bg-app">
        <h1 className="text-xl font-extrabold text-fg">Buscar</h1>
      </div>

      <div className="p-4 border-b border-fg/40 bg-surface/50 space-y-3">
        <div className="relative">
          <label htmlFor="input-pesquisa" className="sr-only">
            Pesquisar pessoas, hats e comunidades
          </label>
          <SearchIcon size={18} className="absolute left-3.5 top-3 text-accent" aria-hidden="true" />
          <input
            id="input-pesquisa"
            type="search"
            placeholder="Pessoas, hats, comunidades..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-app border border-fg/60 text-fg pl-10 pr-4 py-2.5 rounded-full text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ATALHOS.map((atalho) => (
            <button
              key={atalho}
              type="button"
              onClick={() => setBusca(atalho)}
              className="px-3 py-1 rounded-full bg-raised border border-fg/20 hover:border-accent text-xs font-semibold text-fg-soft cursor-pointer transition"
            >
              {atalho}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="m-4 p-4 border border-danger bg-danger-soft/70 text-fg rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-muted">Buscando...</p>
      ) : !buscando ? (
        <section aria-labelledby="titulo-top-hats">
          <h2 id="titulo-top-hats" className="px-4 pt-4 pb-3 text-base font-extrabold text-fg border-b border-fg/30">
            Top hats 🔥
          </h2>
          {topHats.length === 0 ? (
            !error && <p className="p-10 text-center text-muted">Nenhum hat com Fogo ainda.</p>
          ) : (
            renderizarHats(topHats)
          )}
        </section>
      ) : semResultados ? (
        <p className="p-10 text-center text-muted [overflow-wrap:anywhere]">Nada encontrado para "{termo}".</p>
      ) : (
        <>
          {pessoas.length > 0 && (
            <section aria-labelledby="titulo-pessoas" className="p-4 border-b border-fg/30">
              <h2 id="titulo-pessoas" className="text-base font-extrabold text-fg mb-3">Pessoas</h2>
              <ul className="space-y-3">
                {pessoas.map((pessoa) => (
                  <li key={pessoa.userId}>
                    <PersonRow
                      pessoa={pessoa}
                      podeSeguir={pessoa.userId !== eu?.userId}
                      seguindo={seguidos.includes(pessoa.userId)}
                      onChange={(seguindo) => aoMudarSeguindo(pessoa.userId, seguindo)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {comunidades.length > 0 && (
            <section aria-labelledby="titulo-comunidades" className="p-4 border-b border-fg/30">
              <h2 id="titulo-comunidades" className="text-base font-extrabold text-fg mb-3">Comunidades</h2>
              <ul className="space-y-2">
                {comunidades.map((comunidade) => (
                  <li key={comunidade.id} className="flex items-center gap-2 text-sm min-w-0">
                    <Users size={16} className="text-accent shrink-0" aria-hidden="true" />
                    <Link to="/comunidades" className="font-bold text-fg truncate hover:underline">{comunidade.name}</Link>
                    <span className="text-xs text-muted shrink-0">{comPlural(comunidade.members, "membro", "membros")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hats.length > 0 && (
            <section aria-labelledby="titulo-hats">
              <h2 id="titulo-hats" className="px-4 pt-4 pb-3 text-base font-extrabold text-fg border-b border-fg/30">
                Hats
              </h2>
              {renderizarHats(hats)}
            </section>
          )}
        </>
      )}

      <ConfirmModal
        post={postParaDeletar}
        onCancel={() => setPostParaDeletar(null)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
