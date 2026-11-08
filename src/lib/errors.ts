export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}
