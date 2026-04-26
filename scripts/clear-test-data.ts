import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTestData() {
  console.log('🧹 Iniciando limpieza profunda de datos de prueba...');

  const tablesToClear = [
    'kpi_resultados',
    'kpi_capturas',
    'kpi_justificaciones',
    'kpi_evidencias',
    'captura_binaria_documental',
    'captura_conteo',
    'captura_conteo_operativo',
    'captura_entregas',
    'captura_formula_personalizada'
  ];

  for (const table of tablesToClear) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borra todo

    if (error) {
      console.warn(`⚠️ Nota en tabla ${table}:`, error.message);
    } else {
      console.log(`✅ Tabla ${table} limpiada.`);
    }
  }

  console.log('\n✨ El sistema ha sido reseteado. Los KPIs y Áreas permanecen intactos.');
}

clearTestData().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
