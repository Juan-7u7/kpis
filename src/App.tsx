import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Filter, Search, Edit3, HelpCircle, Inbox, PlusCircle, Trash2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import CaptureModal from './components/CaptureModal';
import KpiDetailModal from './components/KpiDetailModal';
import CreateKpiModal from './components/CreateKpiModal';
import ConfirmModal from './components/ConfirmModal';

interface KPI {
  id: string;
  kpi_id: string;
  resultado_id: string | null;
  kpi_nombre: string;
  area: string;
  valor: number | null;
  semaforo: string;
  unidad: string;
  formula_tipo: string;
  tipo_resultado: string;
  es_borrable?: boolean;
}

interface KpiGroup {
  [area: string]: KPI[];
}

function App() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('2');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [captureKpi, setCaptureKpi] = useState<KPI | null>(null);
  const [kpiForHistory, setKpiForHistory] = useState<KPI | null>(null);
  const [showCreateKpi, setShowCreateKpi] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<KPI | null>(null);

  const fetchKPIs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kpis?anio=${selectedYear}&mes=${selectedMonth}`);
      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      if (data.success) {
        setKpis(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKPIs();
  }, [fetchKPIs]);

  const handleDeleteKpiRequest = (kpi: KPI) => {
    if (!kpi.es_borrable) {
      toast.error('No puedes eliminar los KPIs por defecto del sistema.');
      return;
    }
    setKpiToDelete(kpi);
  };

  const confirmDeleteKpi = async () => {
    if (!kpiToDelete) return;

    try {
      const res = await fetch(`/api/kpis/${kpiToDelete.kpi_id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`KPI eliminado: ${kpiToDelete.kpi_nombre}`);
        fetchKPIs();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión al eliminar KPI');
    } finally {
      setKpiToDelete(null);
    }
  };

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

  const groupedKpis = filteredKpis.reduce((acc: KpiGroup, kpi: KPI) => {
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
          popover: { 
            title: '<div style="font-size: 1.25rem; color: #3b82f6;">🏢 Bienvenido al Sistema de KPIs</div>', 
            description: '<div style="text-align:center; padding: 0.5rem 0;"><img src="https://cdn-icons-png.flaticon.com/512/3204/3204094.png" style="width: 70px; margin-bottom: 10px;" /><p style="font-size: 0.95rem; line-height: 1.6; text-align: left;"><b>¿Para qué sirve este panel?</b><br/>Es tu centro de operaciones oficial. Aquí la empresa mide, almacena y evalúa el desempeño de cada métrica clave mensual. <br/><br/><i>Te guiaremos rápidamente sobre cómo utilizarlo.</i></p></div>'
          }
        },
        { 
          element: '#tour-filters', 
          popover: { 
            title: '🔍 Control de Tiempo y Área', 
            description: '<div style="font-size: 0.9rem; line-height: 1.5;"><p>Las metas cambian cada mes. Escoge aquí tu <b>Año</b> y <b>Mes</b> objetivo. <br/><br/>Si el mes no tiene mediciones previas, verás tarjetas vacías en color gris listas para ser llenadas.</p></div>', 
            side: "bottom", 
            align: 'start' 
          }
        },
        { 
          element: '#tour-kpi-grid', 
          popover: { 
            title: '📊 Tarjetas de Rendimiento', 
            description: '<div style="font-size: 0.9rem; line-height: 1.5;"><p>Cada bloque representa un KPI Oficial. En la parte superior derecha ves el tipo de <b>Fórmula</b> (ej. Porcentaje, Documental) y abajo el valor arrojado.</p></div>', 
            side: "top", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-status', 
          popover: { 
            title: '🚥 El Semáforo', 
            description: '<div style="display: grid; grid-template-columns: 20px 1fr; gap: 8px; font-size: 0.85rem; line-height: 1.4; margin-top: 10px;"><span style="color:#10b981;font-size:18px;">🟢</span><span><b>Sano:</b> Alcanzó o superó la meta definida.</span><span style="color:#f59e0b;font-size:18px;">🟡</span><span><b>Alerta:</b> Métrica por debajo del estándar óptimo.</span><span style="color:#ef4444;font-size:18px;">🔴</span><span><b>Riesgo:</b> Rendimiento inaceptable.</span><span style="color:#94a3b8;font-size:18px;">⚪</span><span><b>Gris:</b> Pendiente de captura este mes.</span></div>', 
            side: "top", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-edit-btn', 
          popover: { 
            title: '📝 Ingresar o Actualizar Datos', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>Al pulsar <b>Capturar</b>, se abrirá un formulario inteligente.</p><br/><div style="background:rgba(59,130,246,0.1); padding:10px; border-radius:8px; border:1px solid rgba(59,130,246,0.2);">✔️ Si es KPI Documental: palomea casillas.<br/>✔️ Si es KPI Numérico: ingresa cifras exactas.<br/>✔️ Si es Fecha: agrega el calendario de entregas.</div></div>', 
            side: "bottom", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-card', 
          popover: { 
            title: '🧊 Histórico Interactivo 3D', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>Para realizar <b>análisis a largo plazo</b>, simplemente pulsa sobre el <i>fondo de cualquier tarjeta</i>.</p><p style="margin-top: 10px; color: #3b82f6;"><b>¡Magia!</b> ✨ Se desplegará una gráfica en 3D con las alturas proporcionales de todos los meses de este año.</p></div>', 
            side: "right", 
            align: 'start' 
          }
        },
        { 
          element: '.btn-nuevo-kpi', 
          popover: { 
            title: '✨ Creador de KPIs', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>¿Necesitas medir algo nuevo? Utiliza nuestro <b>asistente inteligente</b>.</p><br/><p>Podrás definir parámetros, elegir cómo se calculará (conteo, verificación documental, fechas límite) y ajustar los umbrales de tu semáforo de manera intuitiva.</p></div>', 
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
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', borderRadius: '10px' }}} />
      <header className="dashboard-header">
        <div className="header-title" style={{ position: 'relative' }}>
          <BarChart3 size={36} style={{ color: 'var(--accent-color)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1>Kpi's</h1>
              <button 
                onClick={startTour} 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'}}
                data-tooltip="Ver Tutorial"
              >
                <HelpCircle size={18} />
              </button>
              <button
                onClick={() => setShowCreateKpi(true)}
                className="btn-nuevo-kpi"
                data-tooltip="Crear nuevo KPI personalizado"
              >
                <PlusCircle size={16} /> Nuevo KPI
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
        {loading && (
           <div className="empty-state">
              <div className="spinner"></div>
              <p>Cargando información del tablero...</p>
           </div>
        )}
        
        {error && (
           <div className="empty-state" style={{ color: 'var(--color-rojo)' }}>
              <p>Error: {error}</p>
           </div>
        )}
        
        {!loading && !error && Object.keys(groupedKpis).length === 0 && (
           <div className="empty-state">
              <Inbox size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p>No se encontraron KPIs con los parámetros seleccionados.</p>
           </div>
        )}

        {!loading && !error && Object.keys(groupedKpis).map(area => (
          <section key={area} className="area-section">
            <h2 className="area-title">{area}</h2>
            <div className="kpi-grid">
              {groupedKpis[area].map((kpi: KPI) => (
                <div 
                  key={kpi.resultado_id || kpi.kpi_id} 
                  className="kpi-card hover-enabled"
                  style={{ 
                    '--card-color': getSemaforoColor(kpi.semaforo), 
                    '--card-rgb': getSemaforoRgb(kpi.semaforo) 
                  } as React.CSSProperties}
                  onClick={() => setKpiForHistory(kpi)}
                >
                  <div className="kpi-card-header">
                    <span className="kpi-formula-type">{kpi.formula_tipo.replace(/[_]/g, ' ').toUpperCase()}</span>
                    <button 
                      className="kpi-info-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Abrimos el modal detallado que ya tiene la lógica de ayuda
                        setKpiForHistory(kpi);
                      }}
                      data-tooltip="Métrica e Historial"
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      <HelpCircle size={14} />
                    </button>
                  </div>
                  <h3 className="kpi-name">{kpi.kpi_nombre}</h3>
                  
                  <div className="kpi-card-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
                     <button className={kpi.valor === null ? "kpi-edit-btn primary-pulse" : "kpi-edit-btn"} style={{ marginTop: 0 }} onClick={() => setCaptureKpi(kpi)}>
                       {kpi.valor === null ? <><PlusCircle size={14} /> Capturar</> : <><Edit3 size={14} /> Actualizar</>}
                     </button>
                     <button 
                       className="kpi-edit-btn btn-delete" 
                       style={{ marginTop: 0, padding: '0.4rem', color: kpi.es_borrable ? '#ef4444' : '#94a3b8', border: kpi.es_borrable ? '1px solid rgba(239, 68, 68, 0.3)' : undefined }} 
                       onClick={() => handleDeleteKpiRequest(kpi)}
                       data-tooltip={kpi.es_borrable ? "Eliminar KPI" : "KPI de Sistema"}
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>

                  <div className="kpi-card-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', width: '100%' }}>
                    {/* Caso: Gráfica Circular (Para Porcentajes y Binarios) */}
                    {(kpi.tipo_resultado === 'porcentaje' || kpi.tipo_resultado === 'binario') ? (
                      <div className="kpi-donut-container">
                        <div className="radial-progress-wrapper">
                          <div 
                            className="radial-progress" 
                            style={{ 
                              '--progress': kpi.valor === null ? 0 : (kpi.tipo_resultado === 'binario' ? (kpi.valor > 0 ? 100 : 0) : kpi.valor) 
                            } as React.CSSProperties}
                          >
                            <div className="radial-progress-inner">
                              {kpi.valor !== null ? (kpi.tipo_resultado === 'binario' ? (kpi.valor > 0 ? '100%' : '0%') : `${kpi.valor}%`) : '--'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                              {kpi.tipo_resultado === 'binario' ? 'CUMPLIMIENTO' : 'PROGRESO'}
                            </div>
                            <div className="kpi-status">
                              <span className="status-dot"></span>
                              {kpi.semaforo === 'gris' ? 'Pendiente' : kpi.semaforo.charAt(0).toUpperCase() + kpi.semaforo.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Caso: Gráfica Lineal (Para Conteo, Montos, Promedios) */
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div className="kpi-result">
                            <span className="kpi-value">{kpi.valor !== null ? kpi.valor : '--'}</span>
                            {kpi.valor !== null && <span className="kpi-unit" style={{ marginLeft: '4px' }}>{kpi.unidad}</span>}
                          </div>
                          <div className="kpi-status">
                            <span className="status-dot"></span>
                            {kpi.semaforo === 'gris' ? 'Pendiente' : kpi.semaforo.charAt(0).toUpperCase() + kpi.semaforo.slice(1)}
                          </div>
                        </div>
                        <div className="linear-progress-container" title="Progreso relativo">
                          <div 
                            className="linear-progress-bar" 
                            style={{ 
                              width: kpi.valor === null ? '0%' : (kpi.semaforo === 'verde' ? '100%' : (kpi.semaforo === 'amarillo' ? '65%' : '35%')),
                              opacity: kpi.valor === null ? 0.3 : 1
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
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

      {showCreateKpi && (
        <CreateKpiModal
          onClose={() => setShowCreateKpi(false)}
          onSuccess={() => { setShowCreateKpi(false); fetchKPIs(); }}
        />
      )}

      {kpiToDelete && (
        <ConfirmModal 
          title="Eliminar KPI Personalizado"
          message={
            <>
              ¿Estás seguro de que deseas eliminar permanentemente el KPI <strong style={{ color: '#0f172a' }}>"{kpiToDelete.kpi_nombre}"</strong>?
              <br/><br/>
              Esta acción es irreversible y eliminará todo su historial de capturas.
            </>
          }
          onConfirm={confirmDeleteKpi}
          onCancel={() => setKpiToDelete(null)}
        />
      )}
    </div>
  );
}

export default App;
