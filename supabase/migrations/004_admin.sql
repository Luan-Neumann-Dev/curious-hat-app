-- Curious Hat: totais do painel administrador.
-- Rode uma única vez no SQL Editor do Supabase, depois da migração 003.

begin;

-- O administrador não lê as tabelas de hats e respostas, para não ver autores anônimos.
-- Por isso os totais vêm de uma função, que devolve só números.
create function public.admin_stats()
returns table (
  total_users bigint,
  blocked_users bigint,
  active_hats bigint,
  anonymous_hats bigint,
  total_replies bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Ação restrita a administradores.' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where blocked),
    (select count(*) from public.hats where expires_at is null or expires_at > now()),
    (select count(*) from public.hats where is_anonymous and expires_at > now()),
    (select count(*) from public.replies_public);
end;
$$;

revoke execute on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to authenticated;

commit;
