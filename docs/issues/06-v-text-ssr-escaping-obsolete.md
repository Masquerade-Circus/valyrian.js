# v-text enables unescaped SSR text rendering (XSS risk)

## Estado del claim contra el repo actual

**No aplica / Obsoleto.** El render SSR actual escapa text nodes normales; `v-text` escribe `textContent`, no HTML.

## Severidad sugerida y confianza

- **Severidad sugerida:** Informativa / No issue.
- **Confianza:** Alta para el estado actual observado.

## Resumen ejecutivo

La evidencia actual no soporta XSS por `v-text` en SSR. En DOM, `v-text` asigna `textContent`. En el adapter Node, `textContent` crea un nodo `Text`; la serialización `domToHtml` escapa text nodes normales con `escapeHtml(...)`. La PoC previa indicada por el solicitante produjo salida escapada para un payload HTML.

## Evidencia repo-first

- `lib/index.ts:808-810`: en creación, si existe `v-text`, asigna `newChild.dom.textContent = newChild.props["v-text"]`.
- `lib/index.ts:942-945`: en actualización, compara y asigna `oldChild.textContent = newChild.props["v-text"]`.
- `lib/node/utils/tree-adapter.ts:536-539`: setter `textContent` convierte a string y crea un `Text` node.
- `lib/node/utils/tree-adapter.ts:660-663`: `domToHtml` escapa text nodes normales con `escapeHtml(dom.textContent)` cuando `rawText` es falso.
- `lib/node/utils/tree-adapter.ts:678`: `rawText` se activa para hijos de `script`/`style`, no para texto normal en elementos comunes.

## Análisis de exploitabilidad y precondiciones

No se identificó una ruta actual donde `v-text` renderice HTML sin escapar en elementos normales. Para reabrir este claim haría falta evidencia de que `v-text` puede colocar texto bajo un contexto `rawText` peligroso o que la serialización se salta `escapeHtml`.

## Impacto

No hay impacto confirmado para el claim formulado. Si existiera una ruta alternativa no observada que coloque `v-text` dentro de `script`/`style`, requeriría análisis separado.

## Duplicados o relación con otros claims

- Contrasta con claim 5/9: `v-html`/`trust()` son boundaries raw; `v-text` no lo es según evidencia actual.

## Riesgo residual

Bajo. Riesgo residual limitado a cambios futuros o contextos especiales no validados aquí.

## Recomendación de fix o decisión

**Cerrar como no aplica/obsoleto.** Recomendado mantener o agregar tests de regresión SSR que verifiquen escape de `v-text` con payloads HTML.

## Validación realizada o disponible

- Validación previa observada: `render(v("div", {"v-text":"<img src=x onerror=alert(1)>"}))` produjo `<div>&lt;img src=x onerror=alert(1)&gt;</div>`.
- Validación disponible: test unitario SSR para `v-text` en elementos comunes.

## Fuentes

1. `lib/index.ts:808-810`
2. `lib/index.ts:942-945`
3. `lib/node/utils/tree-adapter.ts:536-539`
4. `lib/node/utils/tree-adapter.ts:660-663`
5. `lib/node/utils/tree-adapter.ts:678`
