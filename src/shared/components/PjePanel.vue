<script setup lang="ts">
defineProps<{
  /** Título da página, exibido na barra do PJe. Texto, nunca HTML. */
  titulo: string
}>()
</script>

<template>
  <!--
    Reproduz a moldura do PJe: barra de título sólida na cor do sistema e conteúdo em
    cartão branco sobre o fundo cinza-azulado, com as faixas de mensagem no topo do
    cartão — que é onde o PJe as põe.

    Sem o logotipo do PJe na barra, de propósito: ele é marca do sistema hospedeiro, e
    repeti-lo dentro da própria página dele duplicaria a identidade em vez de seguir o
    padrão. A barra azul com o título já é o que dá ao painel a cara do sistema.
  -->
  <div class="pje">
    <header class="pje__barra">
      <h1 class="pje__titulo">{{ titulo }}</h1>
    </header>

    <div class="pje__conteudo">
      <section class="pje__cartao">
        <div v-if="$slots.aviso" class="pje__avisos">
          <slot name="aviso" />
        </div>

        <slot />
      </section>

      <p v-if="$slots.rodape" class="pje__rodape">
        <slot name="rodape" />
      </p>
    </div>
  </div>
</template>

<style scoped>
.pje__barra {
  align-items: center;
  background: var(--pje-barra);
  color: var(--pje-sobre-marca);
  display: flex;
  gap: var(--pje-esp-3);
  height: var(--pje-altura-barra);
  padding: 0 var(--pje-esp-4);
}

.pje__titulo {
  font-size: var(--pje-texto-titulo);
  font-weight: 400;
  line-height: var(--pje-linha-apertada);
}

.pje__conteudo {
  padding: var(--pje-esp-3);
}

.pje__avisos {
  display: grid;
  gap: var(--pje-esp-2);
  margin-bottom: var(--pje-esp-4);
}

.pje__cartao {
  background: var(--pje-superficie);
  border: 1px solid var(--pje-borda);
  border-radius: var(--pje-raio);
  box-shadow: var(--pje-sombra);
  padding: var(--pje-esp-4);
}

.pje__rodape {
  color: var(--pje-texto-suave);
  font-size: var(--pje-texto-sm);
  margin-top: var(--pje-esp-3);
  text-align: right;
}
</style>
