-- =========================================================
-- KPI SOFTWARE - BASE DE DATOS INICIAL
-- Supabase / PostgreSQL
-- =========================================================

-- Extensiones útiles
create extension if not exists "pgcrypto";

-- =========================================================
-- LIMPIEZA OPCIONAL
-- Descomenta solo si quieres recrear todo desde cero
-- =========================================================
-- drop table if exists kpi_evidencias cascade;
-- drop table if exists kpi_justificaciones cascade;
-- drop table if exists kpi_resultados cascade;
-- drop table if exists captura_entregas cascade;
-- drop table if exists captura_conteo_operativo cascade;
-- drop table if exists captura_conteo cascade;
-- drop table if exists captura_binaria_documental cascade;
-- drop table if exists kpi_capturas cascade;
-- drop table if exists profile_roles cascade;
-- drop table if exists roles cascade;
-- drop table if exists profiles cascade;
-- drop table if exists periodos cascade;
-- drop table if exists kpi_config cascade;
-- drop table if exists kpis cascade;
-- drop table if exists areas cascade;

-- =========================================================
-- FUNCION GENERICA PARA updated_at
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- TABLA: areas
-- =========================================================
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: kpis
-- =========================================================
create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete restrict,
  nombre text not null,
  descripcion text null,
  meta_descripcion text not null,
  frecuencia text not null default 'mensual',
  tipo_captura text not null,
  tipo_resultado text not null,
  formula_tipo text not null,
  orden_visual integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kpis_frecuencia_check
    check (frecuencia in ('mensual')),

  constraint kpis_tipo_captura_check
    check (tipo_captura in (
      'binario_documental',
      'conteo',
      'conteo_operativo',
      'fechas',
      'formula_personalizada'
    )),

  constraint kpis_tipo_resultado_check
    check (tipo_resultado in (
      'porcentaje',
      'dias_y_porcentaje'
    )),

  constraint kpis_formula_tipo_check
    check (formula_tipo in (
      'documental_doble',
      'cumplidos_programados',
      'correctos_total',
      'entregas_a_tiempo',
      'si_no',
      'formula_personalizada'
    ))
);

create unique index if not exists ux_kpis_area_nombre
  on public.kpis(area_id, nombre);

create index if not exists ix_kpis_area_id
  on public.kpis(area_id);

-- =========================================================
-- TABLA: kpi_config
-- 1 a 1 con kpis
-- =========================================================
create table if not exists public.kpi_config (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null unique references public.kpis(id) on delete cascade,
  meta_valor numeric(10,2) null,
  meta_operador text null,
  limite_dias integer null,
  semaforo_verde_min numeric(10,2) null,
  semaforo_amarillo_min numeric(10,2) null,
  semaforo_rojo_max numeric(10,2) null,
  permite_multiple_evento_mes boolean not null default false,
  requiere_justificacion boolean not null default false,
  config_json jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kpi_config_meta_operador_check
    check (
      meta_operador is null
      or meta_operador in ('>=', '<=', '=', '>', '<')
    ),

  constraint kpi_config_limite_dias_check
    check (limite_dias is null or limite_dias >= 0)
);

-- =========================================================
-- TABLA: periodos
-- =========================================================
create table if not exists public.periodos (
  id uuid primary key default gen_random_uuid(),
  anio integer not null,
  mes integer not null,
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  cerrado boolean not null default false,
  created_at timestamptz not null default now(),

  constraint periodos_mes_check
    check (mes between 1 and 12),

  constraint periodos_fechas_check
    check (fecha_fin >= fecha_inicio),

  constraint periodos_unique_anio_mes
    unique (anio, mes)
);

create index if not exists ix_periodos_anio_mes
  on public.periodos(anio, mes);

-- =========================================================
-- TABLA: profiles
-- Nota:
-- id puede relacionarse a auth.users.id
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key,
  nombre text not null,
  email text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: roles
-- =========================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: profile_roles
-- =========================================================
create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint profile_roles_unique unique (profile_id, role_id)
);

create index if not exists ix_profile_roles_profile_id
  on public.profile_roles(profile_id);

create index if not exists ix_profile_roles_role_id
  on public.profile_roles(role_id);

-- =========================================================
-- TABLA: kpi_capturas
-- Cabecera por KPI y periodo
-- =========================================================
create table if not exists public.kpi_capturas (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  periodo_id uuid not null references public.periodos(id) on delete restrict,
  capturado_por uuid null references public.profiles(id) on delete set null,
  estado text not null default 'borrador',
  comentario text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kpi_capturas_estado_check
    check (estado in ('borrador', 'finalizado')),

  constraint kpi_capturas_unique_kpi_periodo
    unique (kpi_id, periodo_id)
);

create index if not exists ix_kpi_capturas_kpi_id
  on public.kpi_capturas(kpi_id);

create index if not exists ix_kpi_capturas_periodo_id
  on public.kpi_capturas(periodo_id);

create index if not exists ix_kpi_capturas_capturado_por
  on public.kpi_capturas(capturado_por);

-- =========================================================
-- TABLA: captura_binaria_documental
-- Para KPIs con campos tipo sí/no
-- =========================================================
create table if not exists public.captura_binaria_documental (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null references public.kpi_capturas(id) on delete cascade,
  campo text not null,
  valor boolean not null,
  created_at timestamptz not null default now(),

  constraint captura_binaria_documental_unique
    unique (captura_id, campo)
);

create index if not exists ix_captura_binaria_documental_captura_id
  on public.captura_binaria_documental(captura_id);

-- =========================================================
-- TABLA: captura_conteo
-- Para cumplidos / programados
-- =========================================================
create table if not exists public.captura_conteo (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null unique references public.kpi_capturas(id) on delete cascade,
  programados integer not null default 0,
  cumplidos integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint captura_conteo_programados_check
    check (programados >= 0),

  constraint captura_conteo_cumplidos_check
    check (cumplidos >= 0),

  constraint captura_conteo_cumplidos_no_mayor_programados
    check (cumplidos <= programados or programados = 0)
);

-- =========================================================
-- TABLA: captura_conteo_operativo
-- Para operaciones correctas / total operaciones
-- =========================================================
create table if not exists public.captura_conteo_operativo (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null unique references public.kpi_capturas(id) on delete cascade,
  total_operaciones integer not null default 0,
  operaciones_correctas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint captura_conteo_operativo_total_check
    check (total_operaciones >= 0),

  constraint captura_conteo_operativo_correctas_check
    check (operaciones_correctas >= 0),

  constraint captura_conteo_operativo_correctas_no_mayor_total
    check (operaciones_correctas <= total_operaciones or total_operaciones = 0)
);

-- =========================================================
-- TABLA: captura_entregas
-- Múltiples entregas por mes para un KPI
-- =========================================================
create table if not exists public.captura_entregas (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null references public.kpi_capturas(id) on delete cascade,
  fecha_solicitud date not null,
  fecha_entrega date not null,
  dias_entrega integer not null,
  cumplio_tiempo boolean not null,
  comentario text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint captura_entregas_fechas_check
    check (fecha_entrega >= fecha_solicitud),

  constraint captura_entregas_dias_check
    check (dias_entrega >= 0)
);

create index if not exists ix_captura_entregas_captura_id
  on public.captura_entregas(captura_id);

create index if not exists ix_captura_entregas_fecha_solicitud
  on public.captura_entregas(fecha_solicitud);

create index if not exists ix_captura_entregas_fecha_entrega
  on public.captura_entregas(fecha_entrega);

-- =========================================================
-- TABLA: captura_formula_personalizada
-- Variables numericas libres definidas por el usuario
-- =========================================================
create table if not exists public.captura_formula_personalizada (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null unique references public.kpi_capturas(id) on delete cascade,
  valores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_captura_formula_personalizada_captura_id
  on public.captura_formula_personalizada(captura_id);

-- =========================================================
-- TABLA: kpi_resultados
-- Resultado final mensual por KPI
-- =========================================================
create table if not exists public.kpi_resultados (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  periodo_id uuid not null references public.periodos(id) on delete restrict,
  captura_id uuid not null unique references public.kpi_capturas(id) on delete cascade,
  valor_resultado numeric(10,2) not null,
  valor_auxiliar numeric(10,2) null,
  unidad_resultado text not null,
  semaforo text not null,
  detalle_resultado jsonb null default '{}'::jsonb,
  calculado_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kpi_resultados_semaforo_check
    check (semaforo in ('verde', 'amarillo', 'rojo', 'gris')),

  constraint kpi_resultados_unique_kpi_periodo
    unique (kpi_id, periodo_id)
);

create index if not exists ix_kpi_resultados_kpi_id
  on public.kpi_resultados(kpi_id);

create index if not exists ix_kpi_resultados_periodo_id
  on public.kpi_resultados(periodo_id);

create index if not exists ix_kpi_resultados_semaforo
  on public.kpi_resultados(semaforo);

-- =========================================================
-- TABLA: kpi_justificaciones
-- =========================================================
create table if not exists public.kpi_justificaciones (
  id uuid primary key default gen_random_uuid(),
  kpi_resultado_id uuid not null references public.kpi_resultados(id) on delete cascade,
  texto text not null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ix_kpi_justificaciones_kpi_resultado_id
  on public.kpi_justificaciones(kpi_resultado_id);

-- =========================================================
-- TABLA: kpi_evidencias
-- Opcional futura, pero queda creada
-- =========================================================
create table if not exists public.kpi_evidencias (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null references public.kpi_capturas(id) on delete cascade,
  nombre_archivo text not null,
  storage_path text not null,
  tipo_archivo text null,
  subido_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ix_kpi_evidencias_captura_id
  on public.kpi_evidencias(captura_id);

-- =========================================================
-- TRIGGERS updated_at
-- =========================================================
drop trigger if exists trg_areas_updated_at on public.areas;
create trigger trg_areas_updated_at
before update on public.areas
for each row
execute function public.set_updated_at();

drop trigger if exists trg_kpis_updated_at on public.kpis;
create trigger trg_kpis_updated_at
before update on public.kpis
for each row
execute function public.set_updated_at();

drop trigger if exists trg_kpi_config_updated_at on public.kpi_config;
create trigger trg_kpi_config_updated_at
before update on public.kpi_config
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_kpi_capturas_updated_at on public.kpi_capturas;
create trigger trg_kpi_capturas_updated_at
before update on public.kpi_capturas
for each row
execute function public.set_updated_at();

drop trigger if exists trg_captura_conteo_updated_at on public.captura_conteo;
create trigger trg_captura_conteo_updated_at
before update on public.captura_conteo
for each row
execute function public.set_updated_at();

drop trigger if exists trg_captura_conteo_operativo_updated_at on public.captura_conteo_operativo;
create trigger trg_captura_conteo_operativo_updated_at
before update on public.captura_conteo_operativo
for each row
execute function public.set_updated_at();

drop trigger if exists trg_captura_entregas_updated_at on public.captura_entregas;
create trigger trg_captura_entregas_updated_at
before update on public.captura_entregas
for each row
execute function public.set_updated_at();

drop trigger if exists trg_captura_formula_personalizada_updated_at on public.captura_formula_personalizada;
create trigger trg_captura_formula_personalizada_updated_at
before update on public.captura_formula_personalizada
for each row
execute function public.set_updated_at();

drop trigger if exists trg_kpi_resultados_updated_at on public.kpi_resultados;
create trigger trg_kpi_resultados_updated_at
before update on public.kpi_resultados
for each row
execute function public.set_updated_at();

-- =========================================================
-- DATOS INICIALES
-- =========================================================

-- Roles
insert into public.roles (nombre, descripcion)
values
  ('admin', 'Acceso total al sistema'),
  ('capturista', 'Captura información de KPIs'),
  ('viewer', 'Solo visualiza dashboards')
on conflict (nombre) do nothing;

-- Áreas
insert into public.areas (nombre, descripcion)
values
  ('Mantenimiento', 'KPIs relacionados con mantenimiento y restock'),
  ('Seguridad Operacional', 'KPIs relacionados con seguridad operacional'),
  ('Cumplimiento normativo y de capacitación', 'KPIs de cumplimiento normativo y capacitación')
on conflict (nombre) do nothing;

-- Periodos ejemplo: año actual completo
insert into public.periodos (anio, mes, nombre, fecha_inicio, fecha_fin, cerrado)
values
  (2026, 1, 'Enero 2026', '2026-01-01', '2026-01-31', false),
  (2026, 2, 'Febrero 2026', '2026-02-01', '2026-02-28', false),
  (2026, 3, 'Marzo 2026', '2026-03-01', '2026-03-31', false),
  (2026, 4, 'Abril 2026', '2026-04-01', '2026-04-30', false),
  (2026, 5, 'Mayo 2026', '2026-05-01', '2026-05-31', false),
  (2026, 6, 'Junio 2026', '2026-06-01', '2026-06-30', false),
  (2026, 7, 'Julio 2026', '2026-07-01', '2026-07-31', false),
  (2026, 8, 'Agosto 2026', '2026-08-01', '2026-08-31', false),
  (2026, 9, 'Septiembre 2026', '2026-09-01', '2026-09-30', false),
  (2026,10, 'Octubre 2026', '2026-10-01', '2026-10-31', false),
  (2026,11, 'Noviembre 2026', '2026-11-01', '2026-11-30', false),
  (2026,12, 'Diciembre 2026', '2026-12-01', '2026-12-31', false)
on conflict (anio, mes) do nothing;

-- =========================================================
-- KPIs INICIALES
-- =========================================================

with area_ids as (
  select id, nombre from public.areas
),
inserted_kpis as (
  insert into public.kpis (
    area_id,
    nombre,
    descripcion,
    meta_descripcion,
    frecuencia,
    tipo_captura,
    tipo_resultado,
    formula_tipo,
    orden_visual,
    activo
  )
  values
    (
      (select id from area_ids where nombre = 'Mantenimiento'),
      'Análisis de mantenimiento programado',
      'Cumplimiento documental de presupuesto y plan de trabajo.',
      'Presentar presupuesto y plan de trabajo',
      'mensual',
      'binario_documental',
      'porcentaje',
      'documental_doble',
      1,
      true
    ),
    (
      (select id from area_ids where nombre = 'Mantenimiento'),
      'Control y restock de inventario en fechas que no interfieran en la operación',
      'Cumplimiento documental de presupuesto y plan de trabajo para control y restock.',
      'Presentar presupuesto y plan de trabajo',
      'mensual',
      'binario_documental',
      'porcentaje',
      'documental_doble',
      2,
      true
    ),
    (
      (select id from area_ids where nombre = 'Seguridad Operacional'),
      'Cumplimiento en simulacros, capacitación, juntas, etc.',
      'Porcentaje de cumplimiento entre eventos cumplidos y programados.',
      'Revisión de lista de asistencia',
      'mensual',
      'conteo',
      'porcentaje',
      'cumplidos_programados',
      3,
      true
    ),
    (
      (select id from area_ids where nombre = 'Seguridad Operacional'),
      'Cumplimiento de procedimientos de checklist operacional',
      'Porcentaje de operaciones con procedimiento correcto.',
      'Documento operativo conforme a la operación realizada',
      'mensual',
      'conteo_operativo',
      'porcentaje',
      'correctos_total',
      4,
      true
    ),
    (
      (select id from area_ids where nombre = 'Seguridad Operacional'),
      'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días',
      'Porcentaje de entregas realizadas en tiempo con límite de 2 días.',
      'Entrega en no más de 2 días hábiles',
      'mensual',
      'fechas',
      'dias_y_porcentaje',
      'entregas_a_tiempo',
      5,
      true
    ),
    (
      (select id from area_ids where nombre = 'Cumplimiento normativo y de capacitación'),
      'Cumplir con programación de cursos del PSA',
      'Validación de correo de confirmación del proveedor.',
      'Correo de confirmación del proveedor',
      'mensual',
      'binario_documental',
      'porcentaje',
      'si_no',
      6,
      true
    ),
    (
      (select id from area_ids where nombre = 'Cumplimiento normativo y de capacitación'),
      'Envío de reportes mensuales del helipuerto de corona (HGE)',
      'Validación de acuse del reporte mensual.',
      'Acuse del reporte mensual de HGE',
      'mensual',
      'binario_documental',
      'porcentaje',
      'si_no',
      7,
      true
    )
  on conflict (area_id, nombre) do nothing
  returning id, nombre, formula_tipo
)
insert into public.kpi_config (
  kpi_id,
  meta_valor,
  meta_operador,
  limite_dias,
  semaforo_verde_min,
  semaforo_amarillo_min,
  semaforo_rojo_max,
  permite_multiple_evento_mes,
  requiere_justificacion,
  config_json
)
select
  k.id,
  case
    when k.formula_tipo in ('documental_doble', 'cumplidos_programados', 'correctos_total', 'si_no', 'entregas_a_tiempo')
      then 100
    else null
  end as meta_valor,
  '>=' as meta_operador,
  case
    when k.formula_tipo = 'entregas_a_tiempo' then 2
    else null
  end as limite_dias,
  100 as semaforo_verde_min,
  80 as semaforo_amarillo_min,
  79.99 as semaforo_rojo_max,
  case
    when k.formula_tipo = 'entregas_a_tiempo' then true
    else false
  end as permite_multiple_evento_mes,
  false as requiere_justificacion,
  case
    when k.formula_tipo = 'documental_doble' then
      jsonb_build_object(
        'campos', jsonb_build_array('presupuesto', 'plan_trabajo'),
        'regla', '100 si ambos true, 50 si uno true, 0 si ambos false'
      )
    when k.formula_tipo = 'si_no' then
      jsonb_build_object(
        'regla', '100 si true, 0 si false'
      )
    when k.formula_tipo = 'cumplidos_programados' then
      jsonb_build_object(
        'formula', '(cumplidos / programados) * 100',
        'si_programados_es_0', 'gris'
      )
    when k.formula_tipo = 'correctos_total' then
      jsonb_build_object(
        'formula', '(operaciones_correctas / total_operaciones) * 100',
        'si_total_operaciones_es_0', 'gris'
      )
    when k.formula_tipo = 'entregas_a_tiempo' then
      jsonb_build_object(
        'formula', '(entregas_en_tiempo / total_entregas) * 100',
        'limite_dias', 2,
        'color_evento', jsonb_build_object(
          'verde', '<= 2',
          'amarillo', '= 3',
          'rojo', '> 3'
        )
      )
    else '{}'::jsonb
  end
from public.kpis k
where not exists (
  select 1
  from public.kpi_config kc
  where kc.kpi_id = k.id
);

-- =========================================================
-- VISTA OPCIONAL DE CONSULTA RAPIDA
-- =========================================================
create or replace view public.v_kpis_detalle as
select
  k.id as kpi_id,
  a.nombre as area_nombre,
  k.nombre as kpi_nombre,
  k.meta_descripcion,
  k.frecuencia,
  k.tipo_captura,
  k.tipo_resultado,
  k.formula_tipo,
  k.orden_visual,
  k.activo,
  kc.meta_valor,
  kc.meta_operador,
  kc.limite_dias,
  kc.semaforo_verde_min,
  kc.semaforo_amarillo_min,
  kc.semaforo_rojo_max,
  kc.permite_multiple_evento_mes,
  kc.requiere_justificacion,
  kc.config_json
from public.kpis k
join public.areas a on a.id = k.area_id
left join public.kpi_config kc on kc.kpi_id = k.id;

-- =========================================================
-- FIN
-- =========================================================
