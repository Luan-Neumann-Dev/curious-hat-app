const TOPICOS: { titulo: string; texto: string }[] = [
  {
    titulo: "O que é um hat?",
    texto: "É a publicação do Curious Hat: uma pergunta, um segredo ou uma novidade. Você escolhe, em cada hat, se publica com seu nome ou anonimamente.",
  },
  {
    titulo: "Como funciona o anonimato?",
    texto: "Um hat anônimo mostra só o seu vulgo, nunca o seu perfil. Ele some depois de 24 horas, e só você pode ganhar mais 5 minutos com o botão +5 Min de Vida. O vulgo fica fora do seu perfil público.",
  },
  {
    titulo: "O que é um Fogo?",
    texto: "É a curtida do Curious Hat. Cada pessoa dá um Fogo por hat e pode retirá-lo clicando de novo. Os Fogos que você dá aparecem na aba Fogos do seu perfil.",
  },
  {
    titulo: "Como escolho o que vejo?",
    texto: "Na página inicial, a aba Para você mostra todos os hats, Seguindo mostra os hats com nome de quem você segue, e Só anônimos mostra apenas os anônimos.",
  },
  {
    titulo: "Para que servem as comunidades?",
    texto: "Elas reúnem pessoas por assunto. Depois de entrar em uma, você pode publicar hats nela e conversar no chat de grupo. Se sair, deixa de ver esse chat.",
  },
  {
    titulo: "Como funciona o chat?",
    texto: "Abra o perfil de alguém e escolha Mensagem ou Mensagem anônima. Na conversa anônima, a outra pessoa não vê quem você é, e ela pode desativar esse tipo de chat em Config.",
  },
  {
    titulo: "Quem pode apagar um hat?",
    texto: "O autor pode queimar o próprio hat a qualquer momento. O administrador também pode excluir hats e respostas, mas não consegue ver quem escreveu um hat anônimo.",
  },
];

export function Help() {
  return (
    <div>
      <div className="border-b border-fg/40 p-4 bg-app">
        <h1 className="text-xl font-extrabold text-fg">Ajuda</h1>
      </div>
      <div className="p-4 max-w-2xl space-y-5">
        {TOPICOS.map(({ titulo, texto }) => (
          <section key={titulo}>
            <h2 className="font-extrabold text-fg mb-1">{titulo}</h2>
            <p className="text-sm text-fg-soft leading-relaxed">{texto}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
