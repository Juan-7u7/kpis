import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedJanuary2026() {
  console.log('📅 Generando datos de prueba para Enero 2026 (Basado en Schema Real)...');

  const anioNum = 2026;
  const mesNum = 1;

  // 1. Asegurar que el periodo exista en 'periodos'
  const { data: periodo, error: perError } = await supabase
    .from('periodos')
    .upsert({
      anio: anioNum,
      mes: mesNum,
      nombre: 'Enero 2026',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-31',
      cerrado: false
    }, { onConflict: 'anio, mes' })
    .select()
    .single();

  if (perError) {
    console.error('❌ Error creando periodo:', perError.message);
    return;
  }
  console.log(`✅ Periodo ${periodo.nombre} listo (ID: ${periodo.id})`);

  // 2. Obtener Empresa TODITO
  const { data: empresa, error: empError } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', 'todito')
    .single();

  if (empError || !empresa) {
    console.error('❌ No se encontró la empresa TODITO.');
    return;
  }

  // 3. Obtener todos los KPIs
  const { data: kpis, error: kpisError } = await supabase
    .from('kpis')
    .select(`
      id, 
      nombre, 
      tipo_resultado, 
      kpi_config (config_json)
    `)
    .eq('empresa_id', empresa.id);

  if (kpisError) throw kpisError;

  console.log(`📊 Procesando ${kpis.length} KPIs...`);

  for (const kpi of kpis) {
    const config = (kpi as any).kpi_config?.[0]?.config_json || {};
    const lowerIsBetter = config.sentido === 'lower_is_better';

    let valor = Math.floor(Math.random() * 30) + 70; // 70-100
    if (kpi.tipo_resultado === 'binario') valor = 100;
    
    let semaforo = 'verde';
    if (valor < 90) semaforo = 'amarillo';
    if (valor < 80) semaforo = 'rojo';

    if (lowerIsBetter) {
        valor = Math.floor(Math.random() * 10); // 0-10%
        semaforo = valor < 3 ? 'verde' : (valor < 7 ? 'amarillo' : 'rojo');
    }

    // 4. Insertar Captura (Solo campos que existen en schema_actual.csv)
    const { data: captura, error: capError } = await supabase
      .from('kpi_capturas')
      .upsert({
        kpi_id: kpi.id,
        periodo_id: periodo.id,
        estado: 'finalizado',
        comentario: 'Carga automática de prueba'
      }, { onConflict: 'kpi_id, periodo_id' })
      .select()
      .single();

    if (capError) {
        console.warn(`⚠️ Error en captura para ${kpi.nombre}:`, capError.message);
        continue;
    }

    // 5. Insertar Resultado
    const { error: resError } = await supabase
      .from('kpi_resultados')
      .upsert({
        kpi_id: kpi.id,
        periodo_id: periodo.id,
        captura_id: captura.id,
        valor_resultado: valor,
        semaforo: semaforo,
        unidad_resultado: kpi.tipo_resultado === 'porcentaje' ? '%' : '',
        calculado_en: new Date().toISOString()
      }, { onConflict: 'kpi_id, periodo_id' });

    if (resError) {
        console.warn(`⚠️ Error en resultado para ${kpi.nombre}:`, resError.message);
    }
  }

  console.log('✨ Carga exitosa. Revisa el Dashboard en Enero 2026.');
}

seedJanuary2026().catch(console.error);
