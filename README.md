# Curious Hat

Rede social de perguntas e segredos, com posts públicos e anônimos que expiram em 24h. Projeto acadêmico para a apresentação de uma matéria da faculdade.

## Tecnologias

- React 19 com TypeScript
- Vite
- Tailwind CSS
- React Router

## Como rodar

Requer Node.js e um projeto no [Supabase](https://supabase.com).

1. No SQL Editor do Supabase, rode os arquivos de `supabase/migrations`, em ordem.
2. Em Authentication, desative a confirmação de e-mail (**Confirm email**).
3. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública do projeto.
4. Instale e inicie o app:

```bash
npm install
npm run dev
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Verifica os tipos e gera a versão de produção |
| `npm run typecheck` | Só verifica os tipos |
| `npm run lint` | Roda o linter |
| `npm run preview` | Serve a versão de produção localmente |

## Estrutura

```text
src/
  components/  Componentes reutilizáveis e layout
  hooks/       Hooks de dados
  lib/         Utilitários
  pages/       Telas
  services/    Acesso à API e à sessão
  types/       Tipos compartilhados
```
