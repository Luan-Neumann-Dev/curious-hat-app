import { supabase } from "../lib/supabase";
import type { Comunidade } from "../types";
import { getCurrentProfile } from "./session";
import { filtroContem } from "./social";

export const EVENTO_COMUNIDADES = "curiousHat_communitiesUpdated";

const COLUNAS_COMUNIDADE = "id, name, description, featured, community_members(count)";

interface LinhaComunidade {
  id: string;
  name: string;
  description: string;
  featured: boolean;
  community_members: { count: number }[];
}

function paraComunidade(linha: LinhaComunidade): Comunidade {
  return {
    id: linha.id,
    name: linha.name,
    description: linha.description,
    featured: linha.featured,
    members: linha.community_members[0]?.count ?? 0,
  };
}

/** Todas as comunidades, das que têm mais membros para as que têm menos. */
export async function listarComunidades(): Promise<Comunidade[]> {
  const { data, error } = await supabase
    .from("communities")
    .select(COLUNAS_COMUNIDADE)
    .returns<LinhaComunidade[]>();
  if (error) throw new Error("Não foi possível carregar as comunidades.");

  return data
    .map(paraComunidade)
    .sort(
      (a, b) =>
        b.members - a.members ||
        Number(b.featured) - Number(a.featured) ||
        a.name.localeCompare(b.name, "pt-BR")
    );
}

export async function idsDasMinhasComunidades(): Promise<string[]> {
  const eu = getCurrentProfile();
  if (!eu) return [];

  const { data, error } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", eu.userId);
  if (error) throw new Error("Não foi possível carregar suas comunidades.");
  return data.map((linha) => linha.community_id as string);
}

export async function entrarNaComunidade(id: string): Promise<void> {
  const { error } = await supabase.from("community_members").insert({ community_id: id });
  // 23505: já é membro, por exemplo se clicou em outra aba
  if (error && error.code !== "23505") throw new Error("Não foi possível entrar na comunidade.");
  window.dispatchEvent(new Event(EVENTO_COMUNIDADES));
}

export async function sairDaComunidade(id: string): Promise<void> {
  const eu = getCurrentProfile();
  if (!eu) return;

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", id)
    .eq("user_id", eu.userId);
  if (error) throw new Error("Não foi possível sair da comunidade.");
  window.dispatchEvent(new Event(EVENTO_COMUNIDADES));
}

export async function buscarComunidades(termo: string): Promise<Comunidade[]> {
  const contem = filtroContem(termo);
  const { data, error } = await supabase
    .from("communities")
    .select(COLUNAS_COMUNIDADE)
    .or(`name.ilike.${contem},description.ilike.${contem}`)
    .order("name")
    .limit(10)
    .returns<LinhaComunidade[]>();
  if (error) throw new Error("Não foi possível buscar comunidades.");
  return data.map(paraComunidade);
}

export async function listarComunidadesDaPessoa(id: string): Promise<Comunidade[]> {
  const participacoes = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", id);
  if (participacoes.error) throw new Error("Não foi possível carregar as comunidades.");
  if (participacoes.data.length === 0) return [];

  const { data, error } = await supabase
    .from("communities")
    .select(COLUNAS_COMUNIDADE)
    .in("id", participacoes.data.map((linha) => linha.community_id as string))
    .order("name")
    .returns<LinhaComunidade[]>();
  if (error) throw new Error("Não foi possível carregar as comunidades.");
  return data.map(paraComunidade);
}
