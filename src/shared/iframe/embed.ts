import { CHANNEL, type OutgoingMessage } from './messages'

/**
 * A página está dentro de um iframe?
 *
 * Toda página deste repositório funciona também fora dele (Constituição, Princípio III):
 * esta função serve para *adaptar* o comportamento, nunca para exigir o embutimento.
 */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  } catch {
    // Acesso negado a `window.top` significa pai de outra origem: está embutido.
    return true
  }
}

/**
 * Origem do pai autorizada a receber nossas mensagens.
 *
 * Sem configuração, usamos `'*'`. O único dado que sai daqui é a altura do conteúdo,
 * que não é sigilosa — mas se a origem do PJe for conhecida no build, restringir é
 * melhor. Defina `VITE_PARENT_ORIGIN` para fechar o alvo.
 */
function targetOrigin(): string {
  const configured = import.meta.env.VITE_PARENT_ORIGIN
  return typeof configured === 'string' && configured.length > 0 ? configured : '*'
}

function post(message: OutgoingMessage): void {
  if (!isEmbedded()) return
  window.parent.postMessage(message, targetOrigin())
}

/**
 * Passa a informar a altura do conteúdo ao pai sempre que ela mudar.
 *
 * Devolve uma função que encerra a observação. Fora de um iframe, não faz nada — e a
 * função devolvida também não.
 */
export function reportHeight(site: string): () => void {
  if (!isEmbedded()) return () => {}

  post({ channel: CHANNEL, type: 'ready', site })

  let lastHeight = -1
  const send = (): void => {
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height)
    if (height === lastHeight) return
    lastHeight = height
    post({ channel: CHANNEL, type: 'resize', site, height })
  }

  const observer = new ResizeObserver(send)
  observer.observe(document.documentElement)
  window.addEventListener('load', send)
  send()

  return () => {
    observer.disconnect()
    window.removeEventListener('load', send)
  }
}
