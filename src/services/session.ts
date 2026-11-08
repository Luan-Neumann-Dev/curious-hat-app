import type { User } from "@supabase/supabase-js";
import { avatarPorSemente } from "../lib/avatar";
import { supabase } from "../lib/supabase";
import type { PublicProfile, UserProfile } from "../types";

const BUCKET_IMAGENS = "profile-images";
const COLUNAS_PUBLICAS = "id, account_name, handle, bio, avatar_url, banner_url, joined_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Campos do formulário de perfil. A senha nunca faz parte do perfil. */
export type DadosDoPerfil = Omit<UserProfile, "userId" | "joinedAt" | "publicHandle">;

interface LinhaPerfil {
  id: string;
  account_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  joined_at: string;
}

const MENSAGENS_DE_ERRO: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos. Verifique seus dados ou crie um perfil.",
  user_already_exists: "Este e-mail já tem uma conta. Volte e faça login.",
  email_exists: "Este e-mail já tem uma conta. Volte e faça login.",
  email_address_invalid: "Este endereço de e-mail não é aceito. Tente outro.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  weak_password: "A senha é fraca demais. Use pelo menos 6 caracteres.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_request_rate_limit: "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.",
  over_email_send_rate_limit: "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.",
};

function erroTraduzido(erro: { code?: string; message: string }): Error {
  const mensagem = erro.code ? MENSAGENS_DE_ERRO[erro.code] : undefined;
  return new Error(mensagem ?? "Não foi possível falar com o servidor. Tente novamente.");
}

let perfilAtual: UserProfile | null = null;

/** Perfil da sessão aberta, mantido só em memória. */
export function getCurrentProfile(): UserProfile | null {
  return perfilAtual;
}

/** Apaga as contas da versão antiga, que guardava senhas no navegador. */
function removerContasAntigas(): void {
  localStorage.removeItem("curiousHat_profile");
  localStorage.removeItem("curiousHat_users");
}

function formatarEntrada(data: string): string {
  const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(data)
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function paraPerfilPublico(linha: LinhaPerfil): PublicProfile {
  return {
    userId: linha.id,
    accountName: linha.account_name,
    publicHandle: linha.handle,
    bio: linha.bio,
    avatarUrl: linha.avatar_url || avatarPorSemente(linha.handle),
    bannerImage: linha.banner_url || "",
    joinedAt: formatarEntrada(linha.joined_at),
  };
}

async function carregarPerfil(usuario: User): Promise<UserProfile> {
  const [publico, privado] = await Promise.all([
    supabase.from("profiles").select(COLUNAS_PUBLICAS).eq("id", usuario.id).single<LinhaPerfil>(),
    supabase
      .from("profile_private")
      .select("full_name, birth_date, codename")
      .eq("id", usuario.id)
      .single(),
  ]);
  if (publico.error) throw erroTraduzido(publico.error);
  if (privado.error) throw erroTraduzido(privado.error);

  perfilAtual = {
    ...paraPerfilPublico(publico.data),
    email: usuario.email ?? "",
    fullName: privado.data.full_name,
    birthDate: privado.data.birth_date ?? "",
    codename: privado.data.codename,
  };
  return perfilAtual;
}

/** Restaura a sessão salva pelo Supabase ao abrir o app. */
export async function carregarSessao(): Promise<UserProfile | null> {
  removerContasAntigas();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  try {
    return await carregarPerfil(data.session.user);
  } catch {
    return null;
  }
}

export async function entrar(email: string, senha: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  if (error) throw erroTraduzido(error);
  return carregarPerfil(data.user);
}

export async function sair(): Promise<void> {
  perfilAtual = null;
  await supabase.auth.signOut({ scope: "local" });
}

export function limparPerfilAtual(): void {
  perfilAtual = null;
}

/** Envia uma imagem recém-escolhida ao Storage. URLs que já existem passam direto. */
async function publicarImagem(
  userId: string,
  tipo: "avatar" | "capa",
  imagem: string
): Promise<string> {
  if (!imagem.startsWith("data:")) return imagem;

  const arquivo = await (await fetch(imagem)).blob();
  const caminho = `${userId}/${tipo}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, arquivo, { contentType: "image/jpeg" });
  if (error) throw new Error("Não foi possível enviar a imagem. Tente outro arquivo.");

  return supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}

async function gravarImagens(userId: string, avatarUrl: string, bannerImage: string) {
  const [avatar_url, banner_url] = await Promise.all([
    publicarImagem(userId, "avatar", avatarUrl),
    publicarImagem(userId, "capa", bannerImage),
  ]);
  return { avatar_url, banner_url: banner_url || null };
}

/**
 * Cria a conta. O banco cria o perfil na mesma operação, a partir dos metadados.
 * Devolve um aviso se a conta foi criada, mas as imagens não puderam ser enviadas.
 */
export async function cadastrar(
  dados: DadosDoPerfil,
  handle: string,
  senha: string
): Promise<{ perfil: UserProfile; aviso: string }> {
  const { data, error } = await supabase.auth.signUp({
    email: dados.email,
    password: senha,
    options: {
      data: {
        account_name: dados.accountName,
        handle,
        codename: dados.codename,
        full_name: dados.fullName,
        birth_date: dados.birthDate,
        bio: dados.bio,
      },
    },
  });
  if (error) throw erroTraduzido(error);
  if (!data.user || !data.session) {
    throw new Error("Conta criada, mas ela precisa ser confirmada por e-mail antes do login.");
  }

  let aviso = "Conta criada! Bem-vindo ao Curious Hat.";
  try {
    const imagens = await gravarImagens(data.user.id, dados.avatarUrl, dados.bannerImage);
    const { error: erroImagens } = await supabase
      .from("profiles")
      .update(imagens)
      .eq("id", data.user.id);
    if (erroImagens) throw erroImagens;
  } catch {
    aviso = "Conta criada, mas não foi possível salvar as imagens. Tente de novo em Editar Perfil.";
  }

  return { perfil: await carregarPerfil(data.user), aviso };
}

export async function salvarPerfil(
  userId: string,
  dados: DadosDoPerfil,
  novaSenha: string
): Promise<UserProfile> {
  const imagens = await gravarImagens(userId, dados.avatarUrl, dados.bannerImage);

  const [publico, privado] = await Promise.all([
    supabase
      .from("profiles")
      .update({ account_name: dados.accountName, bio: dados.bio, ...imagens })
      .eq("id", userId),
    supabase
      .from("profile_private")
      .update({
        full_name: dados.fullName,
        birth_date: dados.birthDate,
        codename: dados.codename,
      })
      .eq("id", userId),
  ]);
  if (publico.error) throw erroTraduzido(publico.error);
  if (privado.error) throw erroTraduzido(privado.error);

  if (novaSenha) {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw erroTraduzido(error);
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw erroTraduzido(error);
  return carregarPerfil(data.user);
}

/** Busca um perfil pelo id ou pelo nome no site. */
export async function buscarPerfilPublico(idOuNome: string): Promise<PublicProfile | null> {
  const consulta = supabase.from("profiles").select(COLUNAS_PUBLICAS);
  const { data, error } = await (UUID.test(idOuNome)
    ? consulta.eq("id", idOuNome)
    : consulta.ilike("account_name", idOuNome.replace(/[\\%_]/g, "\\$&"))
  )
    .limit(1)
    .maybeSingle<LinhaPerfil>();

  if (error || !data) return null;
  return paraPerfilPublico(data);
}
