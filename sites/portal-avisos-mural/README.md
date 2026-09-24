# portal-avisos-mural

Candidato de visual para a primeira página do canal de avisos. Direção **mural técnico**.

## Registro da decisão (Princípio IV, regime B)

Este site **não** usa o skin do PJe. A decisão é do titular do projeto, em 2026-09-09: o
skin do PJe foi recusado para este canal por ser sóbrio demais para comunicação. Um canal
de avisos não é tela de sistema.

A identidade própria vive inteira em `tokens.css`, e cada valor de lá diz de onde veio.
Nenhum componente deste site escreve cor, fonte ou espaçamento literal.

## A aposta do desenho

Parecer instrumento de trabalho: tabela de verdade com colunas fixas, número tabular,
mono para metadado e sans para texto, etiqueta `ATENÇÃO` montada sobre a borda do quadro
como em documento técnico, e o filtro como lista de contagens em vez de pílula.

Densidade é o desenho. É o que o separa tanto do skin do PJe — que é neutro por ser
sistema — quanto do repertório que ferramenta de IA entrega por padrão: gradiente, canto
arredondado com sombra macia, chip pastel, ícone de traço genérico.

**A favor:** o mais rápido de varrer, e honesto para quem consulta meia dúzia de itens por
semana.
**Contra:** é o candidato que corre mais risco de ouvir de novo "sóbrio demais". Sem cor de
apoio, o peso todo cai na tipografia.

## Fonte

O par alvo é IBM Plex Sans + IBM Plex Mono. **CDN está fora** (Princípio VII), e o woff2
ainda não foi empacotado no repositório — então hoje a página roda na segunda opção da
pilha: Segoe UI + Consolas, que existem no parque de máquinas do Tribunal. O desenho foi
feito para funcionar assim; com o Plex, melhora.

Empacotar o Plex é item aberto. Enquanto não for feito, ninguém precisa de rede para a
página ficar correta.

## Como publicar um aviso

Editar `avisos.ts` — mesmo formato do `portal-avisos`. **Enquanto os três candidatos
existirem, aviso novo entra nos três**: `avisos.ts` é cópia deliberada em cada um, porque
nenhum site importa arquivo de outro (Princípio I). Escolhida a direção, os perdedores são
apagados e sobra uma cópia só.

## Parâmetro de URL

| Parâmetro   | Valores                               | Efeito                        |
| ----------- | ------------------------------------- | ----------------------------- |
| `categoria` | `melhoria`, `orientacao`, `automacao` | Abre já filtrado na categoria |

Valor desconhecido cai em "todos" — é entrada não confiável e passa por `enumParam`
(Princípio III).
