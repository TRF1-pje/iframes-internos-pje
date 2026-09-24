<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tipo?: 'info' | 'aviso' | 'erro' | 'sucesso'
  }>(),
  { tipo: 'info' },
)

/* Erro interrompe: precisa ser anunciado na hora. O resto é educado e espera. */
const papel = computed(() => (props.tipo === 'erro' ? 'alert' : 'status'))
</script>

<template>
  <!-- Mesma forma das faixas do PJe: borda de 1px em toda a volta, sem barra
       lateral de destaque. A paleta é a do Bootstrap 3, que é a que o PJe usa. -->
  <div class="faixa" :class="`faixa--${tipo}`" :role="papel">
    <slot />
  </div>
</template>

<style scoped>
.faixa {
  border: 1px solid;
  border-radius: var(--pje-raio-faixa);
  padding: var(--pje-esp-3) var(--pje-esp-4);
}

.faixa--info {
  background: var(--pje-info-fundo);
  border-color: var(--pje-info-borda);
  color: var(--pje-info-texto);
}

.faixa--aviso {
  background: var(--pje-aviso-fundo);
  border-color: var(--pje-aviso-borda);
  color: var(--pje-aviso-texto);
}

.faixa--erro {
  background: var(--pje-erro-fundo);
  border-color: var(--pje-erro-borda);
  color: var(--pje-erro-texto);
}

.faixa--sucesso {
  background: var(--pje-sucesso-fundo);
  border-color: var(--pje-sucesso-borda);
  color: var(--pje-sucesso-texto);
}

.faixa :deep(strong) {
  font-weight: 700;
}

/* Link dentro de faixa usa a variante escurecida da própria faixa — é o
   `.alert-link` do Bootstrap, e sem ele o azul normal reprova em AA. */
.faixa :deep(a) {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.faixa--info :deep(a) {
  color: var(--pje-info-link);
}

.faixa--aviso :deep(a) {
  color: var(--pje-aviso-link);
}

.faixa--erro :deep(a) {
  color: var(--pje-erro-link);
}

.faixa--sucesso :deep(a) {
  color: var(--pje-sucesso-link);
}
</style>
