alter table public.kpis
  drop constraint if exists kpis_tipo_captura_check;

alter table public.kpis
  add constraint kpis_tipo_captura_check
  check (tipo_captura in (
    'binario_documental',
    'conteo',
    'conteo_operativo',
    'fechas',
    'formula_personalizada'
  ));

alter table public.kpis
  drop constraint if exists kpis_formula_tipo_check;

alter table public.kpis
  add constraint kpis_formula_tipo_check
  check (formula_tipo in (
    'documental_doble',
    'cumplidos_programados',
    'correctos_total',
    'entregas_a_tiempo',
    'si_no',
    'formula_personalizada'
  ));

create table if not exists public.captura_formula_personalizada (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid not null unique references public.kpi_capturas(id) on delete cascade,
  valores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_captura_formula_personalizada_captura_id
  on public.captura_formula_personalizada(captura_id);

drop trigger if exists trg_captura_formula_personalizada_updated_at on public.captura_formula_personalizada;
create trigger trg_captura_formula_personalizada_updated_at
before update on public.captura_formula_personalizada
for each row
execute function public.set_updated_at();
