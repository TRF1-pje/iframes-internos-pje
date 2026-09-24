<script setup lang="ts">
import { computed, ref } from 'vue'
import { enumParam } from '@shared/iframe'
import {
  ano,
  AVISOS,
  CATEGORIAS,
  type Categoria,
  dataLonga,
  DESTAQUE,
  diaEMes,
  ultimaAtualizacao,
} from './avisos'

/*
 * Portal de avisos, visual "referência" (Constituição, Princípio IV, regime B).
 *
 * É a proposta que o titular enviou, recriada a partir do arquivo dele: mesma estrutura,
 * mesmos valores, agora em tokens e com o conteúdo vindo de `avisos.ts` em vez de escrito
 * na marcação. Foi a direção escolhida entre os três candidatos, em 2026-09-24.
 *
 * Duas diferenças em relação ao original, ambas deliberadas e declaradas:
 *   1. o contorno do botão de filtro escureceu para alcançar 3:1 (ver `tokens.css`);
 *   2. o filtro funciona por estado do Vue, não por `querySelectorAll` e `hidden`.
 */

/** Rótulo plural na barra de filtro, como no original. */
const FILTROS: { chave: Categoria | 'todos'; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'melhoria', rotulo: 'Melhorias' },
  { chave: 'orientacao', rotulo: 'Orientações' },
  { chave: 'automacao', rotulo: 'Automações' },
]

const CHAVES = Object.keys(CATEGORIAS) as Categoria[]
const filtro = ref<Categoria | 'todos'>(enumParam('categoria', CHAVES) ?? 'todos')

const visiveis = computed(() =>
  filtro.value === 'todos' ? AVISOS : AVISOS.filter((aviso) => aviso.categoria === filtro.value),
)

const atualizadoEm = dataLonga(ultimaAtualizacao())
</script>

<template>
  <div class="shell">
    <header class="masthead">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 4h14v16H5z" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </div>
        <div>
          <p class="eyebrow">Justiça Federal da 1ª Região</p>
          <h1>Avisos do PJe</h1>
        </div>
      </div>
      <p class="updated">
        Informações para magistrados e servidores<br />Atualizado em {{ atualizadoEm }}
      </p>
    </header>

    <main>
      <article :id="DESTAQUE.id" class="featured">
        <div class="feature-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 19h14" />
          </svg>
        </div>
        <div>
          <div class="meta">
            <span class="tag tag--important">Atenção</span>
            <time :datetime="DESTAQUE.data">{{ dataLonga(DESTAQUE.data) }}</time>
          </div>
          <h2>{{ DESTAQUE.titulo }}</h2>
          <p>{{ DESTAQUE.resumo }}</p>
          <p class="feature-note"><strong>O que muda:</strong> {{ DESTAQUE.mudanca }}</p>
        </div>
      </article>

      <div class="section-head">
        <div>
          <h2>Comunicados recentes</h2>
          <p>Melhorias, orientações e mudanças operacionais</p>
        </div>
      </div>

      <nav class="filters" aria-label="Filtrar comunicados">
        <button
          v-for="item in FILTROS"
          :key="item.chave"
          type="button"
          class="filter"
          :aria-pressed="filtro === item.chave"
          @click="filtro = item.chave"
        >
          {{ item.rotulo }}
        </button>
      </nav>

      <section class="news-list" aria-live="polite">
        <article v-for="aviso in visiveis" :id="aviso.id" :key="aviso.id" class="news-card">
          <div class="date-block">
            <time :datetime="aviso.data">
              <strong>{{ diaEMes(aviso.data) }}</strong><span>{{ ano(aviso.data) }}</span>
              <span class="apenas-leitor">{{ dataLonga(aviso.data) }}</span>
            </time>
          </div>
          <div class="news-body">
            <span class="tag">{{ CATEGORIAS[aviso.categoria] }}</span>
            <h3>{{ aviso.titulo }}</h3>
            <p>{{ aviso.resumo }}</p>
          </div>
        </article>

        <p v-if="visiveis.length === 0" class="empty">
          Nenhum comunicado encontrado nesta categoria.
        </p>
      </section>
    </main>

    <footer>
      <p><strong>PJe na JF1</strong> · Canal de avisos operacionais</p>
      <p>Uma iniciativa do TRF1, com atuação da Asgen.</p>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  margin: 0 auto;
  padding: var(--ref-esp-5) 0 3rem;
  width: min(100% - 2rem, 1080px);
}

.masthead {
  align-items: center;
  color: var(--ref-sobre-marca);
  display: flex;
  gap: var(--ref-esp-4);
  justify-content: space-between;
  min-height: 7.6rem;
}

.brand {
  align-items: center;
  display: flex;
  gap: 0.9rem;
}

.brand-mark {
  background: var(--ref-marca-fundo);
  border: 1px solid var(--ref-marca-borda);
  border-radius: var(--ref-raio-marca);
  display: grid;
  height: 3rem;
  place-items: center;
  width: 3rem;
}

.brand-mark svg {
  height: 1.75rem;
  width: 1.75rem;
}

.eyebrow {
  color: var(--ref-eyebrow);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  margin-bottom: 0.15rem;
  text-transform: uppercase;
}

h1 {
  font-size: var(--ref-titulo-h1);
  line-height: var(--ref-linha-apertada);
}

.updated {
  color: var(--ref-atualizado);
  font-size: 0.85rem;
  text-align: right;
}

main {
  display: grid;
  gap: var(--ref-esp-5);
}

/* Destaque */
.featured {
  background: var(--ref-branco);
  border: 1px solid var(--ref-laranja-borda);
  border-radius: var(--ref-raio-destaque);
  box-shadow: var(--ref-sombra);
  display: grid;
  gap: var(--ref-esp-4);
  grid-template-columns: 3.2rem 1fr;
  overflow: hidden;
  padding: var(--ref-esp-destaque);
  position: relative;
}

.featured::before {
  background: var(--ref-laranja);
  content: "";
  inset: 0 auto 0 0;
  position: absolute;
  width: 0.35rem;
}

.feature-icon {
  background: var(--ref-laranja-fundo);
  border-radius: 0.8rem;
  color: var(--ref-laranja);
  display: grid;
  height: 3.2rem;
  place-items: center;
  width: 3.2rem;
}

.feature-icon svg {
  height: 1.65rem;
  width: 1.65rem;
}

.meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ref-esp-2) var(--ref-esp-3);
}

.tag {
  align-items: center;
  background: var(--ref-etiqueta-fundo);
  border-radius: var(--ref-raio-etiqueta);
  color: var(--ref-navy);
  display: inline-flex;
  font-size: var(--ref-texto-xs);
  font-weight: 750;
  letter-spacing: 0.03em;
  min-height: 1.65rem;
  padding: 0.18rem 0.55rem;
  text-transform: uppercase;
}

.tag--important {
  background: var(--ref-laranja-fundo);
  color: var(--ref-etiqueta-atencao);
}

time {
  color: var(--ref-suave-texto);
  font-size: 0.84rem;
}

.featured h2 {
  color: var(--ref-navy);
  font-size: var(--ref-titulo-destaque);
  line-height: 1.25;
  margin: 0.55rem 0 0.35rem;
}

.featured p {
  margin: 0;
  max-width: 52rem;
}

.feature-note {
  background: var(--ref-nota-fundo);
  border-left: 3px solid var(--ref-laranja);
  color: var(--ref-nota-texto);
  font-size: 0.93rem;
  margin-top: 0.85rem;
  padding: 0.7rem 0.85rem;
}

/* Cabeça da seção */
.section-head {
  align-items: end;
  display: flex;
  gap: var(--ref-esp-4);
  justify-content: space-between;
  margin-top: 0.35rem;
}

.section-head h2 {
  color: var(--ref-navy);
  font-size: var(--ref-texto-secao);
}

.section-head p {
  color: var(--ref-suave-texto);
  font-size: 0.88rem;
}

/* Filtro */
.filters {
  display: flex;
  gap: var(--ref-esp-2);
  overflow-x: auto;
  padding: 0.15rem 0 var(--ref-esp-1);
  scrollbar-width: thin;
}

.filter {
  background: var(--ref-branco);
  border: 1px solid var(--ref-filtro-borda);
  border-radius: var(--ref-raio-pilula);
  color: var(--ref-filtro-texto);
  cursor: pointer;
  flex: 0 0 auto;
  font-weight: 650;
  min-height: 2.4rem;
  padding: 0.45rem 0.85rem;
}

.filter:hover {
  border-color: var(--ref-azul);
}

.filter[aria-pressed='true'] {
  background: var(--ref-navy);
  border-color: var(--ref-navy);
  color: var(--ref-sobre-marca);
}

/* Lista */
.news-list {
  display: grid;
  gap: var(--ref-esp-3);
}

.news-card {
  align-items: center;
  background: var(--ref-branco);
  border: 1px solid var(--ref-fio);
  border-radius: var(--ref-raio-cartao);
  display: grid;
  gap: var(--ref-esp-4);
  grid-template-columns: var(--ref-col-data) minmax(0, 1fr);
  padding: 1.1rem var(--ref-esp-5);
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.news-card:hover {
  border-color: var(--ref-filtro-borda);
  box-shadow: var(--ref-sombra-cartao);
  transform: translateY(-1px);
}

.date-block {
  border-right: 1px solid var(--ref-fio);
  padding-right: var(--ref-esp-4);
}

.date-block strong {
  color: var(--ref-navy);
  display: block;
  font-size: var(--ref-texto-base);
}

.date-block span {
  color: var(--ref-suave-texto);
  font-size: 0.8rem;
}

.news-body h3 {
  color: var(--ref-navy);
  font-size: 1.04rem;
  line-height: 1.3;
  margin: 0.22rem 0 0.25rem;
}

.news-body p {
  color: var(--ref-suave-texto);
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.empty {
  background: var(--ref-branco);
  border: 1px dashed var(--ref-fio-vazio);
  border-radius: var(--ref-raio-cartao);
  color: var(--ref-suave-texto);
  padding: 2rem;
  text-align: center;
}

/* Rodapé */
footer {
  border-top: 1px solid var(--ref-fio-rodape);
  color: var(--ref-suave-texto);
  display: flex;
  font-size: var(--ref-texto-sm);
  gap: var(--ref-esp-4);
  justify-content: space-between;
  margin-top: var(--ref-esp-6);
  padding: 1.1rem 0.2rem 0;
}

footer strong {
  color: var(--ref-navy);
}

/* Ponto de quebra do original */
@media (max-width: 700px) {
  .shell {
    padding-top: 0.8rem;
    width: min(100% - 1rem, 1080px);
  }

  .masthead {
    min-height: 6.65rem;
  }

  .brand-mark {
    height: 2.65rem;
    width: 2.65rem;
  }

  .updated {
    display: none;
  }

  .featured {
    grid-template-columns: 1fr;
    padding: 1.15rem;
  }

  .feature-icon {
    height: 2.7rem;
    width: 2.7rem;
  }

  .section-head {
    align-items: start;
    flex-direction: column;
    gap: var(--ref-esp-1);
  }

  .news-card {
    gap: 0.7rem;
    grid-template-columns: 1fr;
    padding: var(--ref-esp-4);
  }

  .date-block {
    border-bottom: 1px solid var(--ref-fio);
    border-right: 0;
    padding: 0 0 0.55rem;
  }

  .date-block strong {
    display: inline;
  }

  .date-block strong::after {
    content: " · ";
  }

  footer {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .news-card {
    transition: none;
  }
}
</style>
