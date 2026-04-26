# Sistema de Gestión de KPIs

Repositorio del tablero de KPIs con frontend en React, backend en Express y persistencia en Supabase.

Este README ya no solo describe el producto: también funciona como documento de continuidad para que otro agente o desarrollador pueda retomar el proyecto con contexto suficiente.

## Estado actual

El proyecto ya dejó de ser solo un sistema de KPIs "globales" y ahora va encaminado a un modelo multiempresa.

Hoy ya existe soporte base para:

- selector de empresa en frontend
- empresas en base de datos
- áreas por empresa
- KPIs por empresa
- trabajadores por empresa
- asignación trabajador -> áreas
- asignación trabajador -> KPIs
- KPI con área opcional
- motor de KPI personalizado apoyado en `kpi_config.config_json`

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Base de datos: Supabase / PostgreSQL

## Estructura importante

- `src/App.tsx`
  Tablero principal, selector de empresa y panel administrativo básico.
- `src/components/CreateKpiModal.tsx`
  Flujo para alta de KPI personalizado.
- `src/components/CreateEmpresaModal.tsx`
  Alta de empresas.
- `src/components/CreateAreaModal.tsx`
  Alta de áreas por empresa.
- `src/components/CreateWorkerModal.tsx`
  Alta de trabajadores con `nombre`, `email`, `empresa`.
- `src/components/WorkerAssignmentsModal.tsx`
  Asignación de áreas y KPIs a trabajadores.
- `src/components/VisualConfigModal.tsx`
  Personalización de tipos de gráfica y colores de KPIs.
- `api/routes/kpiRoutes.ts`
  Endpoints de empresas, áreas, KPIs y consultas principales.
- `api/routes/profileRoutes.ts`
  Endpoints de trabajadores y asignaciones.
- `api/services/kpiService.ts`
  Lógica principal de empresas, áreas y KPIs.
- `api/services/profileService.ts`
  Lógica de trabajadores y asignaciones.
- `src/lib/customFormula.ts`
  Validación de fórmula personalizada.

## Arquitectura de Componentes

Para mantener el proyecto escalable y fácil de entender, se utiliza una estructura modular:

- **`src/types/dashboard.ts`**: El "contrato" de datos. Contiene todas las interfaces compartidas (KPI, Empresa, Profile).
- **`src/components/KpiCard.tsx`**: Encapsula la visualización de indicadores. Maneja los diferentes tipos de gráficas (Dona, Barra, Número) y las acciones rápidas.
- **`src/components/DashboardFilters.tsx`**: Centraliza la lógica de búsqueda, filtrado por área y selección de periodos.
- **`src/components/CompanyHub.tsx`**: Administrador visual de las empresas del sistema.
- **`src/App.tsx`**: Orquestador principal que maneja el estado global y la navegación entre el Hub y el Dashboard.

## Decisiones funcionales ya tomadas

Estas decisiones ya fueron acordadas y el siguiente trabajo debe respetarlas:

- una empresa tiene muchas áreas
- una empresa tiene muchos trabajadores
- una empresa tiene muchos KPIs
- un trabajador pertenece a una sola empresa
- un trabajador puede existir sin área al inicio
- un trabajador puede estar en varias áreas
- un trabajador puede estar en varios KPIs
- un KPI pertenece a una empresa
- el área del KPI es opcional
- un KPI puede tener varios trabajadores asignados
- solo existe un administrador del sistema
- no se implementara por ahora un sistema complejo de roles y privilegios
- el alta inicial de trabajador solo guarda:
  - `nombre`
  - `email`
  - `empresa`
- el motor de KPI personalizado se sigue guardando en `kpi_config.config_json`
- la configuración visual (tipo de gráfica, color) se guarda en `kpi_config.config_json.visual`
- el email en `profiles` sigue siendo unico global
- la unicidad de KPIs quedó pensada por `empresa + área + nombre`, con manejo especial cuando `area_id` es `null`

## Fases completadas

### Fase 1. Definición funcional mínima

Quedó cerrada la regla de negocio base para multiempresa, trabajadores, áreas, KPIs y asignaciones.

### Fase 2. Levantamiento del esquema actual

Se revisó la estructura existente en Supabase y se confirmó que el sistema original estaba pensado para una sola organización global:

- `areas` globales
- `kpis` con `area_id` obligatorio
- `profiles` sin `empresa_id`
- `v_kpis_detalle` con `JOIN` duro a `areas`

### Fase 3A. Rediseño base multiempresa en BD

Esto ya se ejecutó en Supabase:

- creación de tabla `empresas`
- `empresa_id` agregado a `áreas`
- `empresa_id` agregado a `profiles`
- `empresa_id` agregado a `kpis`
- `kpis.area_id` ahora permite `null`
- creación de `profile_areas`
- creación de `profile_kpis`
- ajuste de indices y unicidades
- recreación de `v_kpis_detalle` con `LEFT JOIN`

### Fase 3B. Migración inicial de datos

Ya se migró el estado anterior a una empresa base:

- empresa base creada con slug `empresa-base`
- todas las áreas existentes quedaron ligadas a esa empresa
- todos los profiles existentes quedaron ligados a esa empresa
- todos los KPIs existentes quedaron ligados a esa empresa
- `empresa_id` ya es `NOT NULL` en `areas`, `profiles` y `kpis`

Referencia útil de la migración:

- empresa base actual:
  - `id = 3d638928-6c4f-4440-9cce-53cb45b63556`
  - `slug = empresa-base`

### Fase 4. Modularización técnica del backend

Ya no todo vive en un solo archivo. Se modularizó el backend en:

- `api/app.ts`
- `api/routes/*`
- `api/services/*`
- `api/types/*`
- `api/utils/asyncHandler.ts`

También se eliminó duplicidad del cliente Supabase en frontend.

### Fase 5. Soporte multiempresa operativo en backend

Ya existe:

- `GET /api/empresas`
- `POST /api/empresas/create`
- `GET /api/áreas`
- `GET /api/empresas/:empresa_id/áreas`
- `POST /api/áreas/create`
- `GET /api/kpis?empresa_id=...&año=...&mes=...`
- `POST /api/kpis/create`
- `GET /api/empresas/:empresa_id/profiles`
- `POST /api/profiles/create`
- `GET /api/profiles/:profile_id/áreas`
- `POST /api/profiles/:profile_id/áreas`
- `GET /api/profiles/:profile_id/kpis`
- `POST /api/profiles/:profile_id/kpis`

### Fase 6. Frontend multiempresa mínimo

Ya esta implementado:

- selector de empresa en el dashboard
- carga de KPIs por empresa
- alta de empresas desde UI
- alta de áreas por empresa desde UI
- alta de trabajadores desde UI
- asignación de áreas y KPIs a trabajadores desde UI
- alta de KPI usando `empresaId`
- área opcional al crear KPI

### Fase 7. Verificación técnica de esta etapa

La última validación conocida quedó pasando:

```bash
npx tsc -b
npx eslint api src --ext .ts,.tsx
```

### Fase 8. Administración CRUD completa

Se cerró la administración básica de la plataforma:
- Edición de empresas, áreas y trabajadores desde la UI.
- Desactivación (borrado lógico) de empresas, áreas y trabajadores con confirmación.
- Los modales ahora soportan modo creación y edición dinámicamente.
- Integración completa en el panel administrativo de App.tsx.

### Fase 9. Fortalecimiento del motor de KPI personalizado

Se robusteció la definición y visualización de indicadores:
- Campos de negocio formalizados: Objetivo, Definición Técnica, Método de Medición, Fuente de Datos y Frecuencia.
- Soporte para sentido del KPI: Ascendente (mayor es mejor) y Descendente (menor es mejor).
- El semáforo ahora se adapta automáticamente según el sentido elegido.
- Visualización detallada en el KpiDetailModal incluyendo fichas técnicas.
- Mejora de UX en el asistente de creación (Wizard).

### Fase 10. Datos reales en filtros y estados vacíos

Se desacoplaron los filtros de los datos derivados:
- El filtro de áreas ahora utiliza la tabla maestra de `areas` de la empresa.
- El tablero agrupa KPIs por todas las áreas existentes, incluso si no tienen indicadores (mostrando estado vacío).
- Se implementó un grupo "General" para KPIs huérfanos de área.
- Mejora de estados vacíos en el Dashboard con botones de acción rápida para administradores.
- Manejo robusto de empresas recién creadas (sin áreas ni trabajadores).

### Fase 11. Seguridad básica

Se protegió el acceso al panel administrativo:
- Implementación de una pantalla de login para la ruta `/admin`.
- Uso de `localStorage` para persistir la sesión administrativa.
- Botón de "Cerrar Sesión" integrado en la cabecera principal.
- Contraseña configurada inicialmente como `admin123`.

### Fase 12. Limpieza de textos y encoding

Objetivo cumplido:
- Se eliminó el mojibake (caracteres corruptos) en `App.tsx` y otros componentes.
- Se corrigieron acentos y ortografía en toda la interfaz de usuario (modales, tours, mensajes).
- Se revisó y saneó el archivo `README.md` con la codificación correcta.

### Fase 13. Rediseño de Experiencia de Usuario (UX/UI)

Se transformó la interacción administrativa en una experiencia fluida y profesional:
- Creación del **Company Hub**: Una vista centralizada y visual para administrar múltiples empresas.
- **Panel Administrativo Premium**: Rediseño completo con tarjetas de resumen, iconos dinámicos y tablas modernas.
- **Navegación Inteligente**: Botones de retorno rápido al Hub y transiciones suaves entre contextos de empresa.
- **Estética Consistente**: Aplicación de un sistema de diseño "Premium" (glassmorphism, tipografía moderna, animaciones) en toda la sección administrativa.

### Fase 14. Personalización Visual de KPIs

Se implementó un sistema de diseño dinámico para los indicadores:
- **VisualConfigModal**: Nuevo componente para elegir entre tipos de visualización (Dona, Barra de Progreso, Número Grande, Sparkline) y paletas de colores premium.
- **Persistencia en tiempo real**: Los cambios se guardan en la base de datos y se reflejan instantáneamente en el dashboard de todos los usuarios.
- **Motor de Renderizado Dinámico**: Las tarjetas de KPI ahora adaptan su estructura interna según la configuración visual elegida, manteniendo una estética cohesiva.
- **Optimización de API**: Se aplanó la estructura de respuesta de configuraciones para mejorar el rendimiento del frontend.

## Fases faltantes

Estas son las siguientes fases recomendadas. Están ordenadas por prioridad práctica.

### Fase 14. Seguridad y aislamiento estricto

Objetivo:
aislar datos por empresa sin meter un sistema complejo de roles.

Pendiente:
- revisar políticas RLS en Supabase.
- definir si el admin único entra con usuario fijo o por autenticación real.
- evitar consultas cruzadas entre empresas.
- validar en backend que:
  - trabajador y área pertenezcan a la misma empresa.
  - trabajador y KPI pertenezcan a la misma empresa.
  - área y KPI pertenezcan a la misma empresa cuando aplique.

Nota:
- el proyecto intencionalmente no implementa varios roles por ahora.
- eso no elimina la necesidad de aislamiento por empresa.

### Fase 15. Prueba funcional con empresas reales

Objetivo:
validar que el modelo soporte escenarios tipo TODITO / CNCI.

Pendiente:
- crear al menos 2 empresas reales de prueba.
- crear áreas distintas por empresa.
- crear trabajadores distintos por empresa.
- crear KPIs distintos por empresa.
- asignar trabajadores a áreas y KPIs.
- verificar que no se mezclen datos entre empresas.
- probar fórmulas personalizadas reales.

## Riesgos conocidos

- el frontend ya soporta varias operaciones admin, pero la experiencia aún no está pulida
- no hay aislamiento de seguridad real todavia
- hay que revisar si algunos endpoints necesitan validaciones cruzadas de empresa mas estrictas
- el motor personalizado sigue flexible, pero todavía no está modelado con toda la riqueza funcional de los archivos de TODITO/CNCI

## Recomendaciones para el siguiente agente

Si otro agente retoma desde aqui, el orden mas sano es:

1. revisar este README completo
2. correr validación local
3. probar el flujo UI actual
4. atacar primero CRUD faltante
5. luego reforzar validaciones multiempresa
6. despues mejorar el motor de KPI personalizado
7. al final limpiar encoding y UX

## Comandos útiles

```bash
npm install
npm run dev
npm run server
npx tsc -b
npx eslint api src --ext .ts,.tsx
```

## Configuración local

Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon
```

## SQL histórico relevante

Si se levanta una base nueva desde cero, revisar:

- `bd.sql`
- `seed.sql`
- `docs/custom-formula-migration.sql`

Si se va a continuar sobre la BD ya migrada en Supabase, no repetir a ciegas los cambios multiempresa sin revisar el estado actual primero.
