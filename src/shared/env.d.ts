/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origem do PJe autorizada a receber `postMessage`. Vazio = `'*'`. */
  readonly VITE_PARENT_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
