import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Activity, FileText, MessageSquare, Table } from 'lucide-react';

interface KpiData {
  id: string;
  kpi_id: string;
  kpi_nombre: string;
  area: string;
  unidad?: string;
  formula_tipo?: string;
}

interface HistoryItem {
  mes: number;
  mes_nombre: string;
  valor: number;
  unidad: string;
  semaforo: string;
  comentario: string | null;
}

interface KpiMeta {
  meta_descripcion?: string;
  formula_tipo?: string;
  formula_descripcion?: string;
  semaforo_verde_min?: number;
  semaforo_amarillo_min?: number;
}

interface KpiDetailModalProps {
  kpi: KpiData;
  anio: string;
  onClose: () => void;
}

export default function KpiDetailModal({ kpi, anio, onClose }: KpiDetailModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [meta, setMeta] = useState<KpiMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/kpi-historico/${kpi.kpi_id}?anio=${anio}`);
        const body = await res.json();
        if (body.success) {
          setHistory(body.data);
          setMeta(body.meta);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [kpi.kpi_id, anio]);

  const getSemaforoColor = (semaforo: string) => {
    switch (semaforo?.toLowerCase()) {
      case 'verde': return '#10b981';
      case 'amarillo': return '#f59e0b';
      case 'rojo': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const latestHistory = history.length > 0 ? history[history.length - 1] : null;
  const latestProgress = latestHistory ? Math.max(0, Math.min(100, latestHistory.valor)) : 0;

  const renderComparison = () => {
    if (history.length < 2) return null;
    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    const diff = current.valor - prev.valor;
    
    let icon = <Minus size={18} color="#94a3b8" />;
    let diffColor = '#94a3b8';
    if (diff > 0) {
       icon = <TrendingUp size={18} color="#10b981" />;
       diffColor = '#10b981';
    } else if (diff < 0) {
       icon = <TrendingDown size={18} color="#ef4444" />;
       diffColor = '#ef4444';
    }

    return (
      <div className="comparison-box" style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
        <span className="comparison-label">vs mes anterior ({prev.mes_nombre}):</span>
        <div className="comparison-value" style={{ color: diffColor, fontSize: '1.2rem' }}>
          {icon} <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)}{kpi.unidad}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content detail-modal" style={{ maxWidth: '900px', width: '95%' }}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <div className="detail-header">
           <div style={{ background: 'var(--accent-color)', color: 'white', padding: '12px', borderRadius: '14px', marginRight: '1rem' }}>
             <Activity size={28} />
           </div>
           <div>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpi.kpi_nombre}</h2>
             <p className="detail-area" style={{ color: 'var(--accent-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.area}</p>
           </div>
        </div>

        {loading ? (
           <div className="spinner-container" style={{ padding: '4rem 0' }}><div className="spinner"></div></div>
        ) : (
          <div className="detail-body">
            {latestHistory && (
              <div className="detail-hero-card">
                <div
                  className="detail-hero-donut"
                  style={{
                    '--detail-progress': latestProgress,
                    '--detail-color': getSemaforoColor(latestHistory.semaforo),
                    '--detail-shadow': `${getSemaforoColor(latestHistory.semaforo)}33`
                  } as React.CSSProperties}
                >
                  <div className="detail-hero-donut__depth"></div>
                  <div className="detail-hero-donut__ring">
                    <div className="detail-hero-donut__inner">
                      <span className="detail-hero-donut__value">{latestHistory.valor}{latestHistory.unidad}</span>
                      <span className="detail-hero-donut__label">{latestHistory.mes_nombre}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-hero-copy">
                  <div className="detail-hero-kicker">Resumen del ultimo periodo capturado</div>
                  <h3>{latestHistory.mes_nombre} {anio}</h3>
                  <p>
                    Este donut 3D resume el estado actual del KPI para el ultimo mes con captura registrada.
                    El color refleja el semaforo y el centro muestra el valor final del periodo.
                  </p>

                  <div className="detail-hero-stats">
                    <div className="detail-hero-stat">
                      <span className="detail-hero-stat__label">Estado</span>
                      <span className="detail-hero-stat__value" style={{ color: getSemaforoColor(latestHistory.semaforo) }}>
                        {latestHistory.semaforo.charAt(0).toUpperCase() + latestHistory.semaforo.slice(1)}
                      </span>
                    </div>
                    <div className="detail-hero-stat">
                      <span className="detail-hero-stat__label">Resultado</span>
                      <span className="detail-hero-stat__value">{latestHistory.valor}{latestHistory.unidad}</span>
                    </div>
                    <div className="detail-hero-stat">
                      <span className="detail-hero-stat__label">Semaforo verde desde</span>
                      <span className="detail-hero-stat__value">{meta?.semaforo_verde_min || 100}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
               <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                   <FileText size={16} /> DEFINICIÓN
                 </div>
                 <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{meta?.meta_descripcion || 'Medición operativa del desempeño del área.'}</p>
               </div>

                <div className='formula-visual-card'>
                  <div className='formula-visual-title'> ¿Cómo se calcula este KPI?
                  </div>
                  {meta?.formula_tipo === 'si_no' && (
                    <div className='formula-visual-body'>
                      <div className='formula-branch'>
                        <div className='formula-pill pill-input'> Marca SÍ</div>
                        <div className='formula-arrow'>→</div>
                        <div className='formula-pill pill-green'>100% </div>
                      </div>
                      <div className='formula-branch'>
                        <div className='formula-pill pill-input'> Marca NO</div>
                        <div className='formula-arrow'>→</div>
                        <div className='formula-pill pill-red'>0% </div>
                      </div>
                    </div>
                  )}
                  {meta?.formula_tipo === 'documental_doble' && (
                    <div className='formula-visual-body'>
                      <div className='formula-fraction'>
                        <div className='fraction-numerator'>Documentos entregados</div>
                        <div className='fraction-line'></div>
                        <div className='fraction-denominator'>2 documentos requeridos</div>
                      </div>
                      <div className='formula-arrow'>×</div>
                      <div className='formula-pill pill-green'>100</div>
                    </div>
                  )}
                  {meta?.formula_tipo === 'cumplidos_programados' && (
                    <div className='formula-visual-body'>
                      <div className='formula-fraction'>
                        <div className='fraction-numerator'> Actividades Cumplidas</div>
                        <div className='fraction-line'></div>
                        <div className='fraction-denominator'> Actividades Programadas</div>
                      </div>
                      <div className='formula-arrow'>×</div>
                      <div className='formula-pill pill-green'>100</div>
                    </div>
                  )}
                  {meta?.formula_tipo === 'correctos_total' && (
                    <div className='formula-visual-body'>
                      <div className='formula-fraction'>
                        <div className='fraction-numerator'> Operaciones Correctas</div>
                        <div className='fraction-line'></div>
                        <div className='fraction-denominator'> Total de Operaciones</div>
                      </div>
                      <div className='formula-arrow'>×</div>
                      <div className='formula-pill pill-green'>100</div>
                    </div>
                  )}
                  {meta?.formula_tipo === 'entregas_a_tiempo' && (
                    <div className='formula-visual-body'>
                      <div className='formula-fraction'>
                        <div className='fraction-numerator'> Entregas en ≤ 2 días</div>
                        <div className='fraction-line'></div>
                        <div className='fraction-denominator'> Total de Entregas del mes</div>
                      </div>
                      <div className='formula-arrow'>×</div>
                      <div className='formula-pill pill-green'>100</div>
                    </div>
                  )}
                  {!['si_no','documental_doble','cumplidos_programados','correctos_total','entregas_a_tiempo'].includes(meta?.formula_tipo ?? '') && (
                    <div className='formula-visual-body'>
                      <div className='formula-pill pill-green'>Cálculo Estándar %</div>
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 14px 10px', fontStyle: 'italic', textAlign: 'center' }}>
                    {meta?.formula_descripcion || 'Se evalúa el cumplimiento contra la meta programada.'}
                  </p>
                </div>

               <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                   <Activity size={16} /> REGLAS (SEMÁFORO)
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#10b981' }}>●</span> <b>Óptimo:</b> ≥ {meta?.semaforo_verde_min || 100}%
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#f59e0b' }}>●</span> <b>Alerta:</b> ≥ {meta?.semaforo_amarillo_min || 80}%
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#ef4444' }}>●</span> <b>Riesgo:</b> &lt; {meta?.semaforo_amarillo_min || 80}%
                    </div>
                 </div>
               </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(59, 130, 246, 0.3)', marginBottom: '2rem' }}>
               <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--accent-color)' }}> ¿Cómo mejorar este resultado?</h4>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
                 {meta?.formula_tipo === 'entregas_a_tiempo' && 'Asegúrate de registrar las fechas de entrega lo más cercano posible a la fecha de solicitud. El límite para cumplimiento es de 2 días.'}
                 {meta?.formula_tipo === 'cumplidos_programados' && 'Incrementa la eficiencia operativa cumpliendo con el 100% de las actividades programadas en el mes.'}
                 {meta?.formula_tipo === 'documental_doble' && 'Verifica que ambos documentos obligatorios estén correctos y cargados en el sistema para obtener el 100%.'}
                 {meta?.formula_tipo === 'si_no' && 'El cumplimiento es absoluto; asegúrate de realizar la actividad para marcar el SÍ.'}
                 {!['entregas_a_tiempo', 'cumplidos_programados', 'documental_doble', 'si_no'].includes(meta?.formula_tipo ?? '') && 'Revisa los criterios de evaluación del área para asegurar que la captura de datos sea precisa y a tiempo.'}
               </p>
            </div>

            {renderComparison()}

            <h3 className="history-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
               <TrendingUp size={20} /> Histórico {anio}
            </h3>
            
            {history.length === 0 ? (
              <p className="empty-history">No hay capturas registradas este año.</p>
            ) : (
              <>
                <div className="chart-container-3d" style={{ marginBottom: '3rem' }}>
                  {history.map((h, i) => {
                    const currentMax = Math.max(100, ...history.map(x => x.valor));
                    const graphMax = currentMax * 1.1; 
                    const heightPercent = Math.max(5, (h.valor / graphMax) * 100); 

                    let colorVars = {};
                    switch (h.semaforo?.toLowerCase()) {
                      case 'verde': colorVars = { '--bar-front': '#10b981', '--bar-top': '#34d399', '--bar-side': '#059669' }; break;
                      case 'amarillo': colorVars = { '--bar-front': '#f59e0b', '--bar-top': '#fbbf24', '--bar-side': '#d97706' }; break;
                      case 'rojo': colorVars = { '--bar-front': '#ef4444', '--bar-top': '#f87171', '--bar-side': '#dc2626' }; break;
                      default: colorVars = { '--bar-front': '#94a3b8', '--bar-top': '#cbd5e1', '--bar-side': '#64748b' }; break;
                    }

                    return (
                      <div key={i} className="bar-column">
                        <div className="bar-value">
                          {h.valor}{h.unidad}
                        </div>
                        <div 
                          className="bar-3d-isometric" 
                          style={{ height: `${heightPercent}%`, ...colorVars as React.CSSProperties }}
                        ></div>
                        <div className="bar-label">{h.mes_nombre.substring(0, 3)}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '3rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Table size={18} /> BITÁCORA DETALLADA DE CAPTURAS
                  </h3>
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>MES</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>RESULTADO</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>ESTADO</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>OBSERVACIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{h.mes_nombre}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getSemaforoColor(h.semaforo) }}>
                                {h.valor}{h.unidad}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSemaforoColor(h.semaforo) }}></div>
                                <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', fontWeight: 600 }}>{h.semaforo}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                              {h.comentario ? (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                  <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                  <span>{h.comentario}</span>
                                </div>
                              ) : 'Sin observaciones.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
