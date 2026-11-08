-- Apaga as duas contas usadas nos testes do desenvolvimento e tudo o que elas criaram.
-- Hats, respostas, curtidas e mensagens somem junto. Isso não pode ser desfeito.
-- As imagens de teste já foram removidas do Storage antes desta limpeza.
delete from auth.users
where email in ('teste1@teste.dev', 'teste2@teste.dev')
returning email;
