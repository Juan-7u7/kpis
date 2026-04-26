import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, ChevronDown, Check, BarChart3, FileText, Hash, Clock, ToggleLeft, Sigma, PlusCircle, Trash2, BookOpen, Calculator, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeFormulaKey, validateCustomFormula, evaluateCustomFormula, type CustomFormulaVariable } from '../lib/customFormula';

interface Area {
  id: string;
  nombre: string;
}

interface CreateKpiModalProps {
  empresaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type FormulaType = 'si_no' | 'documental_doble' | 'cumplidos_programados' | 'correctos_total' | 'entregas_a_tiempo' | 'formula_personalizada';

interface FormulaOption {
  value: FormulaType;
  label: string;
  description: string;
  tipo_captura: 'binario_documental' | 'conteo' | 'conteo_operativo' | 'fechas' | 'formula_personalizada';
  tipo_resultado: 'porcentaje' | 'dias_y_porcentaje';
  icon: React.ReactNode;
  example: string;
}

interface CustomVariableForm extends CustomFormulaVariable {
  id: string;
}

type CustomTemplateType = 'percentage' | 'difference' | 'sum' | 'average' | 'manual';

const FORMULA_OPTIONS: FormulaOption[] = [
  {
    value: 'si_no',
    label: 'Cumplimiento Si / No',
    description: 'El KPI se cumple al 100% si la actividad se realizo. Si no se realizo, es 0%.',
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
    description: '(Actividades cumplidas / Actividades programadas) x 100.',
    tipo_captura: 'conteo',
    tipo_resultado: 'porcentaje',
    icon: <Hash size={22} />,
    example: 'Ejemplos: Simulacros, juntas, capacitaciones, entrenamientos.'
  },
  {
    value: 'correctos_total',
    label: 'Correctos / Total Operaciones',
    description: '(Operaciones correctas / Total de operaciones) x 100.',
    tipo_captura: 'conteo_operativo',
    tipo_resultado: 'porcentaje',
    icon: <BarChart3 size={22} />,
    example: 'Ejemplos: Checklists operacionales, procedimientos, inspecciones.'
  },
  {
    value: 'entregas_a_tiempo',
    label: 'Entregas en Tiempo (días)',
    description: '(Entregas realizadas en N días o menos / Total de entregas) x 100.',
    tipo_captura: 'fechas',
    tipo_resultado: 'dias_y_porcentaje',
    icon: <Clock size={22} />,
    example: 'Ejemplos: Entrega de informacion operacional, respuesta a solicitudes.'
  },
  {
    value: 'formula_personalizada',
    label: 'Fórmula Personalizada',
    description: 'Define variables propias y una regla matemática creada desde cero.',
    tipo_captura: 'formula_personalizada',
    tipo_resultado: 'porcentaje',
    icon: <Sigma size={22} />,
    example: 'Ejemplo: (solicitudes_resueltas / solicitudes_recibidas) * 100'
  }
];

const STEPS = ['Información', 'Fórmula', 'Semáforo', 'Confirmar'];

const parseNumericInput = (value: string, fallback: number) => {
  if (value.trim() === '') return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createCustomVariable = (index: number): CustomVariableForm => ({
  id: `custom-variable-${index}-${Date.now()}`,
  label: '',
  key: `variable_${index}`,
  helpText: ''
});

const CUSTOM_TEMPLATE_OPTIONS: { value: CustomTemplateType; label: string; description: string }[] = [
  {
    value: 'percentage',
    label: 'Porcentaje de cumplimiento',
    description: '(dato 1 / dato 2) x 100'
  },
  {
    value: 'difference',
    label: 'Diferencia',
    description: 'dato 1 - dato 2'
  },
  {
    value: 'sum',
    label: 'Suma total',
    description: 'dato 1 + dato 2 + ...'
  },
  {
    value: 'average',
    label: 'Promedio',
    description: '(dato 1 + dato 2 + ...) / cantidad'
  },
  {
    value: 'manual',
    label: 'Fórmula libre',
    description: 'Escribir la regla manualmente'
  }
];

const buildExpressionFromTemplate = (template: CustomTemplateType, variables: CustomVariableForm[]) => {
  const keys = variables.map((variable, index) => variable.key || `variable_${index + 1}`);

  if (keys.length === 0) {
    return '';
  }

  switch (template) {
    case 'percentage':
      return keys.length >= 2 ? `(${keys[0]} / ${keys[1]}) * 100` : `${keys[0]} * 100`;
    case 'difference':
      return keys.length >= 2 ? `${keys[0]} - ${keys[1]}` : keys[0];
    case 'sum':
      return keys.join(' + ');
    case 'average':
      return keys.length === 1 ? keys[0] : `(${keys.join(' + ')}) / ${keys.length}`;
    case 'manual':
    default:
      return '';
  }
};

export default function CreateKpiModal({ empresaId, onClose, onSuccess }: CreateKpiModalProps) {
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [areaId, setAreaId] = useState('');
  const [metaDescripcion, setMetaDescripcion] = useState('');
  const [guia, setGuia] = useState('');
  const [formulaTipo, setFormulaTipo] = useState<FormulaType | ''>('');
  const [limiteDias, setLimiteDias] = useState('2');
  const [verdeMin, setVerdeMin] = useState('100');
  const [amarilloMin, setAmarilloMin] = useState('80');
  const [camposDocumentales, setCamposDocumentales] = useState<string[]>(['', '']);
  const [customVariables, setCustomVariables] = useState<CustomVariableForm[]>([
    createCustomVariable(1),
    createCustomVariable(2)
  ]);
  const [customTemplate, setCustomTemplate] = useState<CustomTemplateType>('percentage');
  const [customExpression, setCustomExpression] = useState('(variable_1 / variable_2) * 100');
  
  // Business fields (Phase 9)
  const [objetivo, setObjetivo] = useState('');
  const [definicion, setDefinicion] = useState('');
  const [medicion, setMedicion] = useState('');
  const [sentido, setSentido] = useState<'higher_is_better' | 'lower_is_better' | 'range_is_better'>('higher_is_better');
  const [fuenteDatos, setFuenteDatos] = useState('');
  const [fechaEntregaInfo, setFechaEntregaInfo] = useState('');
  const [simulationValues, setSimulationValues] = useState<Record<string, string>>({});
  const [simulationResult, setSimulationResult] = useState<number | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!empresaId) return;

    fetch(`/api/areas?empresa_id=${empresaId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAreas(d.data as Area[]); })
      .catch(() => toast.error('No se pudieron cargar las áreas'));
  }, [empresaId]);

  const selectedFormula = FORMULA_OPTIONS.find(f => f.value === formulaTipo);
  const limiteDiasValue = parseNumericInput(limiteDias, 2);
  const verdeMinValue = parseNumericInput(verdeMin, 100);
  const amarilloMinValue = parseNumericInput(amarilloMin, 80);
  const customFormulaConfig = {
    expression: customExpression,
    variables: customVariables.map(({ key, label, helpText }) => ({ key, label, helpText }))
  };
  const customFormulaValidation = formulaTipo === 'formula_personalizada'
    ? validateCustomFormula(customFormulaConfig)
    : { valid: true as const };

  // Live simulation effect
  useEffect(() => {
    if (formulaTipo !== 'formula_personalizada' || !customFormulaValidation.valid) {
      setSimulationResult(null);
      setSimulationError(null);
      return;
    }

    try {
      const values: Record<string, number> = {};
      customVariables.forEach(v => {
        values[v.key] = parseFloat(simulationValues[v.id] || '0');
      });
      
      const result = evaluateCustomFormula(customExpression, values);
      setSimulationResult(result);
      setSimulationError(null);
    } catch (err) {
      setSimulationResult(null);
      setSimulationError(err instanceof Error ? err.message : 'Error al simular');
    }
  }, [customExpression, customVariables, simulationValues, formulaTipo, customFormulaValidation.valid]);

  const syncCustomExpression = (
    template: CustomTemplateType,
    variables: CustomVariableForm[],
    activeFormulaType: FormulaType | ''
  ) => {
    if (activeFormulaType !== 'formula_personalizada') return;
    if (template === 'manual') return;

    setCustomExpression(buildExpressionFromTemplate(template, variables));
  };

  const updateCustomVariable = (id: string, field: 'label' | 'key' | 'helpText', value: string) => {
    setCustomVariables((current) => {
      const nextVariables = current.map((variable, index) => {
        if (variable.id !== id) return variable;

        if (field === 'label') {
          const nextKey = normalizeFormulaKey(value, `variable_${index + 1}`);
          return { ...variable, label: value, key: nextKey };
        }

        if (field === 'key') {
          return { ...variable, key: normalizeFormulaKey(value, `variable_${index + 1}`) };
        }

        return { ...variable, helpText: value };
      });

      syncCustomExpression(customTemplate, nextVariables, formulaTipo);
      return nextVariables;
    });
  };

  const addCustomVariable = () => {
    setCustomVariables((current) => {
      const nextVariables = [...current, createCustomVariable(current.length + 1)];
      syncCustomExpression(customTemplate, nextVariables, formulaTipo);
      return nextVariables;
    });
  };

  const removeCustomVariable = (id: string) => {
    setCustomVariables((current) => {
      const nextVariables = current.length <= 1 ? current : current.filter((variable) => variable.id !== id);
      syncCustomExpression(customTemplate, nextVariables, formulaTipo);
      return nextVariables;
    });
  };

  const appendExpressionToken = (token: string) => {
    setCustomExpression((current) => `${current}${current.trim() ? ' ' : ''}${token}`);
  };

  const canNext = () => {
    if (step === 0) return nombre.trim() !== '' && metaDescripcion.trim() !== '';
    if (step === 1) return formulaTipo !== '' && customFormulaValidation.valid;
    if (step === 2) {
      if (verdeMin.trim() === '' || amarilloMin.trim() === '') return false;
      return sentido === 'lower_is_better' 
        ? verdeMinValue < amarilloMinValue 
        : verdeMinValue > amarilloMinValue;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        nombre,
        empresa_id: empresaId,
        area_id: areaId,
        meta_descripcion: metaDescripcion,
        formula_tipo: formulaTipo,
        tipo_captura: selectedFormula?.tipo_captura,
        tipo_resultado: selectedFormula?.tipo_resultado,
        semaforo_verde_min: verdeMinValue,
        semaforo_amarillo_min: amarilloMinValue,
        limite_dias: formulaTipo === 'entregas_a_tiempo' ? limiteDiasValue : undefined,
        campos_documentales: formulaTipo === 'documental_doble'
          ? camposDocumentales.filter(c => c.trim() !== '')
          : undefined,
        formula_personalizada: formulaTipo === 'formula_personalizada'
          ? customFormulaConfig
          : undefined,
        guia: guia.trim() || undefined,
        objetivo: objetivo.trim() || undefined,
        definicion: definicion.trim() || undefined,
        medicion: medicion.trim() || undefined,
        sentido,
        fuente_datos: fuenteDatos.trim() || undefined,
        fecha_entrega_info: fechaEntregaInfo.trim() || undefined
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

          {/* STEP 0: Informacion basica */}
          {step === 0 && (
            <div className="create-step-content">
              <h3 className="step-heading">Información básica</h3>
              <div className="field-group">
                <label className="field-label">Nombre del indicador *</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Ej: Cumplimiento de auditorias internas"
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
                  <option value="">- Selecciona un área -</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Objetivo del KPI</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="¿Qué se busca lograr con este indicador?"
                  value={objetivo}
                  onChange={e => setObjetivo(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Definición técnica</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="Explicación detallada de lo que representa el indicador"
                  value={definicion}
                  onChange={e => setDefinicion(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Método de medición</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="¿Cómo se obtienen los datos?"
                  value={medicion}
                  onChange={e => setMedicion(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Fuente de los datos</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Ej: SAP, Excel de Operaciones, Bitácora física"
                  value={fuenteDatos}
                  onChange={e => setFuenteDatos(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Periodicidad de entrega de información</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Ej: Primeros 5 días del mes"
                  value={fechaEntregaInfo}
                  onChange={e => setFechaEntregaInfo(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Evidencia requerida (para el capturista) *</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="Ej: Acuse de recibo firmado por el supervisor"
                  value={metaDescripcion}
                  onChange={e => setMetaDescripcion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Guía adicional (opcional)</label>
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

          {/* STEP 1: Tipo de formula */}
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
                  <label className="field-label">Límite de días para cumplimiento</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      className="field-input"
                      style={{ width: '100px' }}
                      value={limiteDias}
                      min={1} max={30}
                      onChange={e => setLimiteDias(e.target.value)}
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

              {formulaTipo === 'formula_personalizada' && (
                <div className="formula-extra-config" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                  
                  {/* Tutorial Collapsible */}
                  <div className={`custom-formula-tutorial ${showTutorial ? 'is-open' : ''}`} style={{ marginBottom: '2rem' }}>
                    <button 
                      type="button" 
                      className="tutorial-toggle"
                      onClick={() => setShowTutorial(!showTutorial)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="tutorial-toggle-icon"><BookOpen size={18} /></div>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem' }}>
                            {showTutorial ? 'Ocultar guía de ayuda' : '¿Necesitas ayuda con la fórmula personalizada?'}
                          </span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Aprende a configurar datos y operaciones matemáticas</span>
                        </div>
                      </div>
                      <ChevronDown size={20} style={{ transform: showTutorial ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                    </button>

                    {showTutorial && (
                      <div className="tutorial-content-wrapper">
                        <div className="custom-formula-tutorial__grid">
                          <div className="custom-formula-tutorial__card">
                            <div className="custom-formula-tutorial__card-title">
                              <Hash size={16} /> 1. Define los datos
                            </div>
                            <p>Crea las variables que el capturista llenará cada mes (ej: Tickets resueltos).</p>
                          </div>
                          <div className="custom-formula-tutorial__card">
                            <div className="custom-formula-tutorial__card-title">
                              <Calculator size={16} /> 2. Crea la fórmula
                            </div>
                            <p>Usa las claves (keys) de tus datos para armar la operación matemática.</p>
                          </div>
                        </div>

                        <div className="custom-formula-example" style={{ marginTop: '1rem' }}>
                          <div className="custom-formula-example__title">Ejemplo rápido</div>
                          <div className="custom-formula-example__content">
                            <code>(tickets_resueltos / tickets_recibidos) * 100</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 1: VARIABLES */}
                  <div className="builder-step-section">
                    <div className="builder-step-header">
                      <div className="builder-step-badge">Paso 1</div>
                      <div>
                        <h4>Define los datos a capturar</h4>
                        <p>Agrega los campos que se llenarán mensualmente para este indicador.</p>
                      </div>
                    </div>
                    <div className="variable-builder-grid">
                      {customVariables.map((variable, index) => (
                        <div key={variable.id} className="premium-variable-card">
                          <div className="pvc-header">
                            <div className="pvc-tag">DATO {index + 1}</div>
                            <button
                              type="button"
                              className="pvc-delete"
                              onClick={() => removeCustomVariable(variable.id)}
                              disabled={customVariables.length <= 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="pvc-body">
                            <input
                              className={`pvc-input-label ${!variable.label.trim() ? 'pvc-input-error' : ''}`}
                              type="text"
                              placeholder={index === 0 ? 'Nombre del dato (ej. Tickets)' : 'Nombre del dato'}
                              value={variable.label}
                              onChange={(e) => updateCustomVariable(variable.id, 'label', e.target.value)}
                            />
                            {!variable.label.trim() && (
                              <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                                * Requerido
                              </span>
                            )}

                            <div className="pvc-key-row" title="Usa esta clave en tu fórmula">
                              <Hash size={12} />
                              <span className="pvc-key">{variable.key}</span>
                              <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: 'auto' }}>Clave para fórmula</span>
                            </div>

                            <input
                              className="pvc-input-hint"
                              type="text"
                              placeholder="Instrucciones para el usuario..."
                              value={variable.helpText || ''}
                              onChange={(e) => updateCustomVariable(variable.id, 'helpText', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="btn-add-variable" onClick={addCustomVariable}>
                      <PlusCircle size={18} /> Agregar otro dato a capturar
                    </button>
                  </div>

                  {/* STEP 2: FORMULA */}
                  <div className="builder-step-section">
                    <div className="builder-step-header">
                      <div className="builder-step-badge">Paso 2</div>
                      <div>
                        <h4>Construye la fórmula de cálculo</h4>
                        <p>Elige una plantilla o escribe tu expresión matemática personalizada.</p>
                      </div>
                    </div>

                    <div className="template-selector-grid">
                      {CUSTOM_TEMPLATE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`template-card ${customTemplate === option.value ? 'is-selected' : ''}`}
                          onClick={() => {
                            setCustomTemplate(option.value);
                            syncCustomExpression(option.value, customVariables, formulaTipo);
                          }}
                        >
                          <div className="template-card-label">{option.label}</div>
                          <div className="template-card-desc">{option.description}</div>
                          {customTemplate === option.value && <div className="template-card-check"><Check size={14} /></div>}
                        </button>
                      ))}
                    </div>

                    <div className="formula-composer-box">
                      <div className="formula-preview-header">
                        <Calculator size={14} /> Vista previa de la operación
                      </div>
                      <div className="formula-preview-display">
                        {customExpression || <span className="placeholder">Define una expresión...</span>}
                      </div>

                      <div className="token-bank">
                        <div className="token-group">
                          <span className="token-group-label">Tus Datos:</span>
                          {customVariables.map((v) => (
                            <button key={v.id} type="button" className="token-pill var" onClick={() => appendExpressionToken(v.key)}>
                              {v.key}
                            </button>
                          ))}
                        </div>
                        <div className="token-group">
                          <span className="token-group-label">Operadores:</span>
                          {['+', '-', '*', '/', '(', ')', '100'].map((op) => (
                            <button key={op} type="button" className="token-pill op" onClick={() => appendExpressionToken(op)}>
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        className="formula-textarea"
                        rows={3}
                        placeholder="Escribe aquí tu fórmula..."
                        value={customExpression}
                        onChange={(e) => {
                          if (customTemplate !== 'manual') setCustomTemplate('manual');
                          setCustomExpression(e.target.value);
                        }}
                      />
                      
                      {!customFormulaValidation.valid && (
                        <div className="formula-error-msg">
                          <AlertCircle size={16} /> {customFormulaValidation.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 3: SIMULATION */}
                  <div className="builder-step-section">
                    <div className="builder-step-header">
                      <div className="builder-step-badge">Paso 3</div>
                      <div>
                        <h4>Prueba tu fórmula</h4>
                        <p>Simula valores reales para confirmar que el cálculo es correcto.</p>
                      </div>
                    </div>

                    <div className="premium-simulation-card">
                      <div className="sim-inputs-grid">
                        {customVariables.map((v, i) => (
                          <div key={v.id} className="sim-field">
                            <label>{v.label || `Dato ${i + 1}`}</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={simulationValues[v.id] || ''}
                              onChange={(e) => setSimulationValues(prev => ({ ...prev, [v.id]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="sim-result-panel">
                        <div className="sim-result-main">
                          <div className="sim-result-label">Resultado</div>
                          <div className={`sim-result-value ${simulationError ? 'has-error' : ''}`}>
                            {simulationError ? 'ERROR' : (simulationResult !== null ? `${simulationResult.toLocaleString()}%` : '0%')}
                          </div>
                        </div>
                        <div className="sim-result-status">
                          {simulationError ? (
                            <span className="status-err"><AlertCircle size={14} /> {simulationError}</span>
                          ) : (
                            <span className="status-ok"><Check size={14} /> Fórmula lista para usar</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <style>{`
                    .builder-step-section {
                      background: white;
                      border-radius: 24px;
                      padding: 2rem;
                      margin-bottom: 2rem;
                      border: 1px solid #f1f5f9;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    }
                    .builder-step-header {
                      display: flex;
                      gap: 1.25rem;
                      align-items: flex-start;
                      margin-bottom: 2rem;
                    }
                    .builder-step-badge {
                      background: #1e293b;
                      color: white;
                      padding: 4px 12px;
                      border-radius: 8px;
                      font-size: 0.75rem;
                      font-weight: 800;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                    }
                    .builder-step-header h4 { margin: 0 0 0.25rem; font-size: 1.1rem; color: #0f172a; }
                    .builder-step-header p { margin: 0; font-size: 0.9rem; color: #64748b; }

                    .variable-builder-grid {
                      display: grid;
                      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                      gap: 1rem;
                      margin-bottom: 1.5rem;
                    }
                    
                    .premium-variable-card {
                      background: #f8fafc;
                      border: 2px solid #e2e8f0;
                      border-radius: 20px;
                      padding: 1.25rem;
                      transition: all 0.2s;
                    }
                    .premium-variable-card:hover {
                      border-color: #3b82f6;
                      background: white;
                      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
                    }
                    .pvc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                    .pvc-tag { font-size: 0.65rem; font-weight: 800; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 6px; }
                    .pvc-delete { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 50%; transition: all 0.2s; }
                    .pvc-delete:hover { background: #fef2f2; color: #ef4444; }
                    
                    .pvc-input-label { width: 100%; border: none; background: transparent; font-weight: 700; font-size: 1rem; color: #1e293b; margin-bottom: 0.25rem; outline: none; border-bottom: 2px solid transparent; }
                    .pvc-input-label:focus { border-bottom-color: #3b82f6; }
                    .pvc-input-error { border-bottom-color: #ef4444 !important; }
                    
                    .pvc-key-row { display: flex; align-items: center; gap: 4px; color: #64748b; margin-bottom: 0.75rem; font-family: monospace; font-size: 0.8rem; }
                    .pvc-key { font-weight: 600; color: #334155; }
                    
                    .pvc-input-hint { width: 100%; border: 1px solid #e2e8f0; background: white; border-radius: 8px; padding: 0.5rem; font-size: 0.8rem; outline: none; }

                    .btn-add-variable {
                      width: 100%;
                      padding: 1.25rem;
                      background: #f8fafc;
                      border: 2px dashed #cbd5e1;
                      border-radius: 16px;
                      color: #475569;
                      font-weight: 600;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 0.75rem;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .btn-add-variable:hover {
                      background: #eff6ff;
                      border-color: #3b82f6;
                      color: #3b82f6;
                    }

                    .template-selector-grid {
                      display: grid;
                      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                      gap: 0.75rem;
                      margin-bottom: 1.5rem;
                    }
                    .template-card {
                      background: white;
                      border: 2px solid #f1f5f9;
                      border-radius: 14px;
                      padding: 1rem;
                      text-align: left;
                      cursor: pointer;
                      position: relative;
                      transition: all 0.2s;
                    }
                    .template-card.is-selected {
                      border-color: #3b82f6;
                      background: #f0f7ff;
                    }
                    .template-card-label { font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-bottom: 0.25rem; }
                    .template-card-desc { font-size: 0.75rem; color: #64748b; line-height: 1.3; }
                    .template-card-check { position: absolute; top: 0.75rem; right: 0.75rem; color: #3b82f6; }

                    .formula-composer-box {
                      background: #f8fafc;
                      border: 1px solid #e2e8f0;
                      border-radius: 20px;
                      padding: 1.5rem;
                    }
                    .formula-preview-header { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
                    .formula-preview-display {
                      font-family: monospace;
                      font-size: 1.25rem;
                      font-weight: 700;
                      color: #3b82f6;
                      margin-bottom: 1.5rem;
                      word-break: break-all;
                      min-height: 1.5em;
                    }
                    .formula-preview-display .placeholder { opacity: 0.3; }
                    
                    .token-bank { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
                    .token-group { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                    .token-group-label { font-size: 0.75rem; font-weight: 700; color: #64748b; min-width: 80px; }
                    .token-pill {
                      border: 1px solid #e2e8f0;
                      padding: 0.4rem 0.75rem;
                      border-radius: 8px;
                      font-size: 0.8rem;
                      font-weight: 700;
                      font-family: monospace;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .token-pill.var { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
                    .token-pill.op { background: white; color: #475569; }
                    .token-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

                    .formula-textarea {
                      width: 100%;
                      background: white;
                      border: 2px solid #e2e8f0;
                      border-radius: 14px;
                      padding: 1rem;
                      font-family: monospace;
                      font-size: 1rem;
                      outline: none;
                      transition: all 0.2s;
                    }
                    .formula-textarea:focus { border-color: #3b82f6; }
                    .formula-error-msg { margin-top: 1rem; color: #ef4444; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }

                    .premium-simulation-card {
                      background: #0f172a;
                      border-radius: 24px;
                      overflow: hidden;
                      display: grid;
                      grid-template-columns: 1fr 240px;
                    }
                    .sim-inputs-grid { padding: 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
                    .sim-field label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; }
                    .sim-field input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem 1rem; color: white; font-weight: 600; transition: all 0.2s; }
                    .sim-field input:focus { border-color: #3b82f6; background: rgba(255,255,255,0.1); }
                    
                    .sim-result-panel { background: rgba(255,255,255,0.03); border-left: 1px solid rgba(255,255,255,0.08); padding: 2rem; display: flex; flex-direction: column; justify-content: center; }
                    .sim-result-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; }
                    .sim-result-value { font-size: 2.5rem; font-weight: 800; color: #3b82f6; margin-bottom: 0.5rem; }
                    .sim-result-value.has-error { color: #ef4444; font-size: 1.5rem; }
                    .status-ok { color: #10b981; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
                    .status-err { color: #ef4444; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
                    
                    .tutorial-toggle {
                      width: 100%;
                      padding: 1rem 1.5rem;
                      background: white;
                      border: 1px solid #e2e8f0;
                      border-radius: 16px;
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .tutorial-toggle:hover { background: #f8fafc; border-color: #3b82f6; }
                    .tutorial-toggle-icon { background: #eff6ff; color: #3b82f6; padding: 8px; border-radius: 10px; }
                    .tutorial-content-wrapper { padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }
                    
                    @media (max-width: 768px) {
                      .premium-simulation-card { grid-template-columns: 1fr; }
                      .sim-result-panel { border-left: none; border-top: 1px solid rgba(255,255,255,0.08); }
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Semaforo */}
          {step === 2 && (
            <div className="create-step-content">
              <h3 className="step-heading">Umbrales del semáforo</h3>
              <p className="step-description">Define los rangos de porcentaje y el sentido de este indicador.</p>

              <div className="field-group" style={{ marginBottom: '1.5rem' }}>
                <label className="field-label">Sentido del KPI</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    className={`formula-option-card ${sentido === 'higher_is_better' ? 'selected' : ''}`}
                    onClick={() => setSentido('higher_is_better')}
                    style={{ padding: '0.75rem', textAlign: 'center' }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Ascendente</div>
                    <div className="field-hint">Mayor es mejor (ej: Ventas)</div>
                  </button>
                  <button
                    type="button"
                    className={`formula-option-card ${sentido === 'lower_is_better' ? 'selected' : ''}`}
                    onClick={() => setSentido('lower_is_better')}
                    style={{ padding: '0.75rem', textAlign: 'center' }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Descendente</div>
                    <div className="field-hint">Menor es mejor (ej: Accidentes)</div>
                  </button>
                </div>
              </div>

              <div className="semaforo-config-grid">
                <div className="semaforo-field verde">
                  <div className="semaforo-dot verde-dot"></div>
                  <div>
                    <label className="field-label">Verde (Óptimo) - {sentido === 'lower_is_better' ? 'máximo hasta' : 'mínimo desde'}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="field-input semaforo-input"
                        value={verdeMin}
                        min={0} max={1000}
                        onChange={e => setVerdeMin(e.target.value)}
                      />
                      <span className="field-hint">%</span>
                    </div>
                    <span className="field-hint">El KPI es verde si el resultado es {sentido === 'lower_is_better' ? '<=' : '>='} {verdeMinValue}%</span>
                  </div>
                </div>

                <div className="semaforo-field amarillo">
                  <div className="semaforo-dot amarillo-dot"></div>
                  <div>
                    <label className="field-label">Amarillo (Alerta) - {sentido === 'lower_is_better' ? 'máximo hasta' : 'mínimo desde'}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="field-input semaforo-input"
                        value={amarilloMin}
                        min={0} max={1000}
                        onChange={e => setAmarilloMin(e.target.value)}
                      />
                      <span className="field-hint">%</span>
                    </div>
                    <span className="field-hint">Amarillo: {sentido === 'lower_is_better' ? `> ${verdeMinValue}% y <= ${amarilloMinValue}%` : `>= ${amarilloMinValue}% y < ${verdeMinValue}%`}</span>
                  </div>
                </div>

                <div className="semaforo-field rojo">
                  <div className="semaforo-dot rojo-dot"></div>
                  <div>
                    <label className="field-label">Rojo (Riesgo) - automático</label>
                    <div className="semaforo-auto-value">{sentido === 'lower_is_better' ? '>' : '<'} {amarilloMinValue}%</div>
                    <span className="field-hint">Calculado automáticamente</span>
                  </div>
                </div>
              </div>

              {verdeMin.trim() !== '' && amarilloMin.trim() !== '' && (
                sentido === 'lower_is_better' 
                  ? verdeMinValue >= amarilloMinValue
                  : verdeMinValue <= amarilloMinValue
              ) && (
                <div className="semaforo-warning">
                  {sentido === 'lower_is_better' 
                    ? 'El umbral verde debe ser menor al umbral amarillo.'
                    : 'El umbral verde debe ser mayor al umbral amarillo.'}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirmacion */}
          {step === 3 && (
            <div className="create-step-content">
              <h3 className="step-heading">Confirmar nuevo KPI</h3>
              <div className="confirm-summary">
                <div className="confirm-row">
                  <span className="confirm-key">Nombre</span>
                  <span className="confirm-val">{nombre}</span>
                </div>
                <div className="confirm-row">
                    <span className="confirm-key">Area</span>
                    <span className="confirm-val">{areas.find(a => a.id === areaId)?.nombre ?? '-'}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">Evidencia requerida</span>
                  <span className="confirm-val">{metaDescripcion}</span>
                </div>
                <div className="confirm-row">
                    <span className="confirm-key">Tipo de formula</span>
                    <span className="confirm-val">{selectedFormula?.label ?? '-'}</span>
                </div>
                {formulaTipo === 'entregas_a_tiempo' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Limite de dias</span>
                    <span className="confirm-val">{limiteDias} dias</span>
                  </div>
                )}
                {formulaTipo === 'documental_doble' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Documentos</span>
                    <span className="confirm-val">{camposDocumentales.filter(Boolean).join(' + ')}</span>
                  </div>
                )}
                {formulaTipo === 'formula_personalizada' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Variables</span>
                    <span className="confirm-val">
                      {customVariables.map((variable) => `${variable.label || 'Sin nombre'} (${variable.key})`).join(' | ')}
                    </span>
                  </div>
                )}
                {formulaTipo === 'formula_personalizada' && (
                  <div className="confirm-row">
                    <span className="confirm-key">Formula</span>
                    <span className="confirm-val" style={{ fontFamily: 'monospace' }}>{customExpression}</span>
                  </div>
                )}
                <div className="confirm-row">
                  <span className="confirm-key">Semaforo</span>
                  <span className="confirm-val">
                    <span style={{ color: '#10b981' }}>
                      {sentido === 'lower_is_better' ? 'Verde <=' : 'Verde >= '} {verdeMinValue}%
                    </span>
                    {' | '}
                    <span style={{ color: '#f59e0b' }}>
                      Amarillo {sentido === 'lower_is_better' ? '<=' : '>='} {amarilloMinValue}%
                    </span>
                    {' | '}
                    <span style={{ color: '#ef4444' }}>
                      Rojo {sentido === 'lower_is_better' ? '>' : '<'} {amarilloMinValue}%
                    </span>
                  </span>
                </div>
                {objetivo && (
                  <div className="confirm-row">
                    <span className="confirm-key">Objetivo</span>
                    <span className="confirm-val">{objetivo}</span>
                  </div>
                )}
                {definicion && (
                  <div className="confirm-row">
                    <span className="confirm-key">Definición</span>
                    <span className="confirm-val">{definicion}</span>
                  </div>
                )}
                {medicion && (
                  <div className="confirm-row">
                    <span className="confirm-key">Medición</span>
                    <span className="confirm-val">{medicion}</span>
                  </div>
                )}
                {fuenteDatos && (
                  <div className="confirm-row">
                    <span className="confirm-key">Fuente</span>
                    <span className="confirm-val">{fuenteDatos}</span>
                  </div>
                )}
                {fechaEntregaInfo && (
                  <div className="confirm-row">
                    <span className="confirm-key">Entrega Info</span>
                    <span className="confirm-val">{fechaEntregaInfo}</span>
                  </div>
                )}
                {guia && (
                  <div className="confirm-row">
                    <span className="confirm-key">Guia de captura</span>
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
}


