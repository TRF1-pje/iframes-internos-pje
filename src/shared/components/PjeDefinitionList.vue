<script setup lang="ts">
import type { Item } from './types'

defineProps<{
  itens: readonly Item[]
  /** Título da seção, no estilo dos cabeçalhos de tabela do PJe. */
  titulo?: string
}>()
</script>

<template>
  <!-- Tabela de dados no padrão do PJe: cabeçalho em cinza sem fundo colorido,
       linhas separadas por 1px e listra alternada discreta. -->
  <table class="tabela">
    <caption v-if="titulo" class="tabela__titulo">{{ titulo }}</caption>
    <tbody>
      <tr v-for="item in itens" :key="item.rotulo">
        <th scope="row" class="tabela__rotulo">{{ item.rotulo }}</th>
        <td
          class="tabela__valor"
          :class="{ 'tabela__valor--mono': item.mono, 'tabela__valor--ausente': item.ausente }"
        >
          {{ item.valor }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.tabela {
  border-collapse: collapse;
  width: 100%;
}

.tabela__titulo {
  border-bottom: 1px solid var(--pje-borda);
  color: var(--pje-texto-suave);
  font-size: var(--pje-texto-base);
  font-weight: 600;
  padding-bottom: var(--pje-esp-2);
  text-align: left;
}

.tabela tr:nth-child(even) {
  background: var(--pje-listra);
}

.tabela__rotulo,
.tabela__valor {
  border-bottom: 1px solid var(--pje-borda);
  padding: var(--pje-esp-2) var(--pje-esp-3);
  text-align: left;
  vertical-align: top;
}

.tabela__rotulo {
  color: var(--pje-texto-rotulo);
  font-weight: 600;
  width: var(--pje-largura-rotulo);
}

.tabela__valor {
  overflow-wrap: anywhere;
}

.tabela__valor--mono {
  font-family: var(--pje-fonte-mono);
}

.tabela__valor--ausente {
  color: var(--pje-texto-suave);
  font-style: italic;
}

@media (max-width: 560px) {
  .tabela,
  .tabela tbody,
  .tabela tr,
  .tabela__rotulo,
  .tabela__valor {
    display: block;
    width: auto;
  }

  .tabela__rotulo {
    border-bottom: 0;
    padding-bottom: 0;
  }
}
</style>
