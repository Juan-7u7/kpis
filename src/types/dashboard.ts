import type { VisualConfig } from '../../api/types/kpi';

export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
}

export interface KPI {
  id: string;
  kpi_id: string;
  resultado_id: string | null;
  kpi_nombre: string;
  area: string;
  valor: number | null;
  semaforo: string;
  unidad: string;
  formula_tipo: string;
  tipo_resultado: string;
  es_borrable?: boolean;
  kpi_config?: {
    config_json?: {
      visual?: VisualConfig;
    } | null;
  } | null;
}

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
}

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface KpiGroup {
  [area: string]: KPI[];
}
