import { useState } from 'react';
import { Building2, X, Sparkles, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
}

interface CreateEmpresaModalProps {
  empresa?: Empresa | null;
  onClose: () => void;
  onSuccess: (empresa: Empresa) => void;
}

export default function CreateEmpresaModal({ empresa, onClose, onSuccess }: CreateEmpresaModalProps) {
  const [nombre, setNombre] = useState(empresa?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(empresa?.descripcion ?? '');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(empresa);
  const canSubmit = nombre.trim() !== '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await fetch(isEditing ? `/api/empresas/${empresa?.id}` : '/api/empresas/create', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim()
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo guardar la empresa.');
      }

      toast.success(isEditing ? '¡Empresa actualizada con éxito!' : '¡Empresa creada con éxito!');
      onSuccess(data.data as Empresa);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content premium-modal" style={{ maxWidth: '520px', padding: 0, overflow: 'hidden' }}>
        <div className="modal-header-gradient">
           <div className="header-icon-wrapper">
              <Building2 size={32} />
           </div>
           <button className="modal-close-btn" onClick={onClose}>
             <X size={20} />
           </button>
           <div className="header-text">
             <h2>{isEditing ? 'Editar Organización' : 'Nueva Organización'}</h2>
             <p>{isEditing ? 'Modifica los datos de la empresa seleccionada.' : 'Comienza configurando una nueva identidad corporativa.'}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div className="form-group">
            <label className="premium-label">Nombre de la Empresa</label>
            <div className="input-with-icon">
              <Sparkles size={18} className="input-icon" />
              <input
                type="text"
                className="premium-input"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Todito"
                autoFocus
              />
            </div>
            <p className="input-hint">Este nombre se usará en reportes y encabezados.</p>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="premium-label">Descripción o Misión (Opcional)</label>
            <textarea
              className="premium-input premium-textarea"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Ej. División de logística y transporte regional..."
              rows={4}
            />
          </div>

          <div className="modal-footer-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-premium" disabled={!canSubmit || submitting}>
              {submitting ? (
                <span className="spinner-small"></span>
              ) : (
                <><LayoutGrid size={18} /> {isEditing ? 'Actualizar Empresa' : 'Registrar Empresa'}</>
              )}
            </button>
          </div>
        </form>

        <style>{`
          .premium-modal {
            background: white;
            border-radius: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(0,0,0,0.05);
            animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          @keyframes modalPop {
            from { transform: scale(0.9) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }

          .modal-header-gradient {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 2.5rem 2rem;
            position: relative;
            color: white;
          }

          .header-icon-wrapper {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255,255,255,0.2);
          }

          .modal-close-btn {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .modal-close-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

          .header-text h2 { margin: 0; font-size: 1.6rem; font-weight: 800; }
          .header-text p { margin: 0.5rem 0 0; opacity: 0.7; font-size: 0.95rem; line-height: 1.4; }

          .premium-label {
            display: block;
            font-weight: 700;
            font-size: 0.9rem;
            color: #475569;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }

          .input-with-icon { position: relative; }
          .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

          .premium-input {
            width: 100%;
            padding: 0.85rem 1rem 0.85rem 3rem;
            border-radius: 14px;
            border: 2px solid #f1f5f9;
            background: #f8fafc;
            font-size: 1rem;
            transition: all 0.2s;
            color: #1e293b;
          }

          .premium-input:focus {
            outline: none;
            border-color: var(--accent-color);
            background: white;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          }

          .premium-textarea { padding-left: 1rem; resize: vertical; min-height: 100px; }

          .input-hint { font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; }

          .modal-footer-actions { display: flex; gap: 1rem; }

          .btn-cancel {
            flex: 1;
            padding: 0.85rem;
            border-radius: 14px;
            border: 2px solid #f1f5f9;
            background: white;
            font-weight: 700;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-cancel:hover { background: #f8fafc; color: #475569; }

          .btn-save-premium {
            flex: 2;
            padding: 0.85rem;
            border-radius: 14px;
            border: none;
            background: var(--accent-color);
            color: white;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
          }

          .btn-save-premium:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4);
            filter: brightness(1.1);
          }

          .btn-save-premium:disabled { opacity: 0.5; cursor: not-allowed; }

          .spinner-small {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
