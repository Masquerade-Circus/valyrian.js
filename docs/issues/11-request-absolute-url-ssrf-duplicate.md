# request() now allows absolute URLs, enabling SSRF bypass

## Estado del claim contra el repo actual

**Duplicado.** Este claim describe la misma superficie que claim 10: `request()` conserva URLs absolutas `http(s)` y las envía a `fetch`.

## Severidad sugerida y confianza

- **Severidad sugerida:** Alta/Media según exposición, heredada del claim 10.
- **Confianza:** Alta en la duplicidad.

## Resumen ejecutivo

El comportamiento reportado ya está cubierto por `10-request-absolute-url-ssrf.md`. El término “bypass” no queda validado por sí mismo con la evidencia actual; lo confirmado es que absolutas no son forzadas a `urls.node` salvo reglas específicas de reemplazo `urls.api`.

## Evidencia repo-first

- `lib/request/index.ts:121-143`: `parseUrl` conserva URLs absolutas `http(s)`.
- `lib/request/index.ts:274-310`: `request()` termina llamando `fetch(finalUrl.toString(), ...)`.

## Análisis de exploitabilidad y precondiciones

Igual que claim 10:

1. Uso de `request()` en Node/SSR.
2. URL controlable por input no confiable.
3. Ausencia de allowlist/validación previa.

## Impacto

Mismo impacto que claim 10: SSRF potencial contra recursos internos o externos arbitrarios.

## Duplicados o relación con otros claims

- Duplicado directo de `10-request-absolute-url-ssrf.md`.

## Riesgo residual

No hay riesgo independiente adicional; se gestiona resolviendo o documentando el claim 10.

## Recomendación de fix o decisión

**Consolidar como duplicado / request changes o accept risk en claim 10.** No abrir fix separado.

## Validación realizada o disponible

- Validación previa observada: probes con `bun -e` confirmaron conservación de URLs absolutas arbitrarias.
- Validación disponible: reutilizar tests de `parseUrl`/`request()` propuestos en claim 10.

## Fuentes

1. `lib/request/index.ts:121-143`
2. `lib/request/index.ts:274-310`
