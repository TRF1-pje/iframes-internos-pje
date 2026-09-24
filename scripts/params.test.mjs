#!/usr/bin/env node
/**
 * Testes de `src/shared/iframe/params.ts` — a leitura de contexto vindo da URL.
 *
 * Este é o código de maior risco do repositório e até agora não tinha verificação nenhuma:
 * é o único ponto onde entra dado que não é nosso (Princípio III, "entrada não confiável"),
 * e é executado dentro do PJe, onde depurar é caro.
 *
 * O módulo é TypeScript e o Node o importa direto — em Node 24 o *type stripping* é
 * estável, então não há passo de compilação aqui nem dependência nova.
 *
 * `params.ts` lê `window.location.search` **a cada chamada**, e é por isso que um único
 * import serve: basta trocar o `window` antes de chamar. Uma versão anterior reimportava o
 * módulo com sufixo de cache-busting, alegando memoização do import — cerimônia morta, que
 * criava uma instância do módulo por caso de teste. Apontado em revisão.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as params from '../src/shared/iframe/params.ts'

/** Monta o `window` mínimo que `params.ts` usa e devolve o módulo. */
async function comURL(busca) {
  globalThis.window = { location: { search: busca } }
  return params
}

/* --------------------------------------------------------------------- textParam */

test('textParam: devolve o valor aparado', async () => {
  const { textParam } = await comURL('?orgao=%20%201%C2%AA%20Vara%20%20')
  assert.equal(textParam('orgao'), '1ª Vara')
})

test('textParam: ausente e vazio devolvem null, não string vazia', async () => {
  const { textParam } = await comURL('?a=&b=%20%20')
  assert.equal(textParam('a'), null)
  assert.equal(textParam('b'), null)
  assert.equal(textParam('inexistente'), null)
})

test('textParam: acima do limite devolve null', async () => {
  const { textParam } = await comURL(`?x=${'a'.repeat(200)}`)
  assert.equal(textParam('x', 120), null)
  assert.equal(textParam('x', 200)?.length, 200)
})

test('textParam: caractere de controle C0 e DEL são recusados', async () => {
  const { textParam } = await comURL('?a=%00&b=%1F&c=%7F&d=a%0Ab')
  for (const nome of ['a', 'b', 'c', 'd']) {
    assert.equal(textParam(nome), null, nome)
  }
})

test('textParam: HTML e comilha passam como texto — quem escapa é o Vue', async () => {
  /* Não é falha: o contrato é "validado antes do uso, escapado antes de exibir", e a
     interpolação do Vue escapa. Este teste existe para o comportamento ser deliberado e
     não acidental — se alguém passar isto para `v-html`, o defeito é lá. */
  const { textParam } = await comURL('?a=%3Cscript%3E&b=%27%22')
  assert.equal(textParam('a'), '<script>')
  assert.equal(textParam('b'), '\'"')
})

/**
 * Caractere invisivel se escreve por codigo, nunca literal.
 *
 * `String.fromCodePoint` e nao um escape `uXXXX` porque o escape sobrevive a leitura de
 * quem revisa, mas nao sobrevive a todo editor, terminal e camada de transporte pela qual
 * este arquivo passa — foi exatamente assim que uma versao anterior acabou com o byte cru
 * dentro das aspas, num arquivo cujo assunto e justamente filtrar bidi.
 *
 * Estes dois casos nasceram marcados como pendentes, com a assercao correta escrita e o
 * comportamento de entao reprovando. O filtro foi implementado em `params.ts` por faixa de
 * ponto de codigo, e agora eles valem como teste normal — foi so tirar a marca.
 */
const C1_NEL = String.fromCodePoint(0x85)
const BIDI_RLO = String.fromCodePoint(0x202e)
const INVISIVEL_ZWSP = String.fromCodePoint(0x200b)
const BOM = String.fromCodePoint(0xfeff)

test('textParam: recusa controle C1 (U+0080 a U+009F)', async () => {
  const { textParam } = await comURL(`?a=${encodeURIComponent(C1_NEL)}`)
  assert.equal(textParam('a'), null)
})

test('textParam: recusa bidi e invisiveis', async () => {
  /* U+202E reordena o texto exibido — e a familia do Trojan Source. U+200B some da tela
     e sobra no dado. U+FEFF vira BOM no meio da string. */
  for (const [nome, valor] of [
    ['RLO', `${BIDI_RLO}abc`],
    ['ZWSP', `a${INVISIVEL_ZWSP}b`],
    ['BOM', `a${BOM}b`],
  ]) {
    const { textParam } = await comURL(`?a=${encodeURIComponent(valor)}`)
    assert.equal(textParam('a'), null, nome)
  }
})

test('textParam: recusa em vez de limpar, e o estado vazio e previsto', async () => {
  /* A diferenca importa: limpar devolveria `abc` para `RLO+abc`, ou seja um valor que o
     hospedeiro nao mandou. Recusar devolve null, e a pagina mostra o estado vazio, que o
     Principio III preve. */
  const comRLO = `${BIDI_RLO}abc`
  const { textParam } = await comURL(`?a=${encodeURIComponent(comRLO)}`)
  assert.equal(textParam('a'), null)
  assert.notEqual(textParam('a'), 'abc')
})

test('textParam: texto legitimo com acento e emoji continua passando', async () => {
  /* O filtro recusa faixa de controle e invisivel, nao tudo que nao e ASCII. O emoji
     exercita par surrogate, que e o motivo de a verificacao iterar por ponto de codigo. */
  const { textParam } = await comURL('?a=1%C2%AA%20Vara%20Federal%20C%C3%ADvel%20%E2%9C%93')
  assert.equal(textParam('a'), '1ª Vara Federal Cível ✓')
  const { textParam: t2 } = await comURL(`?b=${encodeURIComponent('audiencia 📅 hoje')}`)
  assert.equal(t2('b'), 'audiencia 📅 hoje')
})

/* ------------------------------------------------------------- processNumberParam */

test('processNumberParam: aceita o padrão CNJ', async () => {
  const { processNumberParam } = await comURL('?numeroProcesso=0001234-56.2026.4.01.3400')
  assert.equal(processNumberParam(), '0001234-56.2026.4.01.3400')
})

test('processNumberParam: recusa o que não é o padrão', async () => {
  const ruins = [
    '1234-56.2026.4.01.3400',
    '0001234.56.2026.4.01.3400',
    '0001234-56.2026.4.01.34000',
    '0001234-56.2026.44.01.3400',
    'abcdefg-hi.jklm.n.op.qrst',
    '0001234-56.2026.4.01.3400x',
    '0001234-56.2026.4.01.3400 x',
  ]
  for (const ruim of ruins) {
    const { processNumberParam } = await comURL(`?numeroProcesso=${encodeURIComponent(ruim)}`)
    assert.equal(processNumberParam(), null, ruim)
  }
})

test('processNumberParam: espaço nas pontas é aparado, não recusado', async () => {
  /* Escrevi este caso primeiro esperando `null`, e o teste falhou. O código está certo:
     `raw()` apara antes de validar, de propósito — parâmetro que chega com espaço a mais
     do hospedeiro é comum e não é dado inválido. O teste é que estava errado. */
  const { processNumberParam } = await comURL('?numeroProcesso=%20%200001234-56.2026.4.01.3400%20')
  assert.equal(processNumberParam(), '0001234-56.2026.4.01.3400')
})

test('processNumberParam: aceita nome de parâmetro alternativo', async () => {
  const { processNumberParam } = await comURL('?outro=0001234-56.2026.4.01.3400')
  assert.equal(processNumberParam('outro'), '0001234-56.2026.4.01.3400')
  assert.equal(processNumberParam(), null)
})

/* ---------------------------------------------------------------------- intParam */

test('intParam: dentro da faixa, inclusive nos extremos', async () => {
  const { intParam } = await comURL('?a=1&b=10&c=5')
  assert.equal(intParam('a', 1, 10), 1)
  assert.equal(intParam('b', 1, 10), 10)
  assert.equal(intParam('c', 1, 10), 5)
})

test('intParam: fora da faixa, não inteiro e vazio devolvem null', async () => {
  const { intParam } = await comURL('?a=0&b=11&c=1.5&d=abc&e=&f=1e3&g=%20')
  for (const nome of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
    assert.equal(intParam(nome, 1, 10), null, nome)
  }
})

test('intParam: negativo é aceito quando a faixa permite', async () => {
  const { intParam } = await comURL('?a=-5')
  assert.equal(intParam('a', -10, 0), -5)
  assert.equal(intParam('a', 0, 10), null)
})

/* --------------------------------------------------------------------- enumParam */

test('enumParam: aceita só o que está na lista fechada', async () => {
  const { enumParam } = await comURL('?classe=civel')
  assert.equal(enumParam('classe', ['civel', 'criminal']), 'civel')
  assert.equal(enumParam('classe', ['criminal']), null)
})

test('enumParam: comparação é sensível a caixa, e valor de fora não vaza', async () => {
  const { enumParam } = await comURL('?classe=CIVEL')
  assert.equal(enumParam('classe', ['civel']), null)
})

test('enumParam: nome herdado de Object.prototype não é aceito', async () => {
  /* `['a'].includes('constructor')` é falso, então isto já passa — o teste trava o
     comportamento para o dia em que alguém trocar `includes` por acesso de propriedade. */
  const { enumParam } = await comURL('?x=constructor')
  assert.equal(enumParam('x', ['a', 'b']), null)
})

test('enumParam: lista vazia recusa tudo', async () => {
  const { enumParam } = await comURL('?x=a')
  assert.equal(enumParam('x', []), null)
})

/* ------------------------------------------------------------ parâmetro repetido */

test('parâmetro repetido na URL: vale o primeiro', async () => {
  /* `URLSearchParams.get` devolve o primeiro. Vale registrar: é a diferença entre "vale o
     primeiro" e "vale o último" que sustenta ataque de poluição de parâmetro quando o
     hospedeiro e a página discordam. */
  const { textParam } = await comURL('?a=um&a=dois')
  assert.equal(textParam('a'), 'um')
})
