import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import captureRoutes from './routes/captureRoutes.js';
import kpiRoutes from './routes/kpiRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', kpiRoutes);
app.use('/api', captureRoutes);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  void next;
  console.error('Error en API:', err);

  const message = err instanceof Error ? err.message : 'Error interno en servidor';
  res.status(500).json({ success: false, error: message });
});

export default app;
