import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoCaptures() {
  console.log('📊 Cargando capturas reales de demo para Febrero 2026...');

  // 1. Obtener los KPIs de TODITO
  const { data: kpis, error: kpiError } = await supabase
    .from('kpis')
    .select('id, nombre')
    .eq('empresa_id', (await supabase.from('empresas').select('id').eq('slug', 'todito').single()).data?.id);

  if (kpiError || !kpis) throw new Error('No se encontraron KPIs para TODITO');

  // 2. Obtener o Crear Período (Febrero 2026)
  let { data: periodo } = await supabase
    .from('periodos')
    .select('id')
    .eq('anio', 2026)
    .eq('mes', 2)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriod, error: pErr } = await supabase
      .from('periodos')
      .insert({ anio: 2026, mes: 2, nombre: 'Febrero 2026', cerrado: false })
      .select()
      .single();
    if (pErr) throw pErr;
    periodo = newPeriod;
  }

  const findKpi = (name: string) => kpis.find(k => k.nombre.toLowerCase().includes(name.toLowerCase()))?.id;

  const demoData = [
    { 
      name: 'EBITDA vs Meta (%)', 
      valor: 92.19, 
      json: { ebitda_real: 43058, ebitda_meta: 46705 } 
    },
    { 
      name: '% requerimientos CNBV/Condusef atendidos', 
      valor: 99.36, 
      json: { atendidos: 4652, recibidos: 4682 } 
    },
    { 
      name: '% de reportes/oficios en tiempo', 
      valor: 100, 
      json: { tiempo: 105, totales: 105 } 
    },
    { 
      name: 'Avance del Plan anual de Seguridad', 
      valor: 90, 
      json: { ejec: 18, plan: 20 } 
    },
    { 
      name: 'Tasa de Fraude (%)', 
      valor: 1.0, 
      json: { monto_f: 1500, monto_t: 150000 } 
    },
    { 
      name: 'Incidencias Operativas por cada 10k Trans.', 
      valor: 0.4, 
      json: { inc: 4, txs: 100000 } 
    }
  ];

  for (const item of demoData) {
    const kpiId = findKpi(item.name);
    if (!kpiId || !periodo) continue;

    // 3. Crear el registro en kpi_capturas primero (Padre)
    const { data: captura, error: capErr } = await supabase
      .from('kpi_capturas')
      .insert({
        kpi_id: kpiId,
        periodo_id: periodo.id,
        estado: 'finalizado',
        comentario: 'Carga demo automática (Excel Feb 2026)'
      })
      .select()
      .single();

    if (capErr) {
      console.error(`❌ Error creando captura padre para ${item.name}:`, capErr.message);
      continue;
    }

    // 4. Insertar resultado vinculado a la captura
    const { error: resErr } = await supabase
      .from('kpi_resultados')
      .upsert({
        kpi_id: kpiId,
        periodo_id: periodo.id,
        captura_id: captura.id,
        valor_resultado: item.valor,
        unidad_resultado: '%',
        semaforo: item.valor >= 95 ? 'verde' : (item.valor >= 85 ? 'amarillo' : 'rojo'),
        detalle_resultado: item.json,
        calculado_en: new Date().toISOString()
      }, { onConflict: 'kpi_id, periodo_id' });

    if (resErr) console.error(`❌ Error en el resultado de ${item.name}:`, resErr.message);
    else console.log(`✅ Resultado y Captura cargados: ${item.name} (${item.valor}%)`);
  }

  console.log('\n✨ Datos de Febrero 2026 listos en el dashboard.');
}

seedDemoCaptures().catch(err => {
  console.error('💥 Error:', err);
});
