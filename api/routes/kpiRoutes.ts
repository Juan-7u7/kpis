import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createArea,
  createEmpresa,
  createKpi,
  deactivateArea,
  deactivateEmpresa,
  deleteKpiById,
  getEmpresas,
  getAreas,
  getKpiConfigById,
  getKpiHistory,
  getKpisByPeriod,
  getNextKpiOrder,
  updateArea,
  updateEmpresa
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
  '/empresas',
  asyncHandler(async (_req, res) => {
    const data = await getEmpresas();
    res.json({ success: true, data });
  })
);

router.post(
  '/empresas/create',
  asyncHandler(async (req, res) => {
    try {
      const data = await createEmpresa(req.body);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la empresa.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.put(
  '/empresas/:id',
  asyncHandler(async (req, res) => {
    try {
      const data = await updateEmpresa({ ...req.body, id: getSingleQueryValue(req.params.id) || '' });
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar la empresa.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.delete(
  '/empresas/:id',
  asyncHandler(async (req, res) => {
    try {
      const empresaId = getSingleQueryValue(req.params.id);
      if (!empresaId) {
        return res.status(400).json({ success: false, error: 'Debe especificar el id de la empresa.' });
      }

      await deactivateEmpresa(empresaId);
      res.json({ success: true, message: 'Empresa desactivada correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo desactivar la empresa.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.get(
  '/kpis',
  asyncHandler(async (req, res) => {
    const empresaId = String(req.query.empresa_id ?? '');
    const anio = String(req.query.anio ?? '');
    const mes = String(req.query.mes ?? '');

    if (!empresaId || !anio || !mes) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar empresa_id, anio y mes.'
      });
    }

    const data = await getKpisByPeriod(empresaId, anio, mes);
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
  asyncHandler(async (req, res) => {
    const empresaId = req.query.empresa_id ? String(req.query.empresa_id) : undefined;
    const data = await getAreas(empresaId);
    res.json({ success: true, data });
  })
);

router.get(
  '/empresas/:empresa_id/areas',
  asyncHandler(async (req, res) => {
    const empresaId = getSingleQueryValue(req.params.empresa_id);
    const data = await getAreas(empresaId);
    res.json({ success: true, data });
  })
);

router.post(
  '/areas/create',
  asyncHandler(async (req, res) => {
    try {
      const data = await createArea(req.body);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el área.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.put(
  '/areas/:id',
  asyncHandler(async (req, res) => {
    try {
      const data = await updateArea({ ...req.body, id: getSingleQueryValue(req.params.id) || '' });
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el área.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.delete(
  '/areas/:id',
  asyncHandler(async (req, res) => {
    try {
      const areaId = getSingleQueryValue(req.params.id);
      if (!areaId) {
        return res.status(400).json({ success: false, error: 'Debe especificar el id del área.' });
      }

      await deactivateArea(areaId);
      res.json({ success: true, message: 'Área desactivada correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo desactivar el área.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.get(
  '/kpis/orden',
  asyncHandler(async (req, res) => {
    const empresaId = req.query.empresa_id ? String(req.query.empresa_id) : '';
    if (!empresaId) {
      return res.status(400).json({ success: false, error: 'Debe especificar empresa_id.' });
    }
    const nextOrder = await getNextKpiOrder(empresaId);
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
