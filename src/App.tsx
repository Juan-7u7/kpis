import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Filter, Search, Edit3, HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import CaptureModal from './components/CaptureModal';
import KpiDetailModal from './components/KpiDetailModal';

function App() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('2');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [captureKpi, setCaptureKpi] = useState<any | null>(null);
  const [kpiForHistory, setKpiForHistory] = useState<any | null>(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/kpis?anio=${selectedYear}&mes=${selectedMonth}`);
      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      if (data.success) {
        setKpis(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [selectedYear, selectedMonth]);

  const getSemaforoColor = (semaforo: string) => {
    switch (semaforo?.toLowerCase()) {
      case 'verde': return 'var(--color-verde)';
      case 'amarillo': return 'var(--color-amarillo)';
      case 'rojo': return 'var(--color-rojo)';
      default: return 'var(--color-gris)';
    }
  };

  const getSemaforoRgb = (semaforo: string) => {
    switch (semaforo?.toLowerCase()) {
      case 'verde': return '16, 185, 129';
      case 'amarillo': return '245, 158, 11';
      case 'rojo': return '239, 68, 68';
      default: return '139, 155, 180';
    }
  };

  // Filter Data
  const filteredKpis = kpis.filter(kpi => {
    const matchArea = selectedArea === 'Todas' || kpi.area === selectedArea;
    const matchSearch = kpi.kpi_nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchArea && matchSearch;
  });

  const groupedKpis = filteredKpis.reduce((acc: any, kpi: any) => {
    if (!acc[kpi.area]) acc[kpi.area] = [];
    acc[kpi.area].push(kpi);
    return acc;
  }, {});

  const areasList = Array.from(new Set(kpis.map(k => k.area)));

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Terminar',
      popoverClass: 'driverjs-theme',
      steps: [
        { 
          element: '#tour-filters', 
          popover: { 
            title: 'Control de Filtros', 
            description: 'Usa estas herramientas para seleccionar el Año, Mes y Área que quieres visualizar. Puedes buscar por nombre de métrica.', 
            side: "bottom", 
            align: 'start' 
          }
        },
        { 
          element: '#tour-kpi-grid', 
          popover: { 
            title: 'Tarjetas de Rendimiento', 
            description: 'Aquí verás el desempeño de tus métricas. El borde y color indican la salud (Verde=Sano, Amarillo=Alerta, Rojo=Riesgo, Gris=Incompleto). Haz clic en ellas para ver el histórico de los meses de este año en 3D.', 
            side: "top", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-edit-btn', 
          popover: { 
            title: 'Capturar Datos', 
            description: 'Al dar clic en "Capturar", verás un formulario inteligente para registrar tu evidencia documental o cifras del mes.', 
            side: "bottom", 
            align: 'start' 
          }
        }
      ]
    });

    driverObj.drive();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title" style={{ position: 'relative' }}>
          <Activity size={32} className="logo-icon" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1>Dashboard Operativo</h1>
              <button 
                onClick={startTour} 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'}}
                title="Ver Tutorial"
              >
                <HelpCircle size={18} />
              </button>
            </div>
            <p className="subtitle">Monitoreo inteligente de indicadores clave</p>
          </div>
        </div>
        
        <div className="header-filters" id="tour-filters">
          <div className="filter-group global-search">
             <span className="filter-label"><Search size={14} /> BÚSQUEDA</span>
             <div style={{ position: 'relative' }}>
               <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-claro)' }} />
               <input 
                 type="text" 
                 placeholder="Buscar KPI..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ paddingLeft: '2.2rem' }}
               />
             </div>
          </div>
          
          <div className="filter-group">
            <span className="filter-label"><Filter size={14} /> ÁREA</span>
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
              <option value="Todas">Todas las áreas</option>
              {areasList.map(a => <option key={a as string} value={a as string}>{a}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label"><Calendar size={14} /> PERIODO</span>
            <div className="period-selectors">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main" id="tour-kpi-grid">
        {loading && <div className="spinner-container"><div className="spinner"></div></div>}
        {error && <div className="error-message">Error: {error}</div>}
        
        {!loading && !error && Object.keys(groupedKpis).length === 0 && (
           <div className="empty-message">No se encontraron KPIs con los filtros actuales.</div>
        )}

        {!loading && !error && Object.keys(groupedKpis).map(area => (
          <section key={area} className="area-section">
            <h2 className="area-title">{area}</h2>
            <div className="kpi-grid">
              {groupedKpis[area].map((kpi: any) => (
                <div 
                  key={kpi.resultado_id} 
                  className="kpi-card hover-enabled"
                  style={{ 
                    '--card-color': getSemaforoColor(kpi.semaforo), 
                    '--card-rgb': getSemaforoRgb(kpi.semaforo) 
                  } as React.CSSProperties}
                  onClick={() => setKpiForHistory(kpi)}
                >
                  <div className="kpi-card-header">
                    <span className="kpi-formula-type">{kpi.formula_tipo.replace(/[_]/g, ' ').toUpperCase()}</span>
                  </div>
                  <h3 className="kpi-name">{kpi.kpi_nombre}</h3>
                  
                  <div className="kpi-card-actions" onClick={e => e.stopPropagation()}>
                     <button className="kpi-edit-btn" style={{ marginTop: 0 }} onClick={() => setCaptureKpi(kpi)}>
                       <Edit3 size={14} /> Capturar
                     </button>
                  </div>

                  <div className="kpi-card-footer">
                    <div className="kpi-result">
                      <span className="kpi-value">{kpi.valor !== null ? kpi.valor : '--'}</span>
                      <span className="kpi-unit">{kpi.unidad}</span>
                    </div>
                    <div className="kpi-status">
                      <span className="status-dot"></span>
                      {kpi.semaforo.charAt(0).toUpperCase() + kpi.semaforo.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {captureKpi && (
         <CaptureModal 
           kpi_id={captureKpi.kpi_id} 
           anio={selectedYear} 
           mes={selectedMonth} 
           onClose={() => setCaptureKpi(null)} 
           onSuccess={fetchKPIs} 
         />
      )}

      {kpiForHistory && (
         <KpiDetailModal 
            kpi={kpiForHistory}
            anio={selectedYear}
            onClose={() => setKpiForHistory(null)}
         />
      )}
    </div>
  );
}

export default App;
