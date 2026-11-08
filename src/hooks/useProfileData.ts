import { useEffect, useState } from "react";
import { listarHatsDoAutor } from "../services/hats";
import { buscarPerfilPublico } from "../services/session";
import type { Post, PublicProfile, UserProfile } from "../types";

/** Carrega os hats com nome do perfil aberto e, se for de outra pessoa, os dados dela. */
export function useProfileData(
  idVisitado: string | undefined,
  visitandoOutroUsuario: boolean,
  meuPerfil: UserProfile | null
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [perfilVisitado, setPerfilVisitado] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        if (visitandoOutroUsuario && idVisitado) {
          const perfil = await buscarPerfilPublico(decodeURIComponent(idVisitado));
          setPerfilVisitado(perfil);
          setPosts(perfil ? await listarHatsDoAutor(perfil.userId) : []);
        } else if (meuPerfil) {
          setPerfilVisitado(null);
          setPosts(await listarHatsDoAutor(meuPerfil.userId));
        }
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [idVisitado, visitandoOutroUsuario, meuPerfil]);

  return { posts, setPosts, perfilVisitado, loading };
}
