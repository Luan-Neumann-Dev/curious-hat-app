import { supabase } from "../lib/supabase";
import type { Conversa, Mensagem, ParticipanteDoChat } from "../types";

interface LinhaConversa {
  id: string;
  kind: Conversa["tipo"];
  my_member_id: string;
  i_am_anonymous: boolean;
  title: string | null;
  peer_avatar: string | null;
  peer_id: string | null;
  member_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

interface LinhaMensagem {
  id: string;
  conversation_id: string;
  member_id: string;
  content: string;
  created_at: string;
}

interface LinhaParticipante {
  member_id: string;
  is_anonymous: boolean;
  is_mine: boolean;
  display_name: string | null;
}

/** Número curto e estável para diferenciar conversas anônimas: "Anônimo #4821". */
function apelidoAnonimo(idDaConversa: string): string {
  const numero = parseInt(idDaConversa.replace(/-/g, "").slice(-8), 16) % 9000;
  return `Anônimo #${numero + 1000}`;
}

function subtituloDe(linha: LinhaConversa): string {
  if (linha.kind === "group") {
    return linha.member_count === 1 ? "1 pessoa" : `${linha.member_count} pessoas`;
  }
  if (linha.kind === "direct") return "Conversa direta";
  return linha.i_am_anonymous
    ? "Você está anônimo · essa pessoa não sabe quem é"
    : "Conversa anônima · ninguém vê quem é";
}

function paraConversa(linha: LinhaConversa): Conversa {
  return {
    id: linha.id,
    tipo: linha.kind,
    titulo: linha.title ?? apelidoAnonimo(linha.id),
    subtitulo: subtituloDe(linha),
    avatar: linha.peer_avatar,
    pessoaId: linha.peer_id,
    meuMembroId: linha.my_member_id,
    outroAnonimo: linha.kind === "anonymous" && !linha.i_am_anonymous,
    ultimaMensagem: linha.last_message,
    ultimaEm: linha.last_message_at,
  };
}

function paraMensagem(linha: LinhaMensagem): Mensagem {
  return {
    id: linha.id,
    conversaId: linha.conversation_id,
    membroId: linha.member_id,
    texto: linha.content,
    criadaEm: linha.created_at,
  };
}

/** Lista as conversas, das mais recentes para as mais antigas. Também atualiza os chats de grupo. */
export async function listarConversas(): Promise<Conversa[]> {
  const sincronizacao = await supabase.rpc("sync_community_chats");
  if (sincronizacao.error) throw new Error("Não foi possível carregar suas conversas.");

  const { data, error } = await supabase
    .from("conversations_overview")
    .select("*")
    .returns<LinhaConversa[]>();
  if (error) throw new Error("Não foi possível carregar suas conversas.");

  return data
    .map(paraConversa)
    .sort((a, b) => (b.ultimaEm ?? "").localeCompare(a.ultimaEm ?? "") || a.titulo.localeCompare(b.titulo, "pt-BR"));
}

export async function listarMensagens(conversaId: string): Promise<Mensagem[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, member_id, content, created_at")
    .eq("conversation_id", conversaId)
    .order("created_at", { ascending: true })
    .limit(200)
    .returns<LinhaMensagem[]>();
  if (error) throw new Error("Não foi possível carregar as mensagens.");
  return data.map(paraMensagem);
}

export async function listarParticipantes(conversaId: string): Promise<ParticipanteDoChat[]> {
  const { data, error } = await supabase
    .from("conversation_members_public")
    .select("member_id, is_anonymous, is_mine, display_name")
    .eq("conversation_id", conversaId)
    .returns<LinhaParticipante[]>();
  if (error) throw new Error("Não foi possível carregar os participantes.");
  return data.map((linha) => ({
    membroId: linha.member_id,
    anonimo: linha.is_anonymous,
    eu: linha.is_mine,
    nome: linha.display_name,
  }));
}

export async function enviarMensagem(
  conversaId: string,
  membroId: string,
  texto: string
): Promise<Mensagem> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversaId, member_id: membroId, content: texto })
    .select("id, conversation_id, member_id, content, created_at")
    .single<LinhaMensagem>();
  if (error) throw new Error("Não foi possível enviar a mensagem.");
  return paraMensagem(data);
}

export async function iniciarConversa(pessoaId: string, anonima: boolean): Promise<string> {
  const { data, error } = await supabase.rpc(
    anonima ? "start_anonymous_chat" : "start_direct_chat",
    { alvo: pessoaId }
  );
  if (error) {
    throw new Error(
      error.code === "42501" ? error.message : "Não foi possível iniciar a conversa."
    );
  }
  return data as string;
}

/** Avisa sobre cada mensagem nova que a pessoa pode ler. Devolve a função que cancela o aviso. */
export function assinarMensagens(aoReceber: (mensagem: Mensagem) => void): () => void {
  const canal = supabase
    .channel("mensagens")
    .on<LinhaMensagem>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (evento) => aoReceber(paraMensagem(evento.new))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
