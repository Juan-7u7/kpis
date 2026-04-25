import { useEffect, useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkerAssignmentsModalProps {
  empresaId: string;
  profile: {
    id: string;
    nombre: string;
    email: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface AreaOption {
  id: string;
  nombre: string;
}

interface KpiOption {
  kpi_id: string;
  kpi_nombre: string;
  area: string;
}

export default function WorkerAssignmentsModal({
  empresaId,
  profile,
  onClose,
  onSuccess
}: WorkerAssignmentsModalProps) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [kpis, setKpis] = useState<KpiOption[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [areasRes, profilesAreasRes, profilesKpisRes, kpisRes] = await Promise.all([
          fetch(`/api/empresas/${empresaId}/areas`),
          fetch(`/api/profiles/${profile.id}/areas`),
          fetch(`/api/profiles/${profile.id}/kpis`),
          fetch(`/api/kpis?empresa_id=${empresaId}&anio=${new Date().getFullYear()}&mes=${new Date().getMonth() + 1}`)
        ]);

        const [areasBody, profileAreasBody, profileKpisBody, kpisBody] = await Promise.all([
          areasRes.json(),
          profilesAreasRes.json(),
          profilesKpisRes.json(),
          kpisRes.json()
        ]);

        if (!areasBody.success || !profileAreasBody.success || !profileKpisBody.success || !kpisBody.success) {
          throw new Error('No se pudo cargar la información de asignaciones.');
        }

        setAreas(areasBody.data as AreaOption[]);
        setSelectedAreas(profileAreasBody.data as string[]);
        setSelectedKpis(profileKpisBody.data as string[]);
        setKpis(kpisBody.data as KpiOption[]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [empresaId, profile.id]);

  const toggleSelection = (currentValues: string[], value: string, setter: (values: string[]) => void) => {
    setter(
      currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [areasRes, kpisRes] = await Promise.all([
        fetch(`/api/profiles/${profile.id}/areas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area_ids: selectedAreas })
        }),
        fetch(`/api/profiles/${profile.id}/kpis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kpi_ids: selectedKpis })
        })
      ]);

      const [areasBody, kpisBody] = await Promise.all([areasRes.json(), kpisRes.json()]);
      if (!areasBody.success || !kpisBody.success) {
        throw new Error(areasBody.error || kpisBody.error || 'No se pudieron guardar las asignaciones.');
      }

      toast.success('Asignaciones actualizadas.');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar las asignaciones.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2>Asignar trabajador</h2>
        <p className="modal-subtitle">
          Define en qué áreas y KPIs participa <strong>{profile.nombre}</strong>.
        </p>

        {loading ? (
          <div className="empty-state" style={{ height: '220px' }}>
            <div className="spinner"></div>
            <p>Cargando asignaciones...</p>
          </div>
        ) : (
          <>
            <div className="assignment-grid">
              <section className="assignment-panel">
                <h3>Áreas</h3>
                <div className="assignment-list">
                  {areas.map((area) => (
                    <label key={area.id} className="assignment-item">
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area.id)}
                        onChange={() => toggleSelection(selectedAreas, area.id, setSelectedAreas)}
                      />
                      <span>{area.nombre}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="assignment-panel">
                <h3>KPIs</h3>
                <div className="assignment-list">
                  {kpis.map((kpi) => (
                    <label key={kpi.kpi_id} className="assignment-item">
                      <input
                        type="checkbox"
                        checked={selectedKpis.includes(kpi.kpi_id)}
                        onChange={() => toggleSelection(selectedKpis, kpi.kpi_id, setSelectedKpis)}
                      />
                      <span>
                        {kpi.kpi_nombre}
                        <small>{kpi.area}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : <><CheckSquare size={16} /> Guardar asignaciones</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
