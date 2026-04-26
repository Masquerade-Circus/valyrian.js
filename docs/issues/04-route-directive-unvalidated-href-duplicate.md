# Route directive now allows unvalidated URLs in href

## Estado del claim contra el repo actual

**Duplicado.** El comportamiento reportado es el mismo que el claim 2: `v-route`/directiva `route` asigna `href` sin validar.

## Severidad sugerida y confianza

- **Severidad sugerida:** Media, heredada del claim 2.
- **Confianza:** Alta en la duplicidad.

## Resumen ejecutivo

Este claim describe la misma superficie: la directiva `route` asigna el valor `url` directamente al atributo/propiedad `href`. Debe triagearse junto con `02-v-route-unvalidated-href.md` para evitar fixes o tickets duplicados.

## Evidencia repo-first

- `lib/router/index.ts:129-144`: registro de la directiva `route`.
- `lib/router/index.ts:134-135`: `setAttribute("href", url, vnode)` sin validación previa.
- `lib/router/index.ts:551-562`: el click handler no cubre todos los modos de interacción con el enlace.

## Análisis de exploitabilidad y precondiciones

Igual que claim 2:

1. Uso de `v-route` con URL controlable por input no confiable.
2. Navegación o interacción con el `href` resultante.
3. Falta de validación local en consumidor.

## Impacto

Mismo impacto que claim 2: posible DOM XSS vía esquemas peligrosos o navegación externa/open redirect si se aceptan URLs arbitrarias.

## Duplicados o relación con otros claims

- Duplicado directo de `02-v-route-unvalidated-href.md`.

## Riesgo residual

No hay riesgo adicional independiente; el riesgo residual se gestiona resolviendo el claim 2.

## Recomendación de fix o decisión

**Consolidar como duplicado / request changes en claim 2.** No abrir un fix separado.

## Validación realizada o disponible

- Validación previa observada por el solicitante: probe de `href` con `javascript:alert(1)` preservó el valor.
- Validación disponible: reutilizar tests propuestos en claim 2.

## Fuentes

1. `lib/router/index.ts:129-144`
2. `lib/router/index.ts:551-562`
