# DOM property assignment enables innerHTML XSS via props

## Estado del claim contra el repo actual

**Aplica.** Props peligrosas como `innerHTML`, `outerHTML` o `srcdoc` pueden asignarse como propiedades DOM si el nombre existe en el nodo y el valor proviene de input no confiable.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta si props no confiables llegan a elementos DOM; Media si las props son controladas por código de aplicación.
- **Confianza:** Alta sobre el comportamiento de asignación; Media-Alta sobre XSS, dependiente de fuente de input y tipo de prop/elemento.

## Resumen ejecutivo

`sharedSetAttribute` trata funciones como listeners, pero para otros valores verifica `name in newVnodeDom`; si es verdadero y no es SVG, asigna `newVnodeDom[name] = value`. Esto permite que props con semántica HTML activa (`innerHTML`, `outerHTML`, `srcdoc`, entre otras) se apliquen como propiedades DOM. Si esas props se construyen desde input no confiable, pueden introducir DOM XSS.

## Evidencia repo-first

- `lib/index.ts:649-669`: `sharedSetAttribute` asigna `newVnodeDom[name] = value` cuando `!newVnode.isSVG && name in newVnodeDom`.
- `lib/index.ts:672-676`: `setAttribute` actualiza props y llama a `sharedSetAttribute`.
- `lib/index.ts:679-706`: `updateAttributes` aplica props/directives y llama a `sharedSetAttribute` para props no reservadas.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. La aplicación permite que input no confiable controle nombres/valores de props o mezcla objetos de props externos en VNodes.
2. El prop coincide con una propiedad DOM peligrosa existente (`innerHTML`, `outerHTML`, `srcdoc`, etc.).
3. El valor contiene HTML/JS activo interpretable por el navegador.

El riesgo es mayor en componentes que hacen spread de props de usuario o transforman JSON/configuración externa a VNodes.

## Impacto

- DOM XSS por asignación de `innerHTML`/`outerHTML`.
- XSS en iframes vía `srcdoc`.
- Posible bypass de expectativas de escape del sistema VDOM.

## Duplicados o relación con otros claims

- Claim 8 es duplicado de este claim.
- Claim 12 también es duplicado de este claim.
- Relacionado con claim 5/9, pero la causa aquí es asignación de props DOM, no `trust()`/`v-html`.

## Riesgo residual

Aunque frameworks suelen permitir propiedades DOM por ergonomía, dejar propiedades peligrosas sin guardrails aumenta el riesgo de mal uso en componentes genéricos.

## Recomendación de fix o decisión

**Request changes.** Recomendado:

- Bloquear o advertir por defecto sobre `innerHTML`, `outerHTML`, `srcdoc` y propiedades peligrosas similares cuando se usan como props normales.
- Exigir API explícita tipo `trust()` para HTML raw.
- Documentar que props DOM no deben construirse desde input no confiable.
- Agregar tests para props peligrosas en DOM browser y SSR si aplica.

## Validación realizada o disponible

- Validación disponible: renderizar un elemento con `{ innerHTML: "<img src=x onerror=...>" }` y confirmar asignación; luego verificar fix esperado.
- No se ejecutó nueva validación en esta sesión; el análisis se basa en código fuente y contexto validado previamente.

## Fuentes

1. `lib/index.ts:649-669`
2. `lib/index.ts:672-676`
3. `lib/index.ts:679-706`
