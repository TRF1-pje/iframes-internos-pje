/**
 * Leitura de contexto vindo da URL.
 *
 * O PJe passa contexto por parâmetro de query. Esse dado é **entrada não confiável**
 * (Constituição, Princípio III): valide antes de usar, e nunca o injete como HTML.
 */

const CNJ_PROCESS = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

/**
 * Faixas de ponto de codigo que nao podem aparecer em texto vindo da URL.
 *
 * Escrito como faixa numerica, e nao como classe de regex com escape `uXXXX`, por dois
 * motivos: o escape e ilegivel para quem revisa — ninguem sabe de cabeca o que e `u202E` —
 * e caractere invisivel escrito literal no fonte nao sobrevive a todo editor e a toda
 * camada de transporte. A lista abaixo diz o nome de cada faixa.
 *
 * Tres familias, e cada uma tem um motivo diferente. As duas ultimas foram apontadas em
 * revisao e ficaram meses como teste pendente, com a assercao correta escrita.
 */
const FAIXAS_PROIBIDAS: readonly (readonly [number, number])[] = [
  /* C0: controles classicos. Quebram linha, apagam caractere e sujam log. */
  [0x00, 0x1f],
  /* DEL e C1: a segunda faixa de controles, que o filtro anterior deixava passar.
     Invisiveis na tela, e cada camada que os recebe os trata de um jeito. */
  [0x7f, 0x9f],
  /* ZWSP a RLM: espaco de largura zero e marcas de direcao. O U+200B desaparece da tela
     e sobra no dado — dois valores que parecem iguais deixam de ser. */
  [0x200b, 0x200f],
  /* Embutimento e override bidirecional. **E o grupo que morde de verdade**: U+202E
     (RIGHT-TO-LEFT OVERRIDE) reordena o texto exibido, entao o parametro pode mostrar na
     tela algo diferente do que contem. E a familia do Trojan Source. */
  [0x202a, 0x202e],
  /* Word joiner e invisiveis matematicos. */
  [0x2060, 0x2064],
  /* BOM no meio da string. */
  [0xfeff, 0xfeff],
]

/**
 * O texto contem algum caractere proibido?
 *
 * Percorre por ponto de codigo (`for...of` sobre string itera par surrogate inteiro), e
 * nao por unidade UTF-16: com indice cru, um emoji seria lido como duas metades e a
 * comparacao de faixa nao valeria.
 */
function temProibido(valor: string): boolean {
  for (const caractere of valor) {
    const codigo = caractere.codePointAt(0)
    if (codigo === undefined) continue
    for (const [inicio, fim] of FAIXAS_PROIBIDAS) {
      if (codigo >= inicio && codigo <= fim) return true
    }
  }
  return false
}

function raw(name: string): string | null {
  const value = new URLSearchParams(window.location.search).get(name)
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Texto curto, sem caractere de controle, bidi nem invisivel. `null` se nao servir.
 *
 * Recusa em vez de limpar: valor com caractere proibido devolve `null`, e a pagina mostra
 * o estado vazio, que o Principio III preve e nao e falha. Limpar em silencio entregaria a
 * tela um valor que ninguem pediu, e diferente do que o hospedeiro mandou.
 */
export function textParam(name: string, maxLength = 120): string | null {
  const value = raw(name)
  if (value === null || value.length > maxLength) return null
  return temProibido(value) ? null : value
}

/** Número de processo no padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO). */
export function processNumberParam(name = 'numeroProcesso'): string | null {
  const value = raw(name)
  return value !== null && CNJ_PROCESS.test(value) ? value : null
}

/** Inteiro dentro de uma faixa. Devolve `null` se ausente ou fora dela. */
export function intParam(name: string, min: number, max: number): number | null {
  const value = raw(name)
  if (value === null || !/^-?\d+$/.test(value)) return null
  const parsed = Number(value)
  return parsed >= min && parsed <= max ? parsed : null
}

/** Um valor de uma lista fechada — a forma mais segura de receber contexto. */
export function enumParam<const T extends readonly string[]>(
  name: string,
  allowed: T,
): T[number] | null {
  const value = raw(name)
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : null
}
