# 🧮 Guía Maestra de Fórmulas y Reglas de Decisión

Este documento es la referencia oficial para la interpretación de los números generados por el sistema.

---

## 📐 Algoritmos de Cálculo Detallados

### 1. Modelo de Cumplimiento Binario (SÍ/NO)
- **Caso de Uso**: Auditorías rápidas o entrega de reportes únicos.
- **Matemáticas**: `X ∈ {0, 100}`.
- **Regla de Semáforo**:
  - Habitualmente, `100` es Verde y `0` es Rojo. No hay estado de transición (Amarillo) a menos que se configure una meta manual muy específica.

### 2. Modelo de Evidencia Documental (Doble)
- **Caso de Uso**: Procesos que requieren dos componentes críticos para ser válidos (ej. Reporte preliminar + Reporte final).
- **Ejemplo**:
  - Item 1: "Factura cargada"
  - Item 2: "XML validado"
- **Puntuación**:
  - 2/2 -> 100%
  - 1/2 -> 50%
  - 0/2 -> 0%

### 3. Modelo de Eficacia (Cumplidos / Programados)
- **Caso de Uso**: Seguimiento a planes de mantenimiento o capacitación.
- **Fórmula**: `(Actual / Meta) * 100`.
- **Consideración Especial**:
  - Si el numerador es mayor al denominador (Sobre-cumplimiento), el resultado puede exceder el 100%. Sin embargo, el sistema trunca la visualización del semáforo a Verde como valor máximo de éxito.

### 4. Modelo de Eficiencia Operativa (Correctos / Total)
- **Caso de Uso**: Inspecciones de seguridad o calidad en línea de producción.
- **Fórmula**: `(∑ Sin Hallazgos / ∑ Inspecciones Totales) * 100`.
- **Impacto**: Este KPI es muy sensible. Una sola operación incorrecta en una muestra pequeña (ej. 1 de 5) baja el resultado al 80%, disparando inmediatamente alertas amarillas.

### 5. Modelo de Oportunidad (ANS - Acuerdos de Nivel de Servicio)
- **Caso de Uso**: Tiempo de respuesta a solicitudes de almacén o compras.
- **Lógica**: Se basa en la ventana de tiempo de **48 horas hábiles** (2 días).
- **Puntaje**:
  - Por cada entrega, se calcula: `Diferencia = Fecha_Fin - Fecha_Inicio`.
  - Si `Diferencia <= 2 días` -> **Válido (1)**.
  - El porcentaje es la suma de Válidos entre el total de la muestra.

---

## 📈 Lógica de Semáforo y Escalas de Color

El sistema no utiliza una escala estática universal; cada KPI puede tener sus propios umbrales definidos en el administrador:

| Métrica de Ejemplo | Umbral Rojo | Umbral Amarillo | Umbral Verde |
| :--- | :--- | :--- | :--- |
| **Seguridad Ind.** | < 99% | 99% - 99.9% | 100% |
| **Mantenimiento** | < 80% | 80% - 89% | >= 90% |
| **Administración** | < 70% | 70% - 84% | >= 85% |

### Estados Especiales:
- **Estado Gris (Pendiente)**: Representa que el mes sigue "abierto" o no se ha realizado ninguna captura. Este estado es vital para identificar omisiones administrativas.
- **Redondeo**: Todos los cálculos se realizan con precisión de 4 decimales y se muestran al usuario final redondeados a **1 decimal** para facilitar la lectura sin perder precisión técnica.

---

## 🔄 Proceso de Actualización de Fórmulas
Si una regla de negocio cambia (ej. el tiempo de entrega pasa de 2 a 3 días), el cambio debe realizarse en:
1.  **Backend**: Modificar la constante en el controlador de `api/index.ts`.
2.  **Base de Datos**: Actualizar la columna `formula_descripcion` para que el usuario vea la información correcta en el modal de detalles.
