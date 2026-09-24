import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const sitesDir = join(root, 'sites')

/**
 * Descobre as entradas do build. Um site é uma pasta em `sites/` com um `index.html`
 * (Constituição, Princípio I) — criar um site novo não exige tocar neste arquivo.
 */
function discoverSites(): string[] {
  if (!existsSync(sitesDir)) return []
  return readdirSync(sitesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(sitesDir, entry.name, 'index.html')))
    .map((entry) => entry.name)
    .sort()
}

/** HTML do índice: lista os sites. Não é um site, é uma porta de entrada. */
function indexHtml(sites: string[]): string {
  const links = sites
    .map((slug) => `        <li><a href="./sites/${slug}/">${slug}</a></li>`)
    .join('')
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>iframes internos PJe</title>
    <style>
      /* Mesmos valores de src/shared/tokens.css. Esta página não passa pelo bundler,
         então os tokens não chegam aqui — mas o padrão visual vale igual. */
      body { font: 14px "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #ebf0f3; color: #333 }
      h1 { background: #0078aa; color: #fff; font-size: 17px; font-weight: 400; margin: 0; padding: 0 16px; height: 50px; line-height: 50px }
      main { padding: 12px }
      .cartao { background: #fff; border: 1px solid #e1e6e9; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,.06) }
      ul { list-style: none; margin: 0; padding: 0 }
      li + li { border-top: 1px solid #e1e6e9 }
      li:nth-child(even) { background: #f7f9fa }
      a { display: block; padding: 10px 16px; color: #0078aa; text-decoration: none }
      a:hover { color: #005a80; text-decoration: underline }
      a:focus-visible { outline: 2px solid #005a80; outline-offset: -2px }
      p { color: #6b6b6b; font-size: 12px; margin: 0; padding: 10px 16px }
      code { font-family: Consolas, monospace }
    </style>
  </head>
  <body>
    <h1>Sites publicados</h1>
    <main>
      <div class="cartao">
        <ul>
${links}
        </ul>
      </div>
      <p>Cada item acima é uma pasta em <code>sites/</code>. Esta página não é um site: é só o índice.</p>
    </main>
  </body>
</html>
`
}

/**
 * Serve o índice na raiz durante o `dev` e o grava em `dist/index.html` no build.
 * Sem isso, `http://localhost:5173/` devolve 404: em MPA não há entrada na raiz.
 */
function siteIndexPlugin(sites: string[]): Plugin {
  return {
    name: 'iframes-internos-pje:site-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '/').split('?')[0]
        if (path !== '/' && path !== '/index.html') return next()
        // Redescobre a cada requisição: pasta criada com o servidor no ar já aparece.
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(indexHtml(discoverSites()))
      })
    },
    closeBundle() {
      writeFileSync(join(root, 'dist', 'index.html'), indexHtml(sites), 'utf8')
    },
  }
}

const sites = discoverSites()

export default defineConfig({
  // Caminhos relativos: nenhum site conhece a URL absoluta de produção
  // (Constituição, Princípio VI). Sobrescrevível por `vite build --base=/algum/caminho/`.
  base: './',
  plugins: [vue(), siteIndexPlugin(sites)],
  resolve: {
    alias: {
      '@shared': resolve(root, 'src/shared'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(
        sites.map((slug) => [slug, join(sitesDir, slug, 'index.html')]),
      ),
    },
  },
})
