# 🛠️ Arquitectura Técnica y Lógica de Negocio

Este documento detalla el funcionamiento interno del Sistema KPI para su mantenimiento y escalabilidad.

---

## 💾 Modelo de Datos (PostgreSQL / Supabase)

El sistema utiliza un esquema relacional diseñado para la trazabilidad completa:

### Tablas Principales
- `areas`: Catálogo de departamentos (Mantenimiento, Seguridad, etc.).
- `kpis`: Definición de indicadores, tipos de fórmula y unidad de medida.
- `periodos`: Gestión cronológica por mes y año.
- `v_kpis_detalle`: **Vista Crítica** que consolida el KPI con su configuración de semáforo y lógica.

### Tablas de Captura (Granularidad)
Para garantizar la integridad, los datos se separan por tipo de captura:
- `kpi_capturas`: Encabezado del registro (quién, cuándo, qué KPI).
- `captura_binaria_documental`: Almacena estados booleano por campo.
- `captura_conteo`: Almacena números enteros (programados vs cumplidos).
- `captura_conteo_operativo`: Almacena operaciones totales vs correctas.
- `captura_entregas`: Almacena pares de fechas (solicitud vs entrega).

### Tabla de Resultados (Caché de Cálculo)
- `kpi_resultados`: Almacena el porcentaje final (`valor_resultado`) y el color del `semaforo`. Se genera automáticamente tras cada captura.

---

## 🧮 Motor de Cálculo (Backend)

Ubicación: `api/index.ts`

El backend procesa los datos según la columna `formula_tipo` de la base de datos:

1.  **`si_no`**: Evalúa el primer registro booleano. `true => 100`, `false => 0`.
2.  **`documental_doble`**: Cuenta cuántos ítems son `true`. `2 => 100`, `1 => 50`, `0 => 0`.
3.  **`cumplidos_programados`**: Realiza `(cumplidos / programados) * 100`. Si `programados` es 0, no guarda resultado.
4.  **`correctos_total`**: Realiza `(correctos / total) * 100`.
5.  **`entregas_a_tiempo`**: Calcula la diferencia en días. Si `días <= 2`, incrementa el contador de éxito. El resultado final es `% de éxitos`.

---

## 📡 Endpoints de la API

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/api/kpis` | `GET` | Obtiene KPIs con sus resultados del mes/año seleccionado via QueryParams. |
| `/api/kpi-config/:id` | `GET` | Obtiene la configuración de campos para el formulario de captura. |
| `/api/guardar` | `POST` | Recibe datos granulares, los guarda y ejecuta el motor de cálculo. |
| `/api/kpi-historico/:id` | `GET` | Devuelve el historial de resultados de un KPI para gráficas de tendencia. |

---

## 🚀 Despliegue en Vercel

El proyecto está configurado para despliegue automático:
1.  **Framework:** Vite.
2.  **Output Directory:** `dist`.
3.  **Build Command:** `npm run build`.
4.  **Funciones Serverless:** La carpeta `/api` es detectada automáticamente por Vercel.
5.  **Variables Críticas:** Es obligatorio configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el panel de Vercel.

---

## 🎨 Sistema de Diseño (UX/UI)

Ubicación: `src/index.css`

- **Variables CSS:** Se utilizan variables (`--accent-color`, `--bg-main`) para permitir un modo oscuro fácil en el futuro.
- **Gráficas CSS:** No se usan librerías pesadas como Chart.js. Las donas de progreso usan `conic-gradient` y las gráficas 3D usan transformaciones isométricas (`rotateX`, `rotateZ`) para máximo rendimiento.
