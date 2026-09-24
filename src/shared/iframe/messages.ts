/**
 * Contrato de mensagens entre a página embutida e o PJe (Constituição, Princípio III).
 * Este arquivo é a *única* definição do canal. Nada fora de `src/shared/iframe/`
 * fala com `window.parent`.
 */

/** Marca toda mensagem nossa, para o pai poder ignorar o que não é dele. */
export const CHANNEL = 'iframes-internos-pje' as const

export interface ResizeMessage {
  channel: typeof CHANNEL
  type: 'resize'
  /** Slug do site que enviou, para o pai saber qual iframe redimensionar. */
  site: string
  /** Altura do conteúdo em pixels CSS. */
  height: number
}

export interface ReadyMessage {
  channel: typeof CHANNEL
  type: 'ready'
  site: string
}

export type OutgoingMessage = ResizeMessage | ReadyMessage
