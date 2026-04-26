# DOM XSS via unsanitized DOM property assignment

## Estado del claim contra el repo actual

**Duplicado.** Este claim es otra formulación de la asignación insegura de propiedades DOM descrita en claim 7.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta/Media según exposición, heredada del claim 7.
- **Confianza:** Alta en la duplicidad.

## Resumen ejecutivo

La causa raíz es que `sharedSetAttribute` asigna directamente `newVnodeDom[name] = value` cuando el nombre existe como propiedad DOM. Si nombres/valores de props son controlables por input no confiable, propiedades como `innerHTML`, `outerHTML` o `srcdoc` pueden producir XSS. Debe consolidarse con `07-dom-property-innerhtml-xss.md`.

## Evidencia repo-first

- `lib/index.ts:649-669`: asignación directa de propiedad DOM para nombres existentes.
- `lib/index.ts:672-706`: `setAttribute`/`updateAttributes` aplican props mediante esa lógica.

## Análisis de exploitabilidad y precondiciones

Igual que claim 7:

1. Props construidas desde input no confiable.
2. Prop peligrosa reconocida por DOM.
3. Valor activo que el navegador interpreta como HTML/documento/código.

## Impacto

Mismo impacto que claim 7: DOM XSS por propiedades peligrosas y bypass de expectativas de escape.

## Duplicados o relación con otros claims

- Duplicado directo de `07-dom-property-innerhtml-xss.md`.
- También se solapa con `08-dom-property-unsafe-props-duplicate.md`.

## Riesgo residual

No hay riesgo adicional independiente. Resolver claim 7 cubre este reporte.

## Recomendación de fix o decisión

**Consolidar como duplicado / request changes en claim 7.** No abrir fix separado.

## Validación realizada o disponible

- Validación disponible: reutilizar pruebas de asignación de props peligrosas propuestas en claim 7.

## Fuentes

1. `lib/index.ts:649-669`
2. `lib/index.ts:672-706`
