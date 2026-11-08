-- Curious Hat: dados da demonstração. Rode no SQL Editor do Supabase.
--
-- Antes, crie pelo app as contas marina@teste.dev, caio@teste.dev e admin@teste.dev.
-- Rode de novo no dia da apresentação: os hats anônimos duram 24 horas.
-- Cada execução APAGA o que essas três contas publicaram e recria tudo do zero.

begin;

do $$
declare
  marina uuid := (select id from auth.users where email = 'marina@teste.dev');
  caio uuid := (select id from auth.users where email = 'caio@teste.dev');
  administrador uuid := (select id from auth.users where email = 'admin@teste.dev');
  familia uuid := (select id from public.communities where name = 'Família');
  amigos uuid := (select id from public.communities where name = 'Amigos');
  trabalho uuid := (select id from public.communities where name = 'Trabalho');
  madrugada uuid := (select id from public.communities where name = 'Madrugada');
  hat_reuniao uuid;
  hat_banco uuid;
  hat_amizade uuid;
  hat_cozinha uuid;
  conversa uuid;
  membro_marina uuid;
  membro_caio uuid;
begin
  if marina is null or caio is null or administrador is null then
    raise exception 'Crie primeiro as contas marina@teste.dev, caio@teste.dev e admin@teste.dev.';
  end if;

  -- Recomeça do zero, sem tocar em outras contas
  delete from public.conversations where id in (
    select conversation_id from public.conversation_members
    where user_id in (marina, caio, administrador)
  );
  delete from public.hats where author_id in (marina, caio, administrador);
  delete from public.replies where author_id in (marina, caio, administrador);
  delete from public.likes where user_id in (marina, caio, administrador);
  delete from public.follows where follower_id in (marina, caio, administrador);
  delete from public.community_members where user_id in (marina, caio, administrador);

  update public.profiles set role = 'admin', blocked = false where id = administrador;
  update public.profiles set blocked = false where id in (marina, caio);

  insert into public.community_members (community_id, user_id) values
    (familia, marina), (amigos, marina), (trabalho, marina),
    (amigos, caio), (trabalho, caio), (madrugada, caio);

  insert into public.follows (follower_id, followee_id) values (marina, caio);

  insert into public.hats (author_id, content, community_id, created_at)
  values (marina, 'Fiz a pergunta errada numa reunião hoje e ela virou a melhor decisão da semana.', trabalho, now() - interval '3 hours')
  returning id into hat_reuniao;

  insert into public.hats (author_id, content, community_id, created_at)
  values (caio, 'Pergunta séria pra quem mora sozinho: vocês comem em pé na cozinha ou eu sou o único?', null, now() - interval '7 hours')
  returning id into hat_cozinha;

  insert into public.hats (author_id, is_anonymous, content, community_id, created_at, expires_at)
  values (marina, true, 'Tenho 34 anos e ainda ligo pra minha mãe quando o banco me manda um e-mail estranho.', familia, now() - interval '5 hours', now() + interval '19 hours')
  returning id into hat_banco;

  insert into public.hats (author_id, is_anonymous, content, created_at, expires_at)
  values (caio, true, 'Sinto falta de uma amizade que acabou por nada. Nenhuma briga, só as mensagens ficando mais curtas.', now() - interval '11 hours', now() + interval '13 hours')
  returning id into hat_amizade;

  insert into public.hats (author_id, is_anonymous, content, community_id, created_at, expires_at)
  values (caio, true, 'Alguém mais finge estar ocupado no trabalho só pra não puxar assunto no corredor?', trabalho, now() - interval '2 hours', now() + interval '22 hours');

  insert into public.replies (hat_id, author_id, content, created_at) values
    (hat_reuniao, caio, 'Agora conta qual foi a pergunta.', now() - interval '2 hours'),
    (hat_cozinha, marina, 'Em pé, olhando pela janela, como quem reflete sobre a vida.', now() - interval '6 hours');

  insert into public.replies (hat_id, author_id, is_anonymous, content, created_at) values
    (hat_banco, caio, true, 'Eu ligo pro meu pai. Ninguém escapa.', now() - interval '4 hours'),
    (hat_amizade, marina, true, 'Às vezes vale mandar a primeira mensagem.', now() - interval '9 hours');

  insert into public.likes (hat_id, user_id) values
    (hat_reuniao, caio),
    (hat_banco, caio),
    (hat_amizade, marina),
    (hat_cozinha, marina),
    (hat_cozinha, administrador);

  -- Chat de grupo da comunidade Amigos
  insert into public.conversations (kind, community_id) values ('group', amigos)
  on conflict (community_id) where kind = 'group' do nothing;
  select id into conversa from public.conversations
  where community_id = amigos and kind = 'group';

  insert into public.conversation_members (conversation_id, user_id) values (conversa, marina)
  on conflict (conversation_id, user_id) do update set left_at = null
  returning id into membro_marina;
  insert into public.conversation_members (conversation_id, user_id) values (conversa, caio)
  on conflict (conversation_id, user_id) do update set left_at = null
  returning id into membro_caio;

  insert into public.messages (conversation_id, member_id, content, created_at) values
    (conversa, membro_caio, 'Quem topa quinta?', now() - interval '50 minutes'),
    (conversa, membro_marina, 'Topo, mas só se não for aquele bar do ano passado.', now() - interval '45 minutes');
end;
$$;

commit;

select
  (select count(*) from public.hats_public) as hats_ativos,
  (select count(*) from public.replies_public) as respostas,
  (select handle from public.profiles where role = 'admin' limit 1) as administrador;
