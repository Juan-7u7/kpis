import assert from 'assert';

const HOST = 'http://localhost:3000';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("Iniciando batería de pruebas automáticas...");
  
  try {
    // 1. Obtener KPIs
    const resKpis = await fetch(`${HOST}/api/kpis?anio=2026&mes=2`);
    const dataKpis = await resKpis.json();
    const kpis = dataKpis.data;
    
    // Identificar IDs por formula_tipo
    const kpiSiNo = kpis.find((k: any) => k.formula_tipo === 'si_no');
    const kpiDoble = kpis.find((k: any) => k.formula_tipo === 'documental_doble');
    const kpiConteo = kpis.find((k: any) => k.formula_tipo === 'cumplidos_programados');
    const kpiOp = kpis.find((k: any) => k.formula_tipo === 'correctos_total');
    const kpiEntrega = kpis.find((k: any) => k.formula_tipo === 'entregas_a_tiempo');
    
    // Función auxiliar para postear
    const capturar = async (kpi_id: string, tipo_captura: string, detalles: any) => {
      const payload = { kpi_id, anio: 2026, mes: 2, tipo_captura, comentario: 'Test auto', detalles };
      const postRes = await fetch(`${HOST}/api/capturas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      if (!postRes.ok) {
        throw new Error(`Error HTTP POST: ${await postRes.text()}`);
      }
      await delay(200); // Pequeña pausa para asegurar bd
      const res = await fetch(`${HOST}/api/kpis?anio=2026&mes=2`);
      const body = await res.json();
      return body.data.find((k: any) => k.kpi_id === kpi_id);
    };

    let result;

    if (kpiSiNo) {
      console.log(`\n--- Test: si_no [${kpiSiNo.kpi_nombre}] ---`);
      result = await capturar(kpiSiNo.kpi_id, 'binario_documental', [{ campo: 'check', valor: true }]);
      assert.strictEqual(result.valor, 100, `Esperaba 100, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'verde', `Esperaba verde, obtuve ${result.semaforo}`);
      
      result = await capturar(kpiSiNo.kpi_id, 'binario_documental', [{ campo: 'check', valor: false }]);
      assert.strictEqual(result.valor, 0, `Esperaba 0, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'rojo', `Esperaba rojo, obtuve ${result.semaforo}`);
      console.log('✅ si_no pasó las pruebas.');
    }

    if (kpiDoble) {
      console.log(`\n--- Test: documental_doble [${kpiDoble.kpi_nombre}] ---`);
      result = await capturar(kpiDoble.kpi_id, 'binario_documental', [{ campo: 'a', valor: true }, { campo: 'b', valor: true }]);
      assert.strictEqual(result.valor, 100, `Esperaba 100, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'verde', `Esperaba verde, obtuve ${result.semaforo}`);

      result = await capturar(kpiDoble.kpi_id, 'binario_documental', [{ campo: 'a', valor: true }, { campo: 'b', valor: false }]);
      assert.strictEqual(result.valor, 50, `Esperaba 50, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'rojo', `Esperaba rojo, obtuve ${result.semaforo}`);
      
      result = await capturar(kpiDoble.kpi_id, 'binario_documental', [{ campo: 'a', valor: false }, { campo: 'b', valor: false }]);
      assert.strictEqual(result.valor, 0, `Esperaba 0, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'rojo', `Esperaba rojo, obtuve ${result.semaforo}`);
      console.log('✅ documental_doble pasó las pruebas.');
    }

    if (kpiConteo) {
      console.log(`\n--- Test: cumplidos_programados [${kpiConteo.kpi_nombre}] ---`);
      result = await capturar(kpiConteo.kpi_id, 'conteo', { programados: 10, cumplidos: 10 });
      assert.strictEqual(result.valor, 100, `Esperaba 100, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'verde', `Esperaba verde, obtuve ${result.semaforo}`);

      result = await capturar(kpiConteo.kpi_id, 'conteo', { programados: 10, cumplidos: 8 });
      assert.strictEqual(result.valor, 80, `Esperaba 80, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'amarillo', `Esperaba amarillo, obtuve ${result.semaforo}`);
      
      result = await capturar(kpiConteo.kpi_id, 'conteo', { programados: 10, cumplidos: 7 });
      assert.strictEqual(result.valor, 70, `Esperaba 70, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'rojo', `Esperaba rojo, obtuve ${result.semaforo}`);
      
      console.log('✅ cumplidos_programados pasó las pruebas.');
    }

    if (kpiOp) {
      console.log(`\n--- Test: correctos_total [${kpiOp.kpi_nombre}] ---`);
      result = await capturar(kpiOp.kpi_id, 'conteo_operativo', { total_operaciones: 100, operaciones_correctas: 90 });
      assert.strictEqual(result.valor, 90, `Esperaba 90, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'amarillo', `Esperaba amarillo, obtuve ${result.semaforo}`);
      console.log('✅ correctos_total pasó las pruebas.');
    }

    if (kpiEntrega) {
      console.log(`\n--- Test: entregas_a_tiempo [${kpiEntrega.kpi_nombre}] ---`);
      // 1 entrega de 2 días (A tiempo) y 1 entrega de 4 días (Fuera de tiempo) => 50%
      result = await capturar(kpiEntrega.kpi_id, 'fechas', { 
        entregas: [
          { solicitud: '2026-04-10', entrega: '2026-04-12' }, // 2 dias -> cumplió
          { solicitud: '2026-04-10', entrega: '2026-04-14' }  // 4 dias -> falló
        ] 
      });
      assert.strictEqual(result.valor, 50, `Esperaba 50, obtuve ${result.valor}`);
      assert.strictEqual(result.semaforo, 'rojo', `Esperaba rojo, obtuve ${result.semaforo}`);
      // promedio dias = (2 + 4) / 2 = 3
      assert.strictEqual(result.valor_auxiliar, 3, `Esperaba promedio 3, obtuve ${result.valor_auxiliar}`);
      console.log('✅ entregas_a_tiempo pasó las pruebas.');
    }

    console.log("\n🚀 TODAS LAS PRUEBAS RESULTARON EXITOSAS.");

  } catch (err: any) {
    console.error("\n❌ ERROR DURANTE LOS TESTS:");
    if (err.name === 'AssertionError') {
      console.error(err.message);
    } else {
      console.error(err.response ? err.response.data : err.message);
    }
  }
}

runTests();
