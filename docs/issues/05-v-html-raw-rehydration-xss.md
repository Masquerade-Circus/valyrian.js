# v-html now rehydrates HTML into DOM, enabling script execution

## Estado del claim contra el repo actual

**Parcial.** `v-html` sí materializa HTML raw mediante `trust()` y puede introducir XSS si recibe HTML no confiable. La parte de “ejecución automática de scripts” está exagerada/no validada en la evidencia disponible y debe matizarse.

## Severidad sugerida y confianza

- **Severidad sugerida:** Media-Alta cuando `v-html` recibe HTML no confiable; Baja/aceptada si se limita a HTML confiable/sanitizado conforme contrato.
- **Confianza:** Alta sobre materialización raw; Media sobre explotación específica; Baja sobre ejecución automática de `<script>` sin interacción o condiciones adicionales.

## Resumen ejecutivo

`v-html` delega a `trust(value as string)`, que parsea HTML y preserva atributos como props del VNode. Esto crea una frontera raw: atributos peligrosos, URLs peligrosas o HTML activo pueden terminar renderizados si la aplicación entrega contenido no confiable. Sin embargo, `trust()`/`v-html` son boundaries raw documentados por comportamiento: el hallazgo no debe formularse como escape accidental de texto seguro ni afirmar ejecución automática de scripts sin PoC específica.

## Evidencia repo-first

- `lib/index.ts:392-394`: `v-html` asigna `vnode.children = trust(value as string)`.
- `lib/index.ts:129-132`: `trust()` usa `div.innerHTML = htmlString.trim()` y convierte `childNodes` a VNodes.
- `lib/index.ts:95-132`: `hidrateDomToVnode` copia atributos del DOM a `props` (`props[attr.nodeName] = attr.nodeValue`) y conserva hijos.
- `lib/node/utils/tree-adapter.ts:660-678`: serialización SSR escapa text nodes normales y atributos, pero pasa raw text a hijos de `script`/`style`.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. La aplicación usa `v-html` con contenido controlable por usuario o terceros.
2. No hay sanitización HTML robusta antes de llamar a `v-html`.
3. El HTML incluye atributos/eventos/URLs peligrosos o tags activos interpretables por navegador.

La explotación depende del navegador y del tipo de payload. La evidencia actual sostiene riesgo XSS por frontera raw, pero no confirma que insertar `<script>` por esta ruta ejecute automáticamente en todos los contextos.

## Impacto

- DOM XSS o SSR-rendered XSS si contenido no confiable llega a `v-html`.
- Inyección de atributos/event handlers o URLs peligrosas.
- Riesgo de confusión para usuarios que traten `v-html` como renderizado seguro.

## Duplicados o relación con otros claims

- Relacionado con claim 1 (DoS del parser al alimentar `trust()`/`v-html`).
- Relacionado con claim 9 (`trust()` preserva atributos raw).
- Diferente de claim 7, que trata props DOM peligrosas fuera de `v-html`.

## Riesgo residual

Incluso si se acepta `v-html` como API raw, queda riesgo residual de mal uso. La documentación y el naming deben dejar claro que no sanitiza.

## Recomendación de fix o decisión

**Docs follow-up + posible hardening.** Recomendado:

- Documentar explícitamente que `v-html` solo acepta HTML confiable/sanitizado.
- Añadir advertencias de seguridad y ejemplos de uso seguro.
- Considerar API alternativa con sanitizador configurable o allowlist.
- No afirmar “script execution” automático sin prueba reproducible.

## Validación realizada o disponible

- Validación previa observada: `v-html` usa `trust()` y materializa HTML raw como VNodes.
- No validado directamente: ejecución automática de `<script>` insertado por esta vía.
- Validación disponible: tests de navegador para payloads específicos (`<script>`, event handlers, URL schemes) y documentación de expected behavior.

## Fuentes

1. `lib/index.ts:95-132`
2. `lib/index.ts:392-394`
3. `lib/node/utils/tree-adapter.ts:660-678`
