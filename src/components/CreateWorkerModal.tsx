import React, { useState } from 'react';
import { PencilLine, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  nombre: string;
  email: string;
}

interface CreateWorkerModalProps {
  empresaId: string;
  profile?: Profile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWorkerModal({ empresaId, profile, onClose, onSuccess }: CreateWorkerModalProps) {
  const [nombre, setNombre] = useState(profile?.nombre ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(profile);
  const canSubmit = nombre.trim() !== '' && email.trim() !== '' && empresaId !== '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await fetch(isEditing ? `/api/profiles/${profile?.id}` : '/api/profiles/create', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaId,
          nombre: nombre.trim(),
          email: email.trim()
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo guardar el trabajador.');
      }

      toast.success(isEditing ? 'Trabajador actualizado correctamente.' : 'Trabajador creado correctamente.');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el trabajador.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2>{isEditing ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
        <p className="modal-subtitle">
          {isEditing
            ? 'Actualiza el nombre o correo del trabajador dentro de la empresa seleccionada.'
            : 'Da de alta un trabajador dentro de la empresa seleccionada usando solo nombre y correo.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Maria Hernandez"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="maria@empresa.com"
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
                  : <><UserPlus size={16} /> Crear trabajador</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
