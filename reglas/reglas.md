# reglas.md

## Objetivo del archivo

Este archivo define las reglas globales que el agente debe seguir en todo momento.

Su función principal es asegurar que el agente:

- no trabaje sin contexto
- no tome decisiones aisladas
- respete entendimiento, escalabilidad y mantenimiento

---

## Regla principal absoluta

Antes de cualquier acción, el agente DEBE:

1. Leer `entendimiento.md`
2. Leer `escala.md`
3. Leer `mantenimiento.md`

No puede omitir ninguno.

---

## Regla de dependencia de contexto

Ninguna decisión puede tomarse sin validar contra:

- entendimiento funcional → `entendimiento.md`
- escalabilidad → `escala.md`
- mantenibilidad → `mantenimiento.md`

Si una acción contradice alguno de estos, debe detenerse.

---

## Orden obligatorio de trabajo

El agente debe trabajar siempre en este orden:

1. Entender el problema (entendimiento.md)
2. Evaluar impacto en crecimiento (escala.md)
3. Evaluar impacto en mantenimiento (mantenimiento.md)
4. Proponer solución
5. Implementar

No puede saltarse pasos.

---

## Regla de validación cruzada

Antes de generar código, el agente debe validar:

- ¿Esto respeta el modelo funcional? (entendimiento.md)
- ¿Esto escala correctamente? (escala.md)
- ¿Esto será fácil de mantener? (mantenimiento.md)

Si alguna respuesta es no → debe corregir antes de continuar.

---

## Regla de conflicto

Si hay conflicto entre reglas:

Prioridad:

1. entendimiento.md
2. escala.md
3. mantenimiento.md

---

## Regla de no improvisación

El agente NO debe:

- inventar reglas de negocio
- asumir fórmulas
- crear lógica no definida
- modificar comportamiento sin base funcional

Debe marcar como:
"PENDIENTE FUNCIONAL"

---

## Regla de consistencia

Todo lo que el agente construya debe ser consistente con:

- estructura del sistema
- modelo de datos
- lógica de cálculo
- visualización

No puede haber contradicciones entre capas.

---

## Regla de separación de responsabilidades

El agente debe siempre respetar:

- lógica ≠ UI
- datos ≠ visualización
- cálculo ≠ presentación

---

## Regla de escalabilidad obligatoria

Antes de implementar algo, el agente debe preguntarse:

¿Esto funcionará si:

- hay más KPIs?
- hay más usuarios?
- hay más datos?
- hay más módulos?

Si la respuesta es no → rediseñar.

---

## Regla de mantenibilidad obligatoria

El agente debe asegurar:

- código legible
- estructura clara
- módulos separados
- nombres explícitos
- sin duplicación innecesaria

---

## Regla de trazabilidad

Todo KPI debe poder rastrearse desde:

captura → cálculo → resultado → visualización

Si no es posible, la implementación es inválida.

---

## Regla de diseño

El agente debe seguir:

- diseño tipo dashboard moderno
- claridad primero
- gráficas 3D controladas
- responsive real
- degradación a 2D si es necesario
- Basate de reglasdiseño.md

---

## Regla de responsive

Toda implementación debe funcionar en:

- móvil
- tablet
- desktop

Si algo solo funciona en desktop, está incompleto.

---

## Regla de performance

El agente debe evitar:

- cargas innecesarias
- renderizados pesados
- cálculos duplicados
- gráficas no optimizadas

---

## Regla de evolución

El agente debe construir pensando en:

- agregar nuevos KPIs
- agregar nuevas vistas
- agregar nuevas reglas
- agregar nuevas integraciones

---

## Regla de documentación

Cada decisión importante debe ser:

- clara
- justificable
- trazable

---

## Regla de bloqueo

El agente debe detenerse si:

- falta definición funcional
- hay ambigüedad en un KPI
- hay contradicción entre documentos
- no puede garantizar escalabilidad o mantenimiento

---

## Regla final

El agente no construye solo para que funcione.

Construye para que:

- sea correcto
- escale
- se mantenga
- y sea entendible

Si no cumple las cuatro, no es válido.
