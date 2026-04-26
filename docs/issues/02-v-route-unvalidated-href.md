# v-route now sets unvalidated href values from input URLs

## Estado del claim contra el repo actual

**Aplica.** `v-route` asigna el valor recibido directamente a `href` sin validación de esquema, origen o formato.

## Severidad sugerida y confianza

- **Severidad sugerida:** Media.
- **Confianza:** Alta sobre la asignación no validada; Media sobre impacto final, porque depende de que input no confiable controle rutas o URLs.

## Resumen ejecutivo

La directiva `route` registra un handler que llama `setAttribute("href", url, vnode)` con el `url` recibido. El click handler intercepta solo clicks primarios sin modificadores; enlaces abiertos en nueva pestaña, menú contextual o copia de enlace usan el `href` materializado. Una URL como `javascript:...` o un destino externo no esperado puede quedar preservado si la aplicación pasa input no confiable a `v-route`.

## Evidencia repo-first

- `lib/router/index.ts:129-144`: `ensureRouteDirective()` registra la directiva `route`.
- `lib/router/index.ts:134-135`: `directive("route", (url, vnode) => { setAttribute("href", url, vnode); ... })` asigna `href` con el valor recibido.
- `lib/router/index.ts:137-140`: si hay router, se agrega `onclick` con `router.getOnClickHandler(url)`.
- `lib/router/index.ts:551-562`: el handler ignora clicks no primarios, clicks con modificadores y eventos `defaultPrevented`; por tanto no cubre todos los modos de uso del link.
- `lib/index.ts:672-676`: `setAttribute` guarda la prop y delega a `sharedSetAttribute`.
- `lib/index.ts:660-668`: `sharedSetAttribute` asigna propiedad DOM si existe o usa `setAttribute`.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. La aplicación usa `v-route` en un elemento enlazable.
2. El valor de URL puede ser influido por input no confiable o datos externos.
3. El usuario interactúa con el enlace o copia/abre el `href` materializado.

El handler de navegación SPA reduce algunos clicks normales, pero no valida ni normaliza el `href`. Además, las rutas de interacción no interceptadas quedan expuestas al valor crudo.

## Impacto

- DOM XSS potencial si se permite un esquema ejecutable como `javascript:` en un contexto navegable.
- Open redirect/phishing o navegación externa no esperada si se permiten URLs absolutas arbitrarias.
- Riesgo de enlaces inseguros visibles para copiar/abrir en nueva pestaña.

## Duplicados o relación con otros claims

- Claim 4 es duplicado directo de este claim.

## Riesgo residual

Aunque las aplicaciones puedan considerar `v-route` como API interna, la ausencia de validación local hace que cada consumidor deba implementar allowlists o normalización de forma consistente.

## Recomendación de fix o decisión

**Request changes.** Recomendado:

- Validar esquemas permitidos para `v-route` (`/`, rutas internas, o `http(s)` bajo política explícita).
- Rechazar o neutralizar `javascript:`, `data:` y otros esquemas peligrosos.
- Documentar contrato: `v-route` acepta rutas internas, no URLs arbitrarias no confiables, salvo configuración explícita.

## Validación realizada o disponible

- Validación previa observada por el solicitante: probe con `bun -e` mostró que `setAttribute("href", "javascript:alert(1)", ...)` preservó el valor sin validación.
- Validación disponible: test unitario para `v-route` con `javascript:alert(1)` y URL externa, esperando rechazo/sanitización.

## Fuentes

1. `lib/router/index.ts:129-144`
2. `lib/router/index.ts:551-562`
3. `lib/index.ts:660-668`
4. `lib/index.ts:672-676`
