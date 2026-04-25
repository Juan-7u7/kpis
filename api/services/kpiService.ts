import { validateCustomFormula } from '../../src/lib/customFormula.js';
import { supabase } from '../../src/lib/supabase.js';
import type {
  AreaRecord,
  CreateAreaBody,
  CreateEmpresaBody,
  CreateKpiBody,
  EmpresaRecord,
  KPIBase,
  KpiHistoryRecord,
  KPIResultRecord,
  UpdateAreaBody,
  UpdateEmpresaBody
} from '../types/kpi.js';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export const getEmpresas = async () => {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre, slug, descripcion, activo')
    .eq('activo', true)
    .order('nombre');

  if (error) throw error;
  return (data as EmpresaRecord[] | null) ?? [];
};

export const createEmpresa = async (body: CreateEmpresaBody) => {
  const nombre = body.nombre?.trim();
  const descripcion = body.descripcion?.trim() || null;

  if (!nombre) {
    throw new Error('El nombre de la empresa es obligatorio.');
  }

  const slugBase = slugify(nombre);
  if (!slugBase) {
    throw new Error('No se pudo generar un identificador válido para la empresa.');
  }

  const { data: existingEmpresa, error: existingError } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slugBase)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEmpresa) {
    throw new Error('Ya existe una empresa con ese nombre.');
  }

  const { data, error } = await supabase
    .from('empresas')
    .insert({
      nombre,
      slug: slugBase,
      descripcion,
      activo: true
    })
    .select('id, nombre, slug, activo')
    .single();

  if (error) throw error;
  return data as EmpresaRecord;
};

export const updateEmpresa = async (body: UpdateEmpresaBody) => {
  const id = body.id?.trim();
  const nombre = body.nombre?.trim();
  const descripcion = body.descripcion?.trim() || null;

  if (!id || !nombre) {
    throw new Error('id y nombre son obligatorios.');
  }

  const slug = slugify(nombre);
  if (!slug) {
    throw new Error('No se pudo generar un identificador válido para la empresa.');
  }

  const { data: existingEmpresa, error: existingError } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEmpresa) {
    throw new Error('Ya existe otra empresa con ese nombre.');
  }

  const { data, error } = await supabase
    .from('empresas')
    .update({
      nombre,
      slug,
      descripcion
    })
    .eq('id', id)
    .select('id, nombre, slug, descripcion, activo')
    .single();

  if (error) throw error;
  return data as EmpresaRecord;
};

export const deactivateEmpresa = async (empresaId: string) => {
  const { count: activeCompanies, error: countError } = await supabase
    .from('empresas')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true);

  if (countError) throw countError;
  if ((activeCompanies ?? 0) <= 1) {
    throw new Error('No puedes desactivar la única empresa activa del sistema.');
  }

  const { error } = await supabase
    .from('empresas')
    .update({ activo: false })
    .eq('id', empresaId);

  if (error) throw error;
};

export const getKpisByPeriod = async (empresaId: string, anio: string, mes: string) => {
  const { data: kpisData, error: kpisError } = await supabase
    .from('kpis')
    .select(
      `
        id,
        empresa_id,
        nombre,
        formula_tipo,
        tipo_resultado,
        orden_visual,
        areas(id, nombre)
      `
    )
    .eq('empresa_id', empresaId)
    .eq('activo', true);

  if (kpisError) throw kpisError;

  const { data: resultsData, error: resultsError } = await supabase
    .from('kpi_resultados')
    .select(
      `
        id,
        kpi_id,
        valor_resultado,
        valor_auxiliar,
        unidad_resultado,
        semaforo,
        periodos!inner(anio, mes, nombre)
      `
    )
    .in(
      'kpi_id',
      ((kpisData as unknown as KPIBase[] | null) ?? []).map((kpi) => kpi.id).length > 0
        ? ((kpisData as unknown as KPIBase[]) ?? []).map((kpi) => kpi.id)
        : ['00000000-0000-0000-0000-000000000000']
    )
    .eq('periodos.anio', anio)
    .eq('periodos.mes', mes);

  if (resultsError) throw resultsError;

  const kpis = ((kpisData as unknown as KPIBase[]) ?? []).map((kpi) => {
    const resultado = (resultsData as unknown as KPIResultRecord[] | null)?.find(
      (result) => result.kpi_id === kpi.id
    );
    const area = Array.isArray(kpi.areas) ? kpi.areas[0] : kpi.areas;

    return {
      kpi_id: kpi.id,
      resultado_id: resultado ? resultado.id : null,
      area: area?.nombre || 'General',
      kpi_nombre: kpi.nombre,
      formula_tipo: kpi.formula_tipo,
      tipo_resultado: kpi.tipo_resultado,
      periodo: resultado ? resultado.periodos?.nombre : `${mes}/${anio}`,
      valor: resultado?.valor_resultado ?? null,
      valor_auxiliar: resultado?.valor_auxiliar ?? null,
      unidad: resultado?.unidad_resultado ?? (kpi.tipo_resultado === 'porcentaje' ? '%' : ''),
      semaforo: resultado?.semaforo ?? 'gris',
      orden_visual: kpi.orden_visual,
      es_borrable: (kpi.orden_visual || 0) > 7
    };
  });

  return kpis.sort((a, b) => {
    if (a.area < b.area) return -1;
    if (a.area > b.area) return 1;
    return (a.orden_visual || 0) - (b.orden_visual || 0);
  });
};

export const getKpiConfigById = async (kpiId: string) => {
  const { data, error } = await supabase
    .from('v_kpis_detalle')
    .select('*')
    .eq('kpi_id', kpiId)
    .single();

  if (error) throw error;
  return data;
};

export const getKpiHistory = async (kpiId: string, anio?: string) => {
  const { data: meta, error: metaErr } = await supabase
    .from('v_kpis_detalle')
    .select(
      'kpi_nombre, area_nombre, meta_descripcion, formula_descripcion, formula_tipo, semaforo_verde_min, semaforo_amarillo_min, config_json'
    )
    .eq('kpi_id', kpiId)
    .single();

  if (metaErr) {
    console.warn('No se pudo cargar metadatos del KPI (v_kpis_detalle):', metaErr.message);
  }

  let query = supabase
    .from('kpi_resultados')
    .select(
      `
        valor_resultado,
        valor_auxiliar,
        unidad_resultado,
        semaforo,
        periodos!inner(anio, mes, nombre),
        kpi_capturas(comentario)
      `
    )
    .eq('kpi_id', kpiId);

  if (anio) {
    query = query.eq('periodos.anio', anio);
  }

  const { data, error } = await query;
  if (error) throw error;

  const historico = ((data as KpiHistoryRecord[]) ?? [])
    .map((record) => {
      const periodo = Array.isArray(record.periodos) ? record.periodos[0] : record.periodos;
      const captura = Array.isArray(record.kpi_capturas) ? record.kpi_capturas[0] : record.kpi_capturas;

      return {
        mes: periodo?.mes,
        mes_nombre: periodo?.nombre,
        valor: record.valor_resultado,
        valor_auxiliar: record.valor_auxiliar,
        unidad: record.unidad_resultado,
        semaforo: record.semaforo,
        comentario: captura?.comentario || null
      };
    })
    .sort((a, b) => (a.mes || 0) - (b.mes || 0));

  const metaFinal = meta ? {
    ...meta,
    ...(meta.config_json || {})
  } : null;

  return { meta: metaFinal, historico };
};

export const getAreas = async (empresaId?: string) => {
  let query = supabase
    .from('areas')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre');

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const createArea = async (body: CreateAreaBody) => {
  const empresaId = body.empresa_id?.trim();
  const nombre = body.nombre?.trim();
  const descripcion = body.descripcion?.trim() || null;

  if (!empresaId || !nombre) {
    throw new Error('empresa_id y nombre son obligatorios.');
  }

  const { data: existingArea, error: existingAreaError } = await supabase
    .from('areas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('nombre', nombre)
    .maybeSingle();

  if (existingAreaError) throw existingAreaError;
  if (existingArea) {
    throw new Error('Ya existe un área con ese nombre en esta empresa.');
  }

  const { data, error } = await supabase
    .from('areas')
    .insert({
      empresa_id: empresaId,
      nombre,
      descripcion,
      activo: true
    })
    .select('id, nombre, empresa_id, activo')
    .single();

  if (error) throw error;
  return data as AreaRecord;
};

export const updateArea = async (body: UpdateAreaBody) => {
  const id = body.id?.trim();
  const empresaId = body.empresa_id?.trim();
  const nombre = body.nombre?.trim();
  const descripcion = body.descripcion?.trim() || null;

  if (!id || !empresaId || !nombre) {
    throw new Error('id, empresa_id y nombre son obligatorios.');
  }

  const { data: existingArea, error: existingAreaError } = await supabase
    .from('areas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('nombre', nombre)
    .neq('id', id)
    .maybeSingle();

  if (existingAreaError) throw existingAreaError;
  if (existingArea) {
    throw new Error('Ya existe otra área con ese nombre en esta empresa.');
  }

  const { data, error } = await supabase
    .from('areas')
    .update({
      nombre,
      descripcion
    })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('id, nombre, descripcion, empresa_id, activo')
    .single();

  if (error) throw error;
  return data as AreaRecord;
};

export const deactivateArea = async (areaId: string) => {
  const { error } = await supabase
    .from('areas')
    .update({ activo: false })
    .eq('id', areaId);

  if (error) throw error;
};

export const getNextKpiOrder = async (empresaId: string) => {
  const { data, error } = await supabase
    .from('kpis')
    .select('orden_visual')
    .eq('empresa_id', empresaId)
    .order('orden_visual', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? (data[0].orden_visual as number) + 1 : 1;
};

export const createKpi = async (body: CreateKpiBody) => {
  const {
    empresa_id,
    nombre,
    area_id,
    meta_descripcion,
    formula_tipo,
    tipo_captura,
    tipo_resultado,
    semaforo_verde_min,
    semaforo_amarillo_min,
    limite_dias,
    permite_multiple_evento_mes,
    campos_documentales,
    formula_personalizada,
    guia,
    objetivo,
    definicion,
    medicion,
    sentido,
    fuente_datos,
    fecha_entrega_info
  } = body;

  if (!empresa_id || !nombre || !meta_descripcion || !formula_tipo || !tipo_captura || !tipo_resultado) {
    throw new Error('Faltan campos requeridos.');
  }

  if (formula_tipo === 'formula_personalizada') {
    const validation = formula_personalizada
      ? validateCustomFormula(formula_personalizada)
      : { valid: false, error: 'Debes definir la formula personalizada.' };

    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  const nextOrder = await getNextKpiOrder(empresa_id);

  const { data: newKpi, error: kpiError } = await supabase
    .from('kpis')
    .insert({
      empresa_id,
      nombre,
      area_id: area_id || null,
      meta_descripcion,
      descripcion: meta_descripcion,
      formula_tipo,
      tipo_captura,
      tipo_resultado,
      frecuencia: 'mensual',
      orden_visual: nextOrder,
      activo: true
    })
    .select('id')
    .single();

  if (kpiError) throw kpiError;
  if (!newKpi) throw new Error('No se pudo crear el KPI');

  let configJson: Record<string, unknown> = {};

  switch (formula_tipo) {
    case 'documental_doble':
      configJson = {
        campos: campos_documentales ?? ['documento_1', 'documento_2'],
        regla: '100 si ambos true, 50 si uno true, 0 si ambos false'
      };
      break;
    case 'si_no':
      configJson = { regla: '100 si true, 0 si false' };
      break;
    case 'cumplidos_programados':
      configJson = { formula: '(cumplidos / programados) * 100', si_programados_es_0: 'gris' };
      break;
    case 'correctos_total':
      configJson = {
        formula: '(operaciones_correctas / total_operaciones) * 100',
        si_total_operaciones_es_0: 'gris'
      };
      break;
    case 'entregas_a_tiempo':
      configJson = {
        formula: '(entregas_en_tiempo / total_entregas) * 100',
        limite_dias: limite_dias ?? 2
      };
      break;
    case 'formula_personalizada':
      configJson = {
        formula: formula_personalizada?.expression,
        custom_formula: formula_personalizada
      };
      break;
  }

  if (guia) configJson.guia = guia;
  if (objetivo) configJson.objetivo = objetivo;
  if (definicion) configJson.definicion = definicion;
  if (medicion) configJson.medicion = medicion;
  if (sentido) configJson.sentido = sentido;
  else configJson.sentido = 'higher_is_better';
  if (fuente_datos) configJson.fuente_datos = fuente_datos;
  if (fecha_entrega_info) configJson.fecha_entrega_info = fecha_entrega_info;

  const { error: configError } = await supabase.from('kpi_config').insert({
    kpi_id: newKpi.id,
    meta_valor: 100,
    meta_operador: '>=',
    limite_dias: formula_tipo === 'entregas_a_tiempo' ? (limite_dias ?? 2) : null,
    semaforo_verde_min: semaforo_verde_min ?? 100,
    semaforo_amarillo_min: semaforo_amarillo_min ?? 80,
    semaforo_rojo_max: (semaforo_amarillo_min ?? 80) - 0.01,
    permite_multiple_evento_mes:
      formula_tipo === 'entregas_a_tiempo' ? true : (permite_multiple_evento_mes ?? false),
    requiere_justificacion: false,
    config_json: configJson
  });

  if (configError) throw configError;

  return { kpi_id: newKpi.id, message: `KPI "${nombre}" creado exitosamente.` };
};

export const deleteKpiById = async (id: string) => {
  const { data: kpi, error: fetchErr } = await supabase
    .from('kpis')
    .select('orden_visual')
    .eq('id', id)
    .single();

  if (fetchErr || !kpi) {
    const error = new Error('KPI no encontrado');
    error.name = 'NotFoundError';
    throw error;
  }

  if (kpi.orden_visual <= 7) {
    const error = new Error(
      'No se pueden eliminar los KPIs por defecto del sistema. Solo puedes eliminar los creados por ti.'
    );
    error.name = 'ForbiddenError';
    throw error;
  }

  const { error: deleteErr } = await supabase.from('kpis').delete().eq('id', id);
  if (deleteErr) throw deleteErr;
};
