#!/usr/bin/env node
/**
 * A página monta? Este é o portão que faltava, e era o de maior risco por menor custo:
 * renomear `#app` no `index.html`, um erro em `main.ts` ou um `mount` em seletor
 * inexistente produzem **página branca em produção com todos os outros portões verdes**.
 *
 * Como funciona, e por que assim:
 *
 *   - roda sobre o `dist/`, não sobre o código-fonte. O que vai ao ar é o bundle, e é ele
 *     que precisa montar. Testar o fonte deixaria passar defeito de empacotamento;
 *   - monta o DOM com jsdom e **importa o bundle de verdade**. O JS do Vite é ESM e a CSS
 *     sai em arquivo separado, então o Node importa o módulo direto do disco sem
 *     empacotador nenhum no meio;
 *   - afirma três coisas: o `#app` deixou de estar vazio, o conteúdo tem texto de verdade,
 *     e nada foi para `console.error`.
 *
 * Exige `npm run build` antes — e diz isso em vez de passar em branco, porque portão que
 * aprova quando não tem o que medir é pior que portão nenhum.
 *
 * **O nome não termina em `.test.mjs` de propósito**, e isso não é estilo: `npm run testar`
 * varre `scripts/*.test.mjs`, e esse comando roda na esteira antes
 * do `build`. Enquanto este arquivo casava o glob, o job reprovava com "dist/ não existe" —
 * o portão estava certo e o lugar errado. São duas famílias de portão e elas não se
 * misturam: `testar` é lógica pura e roda a qualquer momento; este mede o que foi
 * empacotado e só existe depois do build, então mora dentro dele.
 *
 * jsdom é a única dependência de desenvolvimento fora da pilha do Vite. Ela resolve o que
 * não tinha outro jeito de resolver sem navegador; sem ela, a alternativa era conferir à
 * mão, que é justamente o que não se quer.
 */
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { JSDOM } from 'jsdom'

const raiz = new URL('../', import.meta.url)
const dist = new URL('dist/', raiz)
const sites = new URL('sites/', raiz)

/** Sites declarados: pasta em `sites/` com `index.html`. Mesmo critério do Vite. */
const declarados = existsSync(sites)
  ? readdirSync(sites, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(new URL(`${e.name}/index.html`, sites)))
      .map((e) => e.name)
      .sort()
  : []

/** O que estava no globalThis antes de jsdom entrar, para devolver depois. */
const originais = new Map()

const GLOBAIS = [
  'window',
  'document',
  'navigator',
  'location',
  'HTMLElement',
  'SVGElement',
  'Element',
  'Node',
  'CustomEvent',
  'Event',
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]

before(() => {
  for (const nome of GLOBAIS) originais.set(nome, globalThis[nome])
})

after(() => {
  for (const [nome, valor] of originais) {
    try {
      if (valor === undefined) delete globalThis[nome]
      else Object.defineProperty(globalThis, nome, { value: valor, writable: true, configurable: true })
    } catch {
      /* Só-getter do Node: nunca foi substituído, então não há o que restaurar.
         (O comentário não pode começar com a palavra `global`: o ESLint a lê como
         diretiva de configuração de globais, e reprova o arquivo.) */
    }
  }
})

/**
 * Instala um DOM a partir do HTML publicado e devolve o que o teste precisa conferir.
 *
 * `ResizeObserver` não existe em jsdom, e `reportHeight` o usa. O dublê abaixo registra a
 * chamada sem observar nada: aqui interessa que a página monte, não que a altura seja
 * medida — isso é assunto do contrato de iframe.
 */
function instalarDom(html, base) {
  /* `<link>` e `<script>` saem do HTML antes de o DOM existir. O jsdom agenda busca HTTP
     para eles e ela falha **depois** do teste terminar — vazamento que o executor reporta
     como falha do arquivo, não do caso, e que não diz nada sobre a página.
     
     Não se perde nada: o módulo de entrada é importado logo abaixo, à mão e do disco, que
     é justamente o que este portão quer exercitar; e aparência é assunto do
     `npm run contraste`, que mede token, não pixel. */
  const inerte = html
    .replace(/<link\s[^>]*>/gi, '')
    .replace(/<script\s[^>]*>[\s\S]*?<\/script>/gi, '')
  const dom = new JSDOM(inerte, { url: base, pretendToBeVisual: true })
  const { window } = dom

  /*
   * O jsdom diz não suportar `modulepreload`, e por isso o **polyfill do Vite** entra em
   * ação e busca por rede cada `link[rel=modulepreload]`. Isso não é defeito da página:
   * em Chromium e Edge — o parque do Tribunal — `relList.supports('modulepreload')` é
   * verdadeiro e o polyfill sai na primeira linha.
   *
   * Fazer o dublê responder como o navegador de verdade é mais fiel do que tolerar a
   * busca: assim o espião de rede logo abaixo continua valendo para busca **real**, que é
   * o que interessa afirmar. Descobri isto porque o espião trouxe a pilha apontando para
   * o chunk compartilhado; antes era só um `unhandledRejection` anônimo.
   */
  const supportsOriginal = window.DOMTokenList.prototype.supports
  window.DOMTokenList.prototype.supports = function supports(token) {
    if (token === 'modulepreload' || token === 'preload') return true
    try {
      return supportsOriginal.call(this, token)
    } catch {
      return false
    }
  }

  /* `defineProperty` e não atribuição simples: no Node 24 alguns globais são só-getter
     (`navigator` é um), e atribuir a eles lança `TypeError`. Quando não dá para substituir,
     o global do Node serve — é o caso do `navigator`, que já traz `userAgent`. */
  for (const nome of GLOBAIS) {
    if (window[nome] === undefined) continue
    try {
      Object.defineProperty(globalThis, nome, {
        value: window[nome],
        writable: true,
        configurable: true,
      })
    } catch {
      /* Só-getter: fica o do Node, que serve. */
    }
  }

  let observados = 0
  class ResizeObserverDuble {
    observe() {
      observados += 1
    }
    disconnect() {}
    unobserve() {}
  }
  window.ResizeObserver = ResizeObserverDuble
  globalThis.ResizeObserver = ResizeObserverDuble

  const erros = []
  window.console.error = (...args) => erros.push(args.join(' '))
  const consoleOriginal = console.error
  console.error = (...args) => erros.push(args.join(' '))

  /* Espião de rede. Montar uma página deste repositório não deve buscar nada: o build é
     estático e o Princípio II proíbe dependência de rede para a página existir. Sem este
     espião, uma busca disparada na montagem virava só um `unhandledRejection` solto
     depois do fim do teste — ruído que não dizia o que tinha sido buscado. */
  const buscas = []
  const fetchOriginal = globalThis.fetch
  globalThis.fetch = (...args) => {
    buscas.push(String(args[0]))
    return Promise.reject(new Error('rede bloqueada no portão de montagem'))
  }

  return {
    window,
    erros,
    buscas,
    observados: () => observados,
    restaurar: () => {
      console.error = consoleOriginal
      globalThis.fetch = fetchOriginal
      dom.window.close()
    },
  }
}

test('há dist/ para medir', () => {
  assert.ok(
    existsSync(dist),
    'dist/ não existe. Rode `npm run build` antes: este portão mede o que vai ao ar.',
  )
  assert.ok(declarados.length > 0, 'nenhum site em sites/')
})

for (const slug of declarados) {
  test(`${slug}: a página monta e produz conteúdo`, async () => {
    const htmlUrl = new URL(`sites/${slug}/index.html`, dist)
    assert.ok(existsSync(htmlUrl), `falta dist/sites/${slug}/index.html — rode npm run build`)

    const html = readFileSync(htmlUrl, 'utf8')

    /* O módulo de entrada é o que o HTML manda carregar. Se este casamento quebrar, é
       exatamente o defeito que o portão existe para pegar. */
    const src = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1]
    assert.ok(src, `${slug}: o HTML não referencia módulo de entrada`)

    const modulo = new URL(src, htmlUrl)
    assert.ok(existsSync(modulo), `${slug}: o módulo ${src} não existe no dist/`)

    const dom = instalarDom(html, `http://localhost/sites/${slug}/`)
    try {
      /* Sufixo de cache-busting: cada site importa o mesmo chunk compartilhado do Vue, e
         sem isto o segundo site rodaria sobre o módulo já avaliado do primeiro. */
      await import(`${modulo.href}?montagem=${slug}`)

      /* Drena a fila antes de concluir: o que o Vue agenda em microtarefa e o que a
         página dispare em macrotarefa tem de acontecer **dentro** do teste. Sem isto, a
         atividade cai depois do fim e o executor a reporta como falha do arquivo, sem
         dizer qual era. */
      await new Promise((r) => setTimeout(r, 0))
      await new Promise((r) => setTimeout(r, 0))

      const app = dom.window.document.querySelector('#app')
      assert.ok(app, `${slug}: não há #app no HTML publicado`)
      assert.notEqual(
        app.innerHTML.trim(),
        '',
        `${slug}: #app ficou vazio — a página subiu em branco`,
      )

      const texto = app.textContent.replace(/\s+/g, ' ').trim()
      assert.ok(
        texto.length > 40,
        `${slug}: #app tem marcação mas quase nenhum texto (${texto.length} caracteres)`,
      )

      assert.deepEqual(dom.erros, [], `${slug}: console.error durante a montagem`)
      assert.deepEqual(
        dom.buscas,
        [],
        `${slug}: a montagem tentou buscar na rede — o build é estático (Princípio II)`,
      )
    } finally {
      dom.restaurar()
    }
  })
}

test('painel-exemplo: contexto de URL inválido não quebra a montagem', async () => {
  /* Princípio III: parâmetro de URL é entrada não confiável, e o estado vazio é previsto.
     Este caso monta a página com lixo nos parâmetros e exige que ela suba igual. */
  const slug = 'painel-exemplo'
  const htmlUrl = new URL(`sites/${slug}/index.html`, dist)
  const html = readFileSync(htmlUrl, 'utf8')
  const src = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)[1]
  const modulo = new URL(src, htmlUrl)

  const busca = '?numeroProcesso=nao-e-processo&orgao=%00&classe=inexistente'
  const dom = instalarDom(html, `http://localhost/sites/${slug}/${busca}`)
  try {
    await import(`${modulo.href}?montagem=lixo`)
    await new Promise((r) => setTimeout(r, 0))
    const app = dom.window.document.querySelector('#app')
    assert.notEqual(app.innerHTML.trim(), '', 'a página não montou com parâmetro inválido')
    assert.match(app.textContent, /não informado/i, 'o estado vazio deveria aparecer')
    assert.deepEqual(dom.erros, [], 'console.error com parâmetro inválido')
  } finally {
    dom.restaurar()
  }
})
