-- Curious Hat: tabelas, regras de acesso, views públicas e Storage.
-- Rode uma única vez no SQL Editor do Supabase. A transação desfaz tudo em caso de erro.
--
-- Regras centrais:
--   * O vulgo fica em profile_private. Em profiles, de leitura pública, ele permitiria
--     ligar um hat anônimo ao perfil de quem o escreveu.
--   * hats e replies só são lidos pelo próprio autor. Os demais leem hats_public e
--     replies_public, que ocultam o autor dos anônimos e rodam com os direitos do dono.
--   * Mensagens apontam para o participante da conversa, não para a pessoa, para que
--     o tempo real não revele quem está em uma conversa anônima.

begin;

-- ---------------------------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_name text not null check (char_length(trim(account_name)) between 3 and 60),
  handle text not null unique check (handle ~ '^[a-z0-9_]{1,40}$'),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text check (char_length(avatar_url) <= 2048),
  banner_url text check (char_length(banner_url) <= 2048),
  role text not null default 'user' check (role in ('user', 'admin')),
  blocked boolean not null default false,
  joined_at timestamptz not null default now()
);

create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  birth_date date,
  codename text not null check (char_length(codename) between 3 and 40),
  anon_by_default boolean not null default false,
  accept_anon_chats boolean not null default true,
  show_counts boolean not null default true
);

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- ---------------------------------------------------------------------------
-- Comunidades
-- ---------------------------------------------------------------------------

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 60),
  description text not null default '' check (char_length(description) <= 300),
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

-- ---------------------------------------------------------------------------
-- Hats, respostas e curtidas
-- ---------------------------------------------------------------------------

create table public.hats (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  codename text,
  title text not null default '' check (char_length(title) <= 200),
  category text not null default '' check (char_length(category) <= 60),
  spiciness text not null default '' check (char_length(spiciness) <= 60),
  content text not null check (char_length(trim(content)) between 1 and 5000),
  community_id uuid references public.communities (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index hats_created_at_idx on public.hats (created_at desc);
create index hats_author_idx on public.hats (author_id);
create index hats_community_idx on public.hats (community_id);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  hat_id uuid not null references public.hats (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  codename text,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index replies_hat_idx on public.replies (hat_id, created_at);
create index replies_author_idx on public.replies (author_id);

create table public.likes (
  hat_id uuid not null references public.hats (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hat_id, user_id)
);
create index likes_user_idx on public.likes (user_id);

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'anonymous', 'group')),
  community_id uuid references public.communities (id) on delete cascade,
  title text check (char_length(title) <= 80),
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id),
  unique (id, conversation_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  member_id uuid not null,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (member_id, conversation_id)
    references public.conversation_members (id, conversation_id) on delete cascade
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Funções de apoio às regras de acesso
-- ---------------------------------------------------------------------------

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and not blocked
  );
$$;

create function public.hat_is_live(alvo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.hats
    where id = alvo and (expires_at is null or expires_at > now())
  );
$$;

create function public.is_conversation_member(alvo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = alvo and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Cadastro: cria o perfil junto com a conta
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nome text := coalesce(nullif(trim(meta ->> 'account_name'), ''), 'Usuário do Hat');
  base text := left(lower(regexp_replace(coalesce(meta ->> 'handle', nome), '[^a-zA-Z0-9_]', '', 'g')), 30);
  candidato text;
  sufixo integer := 1;
begin
  if base = '' then
    base := 'usuario';
  end if;

  candidato := base;
  while exists (select 1 from public.profiles where handle = candidato) loop
    sufixo := sufixo + 1;
    candidato := base || sufixo::text;
  end loop;

  insert into public.profiles (id, account_name, handle, bio, avatar_url)
  values (
    new.id,
    nome,
    candidato,
    coalesce(meta ->> 'bio', ''),
    meta ->> 'avatar_url'
  );

  insert into public.profile_private (id, full_name, birth_date, codename)
  values (
    new.id,
    coalesce(meta ->> 'full_name', ''),
    nullif(meta ->> 'birth_date', '')::date,
    coalesce(nullif(trim(meta ->> 'codename'), ''), 'Anonimo' || left(md5(new.id::text), 6))
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Hats e respostas: preenche o vulgo e a expiração no servidor
-- ---------------------------------------------------------------------------

create function public.preparar_hat() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_anonymous then
    new.codename := (select codename from public.profile_private where id = new.author_id);
    new.expires_at := coalesce(new.expires_at, now() + interval '24 hours');
  else
    new.codename := null;
    new.expires_at := null;
  end if;
  return new;
end;
$$;

create trigger preparar_hat before insert on public.hats
  for each row execute function public.preparar_hat();

create function public.preparar_resposta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_anonymous then
    new.codename := (select codename from public.profile_private where id = new.author_id);
  else
    new.codename := null;
  end if;
  return new;
end;
$$;

create trigger preparar_resposta before insert on public.replies
  for each row execute function public.preparar_resposta();

-- ---------------------------------------------------------------------------
-- Ações que precisam de uma regra própria
-- ---------------------------------------------------------------------------

-- O administrador exclui hats sem poder lê-los na tabela, então a exclusão é uma função.
create function public.delete_hat(alvo uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.hats
  where id = alvo and (author_id = auth.uid() or public.is_admin());
  if not found then
    raise exception 'Você não pode excluir este hat.' using errcode = '42501';
  end if;
end;
$$;

create function public.delete_reply(alvo uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.replies
  where id = alvo and (author_id = auth.uid() or public.is_admin());
  if not found then
    raise exception 'Você não pode excluir esta resposta.' using errcode = '42501';
  end if;
end;
$$;

create function public.extend_hat(alvo uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  nova_expiracao timestamptz;
begin
  update public.hats
  set expires_at = expires_at + interval '5 minutes'
  where id = alvo
    and author_id = auth.uid()
    and is_anonymous
    and expires_at > now()
  returning expires_at into nova_expiracao;

  if nova_expiracao is null then
    raise exception 'Só o autor pode estender um hat anônimo ativo.' using errcode = '42501';
  end if;
  return nova_expiracao;
end;
$$;

create function public.admin_set_blocked(alvo uuid, bloquear boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Ação restrita a administradores.' using errcode = '42501';
  end if;
  if alvo = auth.uid() then
    raise exception 'Você não pode bloquear a própria conta.' using errcode = '42501';
  end if;
  update public.profiles set blocked = bloquear where id = alvo;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views públicas
-- ---------------------------------------------------------------------------

create view public.hats_public as
select
  h.id,
  case when h.is_anonymous then null else h.author_id end as author_id,
  h.is_anonymous,
  h.author_id = auth.uid() as is_mine,
  case when h.is_anonymous then h.codename else p.account_name end as display_name,
  case when h.is_anonymous then null else p.handle end as author_handle,
  case when h.is_anonymous then null else p.avatar_url end as author_avatar,
  h.title,
  h.category,
  h.spiciness,
  h.content,
  h.community_id,
  h.created_at,
  h.expires_at,
  (select count(*) from public.likes l where l.hat_id = h.id)::integer as likes_count,
  (select count(*) from public.replies r where r.hat_id = h.id)::integer as replies_count,
  exists (
    select 1 from public.likes l where l.hat_id = h.id and l.user_id = auth.uid()
  ) as liked_by_me
from public.hats h
join public.profiles p on p.id = h.author_id
where h.expires_at is null or h.expires_at > now();

create view public.replies_public as
select
  r.id,
  r.hat_id,
  case when r.is_anonymous then null else r.author_id end as author_id,
  r.is_anonymous,
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then r.codename else p.account_name end as display_name,
  case when r.is_anonymous then null else p.handle end as author_handle,
  case when r.is_anonymous then null else p.avatar_url end as author_avatar,
  r.content,
  r.created_at
from public.replies r
join public.profiles p on p.id = r.author_id
join public.hats h on h.id = r.hat_id
where h.expires_at is null or h.expires_at > now();

create view public.conversation_members_public as
select
  m.id as member_id,
  m.conversation_id,
  case when m.is_anonymous and m.user_id <> auth.uid() then null else m.user_id end as user_id,
  m.is_anonymous,
  m.user_id = auth.uid() as is_mine,
  case when m.is_anonymous and m.user_id <> auth.uid() then null else p.account_name end as display_name,
  case when m.is_anonymous and m.user_id <> auth.uid() then null else p.avatar_url end as avatar_url
from public.conversation_members m
join public.profiles p on p.id = m.user_id
where public.is_conversation_member(m.conversation_id);

-- ---------------------------------------------------------------------------
-- Regras de acesso (RLS)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.follows enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.hats enable row level security;
alter table public.replies enable row level security;
alter table public.likes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "perfis visíveis para quem está logado" on public.profiles
  for select to authenticated using (true);
create policy "dono edita o próprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "dono lê os dados privados" on public.profile_private
  for select to authenticated using (id = auth.uid());
create policy "dono edita os dados privados" on public.profile_private
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "seguidores visíveis" on public.follows
  for select to authenticated using (true);
create policy "pessoa segue por si mesma" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "pessoa deixa de seguir por si mesma" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

create policy "comunidades visíveis" on public.communities
  for select to authenticated using (true);

create policy "membros visíveis" on public.community_members
  for select to authenticated using (true);
create policy "pessoa entra por si mesma" on public.community_members
  for insert to authenticated with check (user_id = auth.uid());
create policy "pessoa sai por si mesma" on public.community_members
  for delete to authenticated using (user_id = auth.uid());

create policy "autor lê os próprios hats" on public.hats
  for select to authenticated using (author_id = auth.uid());
create policy "usuário ativo publica hats" on public.hats
  for insert to authenticated with check (
    author_id = auth.uid()
    and public.is_active_user()
    and (
      community_id is null
      or exists (
        select 1 from public.community_members cm
        where cm.community_id = hats.community_id and cm.user_id = auth.uid()
      )
    )
  );

create policy "autor lê as próprias respostas" on public.replies
  for select to authenticated using (author_id = auth.uid());
create policy "usuário ativo responde hats ativos" on public.replies
  for insert to authenticated with check (
    author_id = auth.uid() and public.is_active_user() and public.hat_is_live(hat_id)
  );

create policy "curtidas visíveis" on public.likes
  for select to authenticated using (true);
create policy "pessoa curte por si mesma" on public.likes
  for insert to authenticated with check (user_id = auth.uid() and public.hat_is_live(hat_id));
create policy "pessoa remove a própria curtida" on public.likes
  for delete to authenticated using (user_id = auth.uid());

create policy "participantes veem a conversa" on public.conversations
  for select to authenticated using (public.is_conversation_member(id));

create policy "pessoa vê a própria participação" on public.conversation_members
  for select to authenticated using (user_id = auth.uid());

create policy "participantes leem mensagens" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "participantes enviam como si mesmos" on public.messages
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.conversation_members m
      where m.id = member_id
        and m.conversation_id = messages.conversation_id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Permissões: o Supabase concede tudo por padrão, então começamos do zero
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on
  public.profiles,
  public.profile_private,
  public.follows,
  public.communities,
  public.community_members,
  public.hats,
  public.replies,
  public.likes,
  public.conversations,
  public.conversation_members,
  public.messages,
  public.hats_public,
  public.replies_public,
  public.conversation_members_public
to authenticated;

grant update (account_name, bio, avatar_url, banner_url) on public.profiles to authenticated;
grant update (full_name, birth_date, codename, anon_by_default, accept_anon_chats, show_counts)
  on public.profile_private to authenticated;

grant insert (followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

grant insert (community_id) on public.community_members to authenticated;
grant delete on public.community_members to authenticated;

grant insert (is_anonymous, title, category, spiciness, content, community_id)
  on public.hats to authenticated;
grant insert (hat_id, is_anonymous, content) on public.replies to authenticated;

grant insert (hat_id) on public.likes to authenticated;
grant delete on public.likes to authenticated;

grant insert (conversation_id, member_id, content) on public.messages to authenticated;

grant execute on function
  public.is_admin(),
  public.is_active_user(),
  public.hat_is_live(uuid),
  public.is_conversation_member(uuid),
  public.delete_hat(uuid),
  public.delete_reply(uuid),
  public.extend_hat(uuid),
  public.admin_set_blocked(uuid, boolean)
to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: fotos e capas
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "pessoa envia para a própria pasta" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "pessoa lista a própria pasta" on storage.objects
  for select to authenticated using (
    bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "pessoa apaga da própria pasta" on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
