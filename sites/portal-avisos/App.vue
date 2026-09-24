<script setup lang="ts">
import { computed, ref } from 'vue'
import PjeMessage from '@shared/components/PjeMessage.vue'
import PjePanel from '@shared/components/PjePanel.vue'
import { enumParam } from '@shared/iframe'
import AvisoItem from './AvisoItem.vue'
import {
  AVISOS,
  CATEGORIAS,
  type Categoria,
  dataLonga,
  DESTAQUE,
  ultimaAtualizacao,
} from './avisos'

/*
 * Portal de avisos do PJe — primeira página do canal.
 *
 * A estrutura veio de um rascunho com identidade própria (faixa azul-marinho, cartões
 * arredondados, laranja de destaque). Aqui ela é a mesma, mas a roupa é a do PJe: nada
 * de cor, fonte ou espaçamento literal, só `var(--pje-*)` de `src/shared/tokens.css`
 * (Constituição, Princípio IV). O destaque, que no rascunho era um cartão com barra
 * laranja, é a faixa de aviso do próprio PJe — que é onde o sistema põe o que precisa
 * ser lido antes do resto.
 *
 * Não há aviso de "página aberta fora do PJe", ao contrário de `painel-exemplo`: a
 * página funciona igual dentro e fora do iframe (Princípio III), e para quem lê
 * comunicados esse recado seria ruído. O que muda fora do iframe é só o envio de
 * altura, feito em `main.ts`.
 */

const CHAVES = Object.keys(CATEGORIAS) as Categoria[]

/**
 * Filtro inicial. Vem da URL para o PJe poder apontar direto para uma categoria
 * (`?categoria=melhoria`), e a lista fechada de `enumParam` é o que torna esse
 * parâmetro seguro: valor desconhecido cai em `todos` em vez de vazar para a tela.
 */
const filtro = ref<Categoria | 'todos'>(enumParam('categoria', CHAVES) ?? 'todos')

const visiveis = computed(() =>
  filtro.value === 'todos' ? AVISOS : AVISOS.filter((aviso) => aviso.categoria === filtro.value),
)

const atualizadoEm = dataLonga(ultimaAtualizacao())

function rotuloDoTotal(quantidade: number): string {
  return quantidade === 1 ? '1 comunicado exibido' : `${quantidade} comunicados exibidos`
}
</script>

<template>
  <PjePanel titulo="Avisos do PJe">
    <template #aviso>
      <PjeMessage tipo="aviso">
        <p class="destaque__meta">
          <span class="destaque__etiqueta">Atenção</span>
          <time :datetime="DESTAQUE.data">{{ dataLonga(DESTAQUE.data) }}</time>
        </p>
        <h2 :id="DESTAQUE.id" class="destaque__titulo">{{ DESTAQUE.titulo }}</h2>
        <p>{{ DESTAQUE.resumo }}</p>
        <p class="destaque__mudanca"><strong>O que muda:</strong> {{ DESTAQUE.mudanca }}</p>
      </PjeMessage>
    </template>

    <section aria-labelledby="comunicados">
      <header class="secao">
        <h2 id="comunicados" class="secao__titulo">Comunicados recentes</h2>
        <p class="secao__nota">Melhorias, orientações e mudanças operacionais</p>
      </header>

      <!-- Botão, não link: filtrar não navega. `aria-pressed` é o que informa o
           estado, porque a cor sozinha não informa nada a quem não a vê. -->
      <div class="filtros" role="group" aria-label="Filtrar comunicados por categoria">
        <button
          type="button"
          class="filtro"
          :aria-pressed="filtro === 'todos'"
          @click="filtro = 'todos'"
        >
          Todos
        </button>
        <button
          v-for="(rotulo, chave) in CATEGORIAS"
          :key="chave"
          type="button"
          class="filtro"
          :aria-pressed="filtro === chave"
          @click="filtro = chave"
        >
          {{ rotulo }}
        </button>
      </div>

      <p class="apenas-leitor" role="status">{{ rotuloDoTotal(visiveis.length) }}</p>

      <ul v-if="visiveis.length > 0" class="lista">
        <AvisoItem v-for="aviso in visiveis" :key="aviso.id" :aviso="aviso" />
      </ul>

      <p v-else class="vazio">Nenhum comunicado nesta categoria.</p>
    </section>

    <template #rodape>
      Avisos operacionais do PJe na Justiça Federal da 1ª Região · Atualizado em
      {{ atualizadoEm }}
    </template>
  </PjePanel>
</template>

<style scoped>
.destaque__meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--pje-esp-2);
  font-size: var(--pje-texto-sm);
}

/* Dentro da faixa, a etiqueta usa a cor de link da própria faixa — a variante
   escurecida que o portão de contraste já mede. */
.destaque__etiqueta {
  border: 1px solid currentcolor;
  border-radius: var(--pje-raio);
  color: var(--pje-aviso-link);
  font-weight: 700;
  padding: 0 var(--pje-esp-2);
}

.destaque__titulo {
  font-size: var(--pje-texto-titulo);
  font-weight: 600;
  line-height: var(--pje-linha-apertada);
  margin: var(--pje-esp-2) 0;
}

.destaque__mudanca {
  margin-top: var(--pje-esp-2);
}

.secao {
  border-bottom: 1px solid var(--pje-borda);
  margin-bottom: var(--pje-esp-3);
  padding-bottom: var(--pje-esp-2);
}

.secao__titulo {
  color: var(--pje-texto);
  font-size: var(--pje-texto-titulo);
  font-weight: 600;
  line-height: var(--pje-linha-apertada);
}

.secao__nota {
  color: var(--pje-texto-suave);
  font-size: var(--pje-texto-sm);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pje-esp-2);
  margin-bottom: var(--pje-esp-3);
}

/* Borda na cor da barra do PJe: é cor do sistema, alcança 3:1 sobre o cartão e é
   o que dá contorno visível ao controle. */
.filtro {
  background: var(--pje-superficie);
  border: 1px solid var(--pje-barra);
  border-radius: var(--pje-raio);
  color: var(--pje-link);
  cursor: pointer;
  font-family: var(--pje-fonte);
  font-size: var(--pje-texto-base);
  font-weight: 600;
  min-height: var(--pje-esp-6);
  padding: var(--pje-esp-1) var(--pje-esp-3);
}

.filtro:hover {
  border-color: var(--pje-link-hover);
  color: var(--pje-link-hover);
}

.filtro[aria-pressed='true'] {
  background: var(--pje-barra);
  color: var(--pje-sobre-marca);
}

.lista {
  border: 1px solid var(--pje-borda);
  border-radius: var(--pje-raio);
  list-style: none;
  margin: 0;
  padding: 0;
}

.lista > :nth-child(even) {
  background: var(--pje-listra);
}

.lista > * + * {
  border-top: 1px solid var(--pje-borda);
}

.vazio {
  border: 1px dashed var(--pje-borda);
  border-radius: var(--pje-raio);
  color: var(--pje-texto-suave);
  padding: var(--pje-esp-5);
  text-align: center;
}
</style>
