import { useEffect, useState } from "react";
import { mensagemDeErro } from "../lib/errors";
import {
  EVENTO_COMUNIDADES,
  idsDasMinhasComunidades,
  listarComunidades,
} from "../services/communities";
import type { Comunidade } from "../types";

/** Comunidades e participações da pessoa logada, atualizadas a cada entrada ou saída. */
export function useCommunities() {
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [minhasIds, setMinhasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [lista, ids] = await Promise.all([listarComunidades(), idsDasMinhasComunidades()]);
        if (!ativo) return;
        setComunidades(lista);
        setMinhasIds(ids);
        setErro("");
      } catch (err) {
        if (ativo) setErro(mensagemDeErro(err));
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    window.addEventListener(EVENTO_COMUNIDADES, carregar);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_COMUNIDADES, carregar);
    };
  }, []);

  return { comunidades, minhasIds, loading, erro };
}
