import React, { useState, useEffect } from 'react';
import { X, Save, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { type CustomFormulaConfig } from '../lib/customFormula';

interface CaptureModalProps {
  kpi_id: string;
  anio: string;
  mes: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface KpiConfig {
  kpi_id: string;
  kpi_nombre: string;
  meta_descripcion: string;
  formula_tipo: string;
  formula_descripcion: string;
  tipo_captura: string;
  config_json?: {
    guia?: string;
    campos?: string[];
    formula?: string;
    custom_formula?: CustomFormulaConfig;
  };
}

interface KpiFormData {
  programados?: number | '';
  cumplidos?: number | '';
  total_operaciones?: number | '';
  operaciones_correctas?: number | '';
  entregas?: Array<{
    solicitud: string;
    entrega: string;
    dias: number;
    cumplio: boolean;
  }>;
  [key: string]: string | number | boolean | object | undefined;
}

const parseCountValue = (value: number | '' | undefined) => {
  if (value === '' || value === undefined) return 0;
  return value;
};

const normalizeDocumentFields = (config?: KpiConfig | null) => {
  const configuredFields = config?.config_json?.campos?.filter(Boolean) ?? [];

  if (config?.formula_tipo === 'documental_doble') {
    return [configuredFields[0] || 'documento_1', configuredFields[1] || 'documento_2'];
  }

  return configuredFields.length > 0 ? configuredFields : ['confirmacion_documental'];
};

const formatDocumentLabel = (campo: string, index: number) => {
  const normalized = campo.replace(/_/g, ' ').trim();
  if (!normalized) return `Documento ${index + 1}`;

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function CaptureModal({ kpi_id, anio, mes, onClose, onSuccess }: CaptureModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<KpiConfig | null>(null);
  
  const [formData, setFormData] = useState<KpiFormData>({});
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/kpi-config/${kpi_id}`);
        const data = await res.json();
        if (data.success) {
          const cnf = data.data as KpiConfig;
          setConfig(cnf);
          
          // Local initialization of form state
          const initData: KpiFormData = {};
          if (cnf.tipo_captura === 'binario_documental') {
            const campos = normalizeDocumentFields(cnf);
            campos.forEach((c: string) => initData[c] = false);
          } else if (cnf.tipo_captura === 'conteo') {
            initData.programados = '';
            initData.cumplidos = '';
          } else if (cnf.tipo_captura === 'conteo_operativo') {
            initData.total_operaciones = '';
            initData.operaciones_correctas = '';
          } else if (cnf.tipo_captura === 'formula_personalizada') {
            (cnf.config_json?.custom_formula?.variables || []).forEach((variable) => {
              initData[variable.key] = '';
            });
          } else if (cnf.tipo_captura === 'fechas') {
            initData.entregas = [];
          }
          setFormData(initData);
          setComentario('');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [kpi_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    setSaving(true);
    let detalles: object | null = null;

    if (config.tipo_captura === 'binario_documental') {
      detalles = Object.keys(formData).map(k => ({ campo: k, valor: formData[k] }));
    } else if (config.tipo_captura === 'conteo') {
      detalles = {
        ...formData,
        programados: parseCountValue(formData.programados),
        cumplidos: parseCountValue(formData.cumplidos)
      };
    } else if (config.tipo_captura === 'conteo_operativo') {
      detalles = {
        ...formData,
        total_operaciones: parseCountValue(formData.total_operaciones),
        operaciones_correctas: parseCountValue(formData.operaciones_correctas)
      };
    } else {
      detalles = formData;
    }

    try {
      const res = await fetch('/api/capturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi_id,
          anio,
          mes,
          tipo_captura: config.tipo_captura,
          comentario,
          detalles
        })
      });
      if (res.ok) {
         toast.success('¡Registro guardado exitosamente!');
         onSuccess();
         onClose();
      } else {
         toast.error('Hubo un problema al guardar los datos.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="modal-overlay"><div className="spinner"></div></div>;
  if (!config) return null;

  const documentFields = config.tipo_captura === 'binario_documental'
    ? normalizeDocumentFields(config)
    : [];
  const completedDocuments = documentFields.filter((campo) => formData[campo] === true).length;
  const documentaryScore = config.formula_tipo === 'documental_doble'
    ? (completedDocuments >= 2 ? 100 : completedDocuments === 1 ? 50 : 0)
    : (completedDocuments > 0 ? 100 : 0);
  const remainingDocuments = Math.max(0, documentFields.length - completedDocuments);
  const documentaryMessage = config.formula_tipo === 'documental_doble'
    ? (remainingDocuments === 0
      ? 'Listo: ya estan confirmados los 2 documentos y el KPI quedara en 100%.'
      : remainingDocuments === 1
        ? 'Falta 1 documento para llegar al 100% este mes.'
        : 'Debes confirmar 2 documentos para que el KPI llegue a 100% este mes.')
    : 'Confirma la evidencia documental requerida para completar este KPI.';
  const customFormula = config.config_json?.custom_formula;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        <h2>Capturar: {config.kpi_nombre}</h2>
        
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <HelpCircle size={16} /> GUÍA DE MEDICIÓN
            {false && (
              <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  FÃ³rmula configurada para este KPI
                </div>
                <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.95rem', marginBottom: '0.85rem', overflowX: 'auto' }}>
                  {customFormula?.expression || config?.config_json?.formula || 'Formula personalizada'}
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {customFormula?.variables.map((variable) => (
                    <div key={variable.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{variable.label}</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-color)', fontWeight: 700 }}>{variable.key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: '1.5' }}>
            {config.config_json?.guia || 'Complete todos los campos requeridos para este periodo.'}
          </p>
          <div className="formula-visual-card">
            <div className="formula-visual-title">
              <span className="formula-icon">f(x)</span> ¿Cómo se calcula este KPI?
            </div>
            {config.formula_tipo === 'si_no' && (
              <div className="formula-visual-body">
                <div className="formula-branch">
                  <div className="formula-pill pill-input">Marca SÍ</div>
                  <div className="formula-arrow">→</div>
                  <div className="formula-pill pill-green">100%</div>
                </div>
                <div className="formula-branch">
                  <div className="formula-pill pill-input">Marca NO</div>
                  <div className="formula-arrow">→</div>
                  <div className="formula-pill pill-red">0%</div>
                </div>
              </div>
            )}
            {config.formula_tipo === 'documental_doble' && (
              <div className="formula-visual-body">
                <div className="formula-fraction">
                  <div className="fraction-numerator">Documentos entregados</div>
                  <div className="fraction-line"></div>
                  <div className="fraction-denominator">2 documentos requeridos</div>
                </div>
                <div className="formula-arrow">×</div>
                <div className="formula-pill pill-green">100</div>
              </div>
            )}
            {config.formula_tipo === 'documental_doble' && (
              <div style={{ padding: '0 1rem 1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.75rem', width: '100%' }}>
                  <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9a3412', marginBottom: '0.35rem', fontWeight: 700 }}>0 documentos</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c2410c' }}>0%</div>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a16207', marginBottom: '0.35rem', fontWeight: 700 }}>1 documento</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ca8a04' }}>50%</div>
                  </div>
                  <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '0.35rem', fontWeight: 700 }}>2 documentos</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>100%</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                  Para llegar a 100% debes confirmar ambos documentos dentro de esta captura mensual.
                </div>
              </div>
            )}
            {config.formula_tipo === 'cumplidos_programados' && (
              <div className="formula-visual-body">
                <div className="formula-fraction">
                  <div className="fraction-numerator">Actividades Cumplidas</div>
                  <div className="fraction-line"></div>
                  <div className="fraction-denominator">Actividades Programadas</div>
                </div>
                <div className="formula-arrow">×</div>
                <div className="formula-pill pill-green">100</div>
              </div>
            )}
            {config.formula_tipo === 'correctos_total' && (
              <div className="formula-visual-body">
                <div className="formula-fraction">
                  <div className="fraction-numerator">Operaciones Correctas</div>
                  <div className="fraction-line"></div>
                  <div className="fraction-denominator">Total de Operaciones</div>
                </div>
                <div className="formula-arrow">×</div>
                <div className="formula-pill pill-green">100</div>
              </div>
            )}
            {config.formula_tipo === 'entregas_a_tiempo' && (
              <div className="formula-visual-body">
                <div className="formula-fraction">
                  <div className="fraction-numerator">Entregas en ≤ 2 días</div>
                  <div className="fraction-line"></div>
                  <div className="fraction-denominator">Total de Entregas del mes</div>
                </div>
                <div className="formula-arrow">×</div>
                <div className="formula-pill pill-green">100</div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="capture-form">
          {config.tipo_captura === 'binario_documental' && (
            <div className="form-group">
              <label>Validación Documental</label>
              {config.formula_tipo === 'documental_doble' && (
                <div style={{ marginBottom: '1rem', background: documentaryScore === 100 ? '#ecfdf5' : '#eff6ff', border: `1px solid ${documentaryScore === 100 ? '#86efac' : '#bfdbfe'}`, borderRadius: '14px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.03em', color: documentaryScore === 100 ? '#166534' : '#1d4ed8', textTransform: 'uppercase' }}>
                        Resultado estimado del mes
                      </div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                        {documentaryMessage}
                      </div>
                    </div>
                    <div style={{ minWidth: '82px', textAlign: 'center', background: documentaryScore === 100 ? '#dcfce7' : '#dbeafe', color: documentaryScore === 100 ? '#166534' : '#1d4ed8', borderRadius: '999px', padding: '0.6rem 0.9rem', fontWeight: 800, fontSize: '1.05rem' }}>
                      {documentaryScore}%
                    </div>
                  </div>
                </div>
              )}
              {documentFields.map((campo: string, index) => (
                <div key={campo} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    id={campo}
                    checked={!!formData[campo]}
                    onChange={(e) => setFormData({...formData, [campo]: e.target.checked})}
                  />
                  <label htmlFor={campo}>
                    {config.formula_tipo === 'documental_doble'
                      ? `Documento ${index + 1}: ${formatDocumentLabel(campo, index)}`
                      : `Confirmar: ${formatDocumentLabel(campo, index)}`}
                  </label>
                </div>
              ))}
            </div>
          )}

          {config.tipo_captura === 'conteo' && (
            <div className="form-row">
              <div className="form-group">
                <label>Total Programados</label>
                <input 
                  type="number" min="0" required
                  value={formData.programados ?? ''}
                  onChange={(e) => setFormData({...formData, programados: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Total Cumplidos</label>
                <input 
                  type="number" min="0" max={parseCountValue(formData.programados)} required
                  value={formData.cumplidos ?? ''}
                  onChange={(e) => setFormData({...formData, cumplidos: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
            </div>
          )}

          {config.tipo_captura === 'conteo_operativo' && (
            <div className="form-row">
              <div className="form-group">
                <label>Operaciones Totales</label>
                <input 
                  type="number" min="0" required
                  value={formData.total_operaciones ?? ''}
                  onChange={(e) => setFormData({...formData, total_operaciones: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Operaciones Correctas</label>
                <input 
                  type="number" min="0" max={parseCountValue(formData.total_operaciones)} required
                  value={formData.operaciones_correctas ?? ''}
                  onChange={(e) => setFormData({...formData, operaciones_correctas: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
            </div>
          )}

          {config.tipo_captura === 'formula_personalizada' && (
            <div className="form-group">
              <label>Variables para la fÃ³rmula</label>
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {(customFormula?.variables || []).map((variable) => (
                  <div key={variable.key}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                      {variable.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={(formData[variable.key] as number | '') ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [variable.key]: e.target.value === '' ? '' : Number(e.target.value)
                      })}
                      placeholder={variable.helpText || `Captura el valor de ${variable.label.toLowerCase()}`}
                    />
                    <div className="field-hint" style={{ marginTop: '0.35rem' }}>
                      Clave usada por la formula: <span style={{ fontFamily: 'monospace' }}>{variable.key}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.tipo_captura === 'fechas' && (
             <div className="form-group" style={{ marginBottom: '1.5rem' }}>
               <label>Fechas de Entregas del mes</label>
               <button type="button" className="btn-secondary" style={{ marginBottom: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => {
                 setFormData({ ...formData, entregas: [...(formData.entregas||[]), {
                   solicitud: new Date().toISOString().split('T')[0],
                   entrega: new Date().toISOString().split('T')[0],
                   dias: 0, cumplio: true
                 }]})
               }}>+ Registrar Nueva Entrega</button>
               {formData.entregas?.map((ent, i: number) => (
                 <div key={i} className="form-row" style={{marginBottom: '0.5rem', background: '#f8fafc', padding:'10px', borderRadius:'8px', border: '1px solid rgba(0,0,0,0.1)'}}>
                   <div style={{flex: 1}}>
                     <span style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'block', marginBottom:'4px', fontWeight:600}}>Solicitado</span>
                     <input type="date" style={{width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid rgba(0,0,0,0.15)', background:'white', color:'var(--text-main)', outline:'none'}} value={ent.solicitud} onChange={(e) => {
                       const a = [...(formData.entregas || [])]; a[i].solicitud = e.target.value; setFormData({...formData, entregas: a});
                     }} />
                   </div>
                   <div style={{flex: 1}}>
                     <span style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'block', marginBottom:'4px', fontWeight:600}}>Entregado</span>
                     <input type="date" style={{width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid rgba(0,0,0,0.15)', background:'white', color:'var(--text-main)', outline:'none'}} value={ent.entrega} onChange={(e) => {
                       const a = [...(formData.entregas || [])]; a[i].entrega = e.target.value; setFormData({...formData, entregas: a});
                     }} />
                   </div>
                 </div>
               ))}
             </div>
          )}

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label>Comentarios / Observaciones (Opcional)</label>
            <textarea 
               rows={3} 
               style={{ width: '100%', resize: 'vertical' }}
               placeholder="Añade algún comentario sobre esta captura..."
               value={comentario}
               onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : <><Save size={18} /> Guardar Captura</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
