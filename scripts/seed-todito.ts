import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedToditoFull() {
  console.log('🚀 Iniciando carga masiva de datos para TODITO (Lista Completa)...');

  // 1. Crear/Obtener Empresa
  const { data: empresa, error: empError } = await supabase
    .from('empresas')
    .upsert({ 
      nombre: 'TODITO', 
      slug: 'todito', 
      descripcion: 'Servicios Financieros y Tecnológicos',
      activo: true 
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (empError) throw empError;
  console.log(`✅ Empresa TODITO lista`);

  // 2. Crear/Obtener Áreas
  const areasNames = [
    'Dirección General',
    'Dirección Comercial',
    'Dirección de Administración y Finanzas',
    'Dirección de Sistemas',
    'Dirección de Recursos Humanos',
    'Dirección de Normatividad',
    'Dirección de Operaciones',
    'Gerencia de Seguridad de la Información (CISO)'
  ];

  const { data: areas, error: areaError } = await supabase
    .from('areas')
    .upsert(
      areasNames.map(n => ({ nombre: n, empresa_id: empresa.id, activo: true })),
      { onConflict: 'nombre, empresa_id' }
    )
    .select();

  if (areaError) throw areaError;
  const findArea = (name: string) => areas.find(a => a.nombre.toLowerCase().includes(name.toLowerCase()))?.id;

  // 3. Definición de todos los KPIs del documento
  const allKpis = [
    // --- FINANZAS & COMERCIAL ---
    { nombre: 'EBITDA vs Meta (%)', area: 'Finanzas', formula: '(@ebitda_real / @ebitda_meta) * 100', vars: [{n:'ebitda_real', l:'EBITDA Real'}, {n:'ebitda_meta', l:'EBITDA Meta'}], v: 95, a: 85 },
    { nombre: 'Margen Comercial (%)', area: 'Comercial', formula: '((@ing - @cost) / @ing) * 100', vars: [{n:'ing', l:'Ingresos'}, {n:'cost', l:'Costos'}], v: 15, a: 12 },
    { nombre: 'Ingresos por comisiones/fees', area: 'Comercial', formula: '@monto', vars: [{n:'monto', l:'Monto Total Facturado'}], v: 100, a: 90 },
    
    // --- OPERACIONES (SENTIDO INVERSO) ---
    { 
      nombre: 'Tasa de Fraude (%)', 
      area: 'Operaciones', 
      formula: '(@monto_f / @monto_t) * 100', 
      vars: [{n:'monto_f', l:'Monto Fraude'}, {n:'monto_t', l:'Monto Total'}],
      v: 1.0, // Max 1% para verde
      a: 2.0, // Max 2% para amarillo
      sentido: 'lower_is_better'
    },
    { 
      nombre: 'Incidencias Operativas por cada 10k Trans.', 
      area: 'Operaciones', 
      formula: '(@inc / @txs) * 10000', 
      vars: [{n:'inc', l:'Incidencias'}, {n:'txs', l:'Total Transacciones'}],
      v: 0.5, 
      a: 1.0,
      sentido: 'lower_is_better'
    },

    // --- SEGURIDAD (SENTIDO INVERSO) ---
    { 
      nombre: 'Incidentes de Seguridad Severidad Alta', 
      area: 'CISO', 
      formula: '@conteo', 
      vars: [{n:'conteo', l:'N° de Incidentes'}],
      v: 0, 
      a: 1,
      sentido: 'lower_is_better'
    },

    // --- OTROS (NORMALES) ---
    { nombre: 'Avance del Plan anual de Seguridad', area: 'CISO', formula: '(@ejec / @plan) * 100', vars: [{n:'ejec', l:'Act. Ejecutadas'}, {n:'plan', l:'Act. Planificadas'}], v: 90, a: 80 },
    { nombre: '% de reportes/oficios en tiempo', area: 'Normatividad', formula: '(@tiempo / @totales) * 100', vars: [{n:'tiempo', l:'En Tiempo'}, {n:'totales', l:'Total Solicitudes'}], v: 100, a: 95 },
    { nombre: '% requerimientos CNBV/Condusef atendidos', area: 'Normatividad', formula: '(@atendidos / @recibidos) * 100', vars: [{n:'atendidos', l:'Atendidos'}, {n:'recibidos', l:'Recibidos'}], v: 100, a: 95 },
    { nombre: 'Disponibilidad de Servicios TI (%)', area: 'Sistemas', formula: '((@h_tot - @h_ind) / @h_tot) * 100', vars: [{n:'h_tot', l:'Horas Totales'}, {n:'h_ind', l:'Horas Indisp.'}], v: 99.9, a: 99.5 }
  ];

  for (const k of allKpis) {
    const areaId = findArea(k.area);
    if (!areaId) {
      console.warn(`⚠️ Área no encontrada para KPI: ${k.nombre} (Área buscada: ${k.area})`);
      continue;
    }

    // 1. Upsert KPI
    const { data: kpi, error: kpiErr } = await supabase
      .from('kpis')
      .select('id')
      .eq('nombre', k.nombre)
      .eq('area_id', areaId)
      .maybeSingle();

    let currentKpiId: string;

    if (kpi) {
      const { data: updated, error: updErr } = await supabase
        .from('kpis')
        .update({
          tipo_captura: 'formula_personalizada',
          tipo_resultado: 'porcentaje',
          formula_tipo: 'formula_personalizada'
        })
        .eq('id', kpi.id)
        .select()
        .single();
      if (updErr) throw updErr;
      currentKpiId = updated.id;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('kpis')
        .insert({
          nombre: k.nombre,
          area_id: areaId,
          empresa_id: empresa.id,
          meta_descripcion: `Indicador cargado desde Excel TODITO. Área: ${k.area}`,
          frecuencia: 'mensual',
          tipo_captura: 'formula_personalizada',
          tipo_resultado: 'porcentaje',
          formula_tipo: 'formula_personalizada'
        })
        .select()
        .single();
      if (insErr) throw insErr;
      currentKpiId = inserted.id;
    }

    // 2. Upsert Config con Sentido y Umbrales Personalizados
    const { error: cfgErr } = await supabase
      .from('kpi_config')
      .upsert({
        kpi_id: currentKpiId,
        semaforo_verde_min: k.v || 95,
        semaforo_amarillo_min: k.a || 85,
        semaforo_rojo_max: (k.a || 85) - 0.01,
        config_json: {
          sentido: k.sentido || 'higher_is_better',
          custom_formula: {
            formula: k.formula,
            variables: k.vars.map(v => ({ key: v.n, label: v.l, type: 'number', required: true }))
          }
        }
      }, { onConflict: 'kpi_id' });

    if (cfgErr) console.error(`❌ Error en config de ${k.nombre}:`, cfgErr.message);
    else console.log(`✅ KPI configurado: ${k.nombre} [${k.sentido || 'higher'}]`);
  }

  console.log('\n✨ Carga COMPLETA de TODITO finalizada.');
}

seedToditoFull().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
