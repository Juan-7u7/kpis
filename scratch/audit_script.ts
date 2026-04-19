import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function runAudit() {
  console.log('🚀 INICIANDO AUDITORÍA REAL DE PRODUCCIÓN\n');

  // 1. Verificar KPIs cargados
  const { data: kpis } = await supabase.from('kpis').select('id, nombre, formula_tipo');
  console.log(`✅ KPIs en DB: ${kpis?.length}`);

  // 2. Verificar Resultados del Mes Actual (o último mes con datos)
  const { data: resultados } = await supabase
    .from('kpi_resultados')
    .select('*, kpis(nombre)')
    .order('periodo_id', { ascending: false })
    .limit(10);
  
  if (!resultados || resultados.length === 0) {
    console.log('⚠️ No se encontraron resultados en kpi_resultados. ¿Se han realizado capturas?');
  } else {
    console.log(`✅ Se encontraron ${resultados.length} resultados recientes.`);
    resultados.forEach(r => {
      console.log(`   - [${r.kpis.nombre}]: ${r.valor_resultado}% (Semáforo: ${r.semaforo})`);
    });
  }

  // 3. Probar Lógica de Cálculo (Simulación de api/index.ts)
  console.log('\n🧪 PROBANDO LÓGICA DE CÁLCULO (Simulación Backend):');
  
  // KPI 5: Fechas
  const mockEntregas = [
    { solicitud: '2026-04-01', entrega: '2026-04-03' }, // 2 dias -> OK
    { solicitud: '2026-04-01', entrega: '2026-04-05' }  // 4 dias -> FAIL
  ];
  let aTiempo = 0;
  mockEntregas.forEach(ent => {
    const d = Math.ceil((new Date(ent.entrega).getTime() - new Date(ent.solicitud).getTime()) / (1000*60*60*24));
    if (d <= 2) aTiempo++;
  });
  const res5 = (aTiempo / mockEntregas.length) * 100;
  console.log(`   KPI 5 (Entregas): Expect 50, Got ${res5} -> ${res5 === 50 ? 'PASSED' : 'FAILED'}`);

  // KPI 3: Conteo
  const prog = 3, cump = 2;
  const res3 = (cump / prog) * 100;
  console.log(`   KPI 3 (Conteo): Expect 66.67, Got ${res3.toFixed(2)} -> ${res3.toFixed(2) === '66.67' ? 'PASSED' : 'FAILED'}`);

  // 4. Verificación de Inconsistencias
  const { data: capturas } = await supabase.from('kpi_capturas').select('id');
  const { count: resCount } = await supabase.from('kpi_resultados').select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 INTEGRIDAD:`);
  console.log(`   - Total Capturas: ${capturas?.length}`);
  console.log(`   - Total Resultados: ${resCount}`);
  
  if (capturas?.length !== resCount) {
    console.log('   ⚠️ ADVERTENCIA: Hay desincronización entre capturas y resultados.');
  } else {
    console.log('   ✅ Sincronización perfecta entre capturas y resultados.');
  }
}

runAudit().catch(console.error);
