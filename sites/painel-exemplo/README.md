# painel-exemplo

Site de exemplo e molde para os demais. Copie esta pasta para criar um site novo
(ou rode `npm run novo-site <slug>`), e nada além disso precisa ser registrado —
o Vite descobre as entradas varrendo `sites/*/index.html`.

## Parâmetros aceitos

| Parâmetro         | Validação                                    | Ausente |
|-------------------|----------------------------------------------|---------|
| `numeroProcesso`  | padrão CNJ `NNNNNNN-DD.AAAA.J.TR.OOOO`       | exibe "não informado" |
| `orgao`           | texto até 80 caracteres, sem controle        | exibe "não informado" |
| `classe`          | `civel`, `criminal`, `execucao-fiscal`, `previdenciario` | exibe "não informada" |

## Como o PJe embute

```html
<iframe
  src="https://SERVIDOR/sites/painel-exemplo/?numeroProcesso=0000000-00.2026.4.01.0000"
  title="Painel de exemplo"
  style="width: 100%; border: 0"
  height="200"
></iframe>
```

A página informa a própria altura por `postMessage`. O código que o lado do PJe precisa ter
está inteiro em [`docs/host-de-teste.html`](../../docs/host-de-teste.html) — abra esse arquivo
depois de um `npm run build` para ver o iframe crescendo e encolhendo de verdade, em vez de
confiar no trecho colado abaixo.

```js
window.addEventListener('message', (evento) => {
  const dados = evento.data
  if (dados?.channel !== 'iframes-internos-pje' || dados.type !== 'resize') return
  document.querySelector(`iframe[data-site="${dados.site}"]`).height = dados.height
})
```
