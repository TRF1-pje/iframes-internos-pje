import { createApp } from 'vue'
import { reportHeight } from '@shared/iframe'
// Regime B (Princípio IV): reset agnóstico + identidade própria. O skin do PJe
// (`@shared/base.css`) não entra — a ordem dos três imports é a ordem da cascata.
import '@shared/reset.css'
import './tokens.css'
import './base.css'
import App from './App.vue'

/** Slug do site. É o nome da pasta, e é o identificador enviado ao PJe. */
export const SITE = 'portal-avisos-referencia'

createApp(App).mount('#app')

// Informa a altura ao PJe. Fora de um iframe, não faz nada.
reportHeight(SITE)
