<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

## iframes-internos-pje

Sites estáticos exibidos dentro do PJe por `iframe`. TypeScript + Vue 3 + Vite em modo MPA.

**Leia `.specify/memory/constitution.md` antes de mexer no código.** Ela é curta e prevalece
sobre hábito herdado de outro projeto. Os pontos que mais costumam ser violados sem querer:

- Um site é uma pasta em `sites/<slug>/`. Nenhum site importa arquivo de outro site.
- Nada de backend, segredo ou SSR. O build produz só HTML, CSS, JS e assets.
- Só `src/shared/iframe/` fala com a página hospedeira. Parâmetro de URL é entrada não confiável.
- Toda página funciona também aberta fora do iframe.
- **Dois regimes de identidade visual (Princípio IV), e um site declara em qual está:**
  - **regime A** — skin do PJe: tokens em `src/shared/tokens.css`, cada valor **medido** da
    interface real (consulta pública), não estimado. Importa `@shared/base.css` e pode usar
    `src/shared/components/`. Não invente cor "parecida com PJe".
  - **regime B** — identidade própria do site: tokens em `sites/<slug>/tokens.css`, com a
    decisão de divergir registrada no README do site. Importa `@shared/reset.css` + os
    próprios `tokens.css` e `base.css`, e **não** usa `@shared/base.css` nem os componentes
    do PJe, que são vocabulário do sistema hospedeiro.
  - Nunca os dois juntos. Em qualquer regime: nenhum literal de cor, fonte ou espaçamento em
    componente — sempre `var(--...)` —, e cada token diz de onde o valor veio.
- Contraste é medido: `npm run contraste` varre `src/shared/tokens.css` **e cada
  `sites/*/tokens.css`**, e reprova abaixo de AA (4,5:1 texto normal, 3:1 contorno de
  controle). Cor nova entra na lista de pares de `scripts/contraste.mjs`; arquivo de tokens
  sem lista reprova o portão. Não afirme razão de contraste sem rodar o script.
- Sem fonte externa e sem CDN (Princípio VII). Fonte que não está no parque de máquinas
  vem empacotada no repositório. `npm run verificar-sites` roda depois do `vite build`
  e reprova referência externa no `dist/`, mede o peso por site com gzip e confere uma entrada
  por site.
- Antes de abrir PR: `npm run typecheck`, `npm run lint`, `npm run contraste`, `npm run build`.
- **Publicação é GitHub Pages** (Princípio VI). `.github/workflows/pages.yml` roda os
  portões em todo push e PR e só publica o `dist/` a partir da `master`. Não há servidor,
  imagem nem nginx: o Pages serve arquivo estático e nada mais.
- **Commit em `master` é publicação**, e se faz por **pull request** vindo de `homol`.
  `homol` é branch de trabalho, não ambiente — há um ambiente só, e é `master`.
- A base do build é `./`: o Pages serve em `/<repositório>/` e os caminhos relativos
  funcionam sem parâmetro. Nenhum site conhece a URL absoluta de produção.

### Estado atual, setembro de 2026

O canal de avisos é `sites/portal-avisos-referencia` (regime B), escolhido em 2026-09-24
entre três candidatos; os outros dois foram apagados. `sites/painel-exemplo` é o molde que
`npm run novo-site` copia, não um site em uso.
