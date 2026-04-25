import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, BarChart3, FileText, Hash, Clock, ToggleLeft, Sigma, Plus, Trash2, BookOpen, Lightbulb, Calculator, AlertCircle } from 'lucide-react';
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
                <div className="formula-extra-config">
                  <div className="custom-formula-tutorial">
                    <div className="custom-formula-tutorial__header">
                      <div className="custom-formula-tutorial__icon">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4>Tutorial: cómo configurar una fórmula personalizada</h4>
                        <p>
                          Esta opción sirve para crear un KPI que no encaja en las fórmulas predeterminadas.
                          Tu defines qué datos se capturan cada mes y la regla con la que se convierten en porcentaje.
                        </p>
                      </div>
                    </div>

                    <div className="custom-formula-tutorial__grid">
                      <div className="custom-formula-tutorial__card">
                        <div className="custom-formula-tutorial__card-title">
                          <Lightbulb size={16} />
                          1. Piensa que quieres medir
                        </div>
                        <p>
                          Antes de escribir la fórmula, define el objetivo del KPI. Pregúntate:
                          "¿Qué números necesito capturar para saber si voy bien o mal?"
                        </p>
                        <ul>
                          <li>Solicitudes recibidas vs solicitudes resueltas</li>
                          <li>Errores detectados vs errores corregidos</li>
                          <li>Piezas revisadas vs piezas aprobadas</li>
                        </ul>
                      </div>

                      <div className="custom-formula-tutorial__card">
                        <div className="custom-formula-tutorial__card-title">
                          <Hash size={16} />
                          2. Crea los datos a capturar
                        </div>
                        <p>
                          Cada "Dato" es un valor que el usuario llenará en la captura mensual. Usa nombres claros y fáciles de entender.
                        </p>
                        <ul>
                          <li>Dato 1: Solicitudes resueltas</li>
                          <li>Dato 2: Solicitudes recibidas</li>
                          <li>Dato 3: Casos reabiertos</li>
                        </ul>
                      </div>

                      <div className="custom-formula-tutorial__card">
                        <div className="custom-formula-tutorial__card-title">
                          <Calculator size={16} />
                          3. Elige una forma de calcular
                        </div>
                        <p>
                          Puedes arrancar con una plantilla. Eso cubre la mayoría de los casos y evita errores al escribir la fórmula manualmente.
                        </p>
                        <ul>
                          <li>Porcentaje: (cumplidas / recibidas) x 100</li>
                          <li>Diferencia: meta - resultado</li>
                          <li>Promedio: (valor 1 + valor 2 + valor 3) / 3</li>
                        </ul>
                      </div>

                      <div className="custom-formula-tutorial__card">
                        <div className="custom-formula-tutorial__card-title">
                          <AlertCircle size={16} />
                          4. Revisa antes de guardar
                        </div>
                        <p>
                          La fórmula solo puede usar los datos definidos arriba. Si escribes una variable que no existe o divides entre cero, el sistema lo marcará.
                        </p>
                        <ul>
                          <li>Usa nombres claros en cada dato</li>
                          <li>Confirma que la fórmula refleje el KPI real</li>
                          <li>Verifica que el resultado esperado sea un porcentaje</li>
                        </ul>
                      </div>
                    </div>

                    <div className="custom-formula-example">
                      <div className="custom-formula-example__title">Ejemplo completo</div>
                      <div className="custom-formula-example__content">
                        <div>
                          <strong>KPI:</strong> Cumplimiento de atención de tickets
                        </div>
                        <div>
                          <strong>Datos a capturar:</strong> Tickets resueltos, tickets recibidos
                        </div>
                        <div>
                          <strong>Formula:</strong> <span>(tickets_resueltos / tickets_recibidos) * 100</span>
                        </div>
                        <div>
                          <strong>Interpretación:</strong> si se resolvieron 45 de 50 tickets, el resultado del mes es 90%.
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="field-label">Constructor de fórmula personalizada</label>
                  <p className="step-description" style={{ marginBottom: '1rem' }}>
                    Primero define los datos que el usuario va a capturar y luego elige una forma de calcular el resultado.
                  </p>

                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#f8fbff', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '14px', padding: '0.9rem 1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>Paso 1. Define los datos a capturar</strong>
                      <span className="field-hint">Ejemplo: solicitudes recibidas, solicitudes resueltas, inspecciones correctas.</span>
                    </div>
                    <div style={{ background: '#f8fbff', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '14px', padding: '0.9rem 1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>Paso 2. Elige cómo se calcula</strong>
                      <span className="field-hint">Puedes empezar con una plantilla y, si lo necesitas, cambiarla a fórmula libre.</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
                            className="pvc-input-label"
                            type="text"
                            placeholder={index === 0 ? 'Nombre del dato (ej. Tickets)' : 'Nombre del dato'}
                            value={variable.label}
                            onChange={(e) => updateCustomVariable(variable.id, 'label', e.target.value)}
                          />

                          <div className="pvc-key-row">
                            <Hash size={12} />
                            <span className="pvc-key">{variable.key}</span>
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

                  <style>{`
                    .premium-variable-card {
                      background: white;
                      border: 2px solid #f1f5f9;
                      border-radius: 16px;
                      padding: 1.25rem;
                      transition: all 0.2s;
                    }
                    .premium-variable-card:hover {
                      border-color: var(--accent-color);
                      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
                    }
                    .pvc-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 1rem;
                    }
                    .pvc-tag {
                      font-size: 0.65rem;
                      font-weight: 800;
                      color: var(--accent-color);
                      background: rgba(59, 130, 246, 0.1);
                      padding: 2px 8px;
                      border-radius: 6px;
                      letter-spacing: 0.05em;
                    }
                    .pvc-delete {
                      background: none;
                      border: none;
                      color: #94a3b8;
                      cursor: pointer;
                      padding: 4px;
                      border-radius: 50%;
                      transition: all 0.2s;
                    }
                    .pvc-delete:hover { background: #fef2f2; color: #ef4444; }
                    .pvc-input-label {
                      width: 100%;
                      border: none;
                      background: none;
                      font-weight: 700;
                      font-size: 1rem;
                      color: #1e293b;
                      margin-bottom: 0.5rem;
                      outline: none;
                      font-family: inherit;
                    }
                    .pvc-key-row {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      color: #64748b;
                      margin-bottom: 0.75rem;
                      font-family: monospace;
                      font-size: 0.8rem;
                    }
                    .pvc-input-hint {
                      width: 100%;
                      border: 1px solid #f1f5f9;
                      background: #f8fafc;
                      border-radius: 8px;
                      padding: 0.4rem 0.6rem;
                      font-size: 0.8rem;
                      color: #64748b;
                      outline: none;
                    }
                    .pvc-input-hint:focus { border-color: #cbd5e1; background: white; }
                  `}</style>

                  <button type="button" className="btn-secondary" onClick={addCustomVariable} style={{ marginBottom: '1rem' }}>
                    <Plus size={16} /> Agregar variable
                  </button>

                  <label className="field-label">Plantilla de cálculo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {CUSTOM_TEMPLATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`formula-option-card ${customTemplate === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setCustomTemplate(option.value);
                          syncCustomExpression(option.value, customVariables, formulaTipo);
                        }}
                        style={{ textAlign: 'left', padding: '0.75rem' }}
                      >
                        <div className="foc-body">
                          <div className="foc-label" style={{ fontSize: '0.85rem' }}>{option.label}</div>
                          <div className="foc-example" style={{ fontSize: '0.7rem' }}>{option.description}</div>
                        </div>
                        {customTemplate === option.value && (
                          <div className="foc-check"><Check size={14} /></div>
                        )}
                      </button>
                    ))}
                  </div>

                  <label className="field-label" style={{ marginTop: '2rem' }}>Expresión matemática</label>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(59, 130, 246, 0.12)', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Vista previa del cálculo</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                      {customExpression || <span style={{ opacity: 0.3 }}>Define una fórmula para continuar...</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {customVariables.map((variable) => (
                      <button
                        key={variable.id}
                        type="button"
                        className="btn-token-var"
                        onClick={() => appendExpressionToken(variable.key)}
                      >
                        {variable.key}
                      </button>
                    ))}
                    {['+', '-', '*', '/', '(', ')', '100'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        className="btn-token-op"
                        onClick={() => appendExpressionToken(token)}
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    placeholder="Ej: (tickets_resueltos / tickets_recibidos) * 100"
                    value={customExpression}
                    onChange={(e) => {
                      if (customTemplate !== 'manual') {
                        setCustomTemplate('manual');
                      }
                      setCustomExpression(e.target.value);
                    }}
                    style={{ fontFamily: 'monospace', fontSize: '1rem', border: '2px solid #e2e8f0', borderRadius: '14px' }}
                  />

                  <div className="field-hint" style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                    Usa las plantillas o escribe libremente. Operaciones: +, -, *, /, ( ).
                  </div>

                  {!customFormulaValidation.valid && (
                    <div className="semaforo-warning" style={{ margin: '1rem 0' }}>
                      <AlertCircle size={16} /> {customFormulaValidation.error}
                    </div>
                  )}

                  <style>{`
                    .btn-token-var {
                      background: #eff6ff;
                      border: 1px solid #bfdbfe;
                      color: #2563eb;
                      padding: 0.4rem 0.8rem;
                      border-radius: 8px;
                      font-family: monospace;
                      font-weight: 700;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .btn-token-var:hover { background: #dbeafe; transform: translateY(-1px); }
                    
                    .btn-token-op {
                      background: #f8fafc;
                      border: 1px solid #e2e8f0;
                      color: #64748b;
                      padding: 0.4rem 0.8rem;
                      border-radius: 8px;
                      font-family: monospace;
                      font-weight: 700;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .btn-token-op:hover { background: #f1f5f9; color: #1e293b; }
                  `}</style>

                  <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                    <Calculator size={18} /> Probador de fórmula (Simulación)
                  </label>
                  <div className="simulation-box">
                    <div className="simulation-grid">
                      <div className="simulation-inputs">
                        {customVariables.map((v, i) => (
                          <div key={v.id} className="simulation-field">
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
                      <div className="simulation-display">
                        <div className="simulation-label">Resultado simulado</div>
                        <div className={`simulation-value ${simulationError ? 'error' : ''}`}>
                          {simulationError ? '---' : (simulationResult !== null ? simulationResult.toLocaleString() : '0')}
                        </div>
                        <div className="simulation-hint">
                          {simulationError || 'Cambia los valores de arriba para validar tu fórmula en tiempo real.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <style>{`
                    .simulation-box {
                      background: #0f172a;
                      color: white;
                      border-radius: 20px;
                      padding: 1.5rem;
                      margin-top: 1rem;
                      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
                    }
                    .simulation-grid {
                      display: grid;
                      grid-template-columns: 1fr 200px;
                      gap: 2rem;
                    }
                    .simulation-inputs {
                      display: grid;
                      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                      gap: 1rem;
                    }
                    .simulation-field label {
                      display: block;
                      font-size: 0.7rem;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                      color: #94a3b8;
                      margin-bottom: 0.5rem;
                      font-weight: 700;
                    }
                    .simulation-field input {
                      width: 100%;
                      background: rgba(255, 255, 255, 0.05);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 10px;
                      padding: 0.6rem 0.8rem;
                      color: white;
                      font-family: 'Outfit', sans-serif;
                      font-weight: 600;
                      transition: all 0.2s;
                    }
                    .simulation-field input:focus {
                      outline: none;
                      background: rgba(255, 255, 255, 0.1);
                      border-color: #3b82f6;
                    }
                    .simulation-display {
                      border-left: 1px solid rgba(255, 255, 255, 0.1);
                      padding-left: 1.5rem;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                    }
                    .simulation-label {
                      font-size: 0.75rem;
                      color: #94a3b8;
                      font-weight: 700;
                      text-transform: uppercase;
                      margin-bottom: 0.5rem;
                    }
                    .simulation-value {
                      font-size: 2.5rem;
                      font-weight: 800;
                      color: #3b82f6;
                      line-height: 1;
                      margin-bottom: 0.5rem;
                    }
                    .simulation-value.error {
                      color: #ef4444;
                    }
                    .simulation-hint {
                      font-size: 0.8rem;
                      color: #64748b;
                      line-height: 1.4;
                    }
                    @media (max-width: 640px) {
                      .simulation-grid { grid-template-columns: 1fr; }
                      .simulation-display { border-left: none; padding-left: 0; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }
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


