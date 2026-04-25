import type { CustomFormulaConfig } from '../../src/lib/customFormula.js';

export interface KPIBase {
  id: string;
  empresa_id: string;
  nombre: string;
  formula_tipo: string;
  tipo_resultado: string;
  orden_visual: number;
  areas: { id: string; nombre: string }[] | null;
}

export interface KPIResultRecord {
  id: string;
  kpi_id: string;
  valor_resultado: number;
  valor_auxiliar: number | null;
  unidad_resultado: string;
  semaforo: string;
  periodos: { anio: number; mes: number; nombre: string };
}

export interface KpiHistoryRecord {
  valor_resultado: number;
  valor_auxiliar: number | null;
  unidad_resultado: string;
  semaforo: string;
  periodos: { mes: number; nombre: string } | { mes: number; nombre: string }[];
  kpi_capturas: { comentario: string | null } | { comentario: string | null }[] | null;
}

export interface CreateKpiBody {
  empresa_id: string;
  nombre: string;
  area_id?: string;
  meta_descripcion: string;
  formula_tipo:
    | 'si_no'
    | 'documental_doble'
    | 'cumplidos_programados'
    | 'correctos_total'
    | 'entregas_a_tiempo'
    | 'formula_personalizada';
  tipo_captura:
    | 'binario_documental'
    | 'conteo'
    | 'conteo_operativo'
    | 'fechas'
    | 'formula_personalizada';
  tipo_resultado: 'porcentaje' | 'dias_y_porcentaje';
  semaforo_verde_min: number;
  semaforo_amarillo_min: number;
  limite_dias?: number;
  permite_multiple_evento_mes?: boolean;
  campos_documentales?: string[];
  formula_personalizada?: CustomFormulaConfig;
  guia?: string;
  objetivo?: string;
  definicion?: string;
  medicion?: string;
  sentido?: 'higher_is_better' | 'lower_is_better' | 'range_is_better';
  fuente_datos?: string;
  fecha_entrega_info?: string;
}

export interface CaptureRequestBody {
  kpi_id: string;
  anio: string;
  mes: string;
  tipo_captura: 'binario_documental' | 'conteo' | 'conteo_operativo' | 'fechas' | 'formula_personalizada';
  comentario?: string;
  detalles:
    | Array<{ campo: string; valor: boolean }>
    | { programados?: number; cumplidos?: number }
    | { total_operaciones?: number; operaciones_correctas?: number }
    | { entregas?: Array<{ solicitud: string; entrega: string }> }
    | Array<{ solicitud: string; entrega: string }>
    | Record<string, number>;
}

export interface KpiCalculationConfig {
  formula_tipo: string;
  semaforo_verde_min: number | null;
  semaforo_amarillo_min: number | null;
  limite_dias?: number | null;
  config_json?: { 
    custom_formula?: CustomFormulaConfig;
    sentido?: 'higher_is_better' | 'lower_is_better' | 'range_is_better';
    objetivo?: string;
    definicion?: string;
    medicion?: string;
    fuente_datos?: string;
    fecha_entrega_info?: string;
  } | null;
}

export interface EmpresaRecord {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  descripcion?: string | null;
}

export interface AreaRecord {
  id: string;
  nombre: string;
  empresa_id?: string;
  activo?: boolean;
  descripcion?: string | null;
}

export interface CreateEmpresaBody {
  nombre: string;
  descripcion?: string;
}

export interface CreateAreaBody {
  empresa_id: string;
  nombre: string;
  descripcion?: string;
}

export interface UpdateEmpresaBody {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface UpdateAreaBody {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string;
}

export interface ProfileRecord {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  empresa_id?: string;
}

export interface CreateProfileBody {
  empresa_id: string;
  nombre: string;
  email: string;
}

export interface UpdateProfileBody {
  id: string;
  empresa_id: string;
  nombre: string;
  email: string;
}

export interface UpdateProfileAssignmentsBody {
  profile_id: string;
  area_ids?: string[];
  kpi_ids?: string[];
}
