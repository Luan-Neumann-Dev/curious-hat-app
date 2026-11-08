# Curious Hat

Rede social de perguntas e segredos, com posts públicos e anônimos que expiram em 24h. Projeto acadêmico para a apresentação de uma matéria da faculdade.

## Tecnologias

- React 19 com TypeScript
- Vite
- Tailwind CSS
- React Router

## Como rodar

Requer Node.js.

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
