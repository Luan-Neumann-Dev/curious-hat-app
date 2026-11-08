import type { UserProfile } from "../types";

const CHAVE_PERFIL = "curiousHat_profile";
const CHAVE_USUARIOS = "curiousHat_users";

export function getStoredProfile(): UserProfile | null {
  const dados = localStorage.getItem(CHAVE_PERFIL);
  return dados ? (JSON.parse(dados) as UserProfile) : null;
}

export function clearStoredProfile(): void {
  localStorage.removeItem(CHAVE_PERFIL);
}

export function getStoredUsers(): UserProfile[] {
  return JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || "[]") as UserProfile[];
}

export function saveAccount(conta: UserProfile): void {
  const outrosUsuarios = getStoredUsers().filter(
    (u) => u.userId !== conta.userId && u.email.toLowerCase() !== conta.email.toLowerCase()
  );
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify([...outrosUsuarios, conta]));
  localStorage.setItem(CHAVE_PERFIL, JSON.stringify(conta));
}

export function login(email: string, senha: string): UserProfile | null {
  const usuario = getStoredUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === senha
  );
  if (!usuario) return null;
  localStorage.setItem(CHAVE_PERFIL, JSON.stringify(usuario));
  return usuario;
}
