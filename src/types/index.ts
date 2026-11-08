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
}

/** Dados que podem aparecer na página pública de um perfil. */
export type PublicProfile = Pick<
  UserProfile,
  "userId" | "accountName" | "publicHandle" | "bio" | "avatarUrl" | "bannerImage" | "joinedAt"
>;
