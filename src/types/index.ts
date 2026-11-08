export type AbaDoFeed = "paraVoce" | "seguindo" | "anonimos";

/** Hat como vem da view pública: authorId é nulo nos anônimos. */
export interface Post {
  id: string;
  authorId: string | null;
  isAnonymous: boolean;
  isMine: boolean;
  /** Nome no site ou, nos anônimos, o vulgo. */
  displayName: string;
  authorHandle: string | null;
  authorAvatar: string | null;
  title: string;
  content: string;
  communityName: string | null;
  createdAt: string;
  /** Nulo nos hats com nome, que não expiram. */
  expiresAt: string | null;
  likes: number;
  repliesCount: number;
  likedByMe: boolean;
}

export interface Reply {
  id: string;
  hatId: string;
  authorId: string | null;
  isAnonymous: boolean;
  isMine: boolean;
  displayName: string;
  authorHandle: string | null;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface Comunidade {
  id: string;
  name: string;
  description: string;
  featured: boolean;
  members: number;
}

export interface EstatisticasDoPerfil {
  seguidores: number;
  seguindo: number;
  comunidades: number;
  euSigo: boolean;
}

export interface Preferencias {
  anonimoPorPadrao: boolean;
  aceitarChatsAnonimos: boolean;
  mostrarContagens: boolean;
}

export interface Conversa {
  id: string;
  tipo: "direct" | "anonymous" | "group";
  titulo: string;
  subtitulo: string;
  avatar: string | null;
  /** Nulo em grupos e quando a outra pessoa está anônima. */
  pessoaId: string | null;
  meuMembroId: string;
  outroAnonimo: boolean;
  ultimaMensagem: string | null;
  ultimaEm: string | null;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  membroId: string;
  texto: string;
  criadaEm: string;
}

export interface ParticipanteDoChat {
  membroId: string;
  anonimo: boolean;
  eu: boolean;
  nome: string | null;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  birthDate: string;
  accountName: string;
  publicHandle?: string;
  codename: string;
  bio: string;
  avatarUrl: string;
  bannerImage: string;
  joinedAt: string;
  preferencias: Preferencias;
}

/** Dados que podem aparecer na página pública de um perfil. */
export type PublicProfile = Pick<
  UserProfile,
  "userId" | "accountName" | "publicHandle" | "bio" | "avatarUrl" | "bannerImage" | "joinedAt"
>;
