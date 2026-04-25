import { Router } from 'express';
import { saveCapture } from '../services/captureService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { CaptureRequestBody } from '../types/kpi.js';

const router = Router();

router.post(
  '/capturas',
  asyncHandler(async (req, res) => {
    await saveCapture(req.body as CaptureRequestBody);
    res.json({ success: true, message: 'Captura guardada y calculada correctamente' });
  })
);

export default router;
