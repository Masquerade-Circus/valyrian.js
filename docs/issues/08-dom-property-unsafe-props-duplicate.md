# DOM property assignment enables XSS via unsafe props

## Estado del claim contra el repo actual

**Duplicado.** Este claim cubre la misma causa raíz que claim 7: asignación directa de propiedades DOM peligrosas mediante props.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta/Media según exposición, heredada del claim 7.
- **Confianza:** Alta en la duplicidad.

## Resumen ejecutivo

La ruta vulnerable es `sharedSetAttribute`: si el nombre de prop existe en el DOM y no es SVG, se asigna como propiedad. Esto incluye props inseguras si llegan desde input no confiable. El análisis y fix deben consolidarse en `07-dom-property-innerhtml-xss.md`.

## Evidencia repo-first

- `lib/index.ts:649-669`: asignación directa `newVnodeDom[name] = value` cuando el nombre existe como propiedad DOM.
- `lib/index.ts:679-706`: `updateAttributes` aplica props no reservadas mediante `sharedSetAttribute`.

## Análisis de exploitabilidad y precondiciones

Igual que claim 7:

1. Props controlables por input no confiable.
2. Nombre de prop peligroso existente en DOM.
3. Valor con contenido activo.

## Impacto

Mismo impacto que claim 7: DOM XSS por propiedades como `innerHTML`, `outerHTML`, `srcdoc` u otras superficies activas.

## Duplicados o relación con otros claims

- Duplicado directo de `07-dom-property-innerhtml-xss.md`.
- Relacionado también con claim 12, otro duplicado del mismo patrón.

## Riesgo residual

No hay riesgo adicional independiente. Resolver claim 7 cubre este reporte.

## Recomendación de fix o decisión

**Consolidar como duplicado / request changes en claim 7.** No abrir fix separado.

## Validación realizada o disponible

- Validación disponible: reutilizar tests propuestos en claim 7 para props peligrosas.

## Fuentes

1. `lib/index.ts:649-669`
2. `lib/index.ts:679-706`
