#!/usr/bin/env node
/**
 * Cria um site novo copiando `sites/painel-exemplo`.
 *
 * Uso: npm run novo-site -- <slug> "Título do painel"
 *
 * Não registra nada em lugar nenhum: o Vite descobre as entradas varrendo
 * `sites/*\/index.html` (Constituição, Princípio I).
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const MOLDE = 'painel-exemplo'
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const [slug, titulo] = process.argv.slice(2)

if (!slug) {
  console.error('Uso: npm run novo-site -- <slug> "Título do painel"')
  process.exit(1)
}

if (!SLUG.test(slug)) {
  console.error(`Slug inválido: "${slug}". Use minúsculas e hífen, sem acento.`)
  process.exit(1)
}

const destino = join(root, 'sites', slug)

if (existsSync(destino)) {
  console.error(`Já existe um site em sites/${slug}.`)
  process.exit(1)
}

cpSync(join(root, 'sites', MOLDE), destino, { recursive: true })

const nome = titulo ?? slug
const substituicoes = [
  ['main.ts', MOLDE, slug],
  ['index.html', 'Painel de exemplo — PJe', `${nome} — PJe`],
  ['App.vue', 'Painel de exemplo', nome],
  ['README.md', MOLDE, slug],
]

for (const [arquivo, de, para] of substituicoes) {
  const caminho = join(destino, arquivo)
  writeFileSync(caminho, readFileSync(caminho, 'utf8').replaceAll(de, para), 'utf8')
}

console.log(`Site criado em sites/${slug}. Rode: npm run dev`)
