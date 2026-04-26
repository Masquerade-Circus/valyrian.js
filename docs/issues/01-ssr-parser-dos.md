# Custom HTML parser can be abused for SSR DoS

## Estado del claim contra el repo actual

**Aplica.** El camino SSR `v-html`/`trust()` puede llegar al parser HTML custom de Node mediante `innerHTML`, y el parser contiene recursión no acotada y operaciones con complejidad desfavorable sobre listas de items.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta para aplicaciones SSR que renderizan HTML no confiable; Media si `trust()`/`v-html` solo reciben HTML controlado.
- **Confianza:** Alta sobre el riesgo de DoS del parser; Media sobre exposición real por aplicación, porque depende de que input no confiable llegue a `trust()`/`v-html` en SSR.

## Resumen ejecutivo

`trust(htmlString)` crea un `div` y asigna `div.innerHTML = htmlString.trim()`. En el adapter Node, el setter de `innerHTML` llama a `htmlToDom(html)`. El parser resultante usa recorridos recursivos (`findTexts`, `convertToDom`) y búsquedas/reversiones repetidas en arrays durante el parseo. Según validación previa proporcionada, HTML profundamente anidado provocó `RangeError: Maximum call stack size exceeded` alrededor de 20k tags anidados vía `trust()` y `render(v-html nested)`.

## Evidencia repo-first

- `lib/index.ts:129-132`: `trust(htmlString)` crea un `div`, asigna `div.innerHTML = htmlString.trim()` y mapea `childNodes` a VNodes.
- `lib/index.ts:392-394`: la directiva `v-html` asigna `vnode.children = trust(value as string)`.
- `lib/node/utils/tree-adapter.ts:561-564`: el setter `innerHTML` limpia contenido y llama `htmlToDom(html)`.
- `lib/node/utils/tree-adapter.ts:823`: `findTexts(child, html)` es llamada recursivamente sobre hijos.
- `lib/node/utils/tree-adapter.ts:851-868`: `convertToDom` convierte nodos recursivamente y anexa hijos.
- `lib/node/utils/tree-adapter.ts:884-895` y `956`: el parser usa `[...items].reverse().find(...)`, `items.indexOf(...)` y `items.splice(...)`, patrones costosos en entradas grandes/anidadas.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. La aplicación ejecuta renderizado SSR/Node con el adapter actual.
2. Un atacante puede influir en HTML pasado a `trust()` o `v-html`.
3. La entrada puede ser suficientemente grande/profundamente anidada para agotar la pila o consumir CPU.

La explotación no requiere ejecución de JavaScript: basta con input HTML estructurado para forzar recursión profunda o peor rendimiento durante parseo/rehidratación.

## Impacto

- Caída o interrupción del render SSR por `RangeError`.
- Consumo de CPU/memoria en proceso Node.
- Posible degradación de disponibilidad si el render ocurre en ruta pública.

## Duplicados o relación con otros claims

- Relacionado con claim 5 (`v-html`) y claim 9 (`trust()`), porque ambos son boundaries raw que alimentan este parser.
- No es duplicado directo de XSS: el impacto primario aquí es disponibilidad.

## Riesgo residual

Incluso si se documenta `trust()` como boundary de HTML confiable, el parser sigue siendo una superficie de DoS cuando aplicaciones tratan HTML como “sanitizado” pero no limitan profundidad/tamaño.

## Recomendación de fix o decisión

**Request changes.** Recomendado:

- Establecer límites explícitos de tamaño, profundidad y cantidad de nodos en `htmlToDom`/parser SSR.
- Reemplazar recursión profunda por recorridos iterativos o fallar con error controlado.
- Evitar patrones O(n²) en el matching de tags cuando sea posible.
- Documentar que `trust()`/`v-html` en SSR no deben recibir input no confiable sin sanitización y límites.

## Validación realizada o disponible

- Validación previa observada por el solicitante: probes con `bun -e` confirmaron `RangeError: Maximum call stack size exceeded` con HTML profundamente anidado vía `trust()` y `render(v-html nested)`; `htmlToDom` directo falló a mayor profundidad.
- Validación disponible: agregar prueba SSR con HTML anidado y verificar que el parser falla de forma controlada antes de agotar pila.

## Fuentes

1. `lib/index.ts:129-132`
2. `lib/index.ts:392-394`
3. `lib/node/utils/tree-adapter.ts:561-564`
4. `lib/node/utils/tree-adapter.ts:823`
5. `lib/node/utils/tree-adapter.ts:851-868`
6. `lib/node/utils/tree-adapter.ts:884-895`
7. `lib/node/utils/tree-adapter.ts:956`
