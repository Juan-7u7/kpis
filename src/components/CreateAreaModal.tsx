import React, { useState } from 'react';
import { FolderPlus, PencilLine, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Area {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

interface CreateAreaModalProps {
  empresaId: string;
  area?: Area | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAreaModal({ empresaId, area, onClose, onSuccess }: CreateAreaModalProps) {
  const [nombre, setNombre] = useState(area?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(area?.descripcion ?? '');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(area);
  const canSubmit = empresaId !== '' && nombre.trim() !== '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await fetch(isEditing ? `/api/areas/${area?.id}` : '/api/areas/create', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim()
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo guardar el área.');
      }

      toast.success(isEditing ? 'Área actualizada correctamente.' : 'Área creada correctamente.');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el área.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2>{isEditing ? 'Editar área' : 'Nueva área'}</h2>
        <p className="modal-subtitle">
          {isEditing
            ? 'Actualiza la información base del área seleccionada.'
            : 'Crea un área para la empresa seleccionada. Después podrás asignarle trabajadores y KPIs.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Comercial"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Breve descripción opcional"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
              {submitting
                ? 'Guardando...'
                : isEditing
                  ? <><PencilLine size={16} /> Guardar cambios</>
                  : <><FolderPlus size={16} /> Crear área</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
