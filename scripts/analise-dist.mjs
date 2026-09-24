/**
 * Leitura do `dist/`: funções puras que o portão `verificar-sites.mjs` usa.
 *
 * Estão aqui, separadas do script, para poderem ser testadas sem `dist/` no disco — o
 * script tem efeito e sai com código de erro; estas não têm efeito nenhum.
 */

/** Extensão que conta como JavaScript, com ou sem query string. */
const E_JS = /\.m?js(\?|$)/i

/**
 * Hosts externos citados num texto do `dist/`.
 *
 * Três formas, e as duas últimas foram furos reais do portão:
 *
 *   1. **absoluta** — `https://host/…`, em qualquer contexto. Vale ser ganancioso aqui:
 *      um host absoluto num bundle estático é sempre algo a explicar;
 *   2. **protocolo-relativa entre aspas** — `href="//host/…"`, `url(//host)`, `@import`;
 *   3. **protocolo-relativa sem aspas** — `<link href=//host/x>`. O Vite sempre emite com
 *      aspas, mas HTML escrito à mão (como o `docs/host-de-teste.html`) não.
 *
 * As formas 2 e 3 exigem **posição de referência** e host plausível, e a razão é concreta:
 * `//` também é comentário de JS (`a.href = // por quê`) e aparece dentro de string.
 * Procurar `//` solta enche o portão de falso positivo, e portão que grita à toa é portão
 * que se aprende a ignorar.
 *
 * `permitidos` é a lista de hosts que aparecem sem serem rede (namespace XML, texto de
 * mensagem de erro). Devolve cada host uma vez, na ordem em que apareceram.
 */
export function hostsExternos(conteudo, permitidos = []) {
  const proibidos = new Set()
  const isento = new Set(permitidos.map((h) => h.toLowerCase()))

  /*
   * Dois níveis de exigência sobre o que parece host, e a diferença é deliberada:
   *
   *   QUALQUER   basta para a forma absoluta. `https://` num bundle estático é sempre
   *              algo a explicar, mesmo que o host pareça implausível — não há razão para
   *              o portão julgar TLD.
   *   PLAUSIVEL  exigido nas formas protocolo-relativas: pelo menos um ponto e TLD de duas
   *              letras ou mais. É o que separa referência de comentário de JS.
   */
  const QUALQUER = '([a-z0-9.-]+)'
  const PLAUSIVEL = '(?![.-])((?:[a-z0-9-]+\\.)+[a-z]{2,})'

  const padroes = [
    new RegExp(`https?://${QUALQUER}`, 'gi'),
    new RegExp(`(?:src|href)\\s*=\\s*["']//${PLAUSIVEL}`, 'gi'),
    new RegExp(`(?:src|href)\\s*=\\s*//${PLAUSIVEL}`, 'gi'),
    new RegExp(`url\\(\\s*["']?//${PLAUSIVEL}`, 'gi'),
    new RegExp(`@import\\s+["']//${PLAUSIVEL}`, 'gi'),
  ]

  for (const padrao of padroes) {
    for (const [, host] of conteudo.matchAll(padrao)) {
      const chave = host.toLowerCase()
      if (!isento.has(chave)) proibidos.add(chave)
    }
  }

  return [...proibidos]
}

/**
 * Os arquivos que um HTML de site manda o navegador carregar, já classificados.
 *
 * Devolve `{ caminho, tipo }` com `tipo` em `'js'` ou `'css'`, e não uma lista de strings,
 * porque a classificação foi duplicada em três lugares e mantida à mão — o portão tinha um
 * comentário dizendo "mesmo critério de `referenciasCarregadas`", que é a confissão de que
 * o sincronismo dependia de alguém lembrar. Apontado em revisão.
 *
 * O que entra: script de módulo, folha de estilo e `modulepreload`. Imagem e fonte ficam
 * de fora porque o teto do Princípio VII é de **JS** — que a razão do princípio seja peso
 * de página inteira é verdade, e está anotado nas lacunas do README, mas inventar aqui um
 * teto que a constituição não fixou seria pior.
 *
 * Aceita aspas simples, extensão `.mjs` e query string: o portão media zero — e aprovava —
 * se o Vite mudasse qualquer um desses detalhes. Referência externa é descartada: peso é
 * do que o site serve, e o que vem de fora é assunto de `hostsExternos`.
 */
export function referenciasCarregadas(html) {
  const saida = []
  const padrao = /(?:src|href)\s*=\s*["']([^"']+?\.(?:js|mjs|css)(?:\?[^"']*)?)["']/gi

  for (const [, valor] of html.matchAll(padrao)) {
    if (/^(?:https?:)?\/\//i.test(valor)) continue
    saida.push({ caminho: valor, tipo: E_JS.test(valor) ? 'js' : 'css' })
  }

  return saida
}

/**
 * O que há de errado com a lista de referências de um site, para o portão de peso.
 *
 * Existe separado porque a asserção morava dentro do laço do portão e não era exercitada
 * por teste nenhum — apontado em revisão. Devolve lista de problemas; vazia quer dizer
 * "dá para medir".
 *
 * O caso que importa: se nada casar o padrão, o peso soma zero e o portão **aprova**
 * imprimindo `0.0 KB`. A mensagem separa as duas causas possíveis, porque a conduta é
 * diferente em cada uma.
 */
export function problemasDeReferencia(referencias) {
  if (referencias.length === 0) {
    return [
      'nenhum JS ou CSS referenciado no HTML — o peso não pôde ser medido. ' +
        'Se o site virou HTML puro isto é esperado e a asserção precisa mudar; ' +
        'se não, o formato da referência mudou e o portão parou de medir.',
    ]
  }
  if (!referencias.some((r) => r.tipo === 'js')) {
    return ['nenhum módulo JS referenciado no HTML, mas há CSS — formato inesperado.']
  }
  return []
}
