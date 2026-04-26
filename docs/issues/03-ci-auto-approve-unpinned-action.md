# CI auto-approve job runs unpinned third-party action

## Estado del claim contra el repo actual

**Aplica.** El workflow usa una acción de terceros referenciada por tag mutable y le entrega `secrets.GITHUB_TOKEN`; no se observan `permissions` explícitos en el workflow.

## Severidad sugerida y confianza

- **Severidad sugerida:** Media.
- **Confianza:** Alta sobre el uso no pineado por SHA y ausencia de `permissions` explícitos en el fragmento observado.

## Resumen ejecutivo

El job `auto-approve` ejecuta `hmarr/auto-approve-action@v2.0.0` y pasa `github-token: "${{ secrets.GITHUB_TOKEN }}"`. Al no estar pineada por SHA, la acción queda sujeta a cambios del tag o compromiso del upstream. La ausencia de `permissions` explícitos aumenta el riesgo de privilegios más amplios de lo necesario según la configuración por defecto del repositorio/organización.

## Evidencia repo-first

- `.github/workflows/test.yml:23-30`: define job `auto-approve`, usa `hmarr/auto-approve-action@v2.0.0`, condición para Dependabot y pasa `secrets.GITHUB_TOKEN`.
- No se observaron claves `permissions:` en `.github/workflows/test.yml:20-30`.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. El workflow se ejecuta en pull requests que cumplen la condición de actor Dependabot.
2. La acción de terceros o el tag referenciado cambia de forma maliciosa o inesperada.
3. El token entregado tiene permisos suficientes para aprobar PRs u otras acciones según configuración.

No se valida aquí el historial del tag ni un compromiso real del upstream; el hallazgo se limita al riesgo de supply chain por referencia no inmutable y permisos no declarados.

## Impacto

- Aprobaciones automáticas no esperadas o manipuladas.
- Uso indebido del `GITHUB_TOKEN` dentro de acción de terceros si el upstream se compromete.
- Reducción de garantías de reproducibilidad del pipeline.

## Duplicados o relación con otros claims

- No se identificó duplicado entre los claims listados.

## Riesgo residual

Incluso con condición Dependabot, el riesgo residual permanece si la acción no está pineada y el token no sigue mínimo privilegio.

## Recomendación de fix o decisión

**Request changes.** Recomendado:

- Pinear la acción a SHA de commit revisado.
- Declarar `permissions:` mínimos requeridos para el job/workflow.
- Considerar una alternativa mantenida/interna o GitHub-native si cumple el mismo objetivo.
- Documentar en SECURITY/CONTRIBUTING la política de pinning de GitHub Actions.

## Validación realizada o disponible

- Validación disponible: inspeccionar workflow y confirmar que `uses:` usa SHA completo y que `permissions:` está presente con permisos mínimos.

## Fuentes

1. `.github/workflows/test.yml:23-30`
