import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTestData() {
  console.log('🧹 Limpiando datos de prueba (resultados de captura)...');

  // Borrar todos los resultados de los KPIs
  const { error, count } = await supabase
    .from('kpi_resultados')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error('❌ Error al limpiar resultados:', error.message);
  } else {
    console.log('✅ Todos los resultados de captura han sido eliminados.');
    console.log('✨ El sistema está listo para recibir datos reales.');
  }
}

clearTestData().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
