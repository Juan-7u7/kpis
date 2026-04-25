import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, BarChart3, FileText, Hash, Clock, ToggleLeft, Sigma, Plus, Trash2, BookOpen, Lightbulb, Calculator, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeFormulaKey, validateCustomFormula, type CustomFormulaVariable } from '../lib/customFormula';

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

                  <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1rem' }}>
                    {customVariables.map((variable, index) => (
                      <div key={variable.id} style={{ border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '14px', padding: '1rem', background: '#f8fbff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>Dato {index + 1}</strong>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.75rem' }}
                            onClick={() => removeCustomVariable(variable.id)}
                            disabled={customVariables.length <= 1}
                          >
                            <Trash2 size={14} /> Quitar
                          </button>
                        </div>

                        <input
                          className="field-input"
                          type="text"
                          placeholder={index === 0 ? 'Ej: Solicitudes resueltas' : 'Ej: Solicitudes recibidas'}
                          value={variable.label}
                          onChange={(e) => updateCustomVariable(variable.id, 'label', e.target.value)}
                          style={{ marginBottom: '0.75rem' }}
                        />

                        <div style={{ marginBottom: '0.75rem', display: 'grid', gap: '0.35rem' }}>
                          <span className="field-hint">Clave interna generada automáticamente</span>
                          <div style={{ padding: '0.75rem 0.9rem', borderRadius: '12px', background: 'white', border: '1px dashed rgba(37, 99, 235, 0.25)', fontFamily: 'monospace', color: 'var(--text-soft)' }}>
                            {variable.key}
                          </div>
                        </div>

                        <input
                          className="field-input"
                          type="text"
                          placeholder="Ayuda opcional para quien captura"
                          value={variable.helpText || ''}
                          onChange={(e) => updateCustomVariable(variable.id, 'helpText', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <button type="button" className="btn-secondary" onClick={addCustomVariable} style={{ marginBottom: '1rem' }}>
                    <Plus size={16} /> Agregar variable
                  </button>

                  <label className="field-label">Plantilla de cálculo</label>
                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                    {CUSTOM_TEMPLATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`formula-option-card ${customTemplate === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setCustomTemplate(option.value);
                          syncCustomExpression(option.value, customVariables, formulaTipo);
                        }}
                        style={{ textAlign: 'left' }}
                      >
                        <div className="foc-body">
                          <div className="foc-label">{option.label}</div>
                          <div className="foc-example">{option.description}</div>
                        </div>
                        {customTemplate === option.value && (
                          <div className="foc-check"><Check size={16} /></div>
                        )}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Expresión matemática</label>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(59, 130, 246, 0.12)', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '0.75rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>Vista previa del cálculo</strong>
                    <span className="field-hint">
                      El resultado se calculará con esta expresión: <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{customExpression || 'Define una fórmula para continuar'}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {customVariables.map((variable) => (
                      <button
                        key={variable.id}
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.7rem', fontFamily: 'monospace' }}
                        onClick={() => appendExpressionToken(variable.key)}
                      >
                        {variable.key}
                      </button>
                    ))}
                    {['+', '-', '*', '/', '(', ')', '100'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.7rem', fontFamily: 'monospace' }}
                        onClick={() => appendExpressionToken(token)}
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    placeholder="Ej: (solicitudes_resueltas / solicitudes_recibidas) * 100"
                    value={customExpression}
                    onChange={(e) => {
                      if (customTemplate !== 'manual') {
                        setCustomTemplate('manual');
                      }
                      setCustomExpression(e.target.value);
                    }}
                    style={{ fontFamily: 'monospace' }}
                  />

                  <div className="field-hint" style={{ marginTop: '0.5rem' }}>
                    Puedes usar las plantillas para empezar rápido o cambiar a fórmula libre. Operaciones permitidas: suma (+), resta (-), multiplicación (*), división (/), paréntesis y números.
                  </div>

                  {!customFormulaValidation.valid && (
                    <div className="semaforo-warning" style={{ marginTop: '0.75rem' }}>
                      {customFormulaValidation.error}
                    </div>
                  )}
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


