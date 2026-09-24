<script setup lang="ts">
import { computed } from 'vue'
import PjeDefinitionList from '@shared/components/PjeDefinitionList.vue'
import PjeMessage from '@shared/components/PjeMessage.vue'
import PjePanel from '@shared/components/PjePanel.vue'
import type { Item } from '@shared/components/types'
import { enumParam, isEmbedded, processNumberParam, textParam } from '@shared/iframe'

/*
 * Site de exemplo — o molde para os demais. Demonstra as quatro coisas que todo site
 * deste repositório precisa fazer:
 *
 *   1. ler contexto da URL como entrada não confiável (`@shared/iframe`);
 *   2. vestir a identidade do PJe só por tokens (`@shared/tokens.css`);
 *   3. funcionar aberto fora do iframe, sem quebrar;
 *   4. informar a própria altura ao PJe (feito em `main.ts`).
 */

/** Classes aceitas. Lista fechada: é a forma mais segura de receber contexto. */
const CLASSES = {
  civel: 'Cível',
  criminal: 'Criminal',
  'execucao-fiscal': 'Execução fiscal',
  previdenciario: 'Previdenciário',
} as const

const numeroProcesso = processNumberParam()
const orgao = textParam('orgao', 80)
const classe = enumParam('classe', Object.keys(CLASSES) as (keyof typeof CLASSES)[])

const embutido = isEmbedded()
const semContexto = computed(() => numeroProcesso === null && orgao === null && classe === null)

const itens = computed<Item[]>(() => [
  {
    rotulo: 'Processo',
    valor: numeroProcesso ?? 'Não informado',
    mono: numeroProcesso !== null,
    ausente: numeroProcesso === null,
  },
  {
    rotulo: 'Órgão julgador',
    valor: orgao ?? 'Não informado',
    ausente: orgao === null,
  },
  {
    rotulo: 'Classe judicial',
    valor: classe === null ? 'Não informada' : CLASSES[classe],
    ausente: classe === null,
  },
])

const EXEMPLO_URL =
  '?numeroProcesso=0001234-56.2026.4.01.3400&orgao=1ª Vara Federal Cível da SJDF&classe=previdenciario'
</script>

<template>
  <PjePanel titulo="Painel de exemplo">
    <template v-if="semContexto || !embutido" #aviso>
      <PjeMessage v-if="semContexto" tipo="info">
        Nenhum parâmetro de contexto foi recebido. A página está no estado vazio, que é
        previsto — não é falha.
        <a :href="EXEMPLO_URL">Abrir com um processo de exemplo</a>.
      </PjeMessage>
      <PjeMessage v-if="!embutido" tipo="aviso">
        Página aberta fora do PJe. O conteúdo é o mesmo de dentro do iframe; apenas o
        aviso de altura não é enviado, porque não há página hospedeira para recebê-lo.
      </PjeMessage>
    </template>

    <PjeDefinitionList titulo="Dados do processo" :itens="itens" />

    <p class="nota">
      Todo valor acima veio da URL e foi validado antes de ser exibido. O que não passa na
      validação aparece como <em>não informado</em> — nunca é exibido cru.
    </p>

    <template #rodape>
      Site estático. Não guarda dado, não usa cookie e não depende da sessão do PJe.
    </template>
  </PjePanel>
</template>

<style scoped>
.nota {
  color: var(--pje-texto-suave);
  font-size: var(--pje-texto-sm);
  margin-top: var(--pje-esp-3);
}
</style>
