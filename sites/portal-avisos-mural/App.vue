<script setup lang="ts">
import { computed, ref } from 'vue'
import { enumParam } from '@shared/iframe'
import {
  AVISOS,
  CATEGORIAS,
  type Categoria,
  contagemPorCategoria,
  dataCurta,
  dataLonga,
  DESTAQUE,
  ultimaAtualizacao,
} from './avisos'

/*
 * Candidato de visual "mural técnico" (Constituição, Princípio IV, regime B).
 *
 * A aposta: parecer instrumento de trabalho, não tela de sistema nem página de notícia.
 * Tabela de verdade com colunas fixas, número tabular, mono para metadado, e a etiqueta
 * ATENÇÃO montada sobre a borda do quadro como em documento técnico. Densidade é o
 * desenho — não sobra espaço para enfeite, e é isso que o distingue do que a ferramenta
 * de IA entrega por padrão.
 *
 * Nada de `src/shared/components/`: aqueles são vocabulário do PJe, e este site não está
 * no skin do PJe.
 */

const CHAVES = Object.keys(CATEGORIAS) as Categoria[]

/** Filtro inicial vem da URL, para o PJe poder apontar direto para uma categoria. */
const filtro = ref<Categoria | 'todos'>(enumParam('categoria', CHAVES) ?? 'todos')

const visiveis = computed(() =>
  filtro.value === 'todos' ? AVISOS : AVISOS.filter((aviso) => aviso.categoria === filtro.value),
)

const recortes = contagemPorCategoria()
const atualizadoEm = dataLonga(ultimaAtualizacao())

function total(quantidade: number): string {
  return quantidade === 1 ? '1 comunicado exibido' : `${quantidade} comunicados exibidos`
}
</script>

<template>
  <div class="quadro">
    <header class="cabeca">
      <div class="cabeca__nome">
        <h1 class="cabeca__titulo">Avisos do PJe</h1>
        <p class="cabeca__subtitulo">quadro de avisos operacionais</p>
      </div>
      <p class="cabeca__orgao">JF1 · ASGEN</p>
    </header>

    <!-- Faixa de estado: o que a página sabe sobre si mesma, em uma linha. -->
    <dl class="estado">
      <div class="estado__item">
        <dt>atualizado</dt>
        <dd>{{ atualizadoEm }}</dd>
      </div>
      <div class="estado__item">
        <dt>comunicados</dt>
        <dd>{{ String(AVISOS.length).padStart(2, '0') }}</dd>
      </div>
      <div class="estado__item">
        <dt>fonte</dt>
        <dd>[ato de referência]</dd>
      </div>
    </dl>

    <!-- Destaque. A etiqueta sobe sobre a borda: é o recurso que o desenho usa em vez
         de cartão com sombra. -->
    <section class="destaque" aria-labelledby="destaque-titulo">
      <p class="destaque__etiqueta">ATENÇÃO</p>

      <div class="destaque__corpo">
        <div>
          <h2 id="destaque-titulo" class="destaque__titulo">{{ DESTAQUE.titulo }}</h2>
          <p class="destaque__texto">{{ DESTAQUE.resumo }}</p>
          <p class="destaque__texto">
            <strong>O que muda:</strong> {{ DESTAQUE.mudanca }}
          </p>
        </div>

        <!-- Vem de `DESTAQUE.dados`, não da marcação: com o valor escrito aqui, aviso
             novo trocaria o texto e deixaria o número velho na tela. -->
        <dl class="cnpj">
          <div v-for="dado in DESTAQUE.dados" :key="dado.rotulo" class="cnpj__linha">
            <dt>{{ dado.rotulo }}</dt>
            <dd :class="dado.revogado ? 'cnpj__revogado' : 'cnpj__vigente'">{{ dado.valor }}</dd>
          </div>
          <p class="cnpj__nota">
            vigência a partir de
            <time :datetime="DESTAQUE.data">{{ dataLonga(DESTAQUE.data) }}</time>
          </p>
        </dl>
      </div>
    </section>

    <div class="painel">
      <section aria-labelledby="lista-titulo">
        <h2 id="lista-titulo" class="apenas-leitor">Comunicados recentes</h2>
        <p class="apenas-leitor" role="status">{{ total(visiveis.length) }}</p>

        <div class="tabela__cabeca" aria-hidden="true">
          <span>DATA</span>
          <span>CATEGORIA</span>
          <span>ASSUNTO</span>
        </div>

        <ul v-if="visiveis.length > 0" class="tabela">
          <li v-for="aviso in visiveis" :id="aviso.id" :key="aviso.id" class="linha">
            <time class="linha__data" :datetime="aviso.data">
              {{ dataCurta(aviso.data) }}
              <span class="apenas-leitor">{{ dataLonga(aviso.data) }}</span>
            </time>
            <span class="linha__categoria">{{ CATEGORIAS[aviso.categoria].toUpperCase() }}</span>
            <div>
              <h3 class="linha__titulo">{{ aviso.titulo }}</h3>
              <p class="linha__resumo">{{ aviso.resumo }}</p>
            </div>
          </li>
        </ul>

        <p v-else class="vazio">Nenhum comunicado nesta categoria.</p>
      </section>

      <section class="recorte" aria-labelledby="recorte-titulo">
        <h2 id="recorte-titulo" class="recorte__cabeca">RECORTE</h2>
        <ul class="recorte__lista">
          <li v-for="item in recortes" :key="item.chave">
            <button
              type="button"
              class="recorte__botao"
              :aria-pressed="filtro === item.chave"
              @click="filtro = item.chave"
            >
              <span>{{ item.rotulo }}</span>
              <span>{{ String(item.total).padStart(2, '0') }}</span>
            </button>
          </li>
        </ul>
        <p class="recorte__contato">Dúvidas<br />[contato da Asgen]</p>
      </section>
    </div>

    <footer class="rodape">
      <p>ASGEN · TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO</p>
      <p>ARQUIVO COMPLETO · [LINK INTERNO]</p>
    </footer>
  </div>
</template>

<style scoped>
.quadro {
  padding: var(--mural-esp-6) var(--mural-esp-7) var(--mural-esp-6);
}

/* Cabeça */
.cabeca {
  align-items: baseline;
  display: flex;
  gap: var(--mural-esp-5);
  justify-content: space-between;
}

.cabeca__nome {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: var(--mural-esp-3);
}

.cabeca__titulo {
  font-size: var(--mural-texto-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: var(--mural-linha-apertada);
}

.cabeca__subtitulo {
  color: var(--mural-texto-suave);
  font-family: var(--mural-fonte-mono);
  font-size: 11px;
}

.cabeca__orgao {
  color: var(--mural-texto);
  font-family: var(--mural-fonte-mono);
  font-size: 11px;
}

/* Faixa de estado */
.estado {
  border-bottom: 1px solid var(--mural-fio);
  border-top: 2px solid var(--mural-fio-forte);
  display: flex;
  flex-wrap: wrap;
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-xs);
  margin-top: var(--mural-esp-3);
}

.estado__item {
  border-left: 1px solid var(--mural-fio);
  color: var(--mural-texto);
  display: flex;
  gap: var(--mural-esp-2);
  padding: 9px var(--mural-esp-4);
}

.estado__item:first-child {
  border-left: 0;
  padding-left: 0;
}

.estado dt {
  color: var(--mural-texto-suave);
}

/* Destaque */
.destaque {
  border: 1px solid var(--mural-atencao);
  margin-top: var(--mural-esp-5);
  padding: 0 var(--mural-esp-5) var(--mural-esp-5);
}

.destaque__etiqueta {
  background: var(--mural-papel);
  color: var(--mural-atencao);
  display: inline-block;
  font-family: var(--mural-fonte-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  /* Sobe meia altura de linha para cavalgar a borda do quadro. */
  margin-top: -8px;
  padding: 0 var(--mural-esp-2) 0 var(--mural-esp-1);
}

.destaque__corpo {
  align-items: start;
  display: grid;
  gap: var(--mural-esp-6);
  grid-template-columns: minmax(0, 1fr) 320px;
  padding-top: var(--mural-esp-3);
}

.destaque__titulo {
  font-size: var(--mural-texto-lg);
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: var(--mural-linha-apertada);
  margin-bottom: var(--mural-esp-2);
  text-wrap: pretty;
}

.destaque__texto {
  color: var(--mural-texto);
  text-wrap: pretty;
}

.destaque__texto + .destaque__texto {
  margin-top: var(--mural-esp-3);
}

.destaque__texto strong {
  color: var(--mural-tinta);
  font-weight: 600;
}

/* Quadro do CNPJ — dado tabular, em mono, com o valor revogado riscado. */
.cnpj {
  background: var(--mural-superficie);
  border: 1px solid var(--mural-fio);
  font-family: var(--mural-fonte-mono);
}

.cnpj__linha {
  display: grid;
  font-size: var(--mural-texto-sm);
  grid-template-columns: 92px minmax(0, 1fr);
}

.cnpj__linha + .cnpj__linha {
  border-top: 1px solid var(--mural-fio);
}

.cnpj dt {
  color: var(--mural-texto-suave);
  padding: 9px var(--mural-esp-3);
}

.cnpj dd {
  border-left: 1px solid var(--mural-fio);
  margin: 0;
  overflow-wrap: anywhere;
  padding: 9px var(--mural-esp-3);
}

.cnpj__revogado {
  color: var(--mural-texto-suave);
  text-decoration: line-through;
}

.cnpj__vigente {
  font-weight: 600;
}

.cnpj__nota {
  border-top: 1px solid var(--mural-fio);
  color: var(--mural-texto-suave);
  font-size: var(--mural-texto-xs);
  padding: var(--mural-esp-2) var(--mural-esp-3);
}

/* Painel: tabela + recorte */
.painel {
  align-items: start;
  display: grid;
  gap: var(--mural-esp-6);
  grid-template-columns: minmax(0, 1fr) var(--mural-col-recorte);
  margin-top: var(--mural-esp-6);
}

.tabela__cabeca,
.linha {
  display: grid;
  grid-template-columns: var(--mural-col-data) var(--mural-col-categoria) minmax(0, 1fr);
}

.tabela__cabeca {
  border-bottom: 2px solid var(--mural-fio-forte);
  color: var(--mural-texto);
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-xs);
  letter-spacing: 0.06em;
  padding-bottom: 7px;
}

.tabela {
  list-style: none;
}

.linha {
  align-items: start;
  border-bottom: 1px solid var(--mural-fio);
  padding: var(--mural-esp-4) 0;
}

.linha__data {
  color: var(--mural-texto);
  font-family: var(--mural-fonte-mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

.linha__categoria {
  color: var(--mural-categoria);
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-xs);
  letter-spacing: 0.04em;
  padding-top: 2px;
}

.linha__titulo {
  font-size: var(--mural-texto-md);
  font-weight: 600;
  line-height: var(--mural-linha-apertada);
  margin-bottom: var(--mural-esp-1);
  text-wrap: pretty;
}

.linha__resumo {
  color: var(--mural-texto);
  font-size: 14px;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.vazio {
  border-bottom: 1px solid var(--mural-fio);
  color: var(--mural-texto-suave);
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-sm);
  padding: var(--mural-esp-6) 0;
  text-align: center;
}

/* Recorte — filtro como lista de contagens, não como pílula. */
.recorte__cabeca {
  border-bottom: 2px solid var(--mural-fio-forte);
  color: var(--mural-texto);
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-xs);
  font-weight: 400;
  letter-spacing: 0.06em;
  padding-bottom: 7px;
}

.recorte__lista {
  list-style: none;
}

/* O contorno usa `--mural-contorno-controle`, não o fio da tabela: é botão, e contorno de
   controle vale 3:1 (Princípio VIII). Ver a nota do token. */
.recorte__botao {
  background: none;
  border: 0;
  border-bottom: 1px solid var(--mural-contorno-controle);
  color: var(--mural-texto);
  cursor: pointer;
  display: flex;
  font-family: var(--mural-fonte-mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  gap: var(--mural-esp-2);
  justify-content: space-between;
  padding: 9px 0;
  text-align: left;
  width: 100%;
}

.recorte__botao:hover {
  color: var(--mural-tinta);
}

/* Selecionado por peso e cor de tinta, não por preenchimento: a lista continua lista. */
.recorte__botao[aria-pressed='true'] {
  color: var(--mural-tinta);
  font-weight: 600;
}

.recorte__contato {
  color: var(--mural-texto-suave);
  font-family: var(--mural-fonte-mono);
  font-size: 10.5px;
  line-height: 1.7;
  margin-top: var(--mural-esp-5);
}

/* Rodapé */
.rodape {
  border-top: 1px solid var(--mural-fio);
  color: var(--mural-texto-suave);
  display: flex;
  flex-wrap: wrap;
  font-family: var(--mural-fonte-mono);
  font-size: var(--mural-texto-xs);
  gap: var(--mural-esp-3);
  justify-content: space-between;
  margin-top: var(--mural-esp-6);
  padding-top: var(--mural-esp-3);
}

/* Fora do iframe largo, ou em janela estreita, as duas grades de duas colunas viram uma.
   A tabela vira lista: a data e a categoria sobem como cabeçalho da linha. */
@media (max-width: 860px) {
  .quadro {
    padding: var(--mural-esp-5) var(--mural-esp-4);
  }

  .destaque__corpo,
  .painel {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 620px) {
  .tabela__cabeca {
    display: none;
  }

  .linha {
    gap: var(--mural-esp-1);
    grid-template-columns: minmax(0, 1fr);
  }

  .linha__data,
  .linha__categoria {
    display: inline;
    padding-top: 0;
  }
}
</style>
