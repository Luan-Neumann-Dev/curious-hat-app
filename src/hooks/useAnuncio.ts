import { useEffect } from "react";

/**
 * Anuncia uma mensagem aos leitores de tela sem mover o foco.
 * A região fica no index.html: ela precisa já existir quando o texto muda.
 */
export function useAnuncio(mensagem: string) {
  useEffect(() => {
    const regiao = document.getElementById("anuncios");
    if (regiao) regiao.textContent = mensagem;
  }, [mensagem]);
}
