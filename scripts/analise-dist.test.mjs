#!/usr/bin/env node
/**
 * Testes da leitura do `dist/`: o que conta como referência externa e o que conta como
 * arquivo carregado por uma página.
 *
 * Escritos antes da implementação. Os dois casos que motivaram este arquivo vieram de
 * revisão independente e são falsas seguranças, não erros de cálculo:
 *
 *   - `//cdn.exemplo/x.js` atravessava o portão. É requisição externa idêntica a
 *     `https://cdn.exemplo/x.js` no navegador, e é a forma como muito trecho de CDN
 *     circula por aí;
 *   - se nenhuma referência casasse o padrão, o peso somava zero e o portão aprovava
 *     imprimindo `0.0 KB`. Portão que reporta zero e aprova é a definição de falsa
 *     segurança.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hostsExternos, problemasDeReferencia, referenciasCarregadas } from './analise-dist.mjs'

/* ------------------------------------------------------------------ referência externa */

test('externa: URL absoluta é detectada em qualquer contexto', () => {
  assert.deepEqual(hostsExternos('<script src="https://cdn.exemplo.br/v.js">'), ['cdn.exemplo.br'])
  assert.deepEqual(hostsExternos('@import url(http://a.b/c.css);'), ['a.b'])
  assert.deepEqual(hostsExternos('fetch("https://api.exemplo.br/x")'), ['api.exemplo.br'])
})

test('externa: protocolo-relativo em posição de referência é detectado', () => {
  /* Era o furo: nenhuma destas linhas era vista pelo portão. */
  assert.deepEqual(hostsExternos('<link href="//fonts.googleapis.com/css">'), [
    'fonts.googleapis.com',
  ])
  assert.deepEqual(hostsExternos("<script src='//unpkg.com/vue'>"), ['unpkg.com'])
  assert.deepEqual(hostsExternos('@import url(//cdn.jsdelivr.net/a.css);'), ['cdn.jsdelivr.net'])
  assert.deepEqual(hostsExternos('@import "//cdn.jsdelivr.net/a.css";'), ['cdn.jsdelivr.net'])
  assert.deepEqual(hostsExternos('.x{background:url("//i.exemplo.br/a.png")}'), ['i.exemplo.br'])
})

test('externa: caminho relativo do próprio site não é externo', () => {
  for (const dentro of [
    '<script src="../../assets/x.js">',
    '<link href="./a.css">',
    'url(/assets/a.png)',
    '<img src="a.png">',
  ]) {
    assert.deepEqual(hostsExternos(dentro), [], dentro)
  }
})

test('externa: "//" que não é referência não vira falso positivo', () => {
  /* Comentário de JS e barra dupla dentro de string são o risco de um regex ganancioso. */
  for (const inocente of [
    '// comentário de linha em bundle não minificado',
    'const re = /a\\/\\/b/;',
    'const s = "a//b";',
    'https:',
    '<a href="//">',
  ]) {
    assert.deepEqual(hostsExternos(inocente), [], inocente)
  }
})

test('externa: o mesmo host aparece uma vez só', () => {
  const texto = '<script src="https://a.b/1.js"><script src="//a.b/2.js">'
  assert.deepEqual(hostsExternos(texto), ['a.b'])
})

test('externa: hosts permitidos são omitidos', () => {
  const texto = '<svg xmlns="http://www.w3.org/2000/svg"><script src="//mau.br/x.js">'
  assert.deepEqual(hostsExternos(texto, ['www.w3.org']), ['mau.br'])
})

/* --------------------------------------------------------------- referências carregadas */

test('carregadas: módulo e folha de estilo do HTML do Vite', () => {
  const html = [
    '<link rel="stylesheet" crossorigin href="../../assets/a-1.css">',
    '<script type="module" crossorigin src="../../assets/b-2.js"></script>',
    '<link rel="modulepreload" href="../../assets/c-3.js">',
  ].join('\n')
  assert.deepEqual(referenciasCarregadas(html), [
    { caminho: '../../assets/a-1.css', tipo: 'css' },
    { caminho: '../../assets/b-2.js', tipo: 'js' },
    { caminho: '../../assets/c-3.js', tipo: 'js' },
  ])
})

test('carregadas: aspas simples, .mjs e query string entram, e .mjs conta como JS', () => {
  /* `endsWith('.js')` classificava `a.mjs?v=1` como CSS. A classificação agora sai de um
     lugar só, junto do caminho. */
  const html = "<script src='./a.mjs'></script><link href=\"./b.css?v=2\">"
  assert.deepEqual(referenciasCarregadas(html), [
    { caminho: './a.mjs', tipo: 'js' },
    { caminho: './b.css?v=2', tipo: 'css' },
  ])
})

test('carregadas: referência externa não entra na conta de peso', () => {
  /* Peso é o que o site serve. O que é externo é problema do outro portão. */
  const html = '<script src="https://cdn.exemplo.br/v.js"></script><script src="./a.js"></script>'
  assert.deepEqual(referenciasCarregadas(html), [{ caminho: './a.js', tipo: 'js' }])
})

test('carregadas: imagem e fonte não entram na medição', () => {
  const html = '<link rel="preload" href="./f.woff2"><img src="./a.png">'
  assert.deepEqual(referenciasCarregadas(html), [])
})

test('carregadas: HTML sem módulo nenhum devolve lista vazia, e quem chama decide', () => {
  /* O portão precisa distinguir "medi zero" de "não achei nada para medir": no segundo
     caso, aprovar com 0,0 KB é o defeito. */
  assert.deepEqual(referenciasCarregadas('<div id="app"></div>'), [])
})

test('externa: atributo sem aspas também é referência', () => {
  /* Achado em revisão de spec: `<link rel=stylesheet href=//fonts.googleapis.com/x>` era
     invisível. Vite sempre emite com aspas, mas HTML escrito à mão (docs/) não. */
  assert.deepEqual(hostsExternos('<link rel=stylesheet href=//fonts.googleapis.com/x>'), [
    'fonts.googleapis.com',
  ])
  assert.deepEqual(hostsExternos('<script src=//unpkg.com/vue></script>'), ['unpkg.com'])
})

test('externa: atributo sem aspas não confunde comentário de JS', () => {
  /* `a.href = // comentário` é JS válido. Por isso a forma sem aspas exige host plausível
     (ponto e TLD), e não qualquer coisa depois das duas barras. */
  assert.deepEqual(hostsExternos('el.href = // por que isto existe\n  destino'), [])
})

/* ------------------------------------------------------- asserção do portão de peso */

test('peso: HTML sem referência nenhuma é problema, não zero KB', () => {
  /* Fecha o ramo que a revisão apontou como não medido: a asserção existia no script e
     não era exercitada por teste. */
  const p = problemasDeReferencia([])
  assert.equal(p.length, 1)
  assert.match(p[0], /não pôde ser medido/)
})

test('peso: só CSS, sem módulo JS, é formato inesperado', () => {
  const p = problemasDeReferencia([{ caminho: './a.css', tipo: 'css' }])
  assert.equal(p.length, 1)
  assert.match(p[0], /nenhum módulo JS/)
})

test('peso: JS e CSS juntos não é problema', () => {
  assert.deepEqual(
    problemasDeReferencia([
      { caminho: './a.js', tipo: 'js' },
      { caminho: './b.css', tipo: 'css' },
    ]),
    [],
  )
  assert.deepEqual(problemasDeReferencia([{ caminho: './a.mjs?v=2', tipo: 'js' }]), [])
})
