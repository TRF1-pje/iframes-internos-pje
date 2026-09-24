<script setup lang="ts">
import { type Aviso, ano, CATEGORIAS, dataLonga, diaEMes } from './avisos'

defineProps<{ aviso: Aviso }>()
</script>

<template>
  <!--
    Uma linha da lista, no padrão de tabela do PJe: coluna de data à esquerda,
    separada por 1px, e listra alternada aplicada pela lista que nos contém.

    A data aparece duas vezes de propósito — curta na coluna, longa no `datetime`
    e no rótulo do leitor de tela. `3 set.` é útil para quem varre a lista com o
    olho e ruim para quem a ouve.
  -->
  <li :id="aviso.id" class="aviso">
    <div class="aviso__data">
      <time :datetime="aviso.data">
        <strong>{{ diaEMes(aviso.data) }}</strong>
        <span>{{ ano(aviso.data) }}</span>
        <span class="apenas-leitor">{{ dataLonga(aviso.data) }}</span>
      </time>
    </div>

    <div class="aviso__corpo">
      <span class="aviso__etiqueta">{{ CATEGORIAS[aviso.categoria] }}</span>
      <h3 class="aviso__titulo">{{ aviso.titulo }}</h3>
      <p class="aviso__resumo">{{ aviso.resumo }}</p>
    </div>
  </li>
</template>

<style scoped>
.aviso {
  /* Largura da coluna de data: dimensão de layout deste site, não identidade do
     PJe — por isso fica aqui e não em `tokens.css`. Cabe `28 ago.` sem quebrar. */
  --largura-data: 92px;

  align-items: start;
  display: grid;
  gap: var(--pje-esp-3);
  grid-template-columns: var(--largura-data) minmax(0, 1fr);
  padding: var(--pje-esp-3) var(--pje-esp-4);
}

.aviso__data {
  border-right: 1px solid var(--pje-borda);
  padding-right: var(--pje-esp-3);
}

.aviso__data strong {
  color: var(--pje-texto-rotulo);
  display: block;
  font-weight: 600;
}

.aviso__data span {
  color: var(--pje-texto-suave);
  font-size: var(--pje-texto-sm);
}

.aviso__etiqueta {
  background: var(--pje-fundo);
  border: 1px solid var(--pje-borda);
  border-radius: var(--pje-raio);
  color: var(--pje-texto-rotulo);
  display: inline-block;
  font-size: var(--pje-texto-sm);
  font-weight: 600;
  padding: 0 var(--pje-esp-2);
}

.aviso__titulo {
  color: var(--pje-texto);
  font-size: var(--pje-texto-base);
  font-weight: 600;
  line-height: var(--pje-linha-apertada);
  margin: var(--pje-esp-1) 0 var(--pje-esp-1);
}

.aviso__resumo {
  color: var(--pje-texto-suave);
  overflow-wrap: anywhere;
}

/* Mesmo ponto de quebra de PjeDefinitionList: a coluna de data vira cabeçalho da
   linha, como o rótulo da tabela faz. */
@media (max-width: 560px) {
  .aviso {
    gap: var(--pje-esp-2);
    grid-template-columns: 1fr;
  }

  .aviso__data {
    border-bottom: 1px solid var(--pje-borda);
    border-right: 0;
    padding: 0 0 var(--pje-esp-2);
  }

  .aviso__data strong {
    display: inline;
  }

  .aviso__data strong::after {
    content: " · ";
  }
}
</style>
