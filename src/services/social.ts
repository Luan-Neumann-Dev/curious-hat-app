import { supabase } from "../lib/supabase";
import type { Comunidade, EstatisticasDoPerfil, PublicProfile } from "../types";
import {
  COLUNAS_PUBLICAS,
  getCurrentProfile,
  paraPerfilPublico,
} from "./session";
import type { LinhaPerfil } from "./session";

export const EVENTO_SEGUIDORES = "curiousHat_followsUpdated";

const COLUNAS_COMUNIDADE = "id, name, description, community_members(count)";

interface LinhaComunidade {
  id: string;
  name: string;
  description: string;
  community_members: { count: number }[];
}

function paraComunidade(linha: LinhaComunidade): Comunidade {
  return {
    id: linha.id,
    name: linha.name,
    description: linha.description,
    members: linha.community_members[0]?.count ?? 0,
  };
}

/** Monta um filtro "contém" para o `.or()`, tratando o termo como texto literal. */
export function filtroContem(termo: string): string {
  const literal = termo.replace(/[\\%_]/g, "\\$&");
  return `"%${literal.replace(/[\\"]/g, "\\$&")}%"`;
}

export async function idsQueSigo(): Promise<string[]> {
  const eu = getCurrentProfile();
  if (!eu) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", eu.userId);
  if (error) throw new Error("Não foi possível carregar quem você segue.");
  return data.map((linha) => linha.followee_id as string);
}

export async function seguir(id: string): Promise<void> {
  const { error } = await supabase.from("follows").insert({ followee_id: id });
  // 23505: já segue, por exemplo se clicou em outra aba
  if (error && error.code !== "23505") throw new Error("Não foi possível seguir agora.");
  window.dispatchEvent(new Event(EVENTO_SEGUIDORES));
}

export async function deixarDeSeguir(id: string): Promise<void> {
  const eu = getCurrentProfile();
  if (!eu) return;

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", eu.userId)
    .eq("followee_id", id);
  if (error) throw new Error("Não foi possível deixar de seguir agora.");
  window.dispatchEvent(new Event(EVENTO_SEGUIDORES));
}

async function contar(tabela: string, coluna: string, id: string): Promise<number> {
  const { count, error } = await supabase
    .from(tabela)
    .select("*", { count: "exact", head: true })
    .eq(coluna, id);
  if (error) throw new Error("Não foi possível carregar os números do perfil.");
  return count ?? 0;
}

export async function carregarEstatisticas(id: string): Promise<EstatisticasDoPerfil> {
  const [seguidores, seguindo, comunidades, seguidos] = await Promise.all([
    contar("follows", "followee_id", id),
    contar("follows", "follower_id", id),
    contar("community_members", "user_id", id),
    idsQueSigo(),
  ]);
  return { seguidores, seguindo, comunidades, euSigo: seguidos.includes(id) };
}

/** Pessoas ativas que a pessoa logada ainda não segue, das mais recentes para as mais antigas. */
export async function listarSugestoes(limite = 5): Promise<PublicProfile[]> {
  const eu = getCurrentProfile();
  if (!eu) return [];

  const [seguidos, resposta] = await Promise.all([
    idsQueSigo(),
    supabase
      .from("profiles")
      .select(COLUNAS_PUBLICAS)
      .eq("blocked", false)
      .neq("id", eu.userId)
      .order("joined_at", { ascending: false })
      .limit(limite + 50)
      .returns<LinhaPerfil[]>(),
  ]);
  if (resposta.error) throw new Error("Não foi possível carregar as sugestões.");

  return resposta.data
    .filter((linha) => !seguidos.includes(linha.id))
    .slice(0, limite)
    .map(paraPerfilPublico);
}

export async function buscarPessoas(termo: string): Promise<PublicProfile[]> {
  const contem = filtroContem(termo);
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUNAS_PUBLICAS)
    .eq("blocked", false)
    .or(`account_name.ilike.${contem},handle.ilike.${contem}`)
    .order("account_name")
    .limit(10)
    .returns<LinhaPerfil[]>();
  if (error) throw new Error("Não foi possível buscar pessoas.");
  return data.map(paraPerfilPublico);
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
