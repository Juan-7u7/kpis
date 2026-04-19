# entendimiento.md

## Objetivo del archivo

Este archivo define qué es el proyecto, qué problema resuelve, qué debe construir el agente y cuáles son las reglas de entendimiento funcional antes de programar.

---

## Contexto del proyecto

Se desarrollará un software de KPIs usando:

- React
- Node.js
- Supabase

El sistema debe permitir capturar, calcular, visualizar y analizar KPIs de negocio de forma clara, moderna y responsiva.

La fuente funcional inicial del proyecto es un Excel que contiene:

- qué KPIs existen
- cómo se miden
- cómo se calculan o interpretan
- cómo deben visualizarse en gráficas

El agente debe tomar ese Excel como referencia funcional principal.

---

## Objetivo del sistema

Construir un sistema web de KPIs que permita:

- definir KPIs por área o categoría
- registrar mediciones por periodo
- calcular resultados automáticamente
- comparar resultado vs meta
- visualizar tendencias e históricos
- mostrar dashboards ejecutivos
- funcionar correctamente en móvil, tablet y desktop

---

## Qué debe entender el agente antes de construir

Antes de generar código, el agente debe identificar para cada KPI:

- nombre del KPI
- área o módulo al que pertenece
- definición funcional
- forma de medición
- fuente de los datos
- periodicidad
- meta esperada
- fórmula o lógica de cálculo
- formato de salida
- tipo de visualización
- reglas de interpretación
- estados visuales esperados

Si algún KPI no tiene fórmula clara, el agente no debe inventarla.
Debe marcarlo como pendiente funcional.

---

## Alcance funcional esperado

El sistema debe incluir al menos:

- autenticación de usuarios
- catálogo de KPIs
- captura de mediciones
- cálculo de resultados
- dashboard general
- dashboard por KPI
- filtros por periodo
- filtros por área
- históricos
- visualización con gráficas
- estados de cumplimiento
- estructura preparada para escalar

---

## Reglas de entendimiento

- No asumir reglas de negocio no documentadas.
- No crear cálculos ambiguos.
- No mezclar meta, resultado, tendencia y cumplimiento si no están claramente diferenciados.
- Siempre separar dato fuente, cálculo y visualización.
- Todo KPI debe ser trazable desde su captura hasta su resultado.
- Todo KPI debe poder relacionarse con un periodo.
- Todo KPI debe poder visualizarse históricamente.

---

## Enfoque de análisis

El agente debe trabajar siempre en este orden:

1. entender el KPI
2. identificar cómo se captura
3. identificar cómo se calcula
4. identificar cómo se interpreta
5. identificar cómo se muestra
6. diseñar la estructura técnica

No debe empezar por la UI si antes no entendió la lógica del KPI.

---

## Principios funcionales

- La claridad funcional tiene prioridad sobre la estética.
- La información debe ser consistente entre captura, cálculo y dashboard.
- El usuario debe poder confiar en el resultado mostrado.
- El sistema debe ser mantenible.
- El sistema debe permitir crecer a nuevos KPIs sin rehacer la arquitectura.

---

## Entregables que el agente debe producir

Cuando trabaje en este proyecto, debe poder generar:

- modelo funcional de KPIs
- estructura de base de datos
- endpoints o servicios
- componentes de frontend
- motor de cálculo
- dashboards
- validaciones
- reglas de negocio documentadas

---

## Restricciones

- No usar lógica escondida dentro de componentes visuales.
- No duplicar fórmulas en frontend y backend sin control.
- No diseñar primero algo visual si todavía no existe definición funcional suficiente.
- No depender del Excel para operar en producción; el Excel solo es base de análisis inicial.

---

## Resultado esperado

El proyecto final debe ser un software web de KPIs profesional, responsivo, escalable y visualmente moderno, con foco en lectura ejecutiva y análisis confiable.
