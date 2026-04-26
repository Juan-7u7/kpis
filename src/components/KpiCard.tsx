import { Palette, Edit3, Trash2, HelpCircle, PlusCircle } from 'lucide-react';
import type { KPI } from '../types/dashboard';

interface KpiCardProps {
  kpi: KPI;
  isAdmin: boolean;
  onOpenDetail: (kpi: KPI) => void;
  onCapture: (kpi: KPI) => void;
  onOpenVisualConfig: (kpi: KPI) => void;
  onDelete: (kpi: KPI) => void;
  getSemaforoRgb: (semaforo: string) => string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  kpi,
  isAdmin,
  onOpenDetail,
  onCapture,
  onOpenVisualConfig,
  onDelete,
  getSemaforoRgb
}) => {
  const visual = kpi.kpi_config?.config_json?.visual || {};
  const chartType = visual.chart_type || ((kpi.tipo_resultado === 'porcentaje' || kpi.tipo_resultado === 'binario') ? 'donut' : 'bar');
  const customColor = visual.primary_color;
  const cardStyle = customColor ? { '--progress-color': customColor } as React.CSSProperties : {};

  return (
    <div 
      className="kpi-card hover-enabled" 
      key={kpi.resultado_id || kpi.kpi_id}
      onClick={() => onOpenDetail(kpi)}
      style={{ 
        '--card-rgb': getSemaforoRgb(kpi.semaforo) 
      } as React.CSSProperties}
    >
      <div className="kpi-card-header-v2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0.5rem' }}>
        <span className="kpi-formula-type" style={{ margin: 0 }}>{kpi.formula_tipo.replace(/[_]/g, ' ').toUpperCase()}</span>
        
        <div className="kpi-actions-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
          {isAdmin && (
            <button className="quick-action-btn" onClick={() => onOpenVisualConfig(kpi)} title="Diseño">
              <Palette size={14} />
            </button>
          )}
          <button className="quick-action-btn" onClick={() => onOpenDetail(kpi)} title="Info">
            <HelpCircle size={14} />
          </button>
          <button 
            className={kpi.valor === null ? "kpi-edit-btn primary-pulse" : "kpi-edit-btn"} 
            style={{ margin: 0, padding: '0.4rem 0.8rem', height: '32px' }} 
            onClick={() => onCapture(kpi)}
          >
            {kpi.valor === null ? <PlusCircle size={14} /> : <Edit3 size={14} />}
            <span style={{ marginLeft: '6px', fontSize: '0.75rem' }}>{kpi.valor === null ? 'Capturar' : 'Actualizar'}</span>
          </button>
          {isAdmin && kpi.es_borrable && (
            <button 
              className="kpi-edit-btn btn-delete" 
              style={{ padding: '0.4rem', margin: 0, height: '32px', width: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444' }} 
              onClick={() => onDelete(kpi)}
              title="Eliminar KPI"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <h3 className="kpi-name" style={{ minHeight: '3rem', marginBottom: '1rem', padding: '0 1.5rem' }}>{kpi.kpi_nombre}</h3>

      <div className="kpi-card-footer" style={{ marginTop: 'auto', padding: '0.5rem 1.5rem 1.5rem', width: '100%' }}>
        {(() => {
          if (chartType === 'donut') {
            return (
              <div className="kpi-donut-container">
                <div className="radial-progress-wrapper">
                  <div 
                    className="radial-progress" 
                    style={{ 
                      ...cardStyle,
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
            );
          }

          if (chartType === 'number') {
            return (
              <div className="kpi-big-number-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="kpi-result">
                    <span className="kpi-big-number-value" style={{ '--card-rgb': getSemaforoRgb(kpi.semaforo) } as any}>
                      {kpi.valor !== null ? kpi.valor : '--'}
                    </span>
                    {kpi.valor !== null && <span className="kpi-unit" style={{ marginLeft: '10px', fontSize: '1.2rem', opacity: 0.5, fontWeight: 700 }}>{kpi.unidad}</span>}
                  </div>
                  <div className="kpi-status">
                    <span className="status-dot"></span>
                    {kpi.semaforo === 'gris' ? 'Pendiente' : kpi.semaforo.charAt(0).toUpperCase() + kpi.semaforo.slice(1)}
                  </div>
                </div>
              </div>
            );
          }

          // Default to Bar (Progress Bar)
          return (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
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
                    '--bar-color': customColor || undefined,
                    width: kpi.valor === null ? '0%' : (kpi.semaforo === 'verde' ? '100%' : (kpi.semaforo === 'amarillo' ? '65%' : '35%')),
                    opacity: kpi.valor === null ? 0.3 : 1
                  } as React.CSSProperties}
                ></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default KpiCard;
