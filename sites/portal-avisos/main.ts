import { createApp } from 'vue'
import { reportHeight } from '@shared/iframe'
import '@shared/base.css'
import App from './App.vue'

/** Slug do site. É o nome da pasta, e é o identificador enviado ao PJe. */
export const SITE = 'portal-avisos'

createApp(App).mount('#app')

// Informa a altura ao PJe. Fora de um iframe, não faz nada.
reportHeight(SITE)
