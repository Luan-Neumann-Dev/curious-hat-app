/** Lê um arquivo de imagem e devolve um JPEG em base64 com a largura indicada. */
export function comprimirImagem(arquivo: File, larguraMax: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const proporcao = larguraMax / img.width;
        canvas.width = larguraMax;
        canvas.height = img.height * (proporcao < 1 ? proporcao : 1);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}
