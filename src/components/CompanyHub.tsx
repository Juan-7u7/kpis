import { Plus, Edit2, Trash2, Building2, ArrowRight } from 'lucide-react';

interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
}

interface CompanyHubProps {
  empresas: Empresa[];
  onSelect: (id: string) => void;
  onEdit: (empresa: Empresa) => void;
  onDeactivate: (empresa: Empresa) => void;
  onAdd: () => void;
}

export default function CompanyHub({ empresas, onSelect, onEdit, onDeactivate, onAdd }: CompanyHubProps) {
  return (
    <div className="company-hub">
      <div className="hub-header">
        <div>
          <h1>Panel de Control Multiempresa</h1>
          <p>Selecciona una organización para gestionar sus indicadores o configurar su estructura.</p>
        </div>
        <button className="btn-primary" onClick={onAdd}>
          <Plus size={20} /> Nueva Empresa
        </button>
      </div>

      <div className="company-grid">
        {empresas.map((empresa) => (
          <div key={empresa.id} className="company-card">
            <div className="company-card__icon">
              <Building2 size={32} />
            </div>
            <div className="company-card__content">
              <h3>{empresa.nombre}</h3>
              <span className="company-slug">@{empresa.slug}</span>
              <p>{empresa.descripcion || 'Sin descripción disponible.'}</p>
            </div>
            <div className="company-card__actions">
              <button 
                className="action-btn edit" 
                title="Editar Información"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(empresa);
                }}
              >
                <Edit2 size={16} />
              </button>
              <button 
                className="action-btn delete" 
                title="Desactivar Empresa"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(empresa);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="company-card__footer">
              <button className="enter-btn" onClick={() => onSelect(empresa.id)}>
                Ver Indicadores <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}

        <div className="company-card add-card" onClick={onAdd}>
          <div className="add-card__content">
            <div className="plus-icon">
              <Plus size={40} />
            </div>
            <span>Agregar Nueva Empresa</span>
          </div>
        </div>
      </div>

      <style>{`
        .company-hub {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          gap: 2rem;
        }

        .hub-header h1 {
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .hub-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .company-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .company-card {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .company-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: var(--accent-color);
        }

        .company-card__icon {
          width: 64px;
          height: 64px;
          background: #f1f5f9;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-color);
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .company-card:hover .company-card__icon {
          background: var(--accent-color);
          color: white;
          transform: scale(1.05);
        }

        .company-card__content h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .company-slug {
          display: inline-block;
          font-family: monospace;
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          background: #f8fafc;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .company-card__content p {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .company-card__actions {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .company-card:hover .company-card__actions {
          opacity: 1;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.edit { background: #eff6ff; color: #3b82f6; }
        .action-btn.edit:hover { background: #3b82f6; color: white; }

        .action-btn.delete { background: #fef2f2; color: #ef4444; }
        .action-btn.delete:hover { background: #ef4444; color: white; }

        .company-card__footer {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px dashed #e2e8f0;
        }

        .enter-btn {
          width: 100%;
          padding: 0.75rem;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
          background: white;
          color: #1e293b;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .enter-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          gap: 0.75rem;
        }

        .add-card {
          border: 2px dashed #cbd5e1;
          background: #f8fafc;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          box-shadow: none;
        }

        .add-card:hover {
          background: white;
          border-color: var(--accent-color);
          border-style: solid;
        }

        .add-card__content {
          text-align: center;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .add-card:hover .add-card__content {
          color: var(--accent-color);
        }

        .plus-icon {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .add-card:hover .plus-icon {
          transform: rotate(90deg);
          border-color: var(--accent-color);
        }

        .add-card span {
          font-weight: 700;
          font-size: 1.1rem;
        }

        @media (max-width: 640px) {
          .hub-header {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .hub-header .btn-primary { width: 100%; }
        }
      `}</style>
    </div>
  );
}
