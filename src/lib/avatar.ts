export function avatarPorSemente(semente: string): string {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(semente)}&backgroundColor=6b21a8`;
}

export const AVATAR_PADRAO = avatarPorSemente("CuriousHat");
