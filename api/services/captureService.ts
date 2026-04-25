import { supabase } from '../../src/lib/supabase.js';
import { calculateKpiResult } from './kpiCalculationService.js';
import type { CaptureRequestBody, KpiCalculationConfig } from '../types/kpi.js';

const persistCaptureDetails = async (
  capturaId: string,
  tipoCaptura: CaptureRequestBody['tipo_captura'],
  detalles: CaptureRequestBody['detalles']
) => {
  switch (tipoCaptura) {
    case 'binario_documental':
      for (const documento of detalles as Array<{ campo: string; valor: boolean }>) {
        const { error } = await supabase.from('captura_binaria_documental').upsert(
          { captura_id: capturaId, campo: documento.campo, valor: documento.valor },
          { onConflict: 'captura_id, campo' }
        );
        if (error) throw error;
      }
      break;
    case 'conteo': {
      const { error } = await supabase.from('captura_conteo').upsert(
        {
          captura_id: capturaId,
          programados: (detalles as { programados?: number }).programados,
          cumplidos: (detalles as { cumplidos?: number }).cumplidos
        },
        { onConflict: 'captura_id' }
      );
      if (error) throw error;
      break;
    }
    case 'conteo_operativo': {
      const { error } = await supabase.from('captura_conteo_operativo').upsert(
        {
          captura_id: capturaId,
          total_operaciones: (detalles as { total_operaciones?: number }).total_operaciones,
          operaciones_correctas: (detalles as { operaciones_correctas?: number }).operaciones_correctas
        },
        { onConflict: 'captura_id' }
      );
      if (error) throw error;
      break;
    }
    case 'fechas': {
      const entregas = Array.isArray(detalles)
        ? (detalles as Array<{ solicitud: string; entrega: string }>)
        : ((detalles as { entregas?: Array<{ solicitud: string; entrega: string }> }).entregas ?? []);

      const { error: deleteError } = await supabase
        .from('captura_entregas')
        .delete()
        .eq('captura_id', capturaId);
      if (deleteError) throw deleteError;

      for (const entrega of entregas) {
        const solicitud = new Date(entrega.solicitud);
        const fechaEntrega = new Date(entrega.entrega);
        const diasEntrega = Math.max(
          0,
          Math.ceil((fechaEntrega.getTime() - solicitud.getTime()) / (1000 * 60 * 60 * 24))
        );

        const { error } = await supabase.from('captura_entregas').insert({
          captura_id: capturaId,
          fecha_solicitud: entrega.solicitud,
          fecha_entrega: entrega.entrega,
          dias_entrega: diasEntrega,
          cumplio_tiempo: diasEntrega <= 2
        });
        if (error) throw error;
      }
      break;
    }
    case 'formula_personalizada': {
      const { error } = await supabase.from('captura_formula_personalizada').upsert(
        { captura_id: capturaId, valores: detalles },
        { onConflict: 'captura_id' }
      );
      if (error) throw error;
      break;
    }
    default:
      throw new Error(`Tipo de captura desconocido: ${tipoCaptura}`);
  }
};

export const saveCapture = async (body: CaptureRequestBody) => {
  const { kpi_id, anio, mes, tipo_captura, comentario, detalles } = body;

  if (!kpi_id || !anio || !mes || !tipo_captura || !detalles) {
    throw new Error('Faltan parametros minimos.');
  }

  const { data: periodoObj, error: periodoError } = await supabase
    .from('periodos')
    .select('id')
    .eq('anio', anio)
    .eq('mes', mes)
    .single();

  if (periodoError) throw new Error('No se encontro el periodo asignado.');

  const { data: cabecera, error: capturaError } = await supabase
    .from('kpi_capturas')
    .upsert(
      {
        kpi_id,
        periodo_id: periodoObj.id,
        estado: 'finalizado',
        comentario: comentario || null
      },
      { onConflict: 'kpi_id, periodo_id' }
    )
    .select('id')
    .single();

  if (capturaError) throw capturaError;

  await persistCaptureDetails(cabecera.id, tipo_captura, detalles);

  const { data: configKpi, error: configError } = await supabase
    .from('v_kpis_detalle')
    .select('formula_tipo, semaforo_verde_min, semaforo_amarillo_min, limite_dias, config_json')
    .eq('kpi_id', kpi_id)
    .single();

  if (configError || !configKpi) {
    throw configError || new Error('No se pudo cargar la configuracion del KPI.');
  }

  const calculation = calculateKpiResult(configKpi as KpiCalculationConfig, detalles);

  const { error: resultError } = await supabase.from('kpi_resultados').upsert(
    {
      kpi_id,
      periodo_id: periodoObj.id,
      captura_id: cabecera.id,
      valor_resultado: calculation.valor_resultado,
      valor_auxiliar: calculation.valor_auxiliar,
      unidad_resultado: calculation.unidad_resultado,
      semaforo: calculation.semaforo
    },
    { onConflict: 'kpi_id, periodo_id' }
  );

  if (resultError) throw resultError;
};
