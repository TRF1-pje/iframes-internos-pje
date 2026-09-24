# iframes-internos-pje

Conjunto de sites estáticos exibidos dentro do PJe por `iframe`.

As regras do projeto estão em **[`.specify/memory/constitution.md`](.specify/memory/constitution.md)**.
Ela prevalece sobre o que estiver escrito aqui; este arquivo é só o caminho das pedras.

## Começar

```bash
npm install
npx skills@latest experimental_install   # recria os links de .claude/skills/
npm run dev            # abre o servidor de desenvolvimento
npm run build          # gera dist/ (typecheck e contraste antes, verificar-sites depois)
npm run preview        # serve dist/ para conferência
npm run contraste      # mede os pares cor/fundo contra o alvo WCAG AA
npm run verificar-sites # portão sobre o dist/: referência externa, peso, uma entrada por site
npm run testar         # lógica pura: roda a qualquer momento, não precisa de dist/
npm run montagem       # portão sobre o dist/: as páginas montam mesmo? (roda dentro do build)
```

`http://localhost:5173/` lista os sites; cada um fica em `/sites/<slug>/`.

## Os sites que existem hoje

| Slug | O que é |
|---|---|
| `painel-exemplo` | molde do repositório, no skin do PJe. É o que `npm run novo-site` copia |
| `portal-avisos-referencia` | canal de avisos, proposta do titular recriada (regime B) |

Os outros dois candidatos de visual do portal (`portal-avisos`, no skin do PJe, e
`portal-avisos-mural`) foram apagados em 2026-09-24, quando a referência foi escolhida.

## Criar um site novo

```bash
npm run novo-site -- avisos-da-vara "Avisos da vara"
```

O comando copia `sites/painel-exemplo`. Não há registro a fazer em nenhum outro arquivo:
o Vite descobre as entradas varrendo `sites/*/index.html`.

Um site é uma pasta:

```
sites/<slug>/index.html   entrada do build
sites/<slug>/main.ts      monta a app e informa a altura ao PJe
sites/<slug>/App.vue      a página
```

Nenhum site importa arquivo de outro site. O que é comum vive em `src/shared/`.

## O que `src/shared/` oferece

| Caminho | Para quê |
|---|---|
| `tokens.css` | cores, tipografia e espaçamento do PJe. Nenhum componente escreve valor literal |
| `reset.css` | reset agnóstico de skin: caixa, margem, foco, leitor de tela. Sem cor nem fonte |
| `base.css` | o skin do PJe sobre o reset; importe em `main.ts` quem estiver no regime A |
| `iframe/` | o **único** ponto que fala com a página hospedeira: altura por `postMessage` e leitura validada de parâmetros de URL |
| `components/` | painel, mensagem e lista de definição no visual do PJe |

### Dois regimes de identidade visual

O Princípio IV reconhece dois, e um site declara em qual está:

| Regime | Onde moram os tokens | Quando |
|---|---|---|
| **A — skin do PJe** | `src/shared/tokens.css` | o padrão: o site parece parte do sistema |
| **B — identidade própria** | `sites/<slug>/tokens.css` | quando parecer o PJe é o erro, e a decisão está registrada no README do site |

Em regime B o site importa `@shared/reset.css` + o próprio `tokens.css` + o próprio `base.css`,
e **não** usa `@shared/base.css` nem `src/shared/components/` — aqueles são vocabulário do PJe.
Nunca os dois regimes juntos: meia identidade é pior que qualquer uma das duas.

Vale nos dois: nenhum literal de cor, fonte ou espaçamento em componente; cada token diz de onde
o valor veio; todo par cor/fundo novo entra no portão de contraste. `npm run contraste` varre
`src/shared/tokens.css` e cada `sites/*/tokens.css`, e **reprova arquivo de tokens que não tiver
lista de pares** — identidade nova sem medição não entra.

### De onde vem a aparência do skin PJe

Os tokens foram **medidos** da interface real do PJe do TRF1 — a consulta pública roda o mesmo
skin do sistema autenticado e é acessível sem login:

- barra do sistema `#0078aa` · fundo `#ebf0f3` · cartão branco com borda `#e1e6e9`
- faixas de mensagem: paleta do Bootstrap 3, que é a que o PJe usa
- tipografia: Segoe UI (a pilha de fonte de sistema do Bootstrap 4), base 14px

O alvo de contraste é **WCAG AA**, verificado e não afirmado: `scripts/contraste.mjs` lê os
tokens, calcula cada par cor/fundo que a interface usa e reprova o build abaixo de 4,5:1 para
texto normal. Cor nova na interface entra na lista de pares do script.

Uma divergência deliberada em relação ao PJe, declarada no próprio token: o botão primário do PJe
é `#0084ac`, que com texto branco dá 4,29:1 — abaixo de AA. Usamos o `#0078aa` da barra, que é cor
do mesmo sistema e dá 4,92:1.

## Como o PJe embute uma página

`docs/host-de-teste.html` simula o lado do PJe: embute um site em `<iframe>` e mostra as
mensagens recebidas e a altura aplicada. É o código que o PJe precisa ter, em forma executável.

```bash
npm run build
python -m http.server 5199      # ou qualquer servidor estático na raiz do repo
# abrir http://127.0.0.1:5199/docs/host-de-teste.html
```

Se a moldura tracejada ficar com sobra ou cortar conteúdo, o contrato de altura quebrou.

Toda página funciona também aberta direto no navegador, fora do iframe. Se uma página só
funciona embutida, ela não é testável e não entra.

## Publicação

**O que está no ar é o conteúdo de `master`**, servido pelo GitHub Pages. `homol` é onde o
trabalho amadurece, e chega à `master` por pull request.

`.github/workflows/pages.yml` faz tudo, e na ordem que não se negocia — **portão antes de
publicação**:

1. em todo push e todo PR: `npm ci`, `lint`, `testar` e `build` (que já inclui `typecheck`,
   `contraste`, `verificar-sites` e `montagem`);
2. só na `master`, e só se tudo acima passou: publica o `dist/` no Pages.

Não há servidor, imagem Docker nem nginx: o Pages serve arquivo estático e nada mais, o que
já é o que o Princípio II pede. A base do build é `./`, então as páginas funcionam em
`/<repositório>/sites/<slug>/` sem parâmetro.

O Pages não deixa declarar cabeçalho HTTP. Isso tem uma consequência boa e uma limitação: não
sai `X-Frame-Options`, então o PJe consegue embutir as páginas; e não dá para restringir quem
embute por `frame-ancestors`.

### Duas famílias de portão, e elas não se misturam

| Comando | Precisa de `dist/`? | Onde roda |
|---|---|---|
| `npm run typecheck`, `lint`, `contraste`, `testar` | não — é lógica pura e arquivo de configuração | primeiro passo da esteira, e a qualquer momento |
| `npm run verificar-sites`, `npm run montagem` | **sim** — medem o que foi empacotado | dentro do `npm run build`, depois do `vite build` |

Isso já custou um job vermelho: o portão de montagem se chamava `montagem.test.mjs`, casava o
glob de `npm run testar` e reprovava antes do build com "dist/ não existe". O portão
estava certo e o lugar errado. Por isso o arquivo é `scripts/montagem-portao.mjs`, sem
`.test.` no nome — quem mede o empacotado não entra no glob de quem roda antes de empacotar.

## Lacunas conhecidas dos portões

Os portões medem, e o que eles **não** medem também precisa estar escrito — senão "portão
verde" passa a significar mais do que significa. Levantadas em revisão independente, em
2026-09-10, e ordenadas por risco.

Uma fechou em 2026-09-10 e saiu desta lista, porque **nada aqui se confere à mão**: a
montagem da página (`npm run montagem`, dentro do `build`).

Outra fechou em 2026-09-11: `textParam` passou a recusar controle C1, bidi e
invisíveis, por faixa de ponto de código. Os dois `test.todo` que guardavam a asserção
correta viraram teste normal — foi só apagar o `.todo`.

| Lacuna | Consequência se morder |
|---|---|
| `reportHeight` não tem *debounce* nem histerese | se o resize do pai mudar o layout, o par oscila. `lastHeight` bloqueia repetição exata, não ciclo de dois valores. E só aparece dentro do PJe, onde depurar é caro |
| Não há validador de URL em `src/shared/iframe/` | o cabeçalho do módulo promete "escapado antes de exibir", e hoje quem escapa é a interpolação do Vue, não o contrato. `:href="textParam('link')"` aceitaria `javascript:` |
| O teto de peso é só de **JS** | fonte, imagem e *chunk* de `import()` dinâmico não entram na conta. É a letra do Princípio VII; a razão dele é peso de página, que é maior |
| Protocolo-relativo em `import("//host")` e em *template literal* | `hostsExternos` cobre atributo e `url()`, com e sem aspas. Import dinâmico segue invisível |
| O regime B não é verificado estruturalmente | um site com `tokens.css` próprio pode importar `@shared/base.css` e nada reclama, embora o Princípio IV diga "nunca os dois juntos". Hoje os dois sites estão certos, conferido à mão |
| `vite.config.ts` reescreve a paleta do PJe em literal | a página de índice envelhece em silêncio quando o skin mudar, e é a primeira que alguém abre |
| Acessibilidade além de contraste | ordem de tabulação, semântica e `aria-*` estão feitos à mão e bem feitos, e nada impede a próxima página de perder isso |

## Pendências abertas

Estão registradas como TODO na constituição e são dívida com prazo, não anotação:

- matriz de navegadores do parque de máquinas;
- conferir os tokens contra telas internas do PJe com usuário autenticado — a consulta pública
  não mostra aba, menu lateral nem tabela de resultados preenchida;
