import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createKpi,
  deleteKpiById,
  getAreas,
  getKpiConfigById,
  getKpiHistory,
  getKpisByPeriod,
  getNextKpiOrder
} from '../services/kpiService.js';
import type { CreateKpiBody } from '../types/kpi.js';

const router = Router();

const getSingleQueryValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

router.get(
  '/test-db',
  asyncHandler(async (_req, res) => {
    const data = await getAreas();
    res.json({
      success: true,
      message: 'Conexion exitosa a Supabase',
      data: data.slice(0, 5)
    });
  })
);

router.get(
  '/kpis',
  asyncHandler(async (req, res) => {
    const anio = String(req.query.anio ?? '');
    const mes = String(req.query.mes ?? '');

    if (!anio || !mes) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar anio y mes (ej: /api/kpis?anio=2026&mes=2)'
      });
    }

    const data = await getKpisByPeriod(anio, mes);
    res.json({ success: true, data });
  })
);

router.get(
  '/kpi-config/:kpi_id',
  asyncHandler(async (req, res) => {
    const kpiId = getSingleQueryValue(req.params.kpi_id);
    const data = await getKpiConfigById(kpiId || '');
    res.json({ success: true, data });
  })
);

router.get(
  '/kpi-historico/:kpi_id',
  asyncHandler(async (req, res) => {
    const anio = getSingleQueryValue(req.query.anio as string | string[] | undefined);
    const kpiId = getSingleQueryValue(req.params.kpi_id);
    const { meta, historico } = await getKpiHistory(kpiId || '', anio);
    res.json({ success: true, meta, data: historico });
  })
);

router.get(
  '/areas',
  asyncHandler(async (_req, res) => {
    const data = await getAreas();
    res.json({ success: true, data });
  })
);

router.get(
  '/kpis/orden',
  asyncHandler(async (_req, res) => {
    const nextOrder = await getNextKpiOrder();
    res.json({ success: true, next_order: nextOrder });
  })
);

router.post(
  '/kpis/create',
  asyncHandler(async (req, res) => {
    try {
      const result = await createKpi(req.body as CreateKpiBody);
      res.json({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el KPI';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.delete(
  '/kpis/:id',
  asyncHandler(async (req, res) => {
    try {
      const kpiId = getSingleQueryValue(req.params.id);
      await deleteKpiById(kpiId || '');
      res.json({ success: true, message: 'KPI eliminado correctamente' });
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error instanceof Error && error.name === 'ForbiddenError') {
        return res.status(403).json({ success: false, error: error.message });
      }
      throw error;
    }
  })
);

export default router;
