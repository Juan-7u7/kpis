# ⚙️ Documentación Profunda del Backend (Servidor y Base de Datos)

Este documento detalla la lógica de servidor, la integridad de los datos y el funcionamiento interno del motor de cálculo.

---

## 🏗️ Arquitectura de la Base de Datos (Supabase/Postgres)

El diseño de la base de datos sigue principios de **Normalización** para asegurar que los datos no se dupliquen y se mantenga el historial exacto.

### Relaciones del Esquema:
1.  **KPIs (Maestro)**: Contiene el "Qué" y "Cómo" de la métrica.
    - Se relaciona 1:N con `kpi_resultados`.
    - Se relaciona 1:1 (mediante lógica de negocio) con sus campos de configuración.
2.  **Periodos**: Define el "Cuándo". Cada registro es una combinación única de `anio` y `mes`.
3.  **Capturas vs Resultados**: 
    - Una **Captura** es el acto de ingresar los datos brutos (ej. fechas, conteos).
    - Un **Resultado** es el producto procesado del motor de cálculo. Existe una relación 1:1 entre una captura finalizada y su resultado calculado para asegurar trazabilidad.

### Vista del Diccionario de Datos (`v_kpis_detalle`)
Esta vista es el corazón de la comunicación Backend-Frontend. Realiza JOINs complejos entre `kpis`, `areas` y tablas de configuración para entregar un objeto JSON listo para ser interpretado por el generador de formularios de React.

---

## 🧠 Motor de Cálculo: Análisis por Tipo de Fórmula

El motor reside en el endpoint `POST /api/capturas`. A continuación se detalla el procesamiento interno:

### Estructura del Objeto de Captura:
```json
{
  "kpi_id": "UUID",
  "anio": 2026,
  "mes": 2,
  "tipo_captura": "conteo | fechas | si_no | documental_doble",
  "detalles": { ... } // Varía según tipo_captura
}
```

### Flujo de Ejecución:
1.  **Validación de Periodo**: Busca el `id` del periodo basado en año y mes. Si no existe, lanza un error de integridad.
2.  **Persistencia Granular**: Según el `tipo_captura`, los datos se insertan en tablas específicas (`captura_conteo`, `captura_entregas`, etc.). Esto permite que si en el futuro cambia la fórmula, podamos recalcular basándonos en los datos originales.
3.  **Carga de Configuración**: Se consultan los umbrales de semáforo (`verde_min`, `amarillo_min`) configurados para ese KPI específico.
4.  **Cálculo Aritmético**:
    - Se aplican las reglas de negocio (ej. Promedio de días para entregas).
    - Se redondea a 2 decimales para consistencia visual.
5.  **Evaluación de Semáforo**: Lógica condicional anidada para asignar el string `verde`, `amarillo` o `rojo`.
6.  **Cierre de Transacción (Upsert)**: Se guarda el resultado final en `kpi_resultados` vinculándolo a la captura actual.

---

## 📡 Detalle de API y Protocolos

### Seguridad y CORS
La API está configurada para aceptar peticiones desde cualquier origen (CORS limitado en producción) y utiliza encabezados JSON estándar.

### Errores y Excepciones
El sistema implementa un middleware de captura de errores global que devuelve respuestas estandarizadas:
```json
{
  "success": false,
  "error": "Mensaje detallado para el desarrollador"
}
```
Esto permite que el frontend (`App.tsx`) muestre mensajes de alerta claros al usuario mediante `react-hot-toast`.

---

## ⚡ Optimización en Supabase
- **Índices**: Las columnas `kpi_id` y `periodo_id` en `kpi_resultados` tienen índices únicos de tipo B-Tree para asegurar que las consultas de historial anual sean instantáneas.
- **Vercel Functions**: El código está optimizado para ejecutarse en ambientes *Serverless*, minimizando el arranque en frío (Cold Start) mediante la reutilización de la conexión a Supabase.
