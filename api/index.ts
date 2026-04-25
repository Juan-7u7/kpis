import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`Endpoints de prueba disponibles en:`);
    console.log(`    http://localhost:${PORT}/api/test-db`);
  });
}

export default app;
