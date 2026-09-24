/** Um par rótulo/valor exibido por `PjeDefinitionList`. */
export interface Item {
  rotulo: string
  valor: string
  /** Valor em fonte monoespaçada — para número de processo, CPF, protocolo. */
  mono?: boolean
  /** O valor não veio. Exibe o texto esmaecido, sem fingir que é dado. */
  ausente?: boolean
}
