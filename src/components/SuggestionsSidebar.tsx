import { useEffect, useState } from "react";
import { listarSugestoes } from "../services/social";
import type { PublicProfile } from "../types";
import { PersonRow } from "./PersonRow";

export function SuggestionsSidebar() {
  const [pessoas, setPessoas] = useState<PublicProfile[]>([]);
  const [seguidas, setSeguidas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setPessoas(await listarSugestoes());
      } catch {
        setPessoas([]);
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
    <aside
      aria-label="Sugestões de pessoas"
      className="w-full lg:w-80 xl:w-88 border-t lg:border-t-0 lg:border-l border-fg/30 p-4 bg-app shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
    >
      <div className="border border-fg/30 rounded-2xl bg-surface p-4">
        <h2 className="text-base font-extrabold text-fg tracking-tight pb-3 mb-3 border-b border-fg/20">
          Talvez você conheça
        </h2>

        {loading ? (
          <p className="text-xs text-muted py-4 text-center">Carregando sugestões...</p>
        ) : pessoas.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">Nenhuma sugestão por enquanto.</p>
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
      </div>
    </aside>
  );
}
