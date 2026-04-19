# Sistema de Gestion de KPIs

Repositorio del tablero de KPIs con frontend en React, backend en Express y base de datos en Supabase.

## Que incluye hoy

- tablero con filtros por mes, anio, area y busqueda
- captura dinamica por tipo de KPI
- calculo automatico de resultados y semaforo
- creacion de KPIs desde la interfaz
- formulas predeterminadas y formula personalizada
- historico por KPI y detalle mensual

## Requisitos

- Node.js 18 o superior
- npm
- una cuenta de Supabase

## Instalacion local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Juan-7u7/kpis.git
cd kpis
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor`.
3. Ejecuta `bd.sql` para crear la estructura base.
4. Ejecuta `seed.sql` si quieres cargar datos base de ejemplo.
5. Si ya tenias una base anterior y quieres usar formula personalizada, ejecuta tambien `docs/custom-formula-migration.sql`.

## Variables de entorno

Crea un archivo `.env` en la raiz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon
```

## Ejecucion

### Frontend + backend de desarrollo

```bash
npm run dev
```

### Solo backend

```bash
npm run server
```

## Formula personalizada

El sistema ya permite crear KPIs personalizados desde la UI.

### Lo que hace

- permite definir variables propias para la captura mensual
- permite usar plantillas de calculo o escribir una formula libre
- valida que la formula solo use variables existentes
- guarda la configuracion en `config_json.custom_formula`
- captura los valores en la tabla `captura_formula_personalizada`

### Requisito importante

Si tu base fue creada antes de esta funcionalidad, debes ejecutar:

- `docs/custom-formula-migration.sql`

Si no lo haces, al crear un KPI personalizado Supabase devolvera errores de constraints como `kpis_formula_tipo_check`.

## Documentacion

- `docs/README.md`: indice general de documentacion
- `docs/frontend.md`: arquitectura frontend y experiencia de usuario
- `docs/backend.md`: backend, API y persistencia
- `docs/formulas_kpis.md`: formulas, semaforo y reglas de negocio
- `docs/manual_usuario.md`: guia operativa para usuarios finales

## Comandos utiles

```bash
npm run dev
npm run server
npx tsc -b
npm run build
```

## Notas de mantenimiento

- el periodo por defecto toma el mes y anio actuales del sistema
- los inputs numericos permiten quedar vacios mientras el usuario escribe
- `documental_doble` muestra 2 documentos y su progreso de forma mas intuitiva
- la seccion de formula personalizada incluye un tutorial visual dentro del flujo de creacion
