# 📊 Sistema de Gestión de KPIs (Key Performance Indicators)

Este es un software empresarial diseñado para la captura, procesamiento y visualización de indicadores clave de desempeño (KPIs), basado en un modelo funcional de Excel para la gestión de mantenimiento, seguridad y cumplimiento.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite.
- **Backend:** Node.js (Express) para cálculos automatizados y proxy de API.
- **Base de Datos:** Supabase (PostgreSQL) para datos relacionales y tiempo real.
- **Estilos:** CSS Vanilla (Custom Properties) con enfoque en UX premium.
- **Librerías Clave:** 
  - `driver.js` (Tutorial intermedio).
  - `lucide-react` (Iconografía).
  - `react-hot-toast` (Notificaciones).

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura de desacoplamiento entre captura y resultado:

1.  **Capa de Captura:** Los usuarios ingresan datos granulares (fechas, booleanos, conteos).
2.  **Capa de Procesamiento (Backend/API):** El servidor recibe la captura, identifica el tipo de fórmula y realiza el cálculo matemático. Asigna el color del semáforo basado en las metas configuradas.
3.  **Capa de Persistencia:** Se guardan tanto los datos originales (bitácora) como el resultado final calculado.
4.  **Capa de Visualización:** El frontend renderiza gráficas dinámicas (Donas, Barras 3D, Barras Horizontales) basadas en el tipo de dato.

---

## 📈 Tipos de Indicadores y Lógica

| Tipo | KPI Ejemplo | Lógica de Cálculo |
| :--- | :--- | :--- |
| **Binario Documental** | Análisis de Mantto. | 2 documentos (100%), 1 documento (50%), 0 (0%). |
| **Conteo** | Simulacros/Juntas | `(Cumplidos / Programados) * 100`. |
| **Conteo Operativo** | Checklist Op. | `(Correctos / Total Operaciones) * 100`. |
| **Tiempos (Fechas)** | Entrega Info. | Días entre solicitud y entrega. ≤ 2 días = 100% de cumplimiento por evento. |
| **Sí/No** | Reportes HGE | Sí = 100%, No = 0%. |

---

## 🚥 Reglas del Semáforo

El sistema aplica colores automáticamente según el resultado porcentual:
- 🟢 **Verde (Óptimo):** ≥ 100% (o meta configurada).
- 🟡 **Amarillo (Alerta):** 80% - 99%.
- 🔴 **Rojo (Riesgo):** < 80%.

---

## 📂 Estructura del Proyecto

```text
├── api/                # Backend (Vercel Serverless Functions)
│   └── index.ts        # Motor de cálculos y endpoints
├── src/                # Frontend
│   ├── components/     # Componentes (Modales, Cards, App)
│   ├── lib/            # Configuración Supabase
│   └── index.css       # Sistema de diseño y animaciones
├── reglas/             # Documentación funcional y lógica de negocio
├── bd.sql              # Estructura completa de la base de datos
└── seed.sql            # Datos iniciales y configuración de KPIs
```

---

## 🚀 Instalación y Desarrollo

1.  **Clonar:** `git clone https://github.com/Juan-7u7/kpis.git`
2.  **Dependencias:** `npm install`
3.  **Variables de Env:** Configurar `.env` con las claves de Supabase.
4.  **Ejecutar:** 
    - Frontend: `npm run dev`
    - Backend Local: `npm run dev:backend`

---

## 👤 Autor
Proyecto diseñado para la optimización de métricas operativas por **Antigravity AI**.
