# escala.md

## Objetivo del archivo

Este archivo define las reglas de escalabilidad técnica, modularidad y crecimiento del sistema.

El agente debe leer este archivo para construir el proyecto de manera que soporte crecimiento futuro sin rehacer la base del sistema.

---

## Principio principal

Construir el software como plataforma de KPIs, no como una pantalla única ni como una solución rígida para un solo tablero.

---

## Reglas de escalabilidad

- El sistema debe permitir agregar nuevos KPIs sin modificar toda la aplicación.
- El sistema debe permitir agregar nuevas áreas o categorías sin rediseñar la estructura.
- El sistema debe permitir agregar nuevos periodos de medición.
- El sistema debe permitir cambiar metas y reglas por KPI.
- El sistema debe permitir crecer en usuarios, datos, módulos y dashboards.
- El sistema debe estar preparado para múltiples vistas y múltiples tipos de visualización.

---

## Escalabilidad funcional

El agente debe diseñar para soportar:

- más KPIs
- más áreas
- más periodos
- más usuarios
- más dashboards
- más fuentes de datos
- más reglas de medición
- más tipos de gráficas

No debe acoplar el sistema a una sola estructura fija del Excel.

---

## Escalabilidad de datos

La base de datos debe diseñarse para soportar entidades separadas como:

- usuarios
- roles
- áreas
- KPIs
- fórmulas o reglas de cálculo
- periodos
- capturas
- resultados
- comentarios
- evidencias
- configuraciones visuales

Las tablas deben normalizarse razonablemente.
No duplicar información innecesaria.

---

## Escalabilidad de arquitectura

La arquitectura debe separar claramente:

- frontend
- backend
- acceso a datos
- reglas de negocio
- cálculo
- visualización

El agente debe evitar arquitectura monolítica dentro del frontend.
La lógica crítica no debe quedar atrapada solo en componentes React.

---

## Reglas de modularidad

Cada módulo debe poder evolucionar de forma independiente:

- autenticación
- catálogo de KPIs
- captura
- cálculo
- dashboard
- reportes
- configuración

No mezclar demasiadas responsabilidades en un solo archivo o componente.

---

## Reglas para frontend escalable

- Crear componentes reutilizables.
- Separar componentes de presentación y componentes de lógica.
- Centralizar tipos y contratos de datos.
- Evitar pantallas gigantes con demasiada lógica embebida.
- Diseñar layouts reutilizables.
- Diseñar cards KPI reutilizables.
- Diseñar wrappers de gráficas reutilizables.
- Diseñar filtros reutilizables.

---

## Reglas para backend escalable

- Organizar por módulos o dominios.
- Separar rutas, controladores, servicios y acceso a datos.
- Centralizar validaciones.
- Centralizar manejo de errores.
- Mantener contratos de API consistentes.
- Evitar lógica repetida entre endpoints.

---

## Reglas para motor de cálculo

- El cálculo debe estar encapsulado en una capa propia.
- Cada KPI debe poder asociarse a una lógica de cálculo clara.
- El sistema debe permitir fórmulas simples y fórmulas especiales.
- Las reglas de cálculo deben ser trazables y testeables.
- El cálculo no debe depender del componente visual que lo muestra.

---

## Escalabilidad visual

- El diseño debe soportar más módulos sin romper consistencia.
- Debe existir un sistema visual consistente de cards, tablas, filtros y gráficas.
- Las gráficas 3D deben poder degradarse a 2D si el contexto lo requiere.
- El layout debe responder bien en móvil, tablet y desktop.
- Debe ser posible agregar nuevas vistas sin rehacer la navegación.

---

## Escalabilidad de rendimiento

- No cargar todos los datos a la vez si no es necesario.
- Usar paginación, lazy loading o carga incremental donde aplique.
- Optimizar consultas a Supabase.
- Evitar renderizados pesados innecesarios.
- Optimizar gráficas complejas para dispositivos móviles.
- Minimizar cálculos redundantes en frontend.

---

## Escalabilidad de seguridad

- Implementar roles y permisos desde el inicio.
- Preparar el sistema para acceso diferenciado por usuario o área.
- Usar Row Level Security en Supabase cuando corresponda.
- No exponer datos de forma global sin control.
- Validar siempre entradas del usuario en backend.

---

## Reglas de crecimiento futuro

El agente debe dejar el proyecto preparado para incorporar en el futuro:

- importación de Excel
- exportación de reportes
- notificaciones
- comentarios por KPI
- evidencia documental
- dashboards personalizados
- metas por usuario o área
- automatización de captura
- integración con otras fuentes de datos

---

## Restricciones

- No construir una solución rígida basada únicamente en una sola hoja o vista.
- No quemar valores fijos que deberían venir de configuración.
- No dejar fórmulas duras dentro de componentes visuales.
- No crear una base de datos pensada solo para un demo.

---

## Regla principal

Cada decisión técnica debe responder esta pregunta:

¿Esto permite crecer el sistema sin reescribirlo completo?

Si la respuesta es no, debe replantearse.
