/** Escreve a quantidade com a palavra no singular ou no plural: "1 hat", "2 hats". */
export function comPlural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}
