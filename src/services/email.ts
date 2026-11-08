export async function enviarEmailConfirmacao(emailDestino: string, nomeUsuario: string): Promise<void> {
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(emailDestino)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: "Bem-vindo ao Curious Hat! Confirmação de Conta 🎩",
        Nome: nomeUsuario,
        Mensagem: `Olá, ${nomeUsuario}! Sua conta no Curious Hat foi criada com sucesso.`,
        _template: "table",
      }),
    });
  } catch {
    // Prossegue normalmente
  }
}
