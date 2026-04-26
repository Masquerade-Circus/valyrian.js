# Request helper now accepts absolute URLs, enabling SSRF

## Estado del claim contra el repo actual

**Parcial.** El helper `request()` acepta URLs absolutas `http(s)` y las pasa a `fetch`. Esto puede ser SSRF si input no confiable controla la URL en Node/SSR. No se valida el “now” histórico porque no se usó git ni comparación de versiones.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta en servicios Node/SSR donde usuarios controlan URLs; Media si solo se usan endpoints internos/controlados.
- **Confianza:** Alta sobre aceptación de URLs absolutas; Media sobre exposición SSRF real por depender de uso en aplicaciones.

## Resumen ejecutivo

`parseUrl` conserva URLs absolutas `http(s)` y solo aplica `urls.node` a relativas o reemplazos de `urls.api`. Luego `request()` llama `fetch(finalUrl.toString(), ...)`. En un contexto Node/SSR, si una ruta pública permite que un atacante controle el argumento `url`, puede forzar requests hacia hosts internos o externos arbitrarios.

## Evidencia repo-first

- `lib/request/index.ts:121-143`: `parseUrl` detecta URLs `http(s)`, conserva absolutas y solo resuelve relativas contra `options.urls.node` en Node.
- `lib/request/index.ts:274-310`: `request()` llama `parseUrl`, permite plugins y luego ejecuta `fetch(finalUrl.toString(), requestContext.options)`.
- `lib/node/utils/inline.ts:11-128`: el helper `inline` actual procesa archivos locales con `esbuild`, `CleanCSS` y `fs`; no se observó que use `request.get` ni fetch remoto en este archivo.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. Código Node/SSR usa `request()` con URL influenciable por usuario.
2. El entorno de ejecución tiene acceso de red a recursos internos o metadatos sensibles.
3. No hay allowlist de hosts/esquemas antes de llamar a `request()`.

La aceptación de absolutas es un comportamiento legítimo para un cliente HTTP genérico, por eso el claim es parcial: el bug depende de contrato y contexto. No se comprobó cambio histórico “now”.

## Impacto

- SSRF contra servicios internos, metadatos cloud o paneles administrativos accesibles desde el servidor.
- Exfiltración indirecta de respuestas si la aplicación devuelve datos al atacante.
- Escaneo interno o bypass de restricciones de red en aplicaciones mal integradas.

## Duplicados o relación con otros claims

- Claim 11 es duplicado directo de este claim.
- Se descarta relación directa con `inline` según evidencia observada: `inline` procesa archivos locales y no usa `request()` en el fragmento revisado.

## Riesgo residual

Mientras `request()` acepte absolutas por diseño, el riesgo residual debe gestionarse con documentación clara y opciones de allowlist/bloqueo para SSR.

## Recomendación de fix o decisión

**Request changes o accept risk con guardrails.** Recomendado:

- Para modo SSR/Node, añadir opción de allowlist de hosts/orígenes o bloquear absolutas por defecto cuando se espera API relativa.
- Documentar que URLs controladas por usuario no deben pasarse a `request()` sin validación.
- Ofrecer helper separado para APIs internas que solo acepte rutas relativas.

## Validación realizada o disponible

- Validación previa observada por el solicitante: probes con `bun -e` usando `dist/request/index.js` confirmaron que URLs absolutas arbitrarias quedaron como `http://attacker.local/internal` / `https://attacker.local/secret`, mientras relativas se resolvieron contra `http://node.local`.
- Validación disponible: tests unitarios para `parseUrl` con absolutas y relativas bajo `isNodeJs`.

## Fuentes

1. `lib/request/index.ts:121-143`
2. `lib/request/index.ts:274-310`
3. `lib/node/utils/inline.ts:11-128`
