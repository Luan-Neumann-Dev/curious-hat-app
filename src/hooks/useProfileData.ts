import { useEffect, useState } from "react";
import { avatarPorSemente } from "../lib/avatar";
import { getPosts } from "../services/api";
import { buscarPerfilPublico } from "../services/session";
import type { Post, PublicProfile, UserProfile } from "../types";

function montarPerfilVisitado(idDecodificado: string, postsDaPessoa: Post[]): PublicProfile {
  const postMaisRecente = postsDaPessoa[0];
  if (postMaisRecente) {
    return {
      userId: postMaisRecente.authorId || idDecodificado,
      accountName: postMaisRecente.codename,
      publicHandle:
        postMaisRecente.authorHandle ||
        postMaisRecente.codename?.toLowerCase().replace(/\s+/g, ""),
      bio: postMaisRecente.authorBio || "Usuário do Curious Hat 🎩",
      avatarUrl: postMaisRecente.authorAvatar || avatarPorSemente(postMaisRecente.codename),
      bannerImage: postMaisRecente.authorBanner || "",
      joinedAt: postMaisRecente.authorJoinedAt || "Outubro de 2026",
    };
  }

  return {
    userId: idDecodificado,
    accountName: idDecodificado,
    publicHandle: idDecodificado.toLowerCase().replace(/\s+/g, ""),
    bio: "Usuário do Curious Hat 🎩",
    avatarUrl: avatarPorSemente(idDecodificado),
    bannerImage: "",
    joinedAt: "Outubro de 2026",
  };
}

/** Carrega os posts públicos do perfil aberto e, se for de outra pessoa, os dados dela. */
export function useProfileData(
  idVisitado: string | undefined,
  visitandoOutroUsuario: boolean,
  meuPerfil: UserProfile | null
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [perfilVisitado, setPerfilVisitado] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const todosOsPosts = await getPosts();

        if (visitandoOutroUsuario && idVisitado) {
          const idDecodificado = decodeURIComponent(idVisitado);
          // Filtra apenas os posts públicos dessa pessoa (nunca inclui posts anônimos)
          const postsDaPessoa = todosOsPosts.filter(
            (p) =>
              !p.isAnonymous &&
              (p.authorId === idDecodificado ||
                p.codename?.toLowerCase() === idDecodificado.toLowerCase())
          );
          setPosts(postsDaPessoa);
          const perfilReal = await buscarPerfilPublico(idDecodificado);
          setPerfilVisitado(perfilReal ?? montarPerfilVisitado(idDecodificado, postsDaPessoa));
        } else if (meuPerfil) {
          setPerfilVisitado(null);
          setPosts(
            todosOsPosts.filter(
              (p) =>
                !p.isAnonymous &&
                (p.authorId === meuPerfil.userId ||
                  (!p.authorId && p.codename?.toLowerCase() === meuPerfil.accountName?.toLowerCase()))
            )
          );
        }
      } catch {
        // Silencioso caso a API esteja vazia
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [idVisitado, visitandoOutroUsuario, meuPerfil]);

  return { posts, setPosts, perfilVisitado, loading };
}
