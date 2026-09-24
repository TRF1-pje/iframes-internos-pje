/*
 * NOTA DE DUPLICAÇÃO — deliberada e temporária.
 *
 * Este arquivo é cópia do de `sites/portal-avisos/`. Nenhum site importa arquivo de outro
 * (Princípio I), e os três candidatos de visual precisam do mesmo conteúdo para serem
 * comparados de verdade. Escolhida a direção, os candidatos perdedores são apagados e
 * sobra uma cópia só. Enquanto os três existirem: aviso novo entra nos três.
 */

/**
 * Conteúdo do portal de avisos.
 *
 * Fica em TypeScript, dentro da pasta do site, por três razões:
 *
 *   1. não há backend neste repositório (Constituição, Princípio II) — publicar um
 *      aviso novo é editar este arquivo e rodar a esteira;
 *   2. o dado entra no bundle já validado pelo compilador: categoria fora da lista e
 *      data em formato errado reprovam no `typecheck`, não em produção;
 *   3. o texto não vem de parâmetro de URL nem de `fetch`, então não há entrada não
 *      confiável aqui — o que a página interpola é conteúdo nosso, e o Vue escapa.
 */

/** Categorias do filtro. Lista fechada: também é o que o parâmetro `categoria` aceita. */
export const CATEGORIAS = {
  melhoria: 'Melhoria',
  orientacao: 'Orientação',
  automacao: 'Automação',
} as const

export type Categoria = keyof typeof CATEGORIAS

export interface Aviso {
  /** Âncora e chave de lista. Minúscula com hífen, como o slug do site. */
  id: string
  /** Data de publicação em `YYYY-MM-DD`. */
  data: string
  categoria: Categoria
  titulo: string
  resumo: string
}

/** O aviso em destaque. É um só: destaque que se repete deixa de ser destaque. */
export const DESTAQUE = {
  id: 'uniao-domicilio-judicial-eletronico',
  data: '2026-09-07',
  titulo: 'Intimações da União Federal passam a ser enviadas ao Domicílio Judicial Eletrônico',
  resumo:
    'O CNPJ principal da União Federal foi atualizado de 00.394.411/0001-09 para ' +
    '26.994.558/0001-23, em conformidade com o cadastro existente no Domicílio Judicial ' +
    'Eletrônico.',
  mudanca:
    'Ao selecionar o meio “sistema”, citações e intimações serão encaminhadas ao ' +
    'Domicílio. Os processos existentes foram ajustados automaticamente.',
  /**
   * Dado tabular do destaque, para quem o exibe em tabela em vez de em prosa.
   *
   * Existe porque estava **escrito na marcação** do `portal-avisos-mural`: aviso novo
   * trocaria o texto e deixaria os números velhos na tela, sem nada reclamar. Achado ao
   * gerar a vitrine pública, quando a troca de conteúdo não alcançou aqueles dois campos.
   */
  dados: [
    { rotulo: 'anterior', valor: '00.394.411/0001-09', revogado: true },
    { rotulo: 'em vigor', valor: '26.994.558/0001-23', revogado: false },
  ],
} as const

/** Comunicados recentes, do mais novo para o mais antigo. */
export const AVISOS: readonly Aviso[] = [
  {
    id: 'comunicacao-automatica-agravo-instrumento',
    data: '2026-09-03',
    categoria: 'automacao',
    titulo: 'Comunicação automática de agravo de instrumento',
    resumo:
      'Após o protocolo no 2º grau, o PJe passa a juntar automaticamente uma informação ' +
      'no processo de origem, com o número do agravo.',
  },
  {
    id: 'prioridade-por-idade-no-protocolo',
    data: '2026-09-02',
    categoria: 'melhoria',
    titulo: 'Prioridade por idade identificada no protocolo',
    resumo:
      'Nos processos novos de 1º grau, o fluxo inclui automaticamente prioridade para ' +
      'pessoas com 60 anos ou mais, com tratamento específico para maiores de 80 anos.',
  },
  {
    id: 'modelos-do-plantao-judiciario',
    data: '2026-09-01',
    categoria: 'orientacao',
    titulo: 'Modelos destinados ao plantão judiciário',
    resumo:
      'Para facilitar a localização, os modelos devem receber nomes específicos com o ' +
      'termo “plantão” e ser cadastrados na localização adequada à abrangência pretendida.',
  },
  {
    id: 'api-de-etiquetas-liberada-novamente',
    data: '2026-08-28',
    categoria: 'melhoria',
    titulo: 'API de etiquetas será liberada novamente',
    resumo:
      'Após ajustes e acompanhamento técnico, a API criada para apoiar automações de ' +
      'inclusão e remoção de etiquetas voltará a ser disponibilizada ao Nugep.',
  },
  {
    id: 'execucoes-fiscais-de-baixo-valor',
    data: '2026-08-20',
    categoria: 'automacao',
    titulo: 'Fluxo automatizado para execuções fiscais de baixo valor',
    resumo:
      'Processos aptos são encaminhados ao fluxo de sentença, com validações automáticas ' +
      'no próprio PJe e possibilidade de cancelamento pelo juízo.',
  },
]

/*
 * Datas: o texto é sempre em pt-BR e sempre em UTC. As datas acima são dias de
 * calendário, não instantes — sem fixar o fuso, um navegador a oeste de Greenwich
 * exibiria o dia anterior.
 */
const DIA = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: 'UTC' })
const MES_CURTO = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
const ANO = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'UTC' })
const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

function comoData(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/** `3 set.` — o par curto que a coluna de data exibe. */
export function diaEMes(iso: string): string {
  const data = comoData(iso)
  return `${DIA.format(data)} ${MES_CURTO.format(data)}`
}

/** `2026` */
export function ano(iso: string): string {
  return ANO.format(comoData(iso))
}

/** `7 de setembro de 2026` — forma lida por leitor de tela e usada no rodapé. */
export function dataLonga(iso: string): string {
  return DATA_LONGA.format(comoData(iso))
}

/** Data do aviso mais recente, seja ele o destaque ou um da lista. */
export function ultimaAtualizacao(): string {
  return [DESTAQUE.data, ...AVISOS.map((aviso) => aviso.data)].sort().at(-1) ?? DESTAQUE.data
}

/** `03/09` — forma curta que a coluna de data da tabela exibe. */
export function dataCurta(iso: string): string {
  const data = comoData(iso)
  const dia = String(data.getUTCDate()).padStart(2, '0')
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

/**
 * Quantos avisos há em cada categoria, mais o total. Alimenta a coluna de recorte.
 *
 * Conta só o que está na lista. O destaque fica fora porque ele não é filtrável — está
 * sempre no topo —, e somá-lo faria a conta não fechar com o que a tela mostra.
 */
export function contagemPorCategoria(): { chave: Categoria | 'todos'; rotulo: string; total: number }[] {
  return [
    { chave: 'todos', rotulo: 'todos', total: AVISOS.length },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((chave) => ({
      chave,
      rotulo: CATEGORIAS[chave].toLowerCase(),
      total: AVISOS.filter((aviso) => aviso.categoria === chave).length,
    })),
  ]
}
