import express from 'express';
import cors from 'cors';
import { supabase } from '../src/lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de prueba que verifica datos en bd
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('areas').select('*').limit(5);
    if (error) throw error;
    res.json({ success: true, message: 'Conexión exitosa a Supabase', data });
  } catch (err) {
    console.error('Error crítico:', err);
    res.status(500).json({ success: false, error: 'Error interno de red' });
  }
});

// GET /api/kpis - Obtener KPIs por año y mes
app.get('/api/kpis', async (req, res) => {
  try {
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar anio y mes (ej: /api/kpis?anio=2026&mes=2)'
      });
    }

    // 1. Obtener todos los KPIs activos
    const { data: kpisData, error: kpisError } = await supabase
      .from('kpis')
      .select(`
        id,
        nombre,
        formula_tipo,
        tipo_resultado,
        orden_visual,
        areas(id, nombre)
      `)
      .eq('activo', true);

    if (kpisError) throw kpisError;

    // 2. Obtener resultados correspondientes a ese mes (si existen)
    const { data: resultsData, error: resultsError } = await supabase
      .from('kpi_resultados')
      .select(`
        id,
        kpi_id,
        valor_resultado,
        valor_auxiliar,
        unidad_resultado,
        semaforo,
        periodos!inner(anio, mes, nombre)
      `)
      .eq('periodos.anio', anio)
      .eq('periodos.mes', mes);

    if (resultsError) throw resultsError;

    // 3. Crear el array consolidando los KPIs capturados y los pendientes
    const kpisLimpios = kpisData?.map((kpi: any) => {
      // Find matching result for this KPI
      const r = resultsData?.find((res: any) => res.kpi_id === kpi.id);
      return {
        kpi_id: kpi.id,
        resultado_id: r ? r.id : null,
        area: kpi.areas?.nombre || 'General',
        kpi_nombre: kpi.nombre,
        formula_tipo: kpi.formula_tipo,
        tipo_resultado: kpi.tipo_resultado,
        periodo: r ? r.periodos?.nombre : `${mes}/${anio}`,
        valor: r?.valor_resultado ?? null,
        valor_auxiliar: r?.valor_auxiliar ?? null,
        unidad: r?.unidad_resultado ?? (kpi.tipo_resultado === 'porcentaje' ? '%' : ''),
        semaforo: r?.semaforo ?? 'gris',
        orden_visual: kpi.orden_visual
      };
    }) || [];

    // Ordenamos por área y orden_visual en memoria
    kpisLimpios.sort((a, b) => {
      if (a.area < b.area) return -1;
      if (a.area > b.area) return 1;
      return (a.orden_visual || 0) - (b.orden_visual || 0);
    });

    res.json({
      success: true,
      data: kpisLimpios
    });

  } catch (err) {
    console.error('Error al procesar /api/kpis:', err);
    res.status(500).json({ success: false, error: 'Error interno en servidor' });
  }
});

// GET /api/kpi-config/:kpi_id - Obtiene reglas de captura
app.get('/api/kpi-config/:kpi_id', async (req, res) => {
  try {
    const { kpi_id } = req.params;
    const { data, error } = await supabase
      .from('v_kpis_detalle')
      .select('*')
      .eq('kpi_id', kpi_id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/kpi-historico/:kpi_id - Obtiene el historial de resultados para un KPI especifico
app.get('/api/kpi-historico/:kpi_id', async (req, res) => {
  try {
    const { kpi_id } = req.params;
    const { anio } = req.query;

    let query = supabase
      .from('kpi_resultados')
      .select(`
        valor_resultado,
        valor_auxiliar,
        unidad_resultado,
        semaforo,
        periodos!inner(anio, mes, nombre)
      `)
      .eq('kpi_id', kpi_id);

    if (anio) {
      query = query.eq('periodos.anio', anio);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Ordenar por mes histórico
    const historico = data?.map(d => ({
      mes: d.periodos.mes,
      mes_nombre: d.periodos.nombre,
      valor: d.valor_resultado,
      valor_auxiliar: d.valor_auxiliar,
      unidad: d.unidad_resultado,
      semaforo: d.semaforo
    })).sort((a, b) => a.mes - b.mes) || [];

    res.json({ success: true, data: historico });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/capturas - Guardar información de captura
app.post('/api/capturas', async (req, res) => {
  try {
    const { kpi_id, anio, mes, tipo_captura, comentario, detalles } = req.body;
    if (!kpi_id || !anio || !mes || !tipo_captura || !detalles) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros mínimos.' });
    }

    // 1. Obtener periodo_id
    const { data: periodoObj, error: perErr } = await supabase
      .from('periodos')
      .select('id')
      .eq('anio', anio).eq('mes', mes).single();
      
    if (perErr) throw new Error('No se encontró el periodo asignado.');
    const periodo_id = periodoObj.id;

    // 2. Upsert cabecera de captura
    const { data: cabecera, error: capError } = await supabase
      .from('kpi_capturas')
      .upsert({ 
         kpi_id, 
         periodo_id, 
         estado: 'finalizado',
         comentario: comentario || null 
      }, { onConflict: 'kpi_id, periodo_id' })
      .select('id').single();

    if (capError) throw capError;
    const captura_id = cabecera.id;

    // 3. Guardar en la tabla que corresponda a tipo_captura
    if (tipo_captura === 'binario_documental') {
       // detalles debe ser arreglo de { campo, valor }
       for(const doc of detalles) {
         await supabase.from('captura_binaria_documental')
           .upsert({ captura_id, campo: doc.campo, valor: doc.valor }, { onConflict: 'captura_id, campo' });
       }
    } else if (tipo_captura === 'conteo') {
       await supabase.from('captura_conteo')
           .upsert({ captura_id, programados: detalles.programados, cumplidos: detalles.cumplidos }, { onConflict: 'captura_id' });
    } else if (tipo_captura === 'conteo_operativo') {
       await supabase.from('captura_conteo_operativo')
           .upsert({ captura_id, total_operaciones: detalles.total_operaciones, operaciones_correctas: detalles.operaciones_correctas }, { onConflict: 'captura_id' });
    } else if (tipo_captura === 'fechas') {
       const arregloEntregas = Array.isArray(detalles) ? detalles : (detalles.entregas || []);
       for(const ent of arregloEntregas) {
         const f1 = new Date(ent.solicitud);
         const f2 = new Date(ent.entrega);
         const diffDays = Math.max(0, Math.ceil((f2.getTime() - f1.getTime()) / (1000 * 60 * 60 * 24)));
         const cumplio = diffDays <= 2;
         await supabase.from('captura_entregas').insert({
            captura_id, fecha_solicitud: ent.solicitud, fecha_entrega: ent.entrega,
            dias_entrega: diffDays, cumplio_tiempo: cumplio
         });
       }
    } else {
       throw new Error('Tipo de captura desconocido');
    }

    // 4. Módulo de Cálculo Automático (Fase 7)
    // Extraer formula_tipo y rangos del semáforo
    const { data: configKpi, error: cErr } = await supabase
      .from('v_kpis_detalle')
      .select('formula_tipo, semaforo_verde_min, semaforo_amarillo_min')
      .eq('kpi_id', kpi_id).single();

    if (!cErr && configKpi) {
      let valor_resultado = 0;
      let valor_auxiliar = null;
      let semaforo = 'gris';
      let seCalcula = true;

      const f_tipo = configKpi.formula_tipo;

      if (f_tipo === 'si_no') {
        const compl = detalles[0]?.valor === true;
        valor_resultado = compl ? 100 : 0;
      } else if (f_tipo === 'documental_doble') {
        const trues = detalles.filter((d: any) => d.valor === true).length;
        if (trues === 2) valor_resultado = 100;
        else if (trues === 1) valor_resultado = 50;
        else valor_resultado = 0;
      } else if (f_tipo === 'cumplidos_programados') {
        const p = detalles.programados || 0;
        const c = detalles.cumplidos || 0;
        if (p === 0) seCalcula = false;
        else valor_resultado = (c / p) * 100;
      } else if (f_tipo === 'correctos_total') {
        const t = detalles.total_operaciones || 0;
        const c = detalles.operaciones_correctas || 0;
        if (t === 0) seCalcula = false;
        else valor_resultado = (c / t) * 100;
      } else if (f_tipo === 'entregas_a_tiempo') {
        const entregas = Array.isArray(detalles) ? detalles : (detalles.entregas || []);
        if (entregas.length === 0) seCalcula = false;
        else {
          let aTiempo = 0;
          let sumDias = 0;
          entregas.forEach((ent: any) => {
            const f1 = new Date(ent.solicitud);
            const f2 = new Date(ent.entrega);
            const dias = Math.max(0, Math.ceil((f2.getTime() - f1.getTime()) / (1000 * 60 * 60 * 24)));
            sumDias += dias;
            if (dias <= 2) aTiempo++;
          });
          valor_resultado = (aTiempo / entregas.length) * 100;
          valor_auxiliar = sumDias / entregas.length; // Promedio de días
        }
      }

      if (seCalcula) {
        valor_resultado = Math.round(valor_resultado * 100) / 100;
        if (valor_auxiliar) valor_auxiliar = Math.round(valor_auxiliar * 100) / 100;
        
        const verdeMin = configKpi.semaforo_verde_min ?? 100;
        const amarilloMin = configKpi.semaforo_amarillo_min ?? 80;

        // Evaluar Semáforo
        if (valor_resultado >= verdeMin) semaforo = 'verde';
        else if (valor_resultado >= amarilloMin) semaforo = 'amarillo';
        else semaforo = 'rojo';
      }

      // 5. Guardar el resultado final calculado en kpi_resultados
      const { error: errorRes } = await supabase.from('kpi_resultados')
        .upsert({
           kpi_id,
           periodo_id,
           captura_id, // Obligatorio y único para trazabilidad
           valor_resultado,
           valor_auxiliar,
           unidad_resultado: f_tipo === 'entregas_a_tiempo' ? '%' : '%',
           semaforo
        }, { onConflict: 'kpi_id, periodo_id' })
        
        if (errorRes) console.error("Error al guardar kpi_resultados: ", errorRes);
    }

    res.json({ success: true, message: 'Captura guardada y calculada correctamente' });
  } catch (err: any) {
    console.error('Error capturando KPI:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`➡️  Endpoints de prueba disponibles en:`);
    console.log(`    http://localhost:${PORT}/api/test-db`);
  });
}

export default app;
