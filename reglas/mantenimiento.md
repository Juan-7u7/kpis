# mantenimiento.md

## Objetivo del archivo

Este archivo define las reglas para que el proyecto sea mantenible, legible, testeable y fácil de evolucionar con el tiempo.

El agente debe usar estas reglas para escribir código limpio y sostenible.

---

## Principio principal

El código debe ser fácil de entender, fácil de modificar y difícil de romper.

---

## Reglas generales de mantenimiento

- Priorizar claridad sobre complejidad innecesaria.
- Escribir código modular.
- Evitar duplicación.
- Nombrar variables, funciones y archivos de forma explícita.
- Mantener estructura consistente en todo el proyecto.
- No escribir lógica crítica de forma improvisada.
- Documentar decisiones importantes.

---

## Reglas de organización

El proyecto debe estar organizado por dominios o módulos claros, por ejemplo:

- auth
- users
- areas
- kpis
- captures
- results
- dashboards
- shared

No mezclar todo en carpetas genéricas sin estructura.

---

## Reglas de código frontend

- Usar TypeScript.
- Crear componentes pequeños y reutilizables.
- Evitar componentes enormes con demasiadas responsabilidades.
- Separar UI de hooks, lógica y servicios.
- Centralizar tipos e interfaces.
- Mantener consistencia en props y nombres.
- Extraer constantes y configuraciones reutilizables.
- Evitar lógica de negocio pesada dentro de JSX.

---

## Reglas de código backend

- Usar estructura clara por capas.
- Separar rutas, controladores, servicios y repositorios.
- Validar entradas con esquemas.
- Centralizar errores.
- Mantener respuestas HTTP consistentes.
- Evitar lógica duplicada entre endpoints.
- Mantener nombres claros para funciones y servicios.

---

## Reglas para base de datos

- Nombrar tablas y columnas de forma consistente.
- Usar claves y relaciones claras.
- Evitar columnas ambiguas.
- Documentar el propósito de tablas importantes.
- Preparar migraciones ordenadas.
- No modificar estructura sin considerar impacto en datos existentes.

---

## Reglas para fórmulas y KPIs

- Toda fórmula debe estar documentada.
- Toda fórmula debe ser testeable.
- Todo KPI debe tener una definición clara.
- Separar dato de entrada, regla de cálculo y resultado final.
- No mezclar reglas funcionales con lógica de visualización.
- Cuando una fórmula cambie, dejar trazabilidad del cambio.

---

## Reglas para diseño mantenible

- Reutilizar sistema de diseño.
- Mantener consistencia en spacing, tipografía, cards y botones.
- No crear estilos aislados sin criterio común.
- Mantener tokens de diseño centralizados cuando sea posible.
- Mantener consistencia en estados: loading, empty, error, success.

---

## Reglas para responsividad mantenible

- Diseñar componentes que se adapten por layout, no por hacks.
- Evitar estilos frágiles.
- Probar componentes en móvil, tablet y desktop.
- No resolver mobile con soluciones parcheadas al final.
- Diseñar cada vista con comportamiento responsivo desde el inicio.

---

## Reglas para gráficas

- Encapsular las gráficas en componentes propios.
- Separar configuración visual y datos.
- Permitir cambiar entre 3D y 2D si es necesario.
- Mantener uniformidad en leyendas, etiquetas, escalas y colores.
- Evitar gráficas difíciles de mantener por exceso de personalización.

---

## Reglas para pruebas

- Probar lógica crítica de cálculo.
- Probar validaciones de captura.
- Probar transformación de datos para dashboards.
- Probar componentes reutilizables importantes.
- Probar escenarios vacíos, inválidos y extremos.
- No confiar solo en pruebas manuales.

---

## Reglas para documentación

- Documentar estructura del proyecto.
- Documentar modelo de datos.
- Documentar contratos de API.
- Documentar fórmulas de KPIs.
- Documentar decisiones importantes de arquitectura.
- Mantener README y documentación técnica actualizados.

---

## Reglas para cambios futuros

Cuando se haga una modificación, el agente debe evaluar:

- qué afecta
- qué dependencias toca
- qué vistas impacta
- qué cálculo impacta
- qué datos impacta
- qué pruebas deben actualizarse

No hacer cambios locales sin considerar impacto global.

---

## Antipatrones a evitar

- componentes gigantes
- lógica duplicada
- consultas repetidas sin abstracción
- nombres ambiguos
- estilos dispersos
- estados mal manejados
- fórmulas escondidas
- endpoints inconsistentes
- código muerto
- valores fijos sin razón

---

## Regla de legibilidad

Cualquier desarrollador nuevo debe poder entender rápidamente:

- qué hace cada módulo
- dónde está cada responsabilidad
- cómo se calcula cada KPI
- cómo fluye la información
- cómo extender el sistema

Si eso no es posible, el diseño del código debe mejorar.

---

## Regla principal

No construir solo para que funcione hoy.
Construir para que sea sencillo corregir, ampliar y mantener mañana.
