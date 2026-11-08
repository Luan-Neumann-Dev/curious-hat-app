import type { NewPost, Post } from "../types";
import { getCurrentProfile } from "./session";

const API_URL = "https://6ad69d0bf71f154ac486e9a6.mockapi.io/posts";

function avisarPostsAtualizados(): void {
  window.dispatchEvent(new Event("curiousHat_postsUpdated"));
}

export async function getPosts(): Promise<Post[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Falha ao buscar as fofocas no servidor.");
  const data = (await response.json()) as Post[];
  const agora = Date.now();

  return data
    .filter((post) => Number(post.expiresAt) > agora)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

export async function getPostById(id: string): Promise<Post> {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error("Esta fofoca não foi encontrada ou já se autodestruiu!");
  const post = (await response.json()) as Post;

  if (Number(post.expiresAt) <= Date.now()) {
    throw new Error("Tarde demais! O tempo desta fofoca acabou e ela sumiu.");
  }
  return post;
}

export async function createPost(novoPost: NewPost): Promise<Post> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novoPost),
  });
  if (!response.ok) throw new Error("Não foi possível publicar sua fofoca.");
  const criado = (await response.json()) as Post;
  avisarPostsAtualizados();
  return criado;
}

export async function updatePost(id: string, dadosAtualizados: Post): Promise<Post> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosAtualizados),
  });
  if (!response.ok) throw new Error("Erro ao atualizar as informações.");
  const atualizado = (await response.json()) as Post;
  avisarPostsAtualizados();
  return atualizado;
}

export async function deletePost(id: string): Promise<Post> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Erro ao tentar queimar esta fofoca.");
  const deletado = (await response.json()) as Post;
  avisarPostsAtualizados();
  return deletado;
}

export function getCurrentUserKey(): string {
  const perfil = getCurrentProfile();
  if (!perfil) return "visitante";
  return String(perfil.userId || perfil.email || perfil.accountName || "visitante");
}

function chaveDeCurtidas(userKey: string): string {
  return `curiousHat_likes_${userKey}`;
}

function lerCurtidas(userKey: string): string[] {
  return JSON.parse(localStorage.getItem(chaveDeCurtidas(userKey)) || "[]") as string[];
}

export function hasUserLiked(post: Post): boolean {
  if (!post.id) return false;
  const userKey = getCurrentUserKey();
  const listaNoPost = Array.isArray(post.likedBy) ? post.likedBy.map(String) : [];

  return lerCurtidas(userKey).includes(String(post.id)) || listaNoPost.includes(userKey);
}

function markPostAsLiked(postId: string): void {
  const userKey = getCurrentUserKey();
  const curtidas = lerCurtidas(userKey);
  if (!curtidas.includes(String(postId))) {
    localStorage.setItem(chaveDeCurtidas(userKey), JSON.stringify([...curtidas, String(postId)]));
  }
}

function unmarkPostAsLiked(postId: string): void {
  const userKey = getCurrentUserKey();
  localStorage.setItem(
    chaveDeCurtidas(userKey),
    JSON.stringify(lerCurtidas(userKey).filter((id) => id !== String(postId)))
  );
}

export async function togglePostLike(post: Post): Promise<Post> {
  const jaCurtiu = hasUserLiked(post);
  const userKey = getCurrentUserKey();
  const likesOriginais = Number(post.likes) || 0;
  const listaAtual = Array.isArray(post.likedBy) ? post.likedBy.map(String) : [];

  if (jaCurtiu) {
    unmarkPostAsLiked(post.id);
    return updatePost(post.id, {
      ...post,
      likes: Math.max(0, likesOriginais - 1),
      likedBy: listaAtual.filter((u) => u !== userKey),
    });
  }

  markPostAsLiked(post.id);
  return updatePost(post.id, {
    ...post,
    likes: likesOriginais + 1,
    likedBy: listaAtual.includes(userKey) ? listaAtual : [...listaAtual, userKey],
  });
}
