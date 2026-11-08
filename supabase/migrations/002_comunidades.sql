-- Curious Hat: comunidades iniciais e nome da comunidade em cada hat.
-- Rode uma única vez no SQL Editor do Supabase, depois da migração 001.

begin;

insert into public.communities (name, description, featured)
values
  ('Família', 'Perguntas que a gente não faz no almoço de domingo.', true),
  ('Amigos', 'Amizade adulta, logística difícil.', true),
  ('Trabalho', 'O que ninguém escreve no canal oficial.', true),
  ('Madrugada', 'Para quem ainda está acordado às 2 da manhã.', false),
  ('Dinheiro', 'Perguntas sobre grana sem ninguém se gabando.', false)
on conflict (name) do nothing;

-- As colunas antigas ficam na mesma ordem; a nova entra no fim, e as permissões continuam valendo.
create or replace view public.hats_public as
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
  ) as liked_by_me,
  c.name as community_name
from public.hats h
join public.profiles p on p.id = h.author_id
left join public.communities c on c.id = h.community_id
where h.expires_at is null or h.expires_at > now();

commit;
