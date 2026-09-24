import js from '@eslint/js'
import typescript from '@vue/eslint-config-typescript'
import sonarjs from 'eslint-plugin-sonarjs'
import vue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist/**', 'node_modules/**', '.agents/**', '.specify/**', '.claude/**'] },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...typescript(),
  // Regras do SonarJS rodando como ESLint: o mesmo analisador do Sonar para JS/TS, sem
  // depender de servidor.
  sonarjs.configs.recommended,
  {
    // Modelo de ameaça, não preguiça: ReDoS pressupõe entrada de terceiro. Estes scripts
    // são portões de build que leem arquivo NOSSO do próprio repositório — tokens.css e
    // afins. Não há entrada hostil para explodir o backtracking.
    //
    // A regra fica LIGADA em src/, que é onde entrada não confiável realmente chega (parâmetro
    // de URL, Princípio III). Medi antes de decidir: nove variantes das regex apontadas foram
    // testadas, inclusive uma sem ambiguidade real, e a regra reprovou todas as nove — não
    // existe reescrita que a satisfaça, só contorção.
    files: ['scripts/**/*.mjs'],
    rules: {
      'sonarjs/super-linear-regex': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'vue/multi-word-component-names': 'off',
      // Regras de formatação de template: ruído sem ganho. A formatação é do editor.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
  {
    // Scripts de apoio rodam no Node, fora do bundle.
    files: ['scripts/**/*.mjs', '*.config.js'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', Buffer: 'readonly' },
    },
    rules: {
      'no-console': 'off',
    },
  },
]
