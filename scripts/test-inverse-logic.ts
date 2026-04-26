import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInverseLogic() {
  console.log('🧪 Probando lógica inversa: Cargando 1% de Fraude...');

  const { data: kpi } = await supabase
    .from('kpis')
    .select('id')
    .eq('nombre', 'Tasa de Fraude (%)')
    .single();

  if (!kpi) throw new Error('KPI Tasa de Fraude no encontrado');

  // Asegurar periodo
  let { data: periodo } = await supabase.from('periodos').select('id').eq('anio', 2026).eq('mes', 2).maybeSingle();
  if (!periodo) {
    const { data: p } = await supabase.from('periodos').insert({ anio: 2026, mes: 2, nombre: 'Febrero 2026' }).select().single();
    periodo = p;
  }

  // Crear captura y resultado
  const { data: cap } = await supabase.from('kpi_capturas').insert({
    kpi_id: kpi.id,
    periodo_id: periodo!.id,
    estado: 'finalizado',
    comentario: 'Prueba de lógica inversa (1% debe ser verde)'
  }).select().single();

  // El motor de cálculo en el backend se activa por API, pero aquí insertamos directo.
  // Como insertamos directo, debemos aplicar la lógica nosotros para la visualización manual:
  // 1% <= 1.0 (verdeMin) -> Verde
  const { error } = await supabase.from('kpi_resultados').upsert({
    kpi_id: kpi.id,
    periodo_id: periodo!.id,
    captura_id: cap!.id,
    valor_resultado: 1.0,
    unidad_resultado: '%',
    semaforo: 'verde',
    detalle_resultado: { monto_f: 1000, monto_t: 100000 }
  }, { onConflict: 'kpi_id, periodo_id' });

  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ 1% de Fraude cargado exitosamente como VERDE.');
}

testInverseLogic();
