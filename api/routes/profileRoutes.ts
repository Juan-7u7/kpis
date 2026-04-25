import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createProfile,
  deactivateProfile,
  getProfileAreaAssignments,
  getProfileKpiAssignments,
  getProfilesByEmpresa,
  updateProfile,
  updateProfileAreaAssignments,
  updateProfileKpiAssignments
} from '../services/profileService.js';
import type { CreateProfileBody, UpdateProfileBody } from '../types/kpi.js';

const router = Router();

const getSingleValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

router.get(
  '/empresas/:empresa_id/profiles',
  asyncHandler(async (req, res) => {
    const empresaId = getSingleValue(req.params.empresa_id);
    if (!empresaId) {
      return res.status(400).json({ success: false, error: 'Debe especificar empresa_id.' });
    }

    const data = await getProfilesByEmpresa(empresaId);
    res.json({ success: true, data });
  })
);

router.post(
  '/profiles/create',
  asyncHandler(async (req, res) => {
    try {
      const data = await createProfile(req.body as CreateProfileBody);
      res.json({ success: true, data, message: 'Trabajador creado correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el trabajador.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.put(
  '/profiles/:id',
  asyncHandler(async (req, res) => {
    try {
      const data = await updateProfile({ ...(req.body as UpdateProfileBody), id: getSingleValue(req.params.id) || '' });
      res.json({ success: true, data, message: 'Trabajador actualizado correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el trabajador.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.delete(
  '/profiles/:id',
  asyncHandler(async (req, res) => {
    try {
      const profileId = getSingleValue(req.params.id);
      if (!profileId) {
        return res.status(400).json({ success: false, error: 'Debe especificar el id del trabajador.' });
      }

      await deactivateProfile(profileId);
      res.json({ success: true, message: 'Trabajador desactivado correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desactivar el trabajador.';
      res.status(400).json({ success: false, error: message });
    }
  })
);

router.get(
  '/profiles/:profile_id/areas',
  asyncHandler(async (req, res) => {
    const profileId = getSingleValue(req.params.profile_id);
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'Debe especificar profile_id.' });
    }

    const data = await getProfileAreaAssignments(profileId);
    res.json({ success: true, data });
  })
);

router.post(
  '/profiles/:profile_id/areas',
  asyncHandler(async (req, res) => {
    const profileId = getSingleValue(req.params.profile_id);
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'Debe especificar profile_id.' });
    }

    const areaIds = Array.isArray(req.body?.area_ids) ? (req.body.area_ids as string[]) : [];
    await updateProfileAreaAssignments(profileId, areaIds);
    res.json({ success: true, message: 'Áreas asignadas correctamente.' });
  })
);

router.get(
  '/profiles/:profile_id/kpis',
  asyncHandler(async (req, res) => {
    const profileId = getSingleValue(req.params.profile_id);
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'Debe especificar profile_id.' });
    }

    const data = await getProfileKpiAssignments(profileId);
    res.json({ success: true, data });
  })
);

router.post(
  '/profiles/:profile_id/kpis',
  asyncHandler(async (req, res) => {
    const profileId = getSingleValue(req.params.profile_id);
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'Debe especificar profile_id.' });
    }

    const kpiIds = Array.isArray(req.body?.kpi_ids) ? (req.body.kpi_ids as string[]) : [];
    await updateProfileKpiAssignments(profileId, kpiIds);
    res.json({ success: true, message: 'KPIs asignados correctamente.' });
  })
);

export default router;
