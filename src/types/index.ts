export interface Reply {
  id: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  codename: string;
  title: string;
  category: string;
  spiciness: string;
  content: string;
  likes: number;
  createdAt: number;
  expiresAt: number;
  replies: Reply[];
  /** Ausente em posts antigos, criados antes do modo anônimo. */
  isAnonymous?: boolean;
  likedBy?: string[];
  authorId?: string | null;
  authorAvatar?: string | null;
  authorBanner?: string | null;
  authorBio?: string | null;
  authorHandle?: string | null;
  authorJoinedAt?: string | null;
}

export type NewPost = Omit<Post, "id">;

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  birthDate: string;
  accountName: string;
  publicHandle?: string;
  codename: string;
  password: string;
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
