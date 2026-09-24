# portal-avisos-referencia

Candidato de visual para a primeira página do canal de avisos. É a **proposta do titular**,
recriada dentro do projeto para servir de linha de base na escolha.

## Registro da decisão (Princípio IV, regime B)

Este site **não** usa o skin do PJe. A decisão é do titular do projeto, em 2026-09-09: o
skin do PJe foi recusado para este canal por ser sóbrio demais para comunicação.

A origem dos valores é o arquivo `portal-avisos-pje.html`, enviado por ele na mesma data.
Todos os valores de `tokens.css` foram **lidos daquele arquivo**, não estimados — inclusive
os que ele escrevia como literal dentro das regras.

## Duas diferenças em relação ao original

1. **Contorno do botão de filtro.** O original usava `#c7d5de`, que sobre o branco do botão
   rende 1,50:1 — muito abaixo dos 3:1 que a WCAG 1.4.11 exige do contorno de um controle.
   Como o botão não selecionado é branco sobre página quase branca, esse contorno é a única
   coisa que diz onde o botão começa. Trocado por `#76899a` (3,60:1 sobre branco, 3,34:1
   sobre a página), declarado no token e medido por `npm run contraste`.
2. **O filtro é estado do Vue**, não `querySelectorAll` com `hidden`. Mesmo comportamento
   visível, e a contagem para leitor de tela sai de graça.

Fora dessas duas, é recriação: mesma estrutura, mesmos valores, mesmos pontos de quebra.

Os tokens `--cyan`, `--green` e `--green-soft` do original não foram trazidos: estavam
declarados e não eram usados em nenhuma regra.

## Como publicar um aviso

Editar `avisos.ts`. **Enquanto os três candidatos existirem, aviso novo entra nos três**:
`avisos.ts` é cópia deliberada em cada um, porque nenhum site importa arquivo de outro
(Princípio I). Escolhida a direção, os perdedores são apagados e sobra uma cópia só.

## Parâmetro de URL

| Parâmetro   | Valores                               | Efeito                        |
| ----------- | ------------------------------------- | ----------------------------- |
| `categoria` | `melhoria`, `orientacao`, `automacao` | Abre já filtrado na categoria |

Valor desconhecido cai em "Todos" — é entrada não confiável e passa por `enumParam`
(Princípio III).
