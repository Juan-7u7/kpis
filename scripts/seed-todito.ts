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
    { nombre: 'EBITDA vs Meta (%)', area: 'Finanzas', formula: '(@ebitda_real / @ebitda_meta) * 100', vars: [{n:'ebitda_real', l:'EBITDA Real'}, {n:'ebitda_meta', l:'EBITDA Meta'}] },
    { nombre: 'Margen Comercial (%)', area: 'Comercial', formula: '((@ing - @cost) / @ing) * 100', vars: [{n:'ing', l:'Ingresos'}, {n:'cost', l:'Costos'}] },
    { nombre: 'Ingresos por comisiones/fees', area: 'Comercial', formula: '@monto', vars: [{n:'monto', l:'Monto Total Facturado'}] },
    { nombre: 'Clientes nuevos totales', area: 'Comercial', formula: '@conteo', vars: [{n:'conteo', l:'Nuevos Clientes'}] },

    // --- SISTEMAS & TI ---
    { nombre: 'Disponibilidad de Servicios TI (%)', area: 'Sistemas', formula: '((@h_tot - @h_ind) / @h_tot) * 100', vars: [{n:'h_tot', l:'Horas Totales'}, {n:'h_ind', l:'Horas Indisp.'}] },
    { nombre: '% de liberaciones sin rollback', area: 'Sistemas', formula: '(@exitosos / @totales) * 100', vars: [{n:'exitosos', l:'Liberaciones Exitosas'}, {n:'totales', l:'Total Liberaciones'}] },

    // --- NORMATIVIDAD ---
    { nombre: '% de reportes/oficios en tiempo', area: 'Normatividad', formula: '(@tiempo / @totales) * 100', vars: [{n:'tiempo', l:'En Tiempo'}, {n:'totales', l:'Total Solicitudes'}] },
    { nombre: '% de observaciones cerradas en tiempo', area: 'Normatividad', formula: '(@cerradas / @totales) * 100', vars: [{n:'cerradas', l:'Cerradas'}, {n:'totales', l:'Total Observaciones'}] },
    { nombre: '% requerimientos CNBV/Condusef atendidos', area: 'Normatividad', formula: '(@atendidos / @recibidos) * 100', vars: [{n:'atendidos', l:'Atendidos'}, {n:'recibidos', l:'Recibidos'}] },

    // --- OPERACIONES ---
    { nombre: 'Tasa de Fraude (%)', area: 'Operaciones', formula: '(@monto_f / @monto_t) * 100', vars: [{n:'monto_f', l:'Monto Fraude'}, {n:'monto_t', l:'Monto Total'}] },
    { nombre: 'Incidencias Operativas por cada 10k Trans.', area: 'Operaciones', formula: '(@inc / @txs) * 10000', vars: [{n:'inc', l:'Incidencias'}, {n:'txs', l:'Total Transacciones'}] },

    // --- SEGURIDAD (CISO) ---
    { nombre: 'Avance del Plan anual de Seguridad', area: 'CISO', formula: '(@ejec / @plan) * 100', vars: [{n:'ejec', l:'Act. Ejecutadas'}, {n:'plan', l:'Act. Planificadas'}] },
    { nombre: 'Incidentes de Seguridad Severidad Alta', area: 'CISO', formula: '@conteo', vars: [{n:'conteo', l:'N° de Incidentes'}] },
    { nombre: '% de controles de ciberseguridad efectivos', area: 'CISO', formula: '(@efectivos / @totales) * 100', vars: [{n:'efectivos', l:'Efectivos'}, {n:'totales', l:'Total Controles'}] },

    // --- RECURSOS HUMANOS ---
    { nombre: 'Tiempo promedio cobertura vacantes (días)', area: 'Recursos Humanos', formula: '@suma_dias / @vac_cub', vars: [{n:'suma_dias', l:'Suma Días Cobertura'}, {n:'vac_cub', l:'Vacantes Cubiertas'}] },
    { nombre: 'Retención Anual (%)', area: 'Recursos Humanos', formula: '(@permanecen / @contratados) * 100', vars: [{n:'permanecen', l:'Siguen Activos (12m)'}, {n:'contratados', l:'Total Contratados'}] },
    { nombre: 'Rotación Total de Personal (%)', area: 'Recursos Humanos', formula: '(@salidas / @promedio) * 100', vars: [{n:'salidas', l:'N° Salidas'}, {n:'promedio', l:'Promedio Personal'}] },
    { nombre: 'eNPS / Clima Organizacional', area: 'Recursos Humanos', formula: '@puntaje', vars: [{n:'puntaje', l:'Puntaje Promedio'}] },
    { nombre: 'Rotación temprana (< 90 días) (%)', area: 'Recursos Humanos', formula: '(@salidas / @ingresos) * 100', vars: [{n:'salidas', l:'Salidas < 90d'}, {n:'ingresos', l:'Total Ingresos'}] },
    { nombre: '% de expedientes completos (1er envío)', area: 'Recursos Humanos', formula: '(@completos / @revisados) * 100', vars: [{n:'completos', l:'Completos'}, {n:'revisados', l:'Total Revisados'}] },
    { nombre: '% vacantes cubiertas en fecha objetivo', area: 'Recursos Humanos', formula: '(@en_fecha / @cerradas) * 100', vars: [{n:'en_fecha', l:'En Fecha'}, {n:'cerradas', l:'Total Cerradas'}] },
    { nombre: '% Onboarding en primera semana', area: 'Recursos Humanos', formula: '(@onboarding / @ingresos) * 100', vars: [{n:'onboarding', l:'Con Onboarding'}, {n:'ingresos', l:'Total Ingresos'}] },

    // --- PROYECTOS ESTRATÉGICOS 2026 ---
    { nombre: 'Avance: Onboarding Personal Moral', area: 'General', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] },
    { nombre: 'Avance: 3D Secure', area: 'Sistemas', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] },
    { nombre: 'Avance: Billeteras Apple/Google Pay', area: 'Sistemas', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] },
    { nombre: 'Avance: Certificación PCI', area: 'Normatividad', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] },
    { nombre: 'Avance: Conexión Banxico', area: 'Sistemas', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] },
    { nombre: 'Avance: Sistema PLD', area: 'Normatividad', formula: '@avance', vars: [{n:'avance', l:'% de Avance'}] }
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

    // 2. Upsert Config
    const { error: cfgErr } = await supabase
      .from('kpi_config')
      .upsert({
        kpi_id: currentKpiId,
        semaforo_verde_min: 95,
        semaforo_amarillo_min: 85,
        semaforo_rojo_max: 84.99,
        config_json: {
          custom_formula: {
            formula: k.formula,
            variables: k.vars.map(v => ({ name: v.n, label: v.l, type: 'number', required: true }))
          }
        }
      }, { onConflict: 'kpi_id' });

    if (cfgErr) console.error(`❌ Error en config de ${k.nombre}:`, cfgErr.message);
    else console.log(`✅ KPI listo: ${k.nombre}`);
  }

  console.log('\n✨ Carga COMPLETA de TODITO finalizada.');
}

seedToditoFull().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
