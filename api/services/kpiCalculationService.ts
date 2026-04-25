import {
  evaluateCustomFormula,
  validateCustomFormula,
  type CustomFormulaConfig
} from '../../src/lib/customFormula.js';
import type { KpiCalculationConfig } from '../types/kpi.js';

interface CalculationResult {
  valor_resultado: number;
  valor_auxiliar: number | null;
  semaforo: string;
  unidad_resultado: string;
}

const calculateDeliveryMetrics = (
  detalles: Array<{ solicitud: string; entrega: string }>,
  limiteDias: number
) => {
  let entregasATiempo = 0;
  let sumaDias = 0;

  detalles.forEach((entrega) => {
    const solicitud = new Date(entrega.solicitud);
    const fechaEntrega = new Date(entrega.entrega);
    const dias = Math.max(
      0,
      Math.ceil((fechaEntrega.getTime() - solicitud.getTime()) / (1000 * 60 * 60 * 24))
    );

    sumaDias += dias;
    if (dias <= limiteDias) entregasATiempo += 1;
  });

  return {
    valor_resultado: (entregasATiempo / detalles.length) * 100,
    valor_auxiliar: sumaDias / detalles.length
  };
};

export const calculateKpiResult = (
  config: KpiCalculationConfig,
  detalles: unknown
): CalculationResult => {
  let valor_resultado = 0;
  let valor_auxiliar: number | null = null;
  let semaforo = 'gris';
  let seCalcula = true;

  switch (config.formula_tipo) {
    case 'si_no': {
      const cumple = (detalles as Array<{ valor: boolean }>)[0]?.valor === true;
      valor_resultado = cumple ? 100 : 0;
      break;
    }
    case 'documental_doble': {
      const documentosEntregados = (detalles as Array<{ valor: boolean }>).filter(
        (detalle) => detalle.valor === true
      ).length;
      valor_resultado = documentosEntregados === 2 ? 100 : documentosEntregados === 1 ? 50 : 0;
      break;
    }
    case 'cumplidos_programados': {
      const { programados = 0, cumplidos = 0 } = detalles as {
        programados?: number;
        cumplidos?: number;
      };
      if (programados === 0) seCalcula = false;
      else valor_resultado = (cumplidos / programados) * 100;
      break;
    }
    case 'correctos_total': {
      const { total_operaciones = 0, operaciones_correctas = 0 } = detalles as {
        total_operaciones?: number;
        operaciones_correctas?: number;
      };
      if (total_operaciones === 0) seCalcula = false;
      else valor_resultado = (operaciones_correctas / total_operaciones) * 100;
      break;
    }
    case 'entregas_a_tiempo': {
      const entregas = Array.isArray(detalles)
        ? (detalles as Array<{ solicitud: string; entrega: string }>)
        : ((detalles as { entregas?: Array<{ solicitud: string; entrega: string }> }).entregas ?? []);

      if (entregas.length === 0) {
        seCalcula = false;
      } else {
        const limiteDias = config.limite_dias ?? 2;
        const resultado = calculateDeliveryMetrics(entregas, limiteDias);
        valor_resultado = resultado.valor_resultado;
        valor_auxiliar = resultado.valor_auxiliar;
      }
      break;
    }
    case 'formula_personalizada': {
      const customFormula = config.config_json?.custom_formula as CustomFormulaConfig | undefined;
      const validation = customFormula
        ? validateCustomFormula(customFormula)
        : { valid: false, error: 'No se encontro la configuracion de la formula personalizada.' };

      if (!validation.valid || !customFormula) {
        throw new Error(validation.error || 'La formula personalizada no es valida.');
      }

      valor_resultado = evaluateCustomFormula(
        customFormula.expression,
        detalles as Record<string, number>
      );
      break;
    }
    default:
      throw new Error(`Formula no soportada: ${config.formula_tipo}`);
  }

  if (seCalcula) {
    valor_resultado = Math.round(valor_resultado * 100) / 100;
    if (valor_auxiliar !== null) {
      valor_auxiliar = Math.round(valor_auxiliar * 100) / 100;
    }

    const verdeMin = config.semaforo_verde_min ?? 100;
    const amarilloMin = config.semaforo_amarillo_min ?? 80;

    if (valor_resultado >= verdeMin) semaforo = 'verde';
    else if (valor_resultado >= amarilloMin) semaforo = 'amarillo';
    else semaforo = 'rojo';
  }

  return {
    valor_resultado,
    valor_auxiliar,
    semaforo,
    unidad_resultado: '%'
  };
};
