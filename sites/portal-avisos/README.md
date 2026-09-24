# portal-avisos

Página de avisos operacionais do PJe: um destaque no topo, a lista de comunicados
recentes e um filtro por categoria. É a primeira página do canal — a que o servidor vê
ao abrir o iframe sem contexto nenhum.

## Como publicar um aviso

Editar `avisos.ts`. Não há backend (Constituição, Princípio II): o conteúdo é dado
tipado que entra no bundle.

- Comunicado novo entra no **topo** de `AVISOS`, com `id` em minúscula com hífen,
  `data` em `YYYY-MM-DD` e `categoria` da lista de `CATEGORIAS`.
- Categoria fora da lista ou data em formato errado reprovam em `npm run typecheck`.
- O destaque é um só, em `DESTAQUE`. Promover outro é substituir esse objeto — e o
  anterior, se ainda interessa, desce para `AVISOS`.
- "Atualizado em", no rodapé, é derivado da data mais recente. Não se escreve à mão.

## Parâmetro de URL

| Parâmetro   | Valores                              | Efeito                       |
| ----------- | ------------------------------------ | ---------------------------- |
| `categoria` | `melhoria`, `orientacao`, `automacao` | Abre já filtrado na categoria |

Valor desconhecido cai em "Todos" — é entrada não confiável e passa por `enumParam`
(Princípio III). Cada aviso também tem `id`, então `#<id>` aponta para um comunicado.

## Aparência

Só `var(--pje-*)` de `src/shared/tokens.css`. O destaque usa a faixa de aviso do PJe
(`PjeMessage`), a lista usa a listra alternada das tabelas do sistema e o filtro
selecionado usa o azul da barra. Cor nova exige medição da interface real e entra na
lista de pares de `scripts/contraste.mjs` (Princípios IV e VIII).
