import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface KpiDetailModalProps {
  kpi: any;
  anio: string;
  onClose: () => void;
}

export default function KpiDetailModal({ kpi, anio, onClose }: KpiDetailModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [kpi.kpi_id, anio]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/kpi-historico/${kpi.kpi_id}?anio=${anio}`);
      const body = await res.json();
      if (body.success) {
        setHistory(body.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  // Comparativa vs mes anterior (si existe)
  const renderComparison = () => {
    if (history.length < 2) return null;
    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    const diff = current.valor - prev.valor;
    
    let icon = <Minus size={18} color="var(--color-gris)" />;
    let diffColor = 'var(--color-gris)';
    if (diff > 0) {
       icon = <TrendingUp size={18} color="var(--color-verde)" />;
       diffColor = 'var(--color-verde)';
    } else if (diff < 0) {
       icon = <TrendingDown size={18} color="var(--color-rojo)" />;
       diffColor = 'var(--color-rojo)';
    }

    return (
      <div className="comparison-box">
        <span className="comparison-label">vs mes anterior ({prev.mes_nombre}):</span>
        <div className="comparison-value" style={{ color: diffColor }}>
          {icon} <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)}{kpi.unidad}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content detail-modal">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        <div className="detail-header">
           <Activity size={28} className="detail-icon" />
           <div>
             <h2>{kpi.kpi_nombre}</h2>
             <p className="detail-area">{kpi.area}</p>
           </div>
        </div>

        {loading ? (
           <div className="spinner-container"><div className="spinner"></div></div>
        ) : (
          <div className="detail-body">
            {renderComparison()}

            <h3 className="history-title">Histórico de Resultados {anio}</h3>
            {history.length === 0 ? (
              <p className="empty-history">No hay capturas registradas este año.</p>
            ) : (
              <div className="chart-container-3d">
                {history.map((h, i) => {
                  // Determine max value for proportional heights (default to 100 if percent)
                  const currentMax = Math.max(100, ...history.map(x => x.valor));
                  // Adding a tiny buffer so 100% doesn't hit the absolute ceiling perfectly
                  const graphMax = currentMax * 1.1; 
                  const heightPercent = Math.max(5, (h.valor / graphMax) * 100); 

                  let colorVars = {};
                  switch (h.semaforo?.toLowerCase()) {
                    case 'verde': 
                      colorVars = { '--bar-front': '#10b981', '--bar-top': '#34d399', '--bar-side': '#059669' }; break;
                    case 'amarillo': 
                      colorVars = { '--bar-front': '#f59e0b', '--bar-top': '#fbbf24', '--bar-side': '#d97706' }; break;
                    case 'rojo': 
                      colorVars = { '--bar-front': '#ef4444', '--bar-top': '#f87171', '--bar-side': '#dc2626' }; break;
                    default: 
                      colorVars = { '--bar-front': '#94a3b8', '--bar-top': '#cbd5e1', '--bar-side': '#64748b' }; break;
                  }

                  // Shorten month names for mobile responsiveness (e.g., Enero -> Ene)
                  const shortMonth = h.mes_nombre ? h.mes_nombre.substring(0, 3) : '';

                  return (
                    <div key={i} className="bar-column">
                      <div className="bar-value">
                        {h.valor}{h.unidad}
                        {h.valor_auxiliar != null && <div style={{ fontSize: '10px', color: '#64748b' }}>({h.valor_auxiliar} avg)</div>}
                      </div>
                      <div 
                        className="bar-3d-isometric" 
                        style={{ height: `${heightPercent}%`, ...colorVars as React.CSSProperties }}
                      ></div>
                      <div className="bar-label">{shortMonth}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
