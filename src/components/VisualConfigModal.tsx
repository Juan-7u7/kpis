import React, { useState } from 'react';
import { X, Palette, BarChart3, PieChart, Hash, Sparkles } from 'lucide-react';
import type { VisualConfig } from '../../api/types/kpi';

interface Props {
  kpiId: string;
  kpiNombre: string;
  currentConfig?: VisualConfig;
  onClose: () => void;
  onSave: (config: VisualConfig) => void;
}

const PREMIUM_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Azul Real', value: '#3b82f6' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Ámbar', value: '#f59e0b' },
  { name: 'Carmesí', value: '#ef4444' },
  { name: 'Cian', value: '#06b6d4' },
  { name: 'Naranja Sunset', value: '#f97316' },
  { name: 'Indigo Deep', value: '#4f46e5' }
];

const CHART_TYPES = [
  { id: 'donut', label: 'Círculo (Donut)', icon: PieChart },
  { id: 'bar', label: 'Barra de Progreso', icon: BarChart3 },
  { id: 'number', label: 'Número Grande', icon: Hash }
];

export const VisualConfigModal: React.FC<Props> = ({ kpiId, kpiNombre, currentConfig, onClose, onSave }) => {
  const [config, setConfig] = useState<VisualConfig>(currentConfig || { chart_type: 'donut' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // USAR RUTA RELATIVA PARA EVITAR PROBLEMAS DE PUERTO
      const response = await fetch(`/api/kpis/${kpiId}/visual`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving visual config:', error);
      alert('No se pudo guardar la configuración visual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visual-modal-overlay" onClick={onClose}>
      <div className="visual-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-premium">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette className="w-5 h-5" style={{ color: '#60a5fa' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Diseño de Indicador</h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{kpiNombre}</p>
          </div>
          <button onClick={onClose} className="quick-action-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-premium">
          {/* Chart Type Selection */}
          <section>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '1rem' }}>
                Tipo de Visualización
            </label>
            <div className="chart-type-grid">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = config.chart_type === type.id || (!config.chart_type && type.id === 'donut');
                return (
                  <button
                    key={type.id}
                    onClick={() => setConfig({ ...config, chart_type: type.id as any })}
                    className={`chart-type-option ${isSelected ? 'selected' : ''}`}
                  >
                    <Icon size={24} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Color Selection */}
          <section style={{ marginTop: '2rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '1rem' }}>
                Color Temático Personalizado
            </label>
            <div className="color-selection-grid">
              {PREMIUM_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setConfig({ ...config, primary_color: color.value })}
                  title={color.name}
                  className={`color-dot-btn ${config.primary_color === color.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: color.value || '#1e293b', 
                    backgroundImage: !color.value ? 'linear-gradient(45deg, #1e293b, #334155)' : 'none' 
                  }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer-premium">
          <button
            onClick={onClose}
            style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ 
                flex: 1, 
                padding: '0.75rem', 
                borderRadius: '12px', 
                border: 'none', 
                background: '#3b82f6',
                color: 'white',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {loading ? 'Guardando...' : 'Aplicar Diseño'}
          </button>
        </div>
      </div>
    </div>
  );
};
