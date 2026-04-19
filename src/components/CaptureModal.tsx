import React, { useState, useEffect } from 'react';
import { X, Save, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CaptureModalProps {
  kpi_id: string;
  anio: string;
  mes: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CaptureModal({ kpi_id, anio, mes, onClose, onSuccess }: CaptureModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  // State for forms
  const [formData, setFormData] = useState<any>({});

  const [comentario, setComentario] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [kpi_id]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/kpi-config/${kpi_id}`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        initFormState(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initFormState = (cnf: any) => {
    if (cnf.tipo_captura === 'binario_documental') {
      const campos = cnf.config_json?.campos || ['confirmacion_documental'];
      const initData: any = {};
      campos.forEach((c: string) => initData[c] = false);
      setFormData(initData);
    } else if (cnf.tipo_captura === 'conteo') {
      setFormData({ programados: 0, cumplidos: 0 });
    } else if (cnf.tipo_captura === 'conteo_operativo') {
      setFormData({ total_operaciones: 0, operaciones_correctas: 0 });
    } else if (cnf.tipo_captura === 'fechas') {
      setFormData({ entregas: [] }); // array de entregas
    }
    setComentario('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let detalles: any = null;

    if (config.tipo_captura === 'binario_documental') {
      detalles = Object.keys(formData).map(k => ({ campo: k, valor: formData[k] }));
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        <h2>Capturar: {config.kpi_nombre}</h2>
        
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <HelpCircle size={16} /> GUÍA DE MEDICIÓN
          </div>
          <p style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: '1.5' }}>
            {config.config_json?.guia || 'Complete todos los campos requeridos para este periodo.'}
          </p>
          <div style={{ marginTop: '10px', padding: '8px', background: 'white', borderRadius: '8px', border: '1px dashed var(--accent-color)', textAlign: 'center' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Fórmula de Cálculo:</span>
             <code style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 800 }}>
                {config.formula_tipo === 'si_no' && '[ (Captura == SÍ) ? 100% : 0% ]'}
                {config.formula_tipo === 'documental_doble' && '[ (Documentos / 2) * 100 ]'}
                {config.formula_tipo === 'cumplidos_programados' && '[ (Cumplidos / Programados) * 100 ]'}
                {config.formula_tipo === 'correctos_total' && '[ (Correctos / Total) * 100 ]'}
                {config.formula_tipo === 'entregas_a_tiempo' && '[ (% Entregas <= 2 días) ]'}
             </code>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="capture-form">
          {config.tipo_captura === 'binario_documental' && (
            <div className="form-group">
              <label>Validación Documental</label>
              {(config.config_json?.campos || ['confirmacion_documental']).map((campo: string) => (
                <div key={campo} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    id={campo}
                    checked={formData[campo] || false}
                    onChange={(e) => setFormData({...formData, [campo]: e.target.checked})}
                  />
                  <label htmlFor={campo}>Confirmar: {campo.replace(/_/g, ' ').toUpperCase()}</label>
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
                  value={formData.programados || 0}
                  onChange={(e) => setFormData({...formData, programados: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Total Cumplidos</label>
                <input 
                  type="number" min="0" max={formData.programados || 0} required
                  value={formData.cumplidos || 0}
                  onChange={(e) => setFormData({...formData, cumplidos: Number(e.target.value)})}
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
                  value={formData.total_operaciones || 0}
                  onChange={(e) => setFormData({...formData, total_operaciones: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Operaciones Correctas</label>
                <input 
                  type="number" min="0" max={formData.total_operaciones || 0} required
                  value={formData.operaciones_correctas || 0}
                  onChange={(e) => setFormData({...formData, operaciones_correctas: Number(e.target.value)})}
                />
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
               {formData.entregas?.map((ent: any, i: number) => (
                 <div key={i} className="form-row" style={{marginBottom: '0.5rem', background: '#f8fafc', padding:'10px', borderRadius:'8px', border: '1px solid rgba(0,0,0,0.1)'}}>
                   <div style={{flex: 1}}>
                     <span style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'block', marginBottom:'4px', fontWeight:600}}>Solicitado</span>
                     <input type="date" style={{width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid rgba(0,0,0,0.15)', background:'white', color:'var(--text-main)', outline:'none'}} value={ent.solicitud} onChange={(e) => {
                       const a = [...formData.entregas]; a[i].solicitud = e.target.value; setFormData({...formData, entregas: a});
                     }} />
                   </div>
                   <div style={{flex: 1}}>
                     <span style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'block', marginBottom:'4px', fontWeight:600}}>Entregado</span>
                     <input type="date" style={{width:'100%', padding:'0.5rem', borderRadius:'6px', border:'1px solid rgba(0,0,0,0.15)', background:'white', color:'var(--text-main)', outline:'none'}} value={ent.entrega} onChange={(e) => {
                       const a = [...formData.entregas]; a[i].entrega = e.target.value; setFormData({...formData, entregas: a});
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
