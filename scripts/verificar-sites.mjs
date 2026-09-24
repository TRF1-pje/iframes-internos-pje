#!/usr/bin/env node
/**
 * Portão sobre o `dist/`. Roda depois do `vite build` e mede o que os outros portões não
 * alcançam, porque só existe depois de empacotar:
 *
 *   1. **uma entrada por site** (Princípio I) — pasta em `sites/` sem `index.html` no
 *      `dist/` é site que não foi publicado, e isso passaria em silêncio;
 *   2. **nenhuma referência externa** (Princípios II e VII) — script, folha de estilo,
 *      fonte ou imagem vinda de CDN. A rede interna do Tribunal pode não alcançar, e o
 *      comentário "não use CDN" não impede ninguém: o portão impede;
 *   3. **orçamento de peso** (Princípio VII) — 150 KB de JS comprimido por site, medido
 *      com gzip sobre os arquivos que o HTML daquele site realmente carrega;
 *   4. **`lang="pt-BR"`** (Princípio VIII).
 *
 * Vite não avisa nada disso. Peso "estimado" e conformidade afirmada em prosa não valem.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import {
  hostsExternos,
  problemasDeReferencia,
  referenciasCarregadas,
} from './analise-dist.mjs'

const raiz = new URL('../', import.meta.url)
const dist = new URL('dist/', raiz)
const sites = new URL('sites/', raiz)

/** Teto de JS comprimido por site, em bytes (Princípio VII). */
const ORCAMENTO = 150 * 1024

/**
 * Hosts que aparecem no bundle sem serem rede. A lista é curta de propósito e cada linha
 * diz por que aquele host não é uma requisição — host novo aqui é decisão, não conveniência
 * para calar o portão.
 *
 *   www.w3.org  identificador de namespace XML que o runtime do Vue usa como string para
 *               criar elemento SVG e MathML. Nunca vira requisição.
 *   vuejs.org   texto de mensagem de erro do Vue (`https://vuejs.org/error-reference/#...`),
 *               impresso no console do desenvolvedor. Conferido no bundle: é literal de
 *               string dentro do handler de erro, não `src`, `href` nem `fetch`.
 */
const NAO_E_REDE = ['www.w3.org', 'vuejs.org']

let reprovou = false

function falha(mensagem) {
  console.error(`FALHA  ${mensagem}`)
  reprovou = true
}

function ok(mensagem) {
  console.log(`ok     ${mensagem}`)
}

if (!existsSync(dist)) {
  falha('dist/ não existe. Rode `vite build` antes deste portão.')
  process.exit(1)
}

/** Sites declarados: pasta em `sites/` com `index.html`. É o mesmo critério do Vite. */
const declarados = readdirSync(sites, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(new URL(`${e.name}/index.html`, sites)))
  .map((e) => e.name)
  .sort()

if (declarados.length === 0) {
  falha('nenhum site encontrado em sites/.')
}

/* 1. Índice da raiz. Sem ele, `/` devolve 404 dentro do iframe. */
if (existsSync(new URL('index.html', dist))) {
  ok('índice da raiz presente em dist/index.html')
} else {
  falha('dist/index.html não foi gerado — a raiz devolveria 404.')
}

/* 2. Nenhuma referência externa em nenhum arquivo do dist. */
function arquivos(dir) {
  const saida = []
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const filho = new URL(`${entrada.name}${entrada.isDirectory() ? '/' : ''}`, dir)
    if (entrada.isDirectory()) saida.push(...arquivos(filho))
    else saida.push(filho)
  }
  return saida
}

const todos = arquivos(dist)
const externas = new Map()

for (const arquivo of todos) {
  if (!/\.(html|css|js|mjs|svg|json|map)$/i.test(arquivo.pathname)) continue
  const conteudo = readFileSync(arquivo, 'utf8')
  const nome = decodeURIComponent(arquivo.pathname.split('/dist/')[1] ?? arquivo.pathname)
  for (const host of hostsExternos(conteudo, NAO_E_REDE)) {
    if (!externas.has(host)) externas.set(host, new Set())
    externas.get(host).add(nome)
  }
}

if (externas.size === 0) {
  ok('nenhuma referência externa no dist/')
} else {
  for (const [host, onde] of externas) {
    falha(`referência externa a ${host} em ${[...onde].join(', ')} — CDN está fora (Princípio VII).`)
  }
}

/* 3. Uma entrada por site, com lang correto e dentro do orçamento de peso. */
for (const slug of declarados) {
  const html = new URL(`sites/${slug}/index.html`, dist)

  if (!existsSync(html)) {
    falha(`sites/${slug} não gerou dist/sites/${slug}/index.html.`)
    continue
  }

  const fonte = readFileSync(html, 'utf8')

  if (/<html[^>]+lang="pt-BR"/.test(fonte)) {
    ok(`${slug}: lang="pt-BR"`)
  } else {
    falha(`${slug}: falta lang="pt-BR" no <html> (Princípio VIII).`)
  }

  /* Os arquivos que este HTML carrega de fato: módulo de entrada e pré-carregados. */
  const referencias = referenciasCarregadas(fonte)

  /* Sem esta asserção o portão media zero e **aprovava**, imprimindo `0.0 KB`.
     A decisão vive em `analise-dist.mjs` para poder ser testada. */
  for (const problema of problemasDeReferencia(referencias)) {
    falha(`${slug}: ${problema}`)
  }

  let jsComprimido = 0
  let cssComprimido = 0
  const faltando = []

  for (const { caminho, tipo } of referencias) {
    /* A query string é do navegador, não do disco: `a.js?v=2` é o arquivo `a.js`. */
    const alvo = new URL(caminho.split('?')[0], html)
    if (!existsSync(alvo)) {
      faltando.push(caminho)
      continue
    }
    const bytes = gzipSync(readFileSync(alvo)).length
    if (tipo === 'js') jsComprimido += bytes
    else cssComprimido += bytes
  }

  if (faltando.length > 0) {
    falha(`${slug}: referência quebrada no HTML — ${faltando.join(', ')}`)
  }

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`
  const dentro = jsComprimido <= ORCAMENTO
  const resumo = `${slug}: ${kb(jsComprimido)} de JS + ${kb(cssComprimido)} de CSS, comprimidos`

  if (dentro) {
    ok(`${resumo} (teto de JS: ${kb(ORCAMENTO)})`)
  } else {
    falha(`${resumo} — acima do teto de ${kb(ORCAMENTO)} (Princípio VII).`)
  }
}

/* 4. Nada além de estático no dist. */
const proibidos = todos.filter((a) => /\.(php|jsp|asp|aspx|cgi|py|rb)$/i.test(a.pathname))
if (proibidos.length > 0) {
  falha(`arquivo de servidor no dist/: ${proibidos.map((a) => a.pathname).join(', ')}`)
}

const bytesTotais = todos.reduce((soma, a) => soma + statSync(a).size, 0)
console.log(
  `\n${declarados.length} site(s), ${todos.length} arquivo(s), ${(bytesTotais / 1024).toFixed(1)} KB de dist/.`,
)
console.log(reprovou ? 'Verificação do dist/ reprovada.' : 'Verificação do dist/ aprovada.')
process.exit(reprovou ? 1 : 0)
