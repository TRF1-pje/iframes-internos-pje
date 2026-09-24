#!/usr/bin/env node
/**
 * Portão de contraste: lê cada arquivo de tokens do repositório e confere os pares
 * cor/fundo que a interface realmente usa contra o alvo WCAG.
 *
 * Alvo do projeto: **AA** — 4,5:1 para texto normal, 3:1 para texto grande e para o
 * contorno de componente de interface. É o que o eMAG exige e é o patamar que o próprio
 * PJe alcança. Onde dá para superar sem sair do padrão, superamos, e a coluna de nível
 * mostra quem já chega a AAA (7:1). Exigir AAA de uma superfície de marca seria abandonar
 * o padrão que estamos reproduzindo, e essa troca não vale.
 *
 * Há dois regimes de identidade (Princípio IV) e este portão cobre os dois: o skin do PJe
 * em `src/shared/tokens.css` e a identidade própria de cada site em `sites/*\/tokens.css`.
 * **Arquivo de tokens que não estiver listado em FONTES reprova o portão** — identidade
 * nova sem medição não entra.
 *
 * Ficam de fora as bordas decorativas: fio de tabela, borda de cartão e borda de faixa de
 * mensagem. No desenho a informação está no fundo e no texto, e medi-las produziria número
 * sem decisão. Contorno de controle — botão, campo, aba — não é decorativo e vale 3:1.
 *
 * Não é opinião sobre a tela: é medida, e roda no CI.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const raiz = new URL('../', import.meta.url)

function ler(caminho) {
  return readFileSync(new URL(caminho, raiz), 'utf8')
}

/** Extrai `--nome: #rrggbb` de um arquivo de tokens. */
function lerTokens(fonte) {
  const tokens = {}
  for (const [, nome, valor] of fonte.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[nome] = valor
  }
  return tokens
}

function canal(v) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminancia(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Rótulo do nível WCAG que a razão alcança. `AA-g` é o alvo de contorno de controle. */
function nivelWCAG(razao) {
  if (razao >= 7) return 'AAA '
  if (razao >= 4.5) return 'AA  '
  if (razao >= 3) return 'AA-g'
  return '--  '
}

/**
 * Um bloco por arquivo de tokens. Cada par é um uso real na interface: se um par sai da
 * tela, sai daqui — lista que não corresponde à tela não protege ninguém.
 *
 * `[descrição, token de frente, token de fundo, alvo]`, sem o prefixo do arquivo.
 */
const FONTES = [
  {
    titulo: 'Skin do PJe — src/shared/tokens.css (regime A)',
    arquivo: 'src/shared/tokens.css',
    prefixo: 'pje',
    pares: [
      ['texto do corpo sobre cartão', 'texto', 'superficie', 4.5],
      ['texto do corpo sobre a página', 'texto', 'fundo', 4.5],
      ['texto do corpo sobre listra', 'texto', 'listra', 4.5],
      ['texto suave sobre cartão', 'texto-suave', 'superficie', 4.5],
      ['texto suave sobre a página', 'texto-suave', 'fundo', 4.5],
      ['texto suave sobre listra', 'texto-suave', 'listra', 4.5],
      ['rótulo de linha sobre cartão', 'texto-rotulo', 'superficie', 4.5],
      ['rótulo de linha sobre listra', 'texto-rotulo', 'listra', 4.5],
      ['etiqueta de categoria sobre cinza', 'texto-rotulo', 'fundo', 4.5],
      ['link sobre cartão', 'link', 'superficie', 4.5],
      ['contorno do botão de filtro', 'barra', 'superficie', 3],
      ['link em foco sobre cartão', 'link-hover', 'superficie', 4.5],
      ['título na barra do PJe', 'sobre-marca', 'barra', 4.5],
      ['texto da faixa de informação', 'info-texto', 'info-fundo', 4.5],
      ['texto da faixa de aviso', 'aviso-texto', 'aviso-fundo', 4.5],
      ['texto da faixa de erro', 'erro-texto', 'erro-fundo', 4.5],
      ['texto da faixa de sucesso', 'sucesso-texto', 'sucesso-fundo', 4.5],
      ['link na faixa de informação', 'info-link', 'info-fundo', 4.5],
      ['link na faixa de aviso', 'aviso-link', 'aviso-fundo', 4.5],
      ['link na faixa de erro', 'erro-link', 'erro-fundo', 4.5],
      ['link na faixa de sucesso', 'sucesso-link', 'sucesso-fundo', 4.5],
      ['anel de foco sobre a página', 'link-hover', 'fundo', 3],
    ],
  },
  {
    titulo: 'Mural técnico — sites/portal-avisos-mural (regime B)',
    arquivo: 'sites/portal-avisos-mural/tokens.css',
    prefixo: 'mural',
    pares: [
      ['título e tinta sobre papel', 'tinta', 'papel', 4.5],
      ['CNPJ em vigor sobre o quadro branco', 'tinta', 'superficie', 4.5],
      ['texto de resumo sobre papel', 'texto', 'papel', 4.5],
      ['metadado suave sobre papel', 'texto-suave', 'papel', 4.5],
      ['rótulo suave sobre o quadro branco', 'texto-suave', 'superficie', 4.5],
      ['etiqueta ATENÇÃO sobre papel', 'atencao', 'papel', 4.5],
      ['coluna de categoria e link sobre papel', 'categoria', 'papel', 4.5],
      ['contorno do botão de recorte', 'contorno-controle', 'papel', 3],
      ['anel de foco sobre papel', 'fio-forte', 'papel', 3],
    ],
  },
  {
    titulo: 'Referência do titular — sites/portal-avisos-referencia (regime B)',
    arquivo: 'sites/portal-avisos-referencia/tokens.css',
    prefixo: 'ref',
    pares: [
      ['texto do corpo sobre cartão branco', 'tinta', 'branco', 4.5],
      ['texto do corpo sobre a página', 'tinta', 'suave', 4.5],
      ['texto secundário sobre cartão branco', 'suave-texto', 'branco', 4.5],
      ['texto secundário sobre a página', 'suave-texto', 'suave', 4.5],
      ['título de cartão sobre branco', 'navy', 'branco', 4.5],
      ['título de seção sobre a página', 'navy', 'suave', 4.5],
      ['etiqueta de categoria', 'navy', 'etiqueta-fundo', 4.5],
      ['etiqueta Atenção', 'etiqueta-atencao', 'laranja-fundo', 4.5],
      ['nota "o que muda"', 'nota-texto', 'nota-fundo', 4.5],
      ['texto do botão de filtro', 'filtro-texto', 'branco', 4.5],
      ['contorno do botão de filtro sobre branco', 'filtro-borda', 'branco', 3],
      ['contorno do botão de filtro sobre a página', 'filtro-borda', 'suave', 3],
      ['título na faixa navy', 'sobre-marca', 'navy', 4.5],
      ['sobretítulo na faixa navy', 'eyebrow', 'navy', 4.5],
      ['data de atualização na faixa navy', 'atualizado', 'navy', 4.5],
      ['contorno do filtro em hover sobre branco', 'azul', 'branco', 3],
      ['anel de foco sobre a página', 'navy', 'suave', 3],
    ],
  },
]

let reprovou = false

/* Guarda: identidade nova sem lista de pares não entra (Princípio VIII). */
const sitesDir = new URL('sites/', raiz)
const listados = new Set(FONTES.map((f) => f.arquivo))
if (existsSync(sitesDir)) {
  for (const entrada of readdirSync(sitesDir, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue
    const caminho = `sites/${entrada.name}/tokens.css`
    if (existsSync(new URL(caminho, raiz)) && !listados.has(caminho)) {
      console.error(
        `FALTA  ${caminho} tem tokens próprios e nenhuma lista de pares em scripts/contraste.mjs.`,
      )
      reprovou = true
    }
  }
}

for (const fonte of FONTES) {
  const tokens = lerTokens(ler(fonte.arquivo))
  const largura = Math.max(...fonte.pares.map(([nome]) => nome.length))

  console.log(`\n${fonte.titulo}`)

  for (const [nome, frente, fundo, alvo] of fonte.pares) {
    const corFrente = tokens[`${fonte.prefixo}-${frente}`]
    const corFundo = tokens[`${fonte.prefixo}-${fundo}`]

    if (!corFrente || !corFundo) {
      console.error(
        `  FALTA  ${nome.padEnd(largura)}  token ausente: --${fonte.prefixo}-${frente} / --${fonte.prefixo}-${fundo}`,
      )
      reprovou = true
      continue
    }

    const razao = contraste(corFrente, corFundo)
    const passou = razao >= alvo
    if (!passou) reprovou = true
    const marca = passou ? 'ok    ' : 'FALHA '
    const nivel = nivelWCAG(razao)
    console.log(
      `  ${marca} ${nome.padEnd(largura)}  ${razao.toFixed(2).padStart(5)}:1  ${nivel}  (alvo ${alvo}:1)  ${corFrente} sobre ${corFundo}`,
    )
  }
}

console.log(reprovou ? '\nContraste reprovado.' : '\nContraste aprovado no alvo AA.')
process.exit(reprovou ? 1 : 0)
