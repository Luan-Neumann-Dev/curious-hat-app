-- Curious Hat: início de conversas, chats de comunidade, lista de conversas e tempo real.
-- Rode uma única vez no SQL Editor do Supabase, depois da migração 002.

begin;

-- Quem sai de uma comunidade deixa o chat dela, mas as mensagens antigas continuam.
alter table public.conversation_members add column left_at timestamptz;

create unique index conversations_group_unique
  on public.conversations (community_id) where kind = 'group';

create or replace function public.is_conversation_member(alvo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = alvo and user_id = auth.uid() and left_at is null
  );
$$;

drop policy "participantes enviam como si mesmos" on public.messages;
create policy "participantes enviam como si mesmos" on public.messages
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.conversation_members m
      where m.id = member_id
        and m.conversation_id = messages.conversation_id
        and m.user_id = auth.uid()
        and m.left_at is null
    )
  );

create function public.sair_do_chat_da_comunidade() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversation_members m
  set left_at = now()
  from public.conversations c
  where c.id = m.conversation_id
    and c.community_id = old.community_id
    and c.kind = 'group'
    and m.user_id = old.user_id;
  return old;
end;
$$;

create trigger sair_do_chat_da_comunidade after delete on public.community_members
  for each row execute function public.sair_do_chat_da_comunidade();

create function public.validar_inicio_de_chat(alvo uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_active_user() then
    raise exception 'Sua conta não pode iniciar conversas.' using errcode = '42501';
  end if;
  if alvo = auth.uid() then
    raise exception 'Você não pode conversar com você mesmo.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = alvo and not blocked) then
    raise exception 'Esta pessoa não está disponível.' using errcode = '42501';
  end if;
end;
$$;

create function public.start_direct_chat(alvo uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  conversa uuid;
begin
  perform public.validar_inicio_de_chat(alvo);

  select c.id into conversa
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = auth.uid()
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = alvo
  where c.kind = 'direct'
  limit 1;

  if conversa is null then
    insert into public.conversations (kind) values ('direct') returning id into conversa;
    insert into public.conversation_members (conversation_id, user_id)
    values (conversa, auth.uid()), (conversa, alvo);
  end if;
  return conversa;
end;
$$;

create function public.start_anonymous_chat(alvo uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  conversa uuid;
begin
  perform public.validar_inicio_de_chat(alvo);

  if not (select accept_anon_chats from public.profile_private where id = alvo) then
    raise exception 'Esta pessoa não aceita chats anônimos.' using errcode = '42501';
  end if;

  select c.id into conversa
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id and a.user_id = auth.uid() and a.is_anonymous
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = alvo
  where c.kind = 'anonymous'
  limit 1;

  if conversa is null then
    insert into public.conversations (kind) values ('anonymous') returning id into conversa;
    insert into public.conversation_members (conversation_id, user_id, is_anonymous)
    values (conversa, auth.uid(), true), (conversa, alvo, false);
  end if;
  return conversa;
end;
$$;

-- Garante um chat de grupo para cada comunidade da pessoa e a coloca nele.
create function public.sync_community_chats() returns void
language plpgsql security definer set search_path = '' as $$
declare
  comunidade uuid;
  conversa uuid;
begin
  for comunidade in
    select community_id from public.community_members where user_id = auth.uid()
  loop
    insert into public.conversations (kind, community_id)
    values ('group', comunidade)
    on conflict (community_id) where kind = 'group' do nothing;

    select id into conversa from public.conversations
    where community_id = comunidade and kind = 'group';

    insert into public.conversation_members (conversation_id, user_id)
    values (conversa, auth.uid())
    on conflict (conversation_id, user_id) do update set left_at = null;
  end loop;
end;
$$;

create view public.conversations_overview as
select
  c.id,
  c.kind,
  c.community_id,
  eu.id as my_member_id,
  eu.is_anonymous as i_am_anonymous,
  case
    when c.kind = 'group' then coalesce(com.name, c.title)
    when par.is_anonymous then null
    else pessoa.account_name
  end as title,
  case when par.is_anonymous then null else pessoa.avatar_url end as peer_avatar,
  case when par.is_anonymous then null else par.user_id end as peer_id,
  (
    select count(*) from public.conversation_members m
    where m.conversation_id = c.id and m.left_at is null
  )::integer as member_count,
  ultima.content as last_message,
  ultima.created_at as last_message_at
from public.conversations c
join public.conversation_members eu
  on eu.conversation_id = c.id and eu.user_id = auth.uid() and eu.left_at is null
left join public.communities com on com.id = c.community_id
left join lateral (
  select m.is_anonymous, m.user_id
  from public.conversation_members m
  where m.conversation_id = c.id and m.user_id <> auth.uid() and c.kind <> 'group'
  limit 1
) par on true
left join public.profiles pessoa on pessoa.id = par.user_id
left join lateral (
  select msg.content, msg.created_at
  from public.messages msg
  where msg.conversation_id = c.id
  order by msg.created_at desc
  limit 1
) ultima on true;

revoke all on public.conversations_overview from anon, authenticated;
grant select on public.conversations_overview to authenticated;

revoke execute on function
  public.sair_do_chat_da_comunidade(),
  public.validar_inicio_de_chat(uuid),
  public.start_direct_chat(uuid),
  public.start_anonymous_chat(uuid),
  public.sync_community_chats()
from public, anon, authenticated;

grant execute on function
  public.validar_inicio_de_chat(uuid),
  public.start_direct_chat(uuid),
  public.start_anonymous_chat(uuid),
  public.sync_community_chats()
to authenticated;

-- A tabela messages não guarda quem é a pessoa, só o participante, então o tempo real não revela anônimos.
alter publication supabase_realtime add table public.messages;

commit;
