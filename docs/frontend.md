# 💻 Documentación Profunda del Frontend (Interfaz)

Este documento proporciona un análisis exhaustivo de la arquitectura, decisiones de diseño y lógica de ejecución de la interfaz de usuario.

---

## 🏛️ Arquitectura de Estado y Flujo de Datos

La aplicación utiliza un patrón de **Unidirectional Data Flow** (Flujo de datos unidireccional) centrado en el componente `App.tsx`.

### 1. Gestión de Filtros
El estado de la aplicación se sincroniza mediante tres pilares:
- **Periodo (Año/Mes)**: Al cambiar estos valores, se dispara automáticamente el callback `fetchKPIs` mediante un `useEffect` con dependencias optimizadas.
- **Búsqueda y Área**: Estos filtros se aplican **in-memory** (en el cliente) sobre el arreglo de KPIs ya descargado, lo que proporciona una experiencia de filtrado instantánea sin latencia de red.

### 2. Sincronización de Modales
Se utilizan estados de objeto (`captureKpi` y `kpiForHistory`) en lugar de simples booleanos. Esto permite que el modal reciba automáticamente los metadatos del indicador seleccionado al abrirse, eliminando la necesidad de consultas redundantes a la API.

---

## 🎨 Visualización Avanzada (3D Isometric & Donut Charts)

### Gráficas 3D Isométricas
A diferencia de las librerías tradicionales (Canvas/SVG), estas gráficas están construidas puramente con **CSS 3D Containers**.
- **Lógica**: Se mapea el valor histórico (0-100) a la propiedad `height` de un pseudo-elemento CSS.
- **Perspectiva**: Se aplica `transform: rotateX(55deg) rotateZ(-45deg)` al contenedor para lograr la proyección caballera/isométrica.
- **Interactividad**: Al pasar el mouse, se utilizan filtros de brillo (`brightness`) para resaltar la barra seleccionada sin re-renderizar el componente.

### Donas de Progreso (Bento Cards)
Utilizan la propiedad `background: conic-gradient`. El porcentaje del KPI se inyecta como una variable CSS `--progress` directamente en el atributo `style` de React, lo que permite aprovechar la aceleración por hardware del navegador.

---

## 📋 Formulario de Captura Dinámico (`CaptureModal.tsx`)

El motor de formularios es capaz de auto-configurarse basándose en la respuesta del endpoint `/api/kpi-config/:id`.

### Tipos de Input por Lógica:
1.  **Vista de Documentos**: Genera dinámicamente un listado de checkboxes. Cada checkbox representa un requisito administrativo.
2.  **Vista Operativa**: Muestra campos de comparación `A vs B` (Ej: Programados vs Realizados) con validación inmediata para evitar que el valor realizado sea mayor al programado.
3.  **Registro de Entregas**: Implementa un arreglo de estados local. El usuario puede añadir infinitas filas de "Solicitud vs Entrega". El componente calcula el diferencial de días en tiempo real para dar feedback visual antes de guardar.

---

## 💅 Sistema de Estilos y Temas
El proyecto utiliza un sistema de **Design Tokens** definidos en `:root`:

| Variable | Propósito | Valor Base |
| :--- | :--- | :--- |
| `--accent-color` | Color de marca y botones primarios | `#3b82f6` (Azul Moderno) |
| `--bg-main` | Fondo de la aplicación | `#f1f5f9` (Light Blue Grey) |
| `--card-bg` | Fondo de tarjetas con efecto cristal | `rgba(255, 255, 255, 0.9)` |
| `--text-main` | Color de texto principal | `#1e293b` |

**Efecto Glassmorphism**: Se aplica `backdrop-filter: blur(10px)` en los modales para dar una sensación de profundidad y modernidad premium.

---

## ⚡ Estrategias de Rendimiento
- **Memoización**: Uso de `React.useCallback` para evitar que las funciones de petición se re-creen en cada render, previniendo loops infinitos en los `useEffect`.
- **Skeleton Loading**: Mientras `loading` es `true`, el sistema mantiene el layout pero muestra estados neutros para evitar saltos visuales bruscos (Layout Shift).
