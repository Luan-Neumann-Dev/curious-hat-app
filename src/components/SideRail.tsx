import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCommunities } from "../hooks/useCommunities";
import { mensagemDeErro } from "../lib/errors";
import { comPlural } from "../lib/plural";
import { listarSugestoes } from "../services/social";
import type { PublicProfile } from "../types";
import { JoinButton } from "./JoinButton";
import { PersonRow } from "./PersonRow";

const TAMANHO_DO_TOP = 3;
const estiloDoCartao = "border border-fg/30 rounded-2xl bg-surface p-4";
const estiloDoTitulo = "text-base font-extrabold text-fg tracking-tight pb-3 mb-3 border-b border-fg/20";

function TopComunidades() {
  const { comunidades, minhasIds, loading, erro } = useCommunities();

  return (
    <section aria-labelledby="titulo-rail-comunidades" className={estiloDoCartao}>
      <h2 id="titulo-rail-comunidades" className={estiloDoTitulo}>
        <Link to="/comunidades" className="hover:underline">Top comunidades</Link>
      </h2>
      {loading ? (
        <p className="text-xs text-muted py-4 text-center">Carregando comunidades...</p>
      ) : comunidades.length === 0 ? (
        <p className={`text-xs py-4 text-center ${erro ? "text-danger" : "text-muted"}`}>
          {erro || "Nenhuma comunidade por enquanto."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comunidades.slice(0, TAMANHO_DO_TOP).map((comunidade) => (
            <li key={comunidade.id} className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg truncate">{comunidade.name}</p>
                <p className="text-xs text-muted">
                  {comPlural(comunidade.members, "membro", "membros")}
                </p>
              </div>
              <JoinButton
                comunidadeId={comunidade.id}
                nome={comunidade.name}
                membro={minhasIds.includes(comunidade.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Sugestoes() {
  const [pessoas, setPessoas] = useState<PublicProfile[]>([]);
  const [seguidas, setSeguidas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setPessoas(await listarSugestoes());
      } catch (falha) {
        setErro(mensagemDeErro(falha));
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  function aoMudar(id: string, seguindo: boolean) {
    setSeguidas((atuais) =>
      seguindo ? [...atuais, id] : atuais.filter((item) => item !== id)
    );
  }

  return (
    <section aria-labelledby="titulo-rail-sugestoes" className={estiloDoCartao}>
      <h2 id="titulo-rail-sugestoes" className={estiloDoTitulo}>Talvez você conheça</h2>
      {loading ? (
        <p className="text-xs text-muted py-4 text-center">Carregando sugestões...</p>
      ) : pessoas.length === 0 ? (
        <p className={`text-xs py-4 text-center ${erro ? "text-danger" : "text-muted"}`}>
          {erro || "Nenhuma sugestão por enquanto."}
        </p>
      ) : (
        <ul className="space-y-3">
          {pessoas.map((pessoa) => (
            <li key={pessoa.userId}>
              <PersonRow
                pessoa={pessoa}
                seguindo={seguidas.includes(pessoa.userId)}
                onChange={(seguindo) => aoMudar(pessoa.userId, seguindo)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SideRail() {
  return (
    <aside
      aria-label="Comunidades e sugestões"
      className="w-full lg:w-80 xl:w-88 border-t lg:border-t-0 lg:border-l border-fg/30 p-4 bg-app shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto space-y-4"
    >
      <TopComunidades />
      <Sugestoes />
    </aside>
  );
}
