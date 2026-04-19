-- =========================================================
-- SEED DE PRUEBA KPI SOFTWARE
-- Requiere que ya exista el esquema base
-- =========================================================

-- =========================================================
-- 1. USUARIO DEMO
-- =========================================================
insert into public.profiles (
  id,
  nombre,
  email,
  activo
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Usuario Demo',
  'demo@kpis.local',
  true
)
on conflict (id) do update
set
  nombre = excluded.nombre,
  email = excluded.email,
  activo = excluded.activo,
  updated_at = now();

insert into public.profile_roles (
  profile_id,
  role_id
)
select
  '11111111-1111-1111-1111-111111111111',
  r.id
from public.roles r
where r.nombre = 'admin'
on conflict (profile_id, role_id) do nothing;

-- =========================================================
-- 2. LIMPIEZA OPCIONAL DE DEMO EN ENERO-FEBRERO-MARZO 2026
-- =========================================================
delete from public.kpi_justificaciones
where kpi_resultado_id in (
  select kr.id
  from public.kpi_resultados kr
  join public.periodos p on p.id = kr.periodo_id
  where p.anio = 2026 and p.mes in (1,2,3)
);

delete from public.kpi_resultados
where periodo_id in (
  select id from public.periodos
  where anio = 2026 and mes in (1,2,3)
);

delete from public.captura_entregas
where captura_id in (
  select kc.id
  from public.kpi_capturas kc
  join public.periodos p on p.id = kc.periodo_id
  where p.anio = 2026 and p.mes in (1,2,3)
);

delete from public.captura_conteo_operativo
where captura_id in (
  select kc.id
  from public.kpi_capturas kc
  join public.periodos p on p.id = kc.periodo_id
  where p.anio = 2026 and p.mes in (1,2,3)
);

delete from public.captura_conteo
where captura_id in (
  select kc.id
  from public.kpi_capturas kc
  join public.periodos p on p.id = kc.periodo_id
  where p.anio = 2026 and p.mes in (1,2,3)
);

delete from public.captura_binaria_documental
where captura_id in (
  select kc.id
  from public.kpi_capturas kc
  join public.periodos p on p.id = kc.periodo_id
  where p.anio = 2026 and p.mes in (1,2,3)
);

delete from public.kpi_capturas
where periodo_id in (
  select id from public.periodos
  where anio = 2026 and mes in (1,2,3)
);

-- =========================================================
-- 3. CREAR CABECERAS DE CAPTURA PARA ENERO-FEBRERO-MARZO
-- =========================================================
insert into public.kpi_capturas (
  kpi_id,
  periodo_id,
  capturado_por,
  estado,
  comentario
)
select
  k.id,
  p.id,
  '11111111-1111-1111-1111-111111111111',
  'finalizado',
  'Seed de prueba'
from public.kpis k
cross join public.periodos p
where p.anio = 2026
  and p.mes in (1,2,3)
on conflict (kpi_id, periodo_id) do update
set
  capturado_por = excluded.capturado_por,
  estado = excluded.estado,
  comentario = excluded.comentario,
  updated_at = now();

-- =========================================================
-- 4. KPI 1
-- Análisis de mantenimiento programado
-- Regla:
-- ambos true = 100
-- uno true = 50
-- ambos false = 0
-- =========================================================
insert into public.captura_binaria_documental (captura_id, campo, valor)
select kc.id, x.campo, x.valor
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
join lateral (
  values
    (
      'presupuesto',
      case
        when p.mes = 1 then true
        when p.mes = 2 then true
        when p.mes = 3 then false
      end
    ),
    (
      'plan_trabajo',
      case
        when p.mes = 1 then true
        when p.mes = 2 then false
        when p.mes = 3 then false
      end
    )
) as x(campo, valor) on true
where k.nombre = 'Análisis de mantenimiento programado'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id, campo) do update
set valor = excluded.valor;

-- =========================================================
-- 5. KPI 2
-- Control y restock...
-- =========================================================
insert into public.captura_binaria_documental (captura_id, campo, valor)
select kc.id, x.campo, x.valor
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
join lateral (
  values
    (
      'presupuesto',
      case
        when p.mes = 1 then true
        when p.mes = 2 then true
        when p.mes = 3 then true
      end
    ),
    (
      'plan_trabajo',
      case
        when p.mes = 1 then true
        when p.mes = 2 then true
        when p.mes = 3 then false
      end
    )
) as x(campo, valor) on true
where k.nombre = 'Control y restock de inventario en fechas que no interfieran en la operación'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id, campo) do update
set valor = excluded.valor;

-- =========================================================
-- 6. KPI 3
-- Cumplimiento en simulacros, capacitación, juntas, etc.
-- Formula: (cumplidos / programados) * 100
-- =========================================================
insert into public.captura_conteo (
  captura_id,
  programados,
  cumplidos
)
select
  kc.id,
  case
    when p.mes = 1 then 3
    when p.mes = 2 then 2
    when p.mes = 3 then 1
  end as programados,
  case
    when p.mes = 1 then 3
    when p.mes = 2 then 0
    when p.mes = 3 then 1
  end as cumplidos
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
where k.nombre = 'Cumplimiento en simulacros, capacitación, juntas, etc.'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id) do update
set
  programados = excluded.programados,
  cumplidos = excluded.cumplidos,
  updated_at = now();

-- =========================================================
-- 7. KPI 4
-- Checklist operacional
-- Formula: (correctas / total) * 100
-- =========================================================
insert into public.captura_conteo_operativo (
  captura_id,
  total_operaciones,
  operaciones_correctas
)
select
  kc.id,
  case
    when p.mes = 1 then 40
    when p.mes = 2 then 35
    when p.mes = 3 then 50
  end as total_operaciones,
  case
    when p.mes = 1 then 39
    when p.mes = 2 then 33
    when p.mes = 3 then 50
  end as operaciones_correctas
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
where k.nombre = 'Cumplimiento de procedimientos de checklist operacional'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id) do update
set
  total_operaciones = excluded.total_operaciones,
  operaciones_correctas = excluded.operaciones_correctas,
  updated_at = now();

-- =========================================================
-- 8. KPI 5
-- Entrega de información operacional
-- varias entregas por mes
-- limite: <= 2 días
-- =========================================================
insert into public.captura_entregas (
  captura_id,
  fecha_solicitud,
  fecha_entrega,
  dias_entrega,
  cumplio_tiempo,
  comentario
)
select *
from (
  -- ENERO
  select
    kc.id as captura_id,
    date '2026-01-03' as fecha_solicitud,
    date '2026-01-05' as fecha_entrega,
    2 as dias_entrega,
    true as cumplio_tiempo,
    'Entrega dentro del tiempo' as comentario
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 1

  union all

  select
    kc.id,
    date '2026-01-10',
    date '2026-01-13',
    3,
    false,
    'Entrega fuera de tiempo'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 1

  union all

  select
    kc.id,
    date '2026-01-20',
    date '2026-01-22',
    2,
    true,
    'Entrega dentro del tiempo'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 1

  union all

  -- FEBRERO
  select
    kc.id,
    date '2026-02-02',
    date '2026-02-06',
    4,
    false,
    'Retraso por validación'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 2

  union all

  select
    kc.id,
    date '2026-02-08',
    date '2026-02-11',
    3,
    false,
    'Falta de información previa'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 2

  union all

  select
    kc.id,
    date '2026-02-18',
    date '2026-02-20',
    2,
    true,
    'Entrega correcta'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 2

  union all

  -- MARZO
  select
    kc.id,
    date '2026-03-01',
    date '2026-03-02',
    1,
    true,
    'Entrega correcta'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 3

  union all

  select
    kc.id,
    date '2026-03-12',
    date '2026-03-14',
    2,
    true,
    'Entrega correcta'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 3

  union all

  select
    kc.id,
    date '2026-03-25',
    date '2026-03-29',
    4,
    false,
    'Entrega tardía'
  from public.kpi_capturas kc
  join public.kpis k on k.id = kc.kpi_id
  join public.periodos p on p.id = kc.periodo_id
  where k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días'
    and p.anio = 2026 and p.mes = 3
) t;

-- =========================================================
-- 9. KPI 6
-- Curso PSA
-- Sí = 100, No = 0
-- =========================================================
insert into public.captura_binaria_documental (captura_id, campo, valor)
select
  kc.id,
  'correo_confirmacion',
  case
    when p.mes = 1 then true
    when p.mes = 2 then false
    when p.mes = 3 then true
  end
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
where k.nombre = 'Cumplir con programación de cursos del PSA'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id, campo) do update
set valor = excluded.valor;

-- =========================================================
-- 10. KPI 7
-- Reporte HGE
-- Sí = 100, No = 0
-- =========================================================
insert into public.captura_binaria_documental (captura_id, campo, valor)
select
  kc.id,
  'acuse_reporte',
  case
    when p.mes = 1 then true
    when p.mes = 2 then true
    when p.mes = 3 then false
  end
from public.kpi_capturas kc
join public.kpis k on k.id = kc.kpi_id
join public.periodos p on p.id = kc.periodo_id
where k.nombre = 'Envío de reportes mensuales del helipuerto de corona (HGE)'
  and p.anio = 2026
  and p.mes in (1,2,3)
on conflict (captura_id, campo) do update
set valor = excluded.valor;

-- =========================================================
-- 11. RESULTADOS CALCULADOS DE DEMO
-- =========================================================
insert into public.kpi_resultados (
  kpi_id,
  periodo_id,
  captura_id,
  valor_resultado,
  valor_auxiliar,
  unidad_resultado,
  semaforo,
  detalle_resultado,
  calculado_en
)
select
  kc.kpi_id,
  kc.periodo_id,
  kc.id,
  100.00,
  null,
  '%',
  'verde',
  '{}'::jsonb,
  now()
from public.kpi_capturas kc
join public.periodos p on p.id = kc.periodo_id
where p.anio = 2026
  and p.mes in (1,2,3)
on conflict (kpi_id, periodo_id) do update
set
  valor_resultado = excluded.valor_resultado,
  semaforo = excluded.semaforo,
  updated_at = now();

-- =========================================================
-- 12. JUSTIFICACIONES DEMO
-- =========================================================
insert into public.kpi_justificaciones (
  kpi_resultado_id,
  texto,
  created_by
)
select
  kr.id,
  case
    when k.nombre = 'Análisis de mantenimiento programado' and p.mes = 2
      then 'En febrero faltó cargar el plan de trabajo.'
    when k.nombre = 'Cumplimiento en simulacros, capacitación, juntas, etc.' and p.mes = 2
      then 'No se realizaron actividades programadas por reprogramación operativa.'
    when k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días' and p.mes = 2
      then 'Hubo retrasos por validación previa de información.'
    when k.nombre = 'Envío de reportes mensuales del helipuerto de corona (HGE)' and p.mes = 3
      then 'El acuse del reporte no fue recibido dentro del periodo.'
    else 'Resultado generado por seed de prueba.'
  end,
  '11111111-1111-1111-1111-111111111111'
from public.kpi_resultados kr
join public.kpis k on k.id = kr.kpi_id
join public.periodos p on p.id = kr.periodo_id
where p.anio = 2026
  and p.mes in (1,2,3);

-- =========================================================
-- 12. JUSTIFICACIONES DEMO
-- =========================================================
insert into public.kpi_justificaciones (
  kpi_resultado_id,
  texto,
  created_by
)
select
  kr.id,
  case
    when k.nombre = 'Análisis de mantenimiento programado' and p.mes = 2
      then 'En febrero faltó cargar el plan de trabajo.'
    when k.nombre = 'Cumplimiento en simulacros, capacitación, juntas, etc.' and p.mes = 2
      then 'No se realizaron actividades programadas por reprogramación operativa.'
    when k.nombre = 'Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días' and p.mes = 2
      then 'Hubo retrasos por validación previa de información.'
    when k.nombre = 'Envío de reportes mensuales del helipuerto de corona (HGE)' and p.mes = 3
      then 'El acuse del reporte no fue recibido dentro del periodo.'
    else 'Resultado generado por seed de prueba.'
  end,
  '11111111-1111-1111-1111-111111111111'
from public.kpi_resultados kr
join public.kpis k on k.id = kr.kpi_id
join public.periodos p on p.id = kr.periodo_id
where p.anio = 2026
  and p.mes in (1,2,3);

-- =========================================================
-- 13. CONSULTA RAPIDA PARA REVISAR RESULTADOS
-- =========================================================
select
  a.nombre as area,
  k.nombre as kpi,
  p.nombre as periodo,
  kr.valor_resultado,
  kr.valor_auxiliar,
  kr.unidad_resultado,
  kr.semaforo,
  kr.detalle_resultado
from public.kpi_resultados kr
join public.kpis k on k.id = kr.kpi_id
join public.areas a on a.id = k.area_id
join public.periodos p on p.id = kr.periodo_id
where p.anio = 2026
  and p.mes in (1,2,3)
order by a.nombre, k.orden_visual, p.mes;