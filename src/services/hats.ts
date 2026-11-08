import { supabase } from "../lib/supabase";
import type { AbaDoFeed, Post, Reply } from "../types";
import { getCurrentProfile } from "./session";

const LIMITE_DO_FEED = 100;

interface LinhaHat {
  id: string;
  author_id: string | null;
  is_anonymous: boolean;
  is_mine: boolean;
  display_name: string;
  author_handle: string | null;
  author_avatar: string | null;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  likes_count: number;
  replies_count: number;
  liked_by_me: boolean;
}

interface LinhaResposta {
  id: string;
  hat_id: string;
  author_id: string | null;
  is_anonymous: boolean;
  is_mine: boolean;
  display_name: string;
  author_handle: string | null;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

function paraPost(linha: LinhaHat): Post {
  return {
    id: linha.id,
    authorId: linha.author_id,
    isAnonymous: linha.is_anonymous,
    isMine: linha.is_mine,
    displayName: linha.display_name,
    authorHandle: linha.author_handle,
    authorAvatar: linha.author_avatar,
    title: linha.title,
    content: linha.content,
    createdAt: linha.created_at,
    expiresAt: linha.expires_at,
    likes: linha.likes_count,
    repliesCount: linha.replies_count,
    likedByMe: linha.liked_by_me,
  };
}

function paraResposta(linha: LinhaResposta): Reply {
  return {
    id: linha.id,
    hatId: linha.hat_id,
    authorId: linha.author_id,
    isAnonymous: linha.is_anonymous,
    isMine: linha.is_mine,
    displayName: linha.display_name,
    authorHandle: linha.author_handle,
    authorAvatar: linha.author_avatar,
    content: linha.content,
    createdAt: linha.created_at,
  };
}

function avisarPostsAtualizados(): void {
  window.dispatchEvent(new Event("curiousHat_postsUpdated"));
}

function consultaDeHats() {
  return supabase.from("hats_public").select("*");
}

async function idsQueSigo(): Promise<string[]> {
  const eu = getCurrentProfile();
  if (!eu) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", eu.userId);
  if (error) throw new Error("Não foi possível carregar quem você segue.");
  return data.map((linha) => linha.followee_id as string);
}

export async function listarHats(aba: AbaDoFeed = "paraVoce"): Promise<Post[]> {
  let consulta = consultaDeHats();

  if (aba === "anonimos") {
    consulta = consulta.eq("is_anonymous", true);
  } else if (aba === "seguindo") {
    const seguidos = await idsQueSigo();
    if (seguidos.length === 0) return [];
    // Hats anônimos não têm autor na view, então nunca entram nesta aba
    consulta = consulta.in("author_id", seguidos);
  }

  const { data, error } = await consulta
    .order("created_at", { ascending: false })
    .limit(LIMITE_DO_FEED)
    .returns<LinhaHat[]>();
  if (error) throw new Error("Falha ao buscar os hats no servidor.");
  return data.map(paraPost);
}

export async function listarTopHats(limite = 5): Promise<Post[]> {
  const { data, error } = await consultaDeHats()
    .gt("likes_count", 0)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite)
    .returns<LinhaHat[]>();
  if (error) throw new Error("Falha ao buscar o ranking.");
  return data.map(paraPost);
}

/** Hats com nome de uma pessoa. A view não liga hats anônimos ao autor. */
export async function listarHatsDoAutor(autorId: string): Promise<Post[]> {
  const { data, error } = await consultaDeHats()
    .eq("author_id", autorId)
    .order("created_at", { ascending: false })
    .limit(LIMITE_DO_FEED)
    .returns<LinhaHat[]>();
  if (error) throw new Error("Falha ao buscar os hats deste perfil.");
  return data.map(paraPost);
}

export async function buscarHat(id: string): Promise<Post> {
  const { data, error } = await consultaDeHats().eq("id", id).maybeSingle<LinhaHat>();
  if (error) throw new Error("Não foi possível abrir este hat.");
  if (!data) throw new Error("Este hat não foi encontrado ou já se autodestruiu!");
  return paraPost(data);
}

export async function criarHat(conteudo: string, anonimo: boolean): Promise<Post> {
  const { data, error } = await supabase
    .from("hats")
    .insert({ content: conteudo, is_anonymous: anonimo })
    .select("id")
    .single();
  if (error) throw new Error("Não foi possível publicar seu hat.");

  avisarPostsAtualizados();
  return buscarHat(data.id as string);
}

export async function excluirHat(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_hat", { alvo: id });
  if (error) throw new Error("Você não pode excluir este hat.");
  avisarPostsAtualizados();
}

/** Liga ou desliga o Fogo da pessoa e devolve o hat com a contagem do servidor. */
export async function alternarFogo(post: Post): Promise<Post> {
  const eu = getCurrentProfile();
  if (!eu) throw new Error("Entre na sua conta para dar Fogo.");

  const { error } = post.likedByMe
    ? await supabase.from("likes").delete().eq("hat_id", post.id).eq("user_id", eu.userId)
    : await supabase.from("likes").insert({ hat_id: post.id });

  // 23505: o Fogo já existe, por exemplo se foi dado em outra aba
  if (error && error.code !== "23505") throw new Error("Não foi possível dar Fogo agora.");

  avisarPostsAtualizados();
  return buscarHat(post.id);
}

export async function estenderHat(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("extend_hat", { alvo: id });
  if (error) throw new Error("Só o autor pode estender um hat anônimo ativo.");
  return data as string;
}

export async function listarRespostas(hatId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from("replies_public")
    .select("*")
    .eq("hat_id", hatId)
    .order("created_at", { ascending: true })
    .returns<LinhaResposta[]>();
  if (error) throw new Error("Não foi possível carregar as respostas.");
  return data.map(paraResposta);
}

export async function responderHat(hatId: string, conteudo: string, anonimo: boolean): Promise<void> {
  const { error } = await supabase
    .from("replies")
    .insert({ hat_id: hatId, content: conteudo, is_anonymous: anonimo });
  if (error) throw new Error("Não foi possível publicar sua resposta.");
}

export async function excluirResposta(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_reply", { alvo: id });
  if (error) throw new Error("Você não pode excluir esta resposta.");
}
