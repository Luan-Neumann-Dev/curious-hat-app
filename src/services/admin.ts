import { supabase } from "../lib/supabase";
import type { EstatisticasDoAdmin, UsuarioDoAdmin } from "../types";
import { COLUNAS_PUBLICAS, paraPerfilPublico } from "./session";
import type { LinhaPerfil } from "./session";
import { filtroContem } from "./social";

const LIMITE = 50;

interface LinhaUsuario extends LinhaPerfil {
  role: "user" | "admin";
  blocked: boolean;
}

export async function carregarEstatisticas(): Promise<EstatisticasDoAdmin> {
  const { data, error } = await supabase.rpc("admin_stats").single<{
    total_users: number;
    blocked_users: number;
    active_hats: number;
    anonymous_hats: number;
    total_replies: number;
  }>();
  if (error) throw new Error("Não foi possível carregar os totais.");

  return {
    usuarios: data.total_users,
    bloqueados: data.blocked_users,
    hats: data.active_hats,
    hatsAnonimos: data.anonymous_hats,
    respostas: data.total_replies,
  };
}

export async function listarUsuarios(termo: string): Promise<UsuarioDoAdmin[]> {
  let consulta = supabase.from("profiles").select(`${COLUNAS_PUBLICAS}, role, blocked`);

  if (termo) {
    const contem = filtroContem(termo);
    consulta = consulta.or(`account_name.ilike.${contem},handle.ilike.${contem}`);
  }

  const { data, error } = await consulta
    .order("joined_at", { ascending: false })
    .limit(LIMITE)
    .returns<LinhaUsuario[]>();
  if (error) throw new Error("Não foi possível carregar os usuários.");

  return data.map((linha) => ({
    ...paraPerfilPublico(linha),
    admin: linha.role === "admin",
    bloqueado: linha.blocked,
  }));
}

export async function definirBloqueio(id: string, bloquear: boolean): Promise<void> {
  const { error } = await supabase.rpc("admin_set_blocked", { alvo: id, bloquear });
  if (error) throw new Error(error.code === "42501" ? error.message : "Não foi possível alterar o bloqueio.");
}
