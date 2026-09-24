<!--
Sync Impact Report
- Versão: 3.0.0 → 4.0.0 (MAJOR: o Princípio VI é redefinido — muda o destino de publicação)
- O destino passa a ser o **GitHub Pages**. Caem a imagem nginx de entrega, a imagem de
  esteira, o `docker-stack.yml`, a esteira do GitLab, a varredura do Sonar no servidor e o
  `npm run deploy`. O Pages serve arquivo estático e nada mais, que é o que o Princípio II
  já exigia; a infraestrutura removida só existia para reproduzir isso num servidor próprio.
- O que NÃO muda: `master` decide o que está no ar, chega-se a ela por pull request, e
  **portão antes de publicação**. O workflow do Pages roda os portões e só publica se passarem.
- Removidos: `ci/`, `entrega/`, `docker-stack.yml`, `.gitlab-ci.yml`, `.dockerignore`,
  `sonar-project.properties`, `scripts/deploy.mjs`, `scripts/registro.mjs`,
  `scripts/verificar-entrega.mjs` e os testes deles.
- Templates dependentes:
  ✅ CLAUDE.md — atualizado
  ✅ README.md — atualizado
  ✅ .github/workflows/pages.yml — criado
- TODOs que seguem abertos:
  - Matriz de navegadores do parque de máquinas (Restrições técnicas)
  - Conferir os tokens do skin PJe contra telas internas com usuário autenticado
-->

# Constituição do iframes-internos-pje

Conjunto de sites estáticos exibidos dentro do PJe por `iframe`. O eixo de todas as regras abaixo
é um só: **modificar um site precisa custar pouco, e nenhuma modificação pode depender de algo que
não está neste repositório**.

## Core Principles

### I. Um site é uma pasta

Cada site vive inteiro em `sites/<slug>/`, com seu próprio `index.html` como ponto de entrada do
build. Criar um site novo é copiar uma pasta e registrar a entrada no Vite — nada além disso.

- Nenhum site importa arquivo de outro site. O que é comum sobe para `src/shared/`.
- Nenhum arquivo de um site fica fora da pasta dele.
- `<slug>` em minúscula, com hífen, sem acento, e é a URL final do iframe.

Razão: o custo de modificar é, quase sempre, o custo de achar. Um site espalhado por quatro pastas
já nasce caro.

### II. Estático de verdade (NÃO NEGOCIÁVEL)

O build produz apenas HTML, CSS, JS e assets. Sem SSR, sem servidor de aplicação, sem rota de API
própria, sem banco.

- Nenhum segredo no repositório nem no bundle. Tudo que é publicado é legível por quem alcança a URL.
- Consumo de dado externo só de endpoint já autorizado, sempre por `fetch` do navegador, e a
  indisponibilidade dele degrada a página — nunca a quebra.
- Se uma funcionalidade exige backend, ela não pertence a este repositório.

### III. O PJe é o hospedeiro, não a plataforma

Não controlamos a página que embute. Toda suposição sobre o hospedeiro vira defeito em produção.
O contrato do iframe é fechado e vive em `src/shared/iframe/`:

- A página não toca `window.top` nem `window.parent` fora do canal de `postMessage` definido ali.
- A altura é comunicada ao pai por `postMessage`; a página não presume viewport nem rolagem.
- Sem cookie, sem dependência da sessão do PJe, sem dado sensível em `localStorage`.
- Se a página precisa de contexto (número de processo, órgão, perfil), ele chega por parâmetro de
  URL e é tratado como entrada **não confiável**: validado antes do uso, escapado antes de exibir.
- **Toda página funciona aberta direto no navegador, fora do iframe.** Página que só funciona
  embutida não é testável e não entra.

### IV. Todo valor visual tem origem escrita

A identidade visual vive em variáveis CSS, nunca em literal espalhado por componente. O que a
constituição exige de um valor não é que ele venha do PJe — é que **se saiba de onde ele veio**.

Há dois regimes, e um site declara em qual está.

**Regime A — skin do PJe** (`src/shared/tokens.css`). É o padrão: o site parece parte do
sistema hospedeiro. Aqui **cada valor vem de medição da interface real**, com a origem escrita
no comentário do token.

- A fonte de referência é a consulta pública do PJe, que roda o mesmo skin do sistema
  autenticado e é acessível sem login. Amostrar pixel de uma captura é barato e é verificável;
  estimar cor "parecida com PJe" produziu, na primeira tentativa deste projeto, uma tela que
  não era o PJe.
- Não se copia CSS do PJe para dentro do repositório: ele muda sem aviso e CSS copiado envelhece
  em silêncio. Medimos os valores e os declaramos como nossos, com data e origem.
- Divergir do PJe é permitido quando há razão — acessibilidade, tipicamente —, mas a divergência
  é **declarada no token**, com o número que a motivou. Divergência silenciosa é erro.

**Regime B — identidade própria do site** (`sites/<slug>/tokens.css`). Um site pode ter
identidade própria quando a decisão de divergir do PJe está registrada — no README do site, com
quem decidiu e por quê. Não é escapatória do regime A: é o caso em que parecer o PJe é o erro.

- Existe porque existe pelo menos um: um canal de avisos não é tela de sistema, e o titular
  recusou o skin do PJe para ele por ser sóbrio demais para comunicação.
- O arquivo de tokens do site é o **único** lugar onde a identidade dele mora, e cada token
  ainda diz de onde o valor veio — paleta de referência, decisão de quem, medida de contraste
  que o obrigou. "Achei bonito" não é origem.
- O site importa `sites/<slug>/tokens.css` **em vez de** `src/shared/tokens.css`, nunca os dois:
  meia identidade é pior que qualquer uma das duas.
- Site em regime B não usa componente de `src/shared/components/`, que é vocabulário do PJe.
  O que ele precisar de comum sobe para `src/shared/` de forma agnóstica de skin, ou fica nele.

Vale para os dois regimes, sem exceção:

- Nenhum componente escreve cor, fonte ou espaçamento literal. Sempre `var(--...)`.
- Trocar a identidade visual de um site deve ser a edição de um arquivo.
- Todo par cor/fundo novo entra no portão do Princípio VIII, no regime em que nasceu.
- Fonte é assunto do Princípio VII: identidade própria não autoriza CDN. Fonte que não está no
  parque de máquinas vem empacotada no repositório.

### V. TypeScript estrito e Vue simples

- `strict: true`. Sem `any` implícito. `@ts-ignore` só com comentário dizendo por quê.
- Vue 3 com SFC e `<script setup lang="ts">`.
- Sem store global, sem router, sem biblioteca de componentes, enquanto um site couber sem eles —
  e um site de iframe quase sempre cabe.
- Dependência nova exige justificativa no PR: o que ela resolve e o que custaria não tê-la.

Razão: a pessoa que vai modificar este código daqui a seis meses pode não ser quem o escreveu, e
provavelmente vai mexer em um site só.

### VI. Deploy é peça trocável

O destino está decidido: **GitHub Pages**, publicado por `.github/workflows/pages.yml`.

- O que decide o que está no ar é o conteúdo de `master`. O workflow publica o `dist/` só a
  partir dela; em qualquer outro branch e em pull request ele roda os portões e mais nada.
- **Portão antes de publicação, sem exceção.** `lint`, `testar` e `build` (que inclui
  `typecheck`, `contraste`, `verificar-sites` e `montagem`) rodam antes da publicação, e se um
  reprova nada vai ao ar. Publicar primeiro e conferir depois é o que o Princípio VIII existe
  para impedir.
- Nenhum código de site conhece URL absoluta de produção. Caminhos são relativos e a base do build
  é parâmetro (`--base`), porque o caminho de montagem — no Pages ou dentro do PJe — não é
  decisão de um site.
- O Pages serve arquivo estático e nada mais: sem proxy, sem rota de API, sem reescrita, sem
  cabeçalho próprio. Se a publicação precisar de lógica de servidor, o Princípio II já foi
  violado antes.

### VII. Peso é requisito

Um iframe carrega dentro de uma página que já é pesada.

- Orçamento por site: **≤ 150 KB de JS comprimido**. Quem ultrapassa não publica sem decisão
  explícita registrada no PR.
- Sem fonte externa, sem CDN de terceiro: a rede interna pode não alcançá-los.

### VIII. Acessibilidade é medida, não declarada

O alvo é **WCAG AA**: 4,5:1 para texto normal, 3:1 para texto grande e componentes. É o que o
eMAG exige e é o patamar que o próprio PJe alcança.

- `npm run contraste` lê `src/shared/tokens.css` **e cada `sites/*/tokens.css`**, calcula todo
  par cor/fundo que a interface usa de fato e reprova o que não alcança o alvo. Roda no `build`
  e no CI. Conformidade afirmada em prosa não vale; vale a que o portão mede — inclusive quando
  quem afirma é o agente que escreveu o código.
- Par novo na interface é par novo na lista do portão. Lista que não corresponde à tela não
  protege ninguém. Arquivo de tokens sem lista de pares reprova o portão: identidade nova sem
  medição não entra.
- Contorno de controle — botão, campo, aba — é componente de interface e vale 3:1. Fundo de
  cartão e fio de tabela são decorativos: a informação está no texto, e medi-los produziria
  número sem decisão.
- Superamos AA onde dá sem sair do padrão PJe — o corpo de texto fica em 12,6:1. Mas **AAA não
  é o alvo**: exigir 7:1 de uma superfície de marca do PJe seria abandonar o padrão que estamos
  reproduzindo, e essa troca não vale a pena.
- Quando um valor do PJe não alcança AA, a saída é a variante do próprio PJe que alcança, e a
  substituição fica declarada no token. É o caso do botão primário `#0084ac`, que com texto
  branco dá 4,29:1: usamos o `#0078aa` da barra, que dá 4,92:1.
- Além do contraste: HTML semântico, foco visível, navegação por teclado, `lang="pt-BR"`.

## Restrições técnicas

Pilha fixa: **TypeScript · Vue 3 · Vite em modo MPA · npm · Node 24 LTS**. Trocar qualquer item
exige emenda a esta constituição.

```
sites/<slug>/index.html   entrada do build, uma por site
sites/<slug>/main.ts
sites/<slug>/App.vue
sites/<slug>/tokens.css   só em regime B (Princípio IV): identidade própria do site
src/shared/               componentes, tokens.css, iframe/
.github/workflows/        portões e publicação no GitHub Pages (Princípio VI)
```

Convenções: pasta e arquivo em minúscula com hífen, sem acento. Componentes Vue em `PascalCase`.
Texto de interface em pt-BR; identificadores de código em inglês.

> TODO: fixar a matriz de navegadores do parque de máquinas antes da primeira publicação. Ela decide
> alvo de transpilação e uso de recurso moderno de CSS.

## Fluxo de trabalho e portões de qualidade

- Branches: `master` é o que está publicado; todo o resto é branch de trabalho, `homol`
  incluída. **Commit em `master` é publicação** — e se faz por pull request, não por push.
- **Há um ambiente só, e é `master`.** `homol` é o lugar de commitar fora da `master` para
  depois abrir pull request. Um push nela roda os portões e mais nada.
- Todo PR passa, verde: `npm run typecheck`, `npm run lint`, `npm run contraste`,
  `npm run testar`, `npm run build` (que já roda `verificar-sites` e `montagem` sobre o `dist/`).
- Nenhum segredo no workflow nem no repositório. A publicação no Pages usa o token efêmero do
  próprio GitHub Actions, com permissão só de `pages: write`.

## Governance

Esta constituição prevalece sobre preferência pessoal e sobre hábito herdado de outro projeto. Divergência entre ela e um arquivo de instrução do agente se resolve em favor dela.

- **Emenda**: PR que altera este arquivo, declarando o que muda e por quê, e ajustando no mesmo PR
  os artefatos dependentes listados no Sync Impact Report.
- **Versionamento**: MAJOR remove ou redefine princípio; MINOR acrescenta princípio ou seção;
  PATCH esclarece redação sem mudar obrigação.
- **Conformidade**: a revisão de PR verifica os princípios explicitamente. Complexidade acima do
  necessário precisa ser justificada, não apenas aceita.
- Um TODO desta constituição é dívida com prazo, não anotação. Fechá-lo é trabalho de entrega.

**Version**: 4.0.0 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-24
