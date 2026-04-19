import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, BarChart3, FileText, Hash, Clock, ToggleLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Area {
  id: string;
  nombre: string;
}

interface CreateKpiModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormulaType = 'si_no' | 'documental_doble' | 'cumplidos_programados' | 'correctos_total' | 'entregas_a_tiempo';

interface FormulaOption {
  value: FormulaType;
  label: string;
  description: string;
  tipo_captura: 'binario_documental' | 'conteo' | 'conteo_operativo' | 'fechas';
  tipo_resultado: 'porcentaje' | 'dias_y_porcentaje';
  icon: React.ReactNode;
  example: string;
}

const FORMULA_OPTIONS: FormulaOption[] = [
  {
    value: 'si_no',
    label: 'Cumplimiento Sí / No',
    description: 'El KPI se cumple al 100% si la actividad se realizó. Si no se realizó, es 0%.',
    tipo_captura: 'binario_documental',
    tipo_resultado: 'porcentaje',
    icon: <ToggleLeft size={22} />,
    example: 'Ejemplos: Entrega de reportes, confirmación de proveedor, envío de acuse.'
  },
  {
    value: 'documental_doble',
    label: 'Documental Doble (2 documentos)',
    description: 'Requiere 2 documentos. Ambos = 100%, uno solo = 50%, ninguno = 0%.',
    tipo_captura: 'binario_documental',
    tipo_resultado: 'porcentaje',
    icon: <FileText size={22} />,
    example: 'Ejemplos: Presupuesto + Plan de trabajo, Análisis + Informe.'
  },
  {
    value: 'cumplidos_programados',
    label: 'Cumplidos / Programados',
    description: '(Actividades cumplidas / Actividades programadas) × 100.',
    tipo_captura: 'conteo',
    tipo_resultado: 'porcentaje',
    icon: <Hash size={22} />,
    example: 'Ejemplos: Simulacros, juntas, capacitaciones, entrenamientos.'
  },
  {
    value: 'correctos_total',
    label: 'Correctos / Total Operaciones',
    description: '(Operaciones correctas / Total de operaciones) × 100.',
    tipo_captura: 'conteo_operativo',
    tipo_resultado: 'porcentaje',
    icon: <BarChart3 size={22} />,
    example: 'Ejemplos: Checklists operacionales, procedimientos, inspecciones.'
  },
  {
    value: 'entregas_a_tiempo',
    label: 'Entregas en Tiempo (días)',
    description: '(Entregas realizadas en N días o menos / Total de entregas) × 100.',
    tipo_captura: 'fechas',
    tipo_resultado: 'dias_y_porcentaje',
    icon: <Clock size={22} />,
    example: 'Ejemplos: Entrega de información operacional, respuesta a solicitudes.'
  }
];

const STEPS = ['Información', 'Fórmula', 'Semáforo', 'Confirmar'];

const CreateKpiModal: React.FC<CreateKpiModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [areaId, setAreaId] = useState('');
  const [metaDescripcion, setMetaDescripcion] = useState('');
  const [guia, setGuia] = useState('');
  const [formulaTipo, setFormulaTipo] = useState<FormulaType | ''>('');
  const [limiteDias, setLimiteDias] = useState(2);
  const [verdeMin, setVerdeMin] = useState(100);
  const [amarilloMin, setAmarilloMin] = useState(80);
  const [camposDocumentales, setCamposDocumentales] = useState<string[]>(['', '']);

  useEffect(() => {
    fetch('/api/areas')
      .then(r => r.json())
      .then(d => { if (d.success) setAreas(d.data as Area[]); })
      .catch(() => toast.error('No se pudieron cargar las áreas'));
  }, []);

  const selectedFormula = FORMULA_OPTIONS.find(f => f.value === formulaTipo);

  const canNext = () => {
    if (step === 0) return nombre.trim() !== '' && areaId !== '' && metaDescripcion.trim() !== '';
    if (step === 1) return formulaTipo !== '';
    if (step === 2) return verdeMin > amarilloMin;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        nombre,
        area_id: areaId,
        meta_descripcion: metaDescripcion,
        formula_tipo: formulaTipo,
        tipo_captura: selectedFormula?.tipo_captura,
        tipo_resultado: selectedFormula?.tipo_resultado,
        semaforo_verde_min: verdeMin,
        semaforo_amarillo_min: amarilloMin,
        limite_dias: formulaTipo === 'entregas_a_tiempo' ? limiteDias : undefined,
        campos_documentales: formulaTipo === 'documental_doble'
          ? camposDocumentales.filter(c => c.trim() !== '')
          : undefined,
        guia: guia.trim() || undefined
      };

      const res = await fetch('/api/kpis/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`KPI "${nombre}" creado exitosamente.`);
        onSuccess();
      } else {
        toast.error(data.error || 'Error al crear el KPI');
      }
    } catch {
      toast.error('Error de conexión al crear el KPI');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="create-kpi-modal">
        {/* Header */}
        <div className="create-kpi-header">
          <div>
            <h2 className="create-kpi-title">Crear nuevo KPI</h2>
            <p className="create-kpi-subtitle">Configura un indicador de desempeño personalizado</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Stepper */}
        <div className="kpi-stepper">
          {STEPS.map((label, i) => (
            <div key={i} className={`kpi-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="kpi-step-circle">
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="kpi-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className={`kpi-step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="create-kpi-body">

          {/* STEP 0: Información básica */}
          {step === 0 && (
            <div className="create-step-content">
              <h3 className="step-heading">Información básica</h3>
              <div className="field-group">
                <label className="field-label">Nombre del indicador *</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Ej: Cumplimiento de auditorías internas"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  maxLength={120}
                />
                <span className="field-hint">{nombre.length}/120 caracteres</span>
              </div>

              <div className="field-group">
                <label className="field-label">Área responsable *</label>
                <select
                  className="field-input"
                  value={areaId}
                  onChange={e => setAreaId(e.target.value)}
                >
                  <option value="">— Selecciona un área —</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">¿Qué se debe presentar como evidencia? *</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="Ej: Acuse de recibo firmado por el supervisor"
                  value={metaDescripcion}
                  onChange={e => setMetaDescripcion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Guía para el capturista (opcional)</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="Instrucciones adicionales que verá el usuario al momento de capturar datos"
                  value={guia}
                  onChange={e => setGuia(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* STEP 1: Tipo de fórmula */}
          {step === 1 && (
            <div className="create-step-content">
              <h3 className="step-heading">Tipo de fórmula de cálculo</h3>
              <p className="step-description">Selecciona cómo se calculará el porcentaje de cumplimiento de este KPI.</p>
              <div className="formula-options-grid">
                {FORMULA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`formula-option-card ${formulaTipo === opt.value ? 'selected' : ''}`}
                    onClick={() => setFormulaTipo(opt.value)}
                    type="button"
                  >
                    <div className="foc-icon">{opt.icon}</div>
                    <div className="foc-body">
                      <div className="foc-label">{opt.label}</div>
                      <div className="foc-desc">{opt.description}</div>
                      <div className="foc-example">{opt.example}</div>
                    </div>
                    {formulaTipo === opt.value && (
                      <div className="foc-check"><Check size={16} /></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Extra config for specific formulas */}
              {formulaTipo === 'entregas_a_tiempo' && (
                <div className="formula-extra-config">
                  <label className="field-label">Limite de días para cumplimiento</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      className="field-input"
                      style={{ width: '100px' }}
                      value={limiteDias}
                      min={1} max={30}
                      onChange={e => setLimiteDias(Number(e.target.value))}
                    />
                    <span className="field-hint">días o menos = cumplimiento</span>
                  </div>
                </div>
              )}

              {formulaTipo === 'documental_doble' && (
                <div className="formula-extra-config">
                  <label className="field-label">Nombre de los 2 documentos requeridos</label>
                  {camposDocumentales.map((c, i) => (
                    <input
                      key={i}
                      type="text"
                      className="field-input"
                      style={{ marginBottom: '8px' }}
                      placeholder={`Documento ${i + 1}: Ej. ${i === 0 ? 'Presupuesto' : 'Plan de trabajo'}`}
                      value={c}
                      onChange={e => {
                        const copy = [...camposDocumentales];
                        copy[i] = e.target.value;
                        setCamposDocumentales(copy);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Semáforo */}
          {step === 2 && (
            <div className="create-step-content">
              <h3 className="step-heading">Umbrales del semáforo</h3>
              <p className="step-description">Define los rangos de porcentaje para cada color del semáforo.</p>

              <div className="semaforo-config-grid">
                <div className="semaforo-field verde">
                  <div className="semaforo-dot verde-dot"></div>
                  <div>
                    <label className="field-label">Verde (Óptimo) — mínimo desde</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="field-input semaforo-input"
                        value={verdeMin}
                        min={1} max={100}
                        onChange={e => setVerdeMin(Number(e.target.value))}
                      />
                      <span className="field-hint">%</span>
                    </div>
                    <span className="field-hint">El KPI es verde si el resultado es &ge; {verdeMin}%</span>
                  </div>
                </div>

                <div className="semaforo-field amarillo">
                  <div className="semaforo-dot amarillo-dot"></div>
                  <div>
                    <label className="field-label">Amarillo (Alerta) — mínimo desde</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="field-input semaforo-input"
                        value={amarilloMin}
                        min={1} max={99}
                        onChange={e => setAmarilloMin(Number(e.target.value))}
                      />
                      <span className="field-hint">%</span>
                    </div>
                    <span className="field-hint">Amarillo: &ge; {amarilloMin}% y &lt; {verdeMin}%</span>
                  </div>
                </div>

                <div className="semaforo-field rojo">
                  <div className="semaforo-dot rojo-dot"></div>
                  <div>
                    <label className="field-label">Rojo (Riesgo) — automático</label>
                    <div className="semaforo-auto-value">&lt; {amarilloMin}%</div>
                    <span className="field-hint">Calculado automáticamente</span>
                  </div>
                </div>
              </div>

              {verdeMin <= amarilloMin && (
                <div className="semaforo-warning">
                  El umbral verde debe ser mayor al umbral amarillo.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirmación */}
          {step === 3 && (
            <div className="create-step-content">
              <h3 className="step-heading">Confirmar nuevo KPI</h3>
              <div className="confirm-summary">
                <div className="confirm-row">
                  <span className="confirm-key">Nombre</span>
                  <span className="confirm-val">{nombre}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Área</span>
                  <span className="confirm-val">{areas.find(a => a.id === areaId)?.nombre ?? '—'}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Evidencia requerida</span>
                  <span className="confirm-val">{metaDescripcion}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Tipo de fórmula</span>
                  <span className="confirm-val">{selectedFormula?.label ?? '—'}</span>
                </div>
                {formulaTipo === 'entregas_a_tiempo' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Límite de días</span>
                    <span className="confirm-val">{limiteDias} días</span>
                  </div>
                )}
                {formulaTipo === 'documental_doble' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Documentos</span>
                    <span className="confirm-val">{camposDocumentales.filter(Boolean).join(' + ')}</span>
                  </div>
                )}
                <div className="confirm-row">
                  <span className="confirm-key">Semáforo</span>
                  <span className="confirm-val">
                    <span style={{ color: '#10b981' }}>Verde &ge; {verdeMin}%</span>
                    {' · '}
                    <span style={{ color: '#f59e0b' }}>Amarillo &ge; {amarilloMin}%</span>
                    {' · '}
                    <span style={{ color: '#ef4444' }}>Rojo &lt; {amarilloMin}%</span>
                  </span>
                </div>
                {guia && (
                  <div className="confirm-row">
                    <span className="confirm-key">Guía de captura</span>
                    <span className="confirm-val">{guia}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="create-kpi-footer">
          <button
            className="btn-secondary"
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
          >
            {step === 0 ? 'Cancelar' : <><ChevronLeft size={16} /> Anterior</>}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary"
              disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="btn-primary btn-create"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Creando...' : <><Check size={16} /> Crear KPI</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateKpiModal;
