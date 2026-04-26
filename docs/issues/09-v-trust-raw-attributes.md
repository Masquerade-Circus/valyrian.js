# v.trust now preserves raw attributes, enabling XSS

## Estado del claim contra el repo actual

**Comportamiento raw documentado / riesgo residual real.** `trust()` preserva atributos peligrosos al convertir HTML a VNodes. No es bug puro si el contrato exige HTML confiable/sanitizado, pero el riesgo de XSS por mal uso es real.

## Severidad sugerida y confianza

- **Severidad sugerida:** Media si falta documentación/guardrails; Alta si consumidores pasan HTML no confiable.
- **Confianza:** Alta sobre preservación de atributos; Media sobre severidad efectiva por depender del contrato de uso.

## Resumen ejecutivo

`trust()` parsea HTML con `innerHTML` y `hidrateDomToVnode` copia todos los atributos del DOM resultante a `props` sin sanitizarlos. Esto preserva atributos como event handlers o URLs peligrosas si el HTML de entrada los contiene. El comportamiento es esperable para una API llamada `trust`, pero requiere documentación fuerte y límites de uso.

## Evidencia repo-first

- `lib/index.ts:129-132`: `trust()` asigna HTML raw a `div.innerHTML` y convierte los `childNodes`.
- `lib/index.ts:115-119`: `hidrateDomToVnode` itera `dom.attributes` y copia `props[attr.nodeName] = attr.nodeValue`.
- `lib/index.ts:121-125`: crea un `Vnode` con esos props y conserva referencia DOM.
- `lib/index.ts:392-394`: `v-html` usa `trust()` internamente.

## Análisis de exploitabilidad y precondiciones

Precondiciones:

1. Input no confiable llega a `trust()` o `v-html`.
2. El HTML incluye atributos peligrosos (`on*`, URLs con esquemas peligrosos, atributos específicos de elementos activos, etc.).
3. El resultado se monta/renderiza en un entorno que interpreta esos atributos.

Si el input está sanitizado correctamente antes de `trust()`, el riesgo baja significativamente. La evidencia no demuestra que `trust()` prometa sanitización; por el contrario, su comportamiento preserva HTML raw.

## Impacto

- XSS por atributos/event handlers preservados.
- Navegación o carga de recursos peligrosos por URLs/atributos no filtrados.
- Riesgo de mal uso por consumidores que confundan rehidratación con sanitización.

## Duplicados o relación con otros claims

- Relacionado con claim 5 (`v-html` usa `trust()`).
- Relacionado con claim 1 (el mismo parser puede generar DoS con HTML adversarial).
- No es duplicado de claim 7, que trata props DOM pasadas directamente por la aplicación.

## Riesgo residual

Alto si la documentación no marca `trust()` como boundary de seguridad. Medio/Bajo si se documenta y se espera HTML sanitizado por contrato.

## Recomendación de fix o decisión

**Accept risk con docs follow-up**, o **request changes** si el proyecto quiere modo seguro por defecto.

Opciones:

- Documentar `trust()` como API unsafe/raw que requiere HTML confiable o sanitizado.
- Añadir helper separado con sanitización/allowlist para casos de contenido externo.
- Agregar advertencias en docs de `v-html`, ya que delega a `trust()`.

## Validación realizada o disponible

- Validación disponible: test con HTML que contenga atributos peligrosos y verificar que quedan en `props` tras `trust()`.
- No validado aquí: ejecución final de un payload específico en navegador.

## Fuentes

1. `lib/index.ts:115-125`
2. `lib/index.ts:129-132`
3. `lib/index.ts:392-394`
