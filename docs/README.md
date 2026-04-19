# 📑 Centro de Documentación Avanzada - Sistema KPI

Este es el repositorio central de conocimiento técnico y operativo del Sistema de Monitoreo de KPIs. Aquí se detalla desde la arquitectura de código hasta la lógica matemática detrás de cada indicador.

---

## 📂 Contenidos Detallados

### 1. [Arquitectura del Frontend](./frontend.md)
**Foco:** Interfaz de usuario, Gráficas 3D Isométricas y Estado Dinámico.
- Gestión de flujos de datos en React 19.
- Renderizado de alto rendimiento mediante CSS Vanilla.
- Lógica de formularios dinámicos y feedback visual.

### 2. [Arquitectura del Backend y Datos](./backend.md)
**Foco:** API Express, Supabase y Motor de Cálculo.
- Esquema de base de datos relacional y vistas SQL.
- Proceso de persistencia granular por tipo de captura.
- Seguridad, manejo de errores y optimización serverless.

### 3. [Lógica Maestra de KPIs y Semáforos](./formulas_kpis.md)
**Foco:** Algoritmos matemáticos y Reglas de Decisión.
- Desglose de los 5 modelos de cálculo (Binario, Documental, Eficacia, Eficiencia, Oportunidad).
- Gestión de umbrales dinámicos y estados de semáforo.
- Precisiones sobre redondeos y manejo de nulos.

### 4. [Manual de Usuario Operativo](./manual_usuario.md)
Guía paso a paso para los usuarios ejecutivos y operativos sobre cómo capturar datos y leer el tablero.

### 5. [Guía de Instalación Local](../README.md)
Instrucciones detalladas para clonar, configurar variables de entorno y ejecutar el proyecto en tu propia computadora.
- Interpretación de tableros de control y gráficas de tendencia.

---

## ⚙️ Especificaciones Técnicas (Stack)

| Tecnología | Rol | Versión |
| :--- | :--- | :--- |
| **React** | UI Library | 19.0.0 |
| **TypeScript** | Lenguaje | 5.x |
| **Node.js** | Runtime | 20.x |
| **Supabase** | DB / BaaS | v2 |
| **Lucide** | Iconografía | v0.4 |

---

## 🆘 Soporte y Mantenimiento
Para modificaciones en las reglas de negocio o escalabilidad del sistema, consulte la sección de **"Proceso de Actualización"** dentro del documento de [Lógica de Fórmulas](./formulas_kpis.md).
