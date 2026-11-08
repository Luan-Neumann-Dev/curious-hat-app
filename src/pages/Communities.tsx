import { useState } from "react";
import { Search as SearchIcon, Users } from "lucide-react";
import { JoinButton } from "../components/JoinButton";
import { useCommunities } from "../hooks/useCommunities";
import { comPlural } from "../lib/plural";
import type { Comunidade } from "../types";

const TAMANHO_DO_TOP = 3;

interface CommunityCardProps {
  comunidade: Comunidade;
  membro: boolean;
  posicao?: number;
}

function CommunityCard({ comunidade, membro, posicao }: CommunityCardProps) {
  return (
    <li className="flex flex-col gap-2 border border-fg/30 rounded-2xl bg-surface p-4 min-w-0">
      {posicao && (
        <span className="text-xs font-extrabold text-accent">Top {posicao}</span>
      )}
      <h3 className="font-extrabold text-fg text-base [overflow-wrap:anywhere]">{comunidade.name}</h3>
      <p className="text-sm text-fg-soft flex-1">{comunidade.description}</p>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-muted min-w-0">
          <Users size={13} aria-hidden="true" className="shrink-0" />
          <span>{comPlural(comunidade.members, "membro", "membros")}</span>
        </span>
        <JoinButton comunidadeId={comunidade.id} nome={comunidade.name} membro={membro} />
      </div>
    </li>
  );
}

export function Communities() {
  const { comunidades, minhasIds, loading, erro } = useCommunities();
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const filtradas = comunidades.filter((comunidade) =>
    `${comunidade.name} ${comunidade.description}`.toLocaleLowerCase("pt-BR").includes(termo)
  );
  const top = filtradas.slice(0, TAMANHO_DO_TOP);
  const outras = filtradas.slice(TAMANHO_DO_TOP);
  const minhas = comunidades.filter((comunidade) => minhasIds.includes(comunidade.id));

  const grade = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3";

  return (
    <div>
      <div className="border-b border-fg/40 p-4 bg-app">
        <h1 className="text-xl font-extrabold text-fg">Comunidades</h1>
      </div>

      {erro && (
        <div role="alert" className="m-4 p-4 border border-danger bg-danger-soft/70 text-fg rounded-xl">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-muted">Carregando comunidades...</p>
      ) : (
        <div className="p-4 space-y-6">
          <div className="relative">
            <label htmlFor="busca-comunidades" className="sr-only">
              Buscar comunidades
            </label>
            <SearchIcon size={18} className="absolute left-3.5 top-3 text-accent" aria-hidden="true" />
            <input
              id="busca-comunidades"
              type="search"
              placeholder="Buscar comunidades"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-app border border-fg/60 text-fg pl-10 pr-4 py-2.5 rounded-full text-sm"
            />
          </div>

          {filtradas.length === 0 ? (
            <p className="py-6 text-center text-muted [overflow-wrap:anywhere]">
              Nenhuma comunidade encontrada para "{busca.trim()}".
            </p>
          ) : (
            <>
              <section aria-labelledby="titulo-top-comunidades">
                <h2 id="titulo-top-comunidades" className="text-base font-extrabold text-fg mb-3">
                  Top comunidades
                </h2>
                <ul className={grade}>
                  {top.map((comunidade, indice) => (
                    <CommunityCard
                      key={comunidade.id}
                      comunidade={comunidade}
                      membro={minhasIds.includes(comunidade.id)}
                      posicao={termo ? undefined : indice + 1}
                    />
                  ))}
                </ul>
              </section>

              {outras.length > 0 && (
                <section aria-labelledby="titulo-outras-comunidades">
                  <h2 id="titulo-outras-comunidades" className="text-base font-extrabold text-fg mb-3">
                    Outras comunidades
                  </h2>
                  <ul className={grade}>
                    {outras.map((comunidade) => (
                      <CommunityCard
                        key={comunidade.id}
                        comunidade={comunidade}
                        membro={minhasIds.includes(comunidade.id)}
                      />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <section aria-labelledby="titulo-suas-comunidades">
            <h2 id="titulo-suas-comunidades" className="text-base font-extrabold text-fg mb-3">
              Suas comunidades
            </h2>
            {minhas.length === 0 ? (
              <p className="text-sm text-muted">Você ainda não entrou em nenhuma comunidade.</p>
            ) : (
              <ul className={grade}>
                {minhas.map((comunidade) => (
                  <CommunityCard key={comunidade.id} comunidade={comunidade} membro />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
