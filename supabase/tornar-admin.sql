-- Dá o papel de administrador a uma conta. Troque o e-mail e rode no SQL Editor do Supabase.
-- O papel só muda por aqui: o app e a API não permitem que alguém se promova.
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'email-da-conta@exemplo.com');
