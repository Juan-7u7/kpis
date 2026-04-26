import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Edit3, HelpCircle, Inbox, PlusCircle, Trash2, LogOut, LayoutGrid, Users, Briefcase, Shield, Lock, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import CaptureModal from './components/CaptureModal';
import KpiDetailModal from './components/KpiDetailModal';
import CreateKpiModal from './components/CreateKpiModal';
import ConfirmModal from './components/ConfirmModal';
import CreateEmpresaModal from './components/CreateEmpresaModal';
import CreateAreaModal from './components/CreateAreaModal';
import CreateWorkerModal from './components/CreateWorkerModal';
import WorkerAssignmentsModal from './components/WorkerAssignmentsModal';
import CompanyHub from './components/CompanyHub';
import KpiCard from './components/KpiCard';
import DashboardFilters from './components/DashboardFilters';
import { VisualConfigModal } from './components/VisualConfigModal';
import type { Empresa, KPI, Profile, Area, KpiGroup } from './types/dashboard';

const getCurrentPeriod = () => {
  const now = new Date();

  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1)
  };
};

function App() {
  const currentPeriod = getCurrentPeriod();
  const isAdminView = window.location.pathname.replace(/\/+$/, '').toLowerCase().endsWith('/admin');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('kpi_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [isAutoPeriod, setIsAutoPeriod] = useState(true);
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [captureKpi, setCaptureKpi] = useState<KPI | null>(null);
  const [kpiForHistory, setKpiForHistory] = useState<KPI | null>(null);
  const [showCreateKpi, setShowCreateKpi] = useState(false);
  const [showCreateEmpresa, setShowCreateEmpresa] = useState(false);
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [empresaToEdit, setEmpresaToEdit] = useState<Empresa | null>(null);
  const [areaToEdit, setAreaToEdit] = useState<Area | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [kpiToDelete, setKpiToDelete] = useState<KPI | null>(null);
  const [empresaToDeactivate, setEmpresaToDeactivate] = useState<Empresa | null>(null);
  const [areaToDeactivate, setAreaToDeactivate] = useState<Area | null>(null);
  const [profileToDeactivate, setProfileToDeactivate] = useState<Profile | null>(null);
  const [profileForAssignments, setProfileForAssignments] = useState<Profile | null>(null);
  const [visualConfigKpi, setVisualConfigKpi] = useState<KPI | null>(null);

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await fetch('/api/empresas');
      if (!res.ok) throw new Error('No se pudieron cargar las empresas.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron cargar las empresas.');

      const empresasData = data.data as Empresa[];
      setEmpresas(empresasData);
      setSelectedEmpresaId((current) =>
        empresasData.some((empresa) => empresa.id === current) ? current : (empresasData[0]?.id || '')
      );
      return empresasData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return [];
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    if (!selectedEmpresaId) {
      return;
    }

    try {
      const res = await fetch(`/api/empresas/${selectedEmpresaId}/profiles`);
      if (!res.ok) throw new Error('No se pudieron cargar los trabajadores.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron cargar los trabajadores.');
      setProfiles(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
    }
  }, [selectedEmpresaId]);

  const fetchAreas = useCallback(async () => {
    if (!selectedEmpresaId) {
      setAreas([]);
      return;
    }

    try {
      const res = await fetch(`/api/empresas/${selectedEmpresaId}/areas`);
      if (!res.ok) throw new Error('No se pudieron cargar las áreas.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron cargar las áreas.');
      setAreas(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
    }
  }, [selectedEmpresaId]);

  const fetchKPIs = useCallback(async () => {
    if (!selectedEmpresaId) {
      setKpis([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/kpis?empresa_id=${selectedEmpresaId}&anio=${selectedYear}&mes=${selectedMonth}`);
      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      if (data.success) {
        setKpis(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresaId, selectedYear, selectedMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAreas();
  }, [fetchAreas]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // En una fase posterior esto vendría de una API o Env variable
    if (adminPassword === 'admin123') {
      localStorage.setItem('kpi_admin_auth', 'true');
      setIsAdminAuthenticated(true);
      toast.success('Sesión iniciada como administrador');
    } else {
      toast.error('Contraseña incorrecta');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('kpi_admin_auth');
    setIsAdminAuthenticated(false);
    toast.success('Sesión cerrada');
  };

  useEffect(() => {
    if (!isAutoPeriod) return;

    let intervalId: number | undefined;

    const syncPeriodWithCalendar = () => {
      const nextPeriod = getCurrentPeriod();
      setSelectedYear(nextPeriod.year);
      setSelectedMonth(nextPeriod.month);
    };

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeoutId = window.setTimeout(() => {
      syncPeriodWithCalendar();
      intervalId = window.setInterval(syncPeriodWithCalendar, 24 * 60 * 60 * 1000);
    }, nextMidnight.getTime() - now.getTime());

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isAutoPeriod]);

  const handleDeleteKpiRequest = (kpi: KPI) => {
    if (!kpi.es_borrable) {
      toast.error('No puedes eliminar los KPIs por defecto del sistema.');
      return;
    }
    setKpiToDelete(kpi);
  };

  const confirmDeleteKpi = async () => {
    if (!kpiToDelete) return;

    try {
      const res = await fetch(`/api/kpis/${kpiToDelete.kpi_id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`KPI eliminado: ${kpiToDelete.kpi_nombre}`);
        fetchKPIs();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexiÃ³n al eliminar KPI');
    } finally {
      setKpiToDelete(null);
    }
  };

  const deactivateEmpresa = async () => {
    if (!empresaToDeactivate) return;

    try {
      const res = await fetch(`/api/empresas/${empresaToDeactivate.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'No se pudo desactivar la empresa.');
      }

      toast.success('Empresa desactivada correctamente.');
      setEmpresaToDeactivate(null);
      await fetchEmpresas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar la empresa.');
    }
  };

  const deactivateArea = async () => {
    if (!areaToDeactivate) return;

    try {
      const res = await fetch(`/api/areas/${areaToDeactivate.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'No se pudo desactivar el área.');
      }

      toast.success('Área desactivada correctamente.');
      setAreaToDeactivate(null);
      await fetchAreas();
      await fetchKPIs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar el área.');
    }
  };

  const deactivateProfile = async () => {
    if (!profileToDeactivate) return;

    try {
      const res = await fetch(`/api/profiles/${profileToDeactivate.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'No se pudo desactivar el trabajador.');
      }

      toast.success('Trabajador desactivado correctamente.');
      setProfileToDeactivate(null);
      await fetchProfiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar el trabajador.');
    }
  };

  const getSemaforoRgb = (semaforo: string) => {
    switch (semaforo?.toLowerCase()) {
      case 'verde': return '16, 185, 129';
      case 'amarillo': return '245, 158, 11';
      case 'rojo': return '239, 68, 68';
      default: return '139, 155, 180';
    }
  };

  // Filter Data
  const filteredKpis = kpis.filter(kpi => {
    const matchArea = selectedArea === 'Todas' || kpi.area === selectedArea;
    const matchSearch = kpi.kpi_nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchArea && matchSearch;
  });

  const groupedKpis = areas.reduce((acc: KpiGroup, area: Area) => {
    acc[area.nombre] = filteredKpis.filter(kpi => kpi.area === area.nombre);
    return acc;
  }, {});

  // Add a "General" group if there are KPIs without a matching area or if no areas are defined
  const kpisWithoutArea = filteredKpis.filter(kpi => !areas.some(a => a.nombre === kpi.area));
  if (kpisWithoutArea.length > 0 || areas.length === 0) {
    groupedKpis['General'] = [...(groupedKpis['General'] || []), ...kpisWithoutArea];
  }

  const areasList = areas.map(a => a.nombre);
  const selectedEmpresa = empresas.find((empresa) => empresa.id === selectedEmpresaId) ?? null;
  const availableYears = Array.from({ length: 3 }, (_, index) => String(new Date().getFullYear() + index));
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Terminar',
      popoverClass: 'driverjs-theme',
      steps: [
        { 
          popover: { 
            title: '<div style="font-size: 1.25rem; color: #3b82f6;">🏢 Bienvenido al Sistema de KPIs</div>', 
            description: '<div style="text-align:center; padding: 0.5rem 0;"><img src="https://cdn-icons-png.flaticon.com/512/3204/3204094.png" style="width: 70px; margin-bottom: 10px;" /><p style="font-size: 0.95rem; line-height: 1.6; text-align: left;"><b>¿Para qué sirve este panel?</b><br/>Es tu centro de operaciones oficial. Aquí la empresa mide, almacena y evalúa el desempeño de cada métrica clave mensual. <br/><br/><i>Te guiaremos rápidamente sobre cómo utilizarlo.</i></p></div>'
          }
        },
        { 
          element: '#tour-filters', 
          popover: { 
            title: '🔍 Control de Tiempo y Área', 
            description: '<div style="font-size: 0.9rem; line-height: 1.5;"><p>Las metas cambian cada mes. Escoge aquí tu <b>Año</b> y <b>Mes</b> objetivo. <br/><br/>Si el mes no tiene mediciones previas, verás tarjetas vacías en color gris listas para ser llenadas.</p></div>', 
            side: "bottom", 
            align: 'start' 
          }
        },
        { 
          element: '#tour-kpi-grid', 
          popover: { 
            title: '📊 Tarjetas de Rendimiento', 
            description: '<div style="font-size: 0.9rem; line-height: 1.5;"><p>Cada bloque representa un KPI Oficial. En la parte superior derecha ves el tipo de <b>Fórmula</b> (ej. Porcentaje, Documental) y abajo el valor arrojado.</p></div>', 
            side: "top", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-status', 
          popover: { 
            title: '🚦 El Semáforo', 
            description: '<div style="display: grid; grid-template-columns: 20px 1fr; gap: 8px; font-size: 0.85rem; line-height: 1.4; margin-top: 10px;"><span style="color:#10b981;font-size:18px;">🟢</span><span><b>Sano:</b> Alcanzó o superó la meta definida.</span><span style="color:#f59e0b;font-size:18px;">🟡</span><span><b>Alerta:</b> Métrica por debajo del estándar óptimo.</span><span style="color:#ef4444;font-size:18px;">🔴</span><span><b>Riesgo:</b> Rendimiento inaceptable.</span><span style="color:#94a3b8;font-size:18px;">⚪</span><span><b>Gris:</b> Pendiente de captura este mes.</span></div>', 
            side: "top", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-edit-btn', 
          popover: { 
            title: '📝 Ingresar o Actualizar Datos', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>Al pulsar <b>Capturar</b>, se abrirá un formulario inteligente.</p><br/><div style="background:rgba(59,130,246,0.1); padding:10px; border-radius:8px; border:1px solid rgba(59,130,246,0.2);">✔️ Si es KPI Documental: palomea casillas.<br/>✔️ Si es KPI Numérico: ingresa cifras exactas.<br/>✔️ Si es Fecha: agrega el calendario de entregas.</div></div>', 
            side: "bottom", 
            align: 'start' 
          }
        },
        { 
          element: '.kpi-card', 
          popover: { 
            title: '🧊 Histórico Interactivo 3D', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>Para realizar <b>análisis a largo plazo</b>, simplemente pulsa sobre el <i>fondo de cualquier tarjeta</i>.</p><p style="margin-top: 10px; color: #3b82f6;"><b>¡Magia!</b> ✨ Se desplegará una gráfica en 3D con las alturas proporcionales de todos los meses de este año.</p></div>', 
            side: "right", 
            align: 'start' 
          }
        },
        ...(isAdminView ? [{ 
          element: '.btn-nuevo-kpi', 
          popover: { 
            title: '✨ Creador de KPIs', 
            description: '<div style="font-size: 0.95rem; line-height: 1.5;"><p>¿Necesitas medir algo nuevo? Utiliza nuestro <b>asistente inteligente</b>.</p><br/><p>Podrás definir parámetros, elegir cómo se calculará (conteo, verificación documental, fechas límite) y ajustar los umbrales de tu semáforo de manera intuitiva.</p></div>', 
            side: 'bottom' as const, 
            align: 'start' as const 
          }
        }] : [])
      ]
    });

    driverObj.drive();
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', borderRadius: '10px' }}} />
      <header className="dashboard-header">
        <div className="header-title" style={{ position: 'relative' }}>
          <BarChart3 size={36} style={{ color: 'var(--accent-color)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1>Kpi's</h1>
              <button 
                onClick={startTour} 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'}}
                data-tooltip="Ver Tutorial"
              >
                <HelpCircle size={18} />
              </button>
              {isAdminView && (
                <>
                  {isAdminAuthenticated && (
                    <button
                      onClick={() => setSelectedEmpresaId('')}
                      className="btn-nuevo-kpi"
                      style={{ background: 'var(--accent-color)', color: 'white', border: 'none' }}
                      data-tooltip="Volver al Hub Multiempresa"
                    >
                      <LayoutGrid size={16} /> Hub de Empresas
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateEmpresa(true)}
                    className="btn-nuevo-kpi"
                    data-tooltip="Crear una nueva empresa"
                  >
                    <PlusCircle size={16} /> Nueva empresa
                  </button>
                  <button
                    onClick={() => setShowCreateKpi(true)}
                    className="btn-nuevo-kpi"
                    data-tooltip="Crear nuevo KPI personalizado"
                  >
                    <PlusCircle size={16} /> Nuevo KPI
                  </button>
                  {isAdminAuthenticated && (
                    <button
                      onClick={handleAdminLogout}
                      className="btn-nuevo-kpi"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="subtitle">Monitoreo inteligente de indicadores clave</p>
          </div>
        </div>
        
        <DashboardFilters 
          empresas={empresas}
          selectedEmpresaId={selectedEmpresaId}
          onEmpresaChange={(id) => {
            setProfiles([]);
            setAreas([]);
            setSelectedEmpresaId(id);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          areasList={areasList}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableYears={availableYears}
          setIsAutoPeriod={setIsAutoPeriod}
        />
      </header>

      {isAdminView && !isAdminAuthenticated ? (
        <div className="admin-login-container">
          <div className="admin-login-card">
            <div className="admin-login-icon-wrapper">
              <Shield size={40} />
            </div>
            <h2>Acceso Admin</h2>
            <p>Panel de control maestro para la gestión de indicadores y empresas.</p>
            
            <form onSubmit={handleAdminLogin} className="admin-login-form">
              <div className="admin-login-input-group">
                <label>Contraseña de Seguridad</label>
                <div className="admin-login-input-wrapper">
                  <Lock size={20} className="admin-login-input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              <button type="submit" className="admin-login-button">
                Desbloquear Panel <ArrowRight size={20} />
              </button>
            </form>
            
            <div className="admin-login-footer">
              Sistema Protegido &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      ) : isAdminView && isAdminAuthenticated && !selectedEmpresaId ? (
        <main className="dashboard-main">
          <CompanyHub 
            empresas={empresas}
            onSelect={(id) => setSelectedEmpresaId(id)}
            onEdit={(empresa) => setEmpresaToEdit(empresa)}
            onDeactivate={(empresa) => setEmpresaToDeactivate(empresa)}
            onAdd={() => setShowCreateEmpresa(true)}
          />
        </main>
      ) : (
        <>
          {isAdminView && isAdminAuthenticated && selectedEmpresaId && (
            <section className="admin-panel">
              <div className="admin-panel__header" style={{ marginBottom: '2rem' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setSelectedEmpresaId('')}
                  style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <LayoutGrid size={18} /> Volver al Hub de Empresas
                </button>
              </div>

              <div className="admin-summary-grid">
                <article className="admin-summary-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--accent-color)' }}>
                       <Briefcase size={20} />
                    </div>
                    <span className="admin-summary-label">Empresa</span>
                  </div>
                  <strong>{selectedEmpresa?.nombre ?? 'Sin seleccionar'}</strong>
                </article>
                <article className="admin-summary-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--color-verde)' }}>
                       <LayoutGrid size={20} />
                    </div>
                    <span className="admin-summary-label">Áreas</span>
                  </div>
                  <strong>{areas.length}</strong>
                </article>
                <article className="admin-summary-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--color-amarillo)' }}>
                       <Users size={20} />
                    </div>
                    <span className="admin-summary-label">Trabajadores</span>
                  </div>
                  <strong>{profiles.length}</strong>
                </article>
              </div>

              <div className="admin-panel-section">
                <div className="admin-section-header">
                  <div>
                    <h2>Áreas Operativas</h2>
                    <p>Gestiona las divisiones de la empresa para agrupar indicadores.</p>
                  </div>
                  <button className="btn-icon-label primary" onClick={() => setShowCreateArea(true)}>
                    <PlusCircle size={18} /> Nueva Área
                  </button>
                </div>

                <div className="chip-list">
                  {areas.length === 0 ? (
                    <div style={{ textAlign: 'center', width: '100%', padding: '2rem', color: 'var(--text-muted)' }}>
                       <Inbox size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                       <p>No hay áreas configuradas aún.</p>
                    </div>
                  ) : (
                    areas.map((area) => (
                      <div key={area.id} className="admin-chip">
                        <span>{area.nombre}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="chip-action" onClick={() => setAreaToEdit(area)} title="Editar">
                            <Edit3 size={14} />
                          </button>
                          <button className="chip-action chip-action--danger" onClick={() => setAreaToDeactivate(area)} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-panel-section">
                <div className="admin-section-header">
                  <div>
                    <h2>Plantilla de Trabajadores</h2>
                    <p>Administra los colaboradores y sus accesos a métricas específicas.</p>
                  </div>
                  <button className="btn-icon-label primary" onClick={() => setShowCreateWorker(true)}>
                    <PlusCircle size={18} /> Nuevo Colaborador
                  </button>
                </div>

                <div className="admin-table-wrapper" style={{ background: '#f8fafc', borderRadius: '24px', padding: '1rem', border: '1px solid #f1f5f9' }}>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        <th>Contacto</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Users size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No se han registrado trabajadores para esta empresa.</p>
                          </td>
                        </tr>
                      ) : (
                        profiles.map((profile) => (
                          <tr key={profile.id}>
                            <td>
                              <div className="user-badge">
                                <div className="user-avatar">
                                  {profile.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 700 }}>{profile.nombre}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{profile.email}</td>
                            <td>
                              <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn-icon-label" onClick={() => setProfileForAssignments(profile)}>
                                   Asignaciones
                                </button>
                                <button className="btn-icon-label" onClick={() => setProfileToEdit(profile)}>
                                  <Edit3 size={14} />
                                </button>
                                <button className="btn-icon-label danger" onClick={() => setProfileToDeactivate(profile)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
        </section>
      )}

      <main className="dashboard-main" id="tour-kpi-grid">
        {loading && (
           <div className="empty-state">
              <div className="spinner"></div>
              <p>Cargando información del tablero...</p>
           </div>
        )}
        
        {error && (
           <div className="empty-state" style={{ color: 'var(--color-rojo)' }}>
              <p>Error: {error}</p>
           </div>
        )}
        
        {!loading && !error && Object.keys(groupedKpis).length === 0 && (
           <div className="empty-state">
              <Inbox size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              {kpis.length === 0 ? (
                <>
                  <p>Esta empresa aún no tiene KPIs registrados.</p>
                  {isAdminView && (
                    <button className="btn-primary" onClick={() => setShowCreateKpi(true)} style={{ marginTop: '1rem' }}>
                      <PlusCircle size={16} /> Crear el primer KPI
                    </button>
                  )}
                </>
              ) : (
                <p>No se encontraron KPIs con los parámetros de búsqueda seleccionados.</p>
              )}
           </div>
        )}

        {!loading && !error && Object.keys(groupedKpis).map(area => (
          <section key={area} className="area-section">
            <h2 className="area-title">{area}</h2>
            {groupedKpis[area].length === 0 ? (
              <p className="empty-area-copy" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', padding: '1rem' }}>
                Sin indicadores asignados a esta área este periodo.
              </p>
            ) : (
              <div className="kpi-grid">
                {groupedKpis[area].map((kpi: KPI) => (
                  <KpiCard
                    key={kpi.resultado_id || kpi.kpi_id}
                    kpi={kpi}
                    isAdmin={isAdminAuthenticated}
                    onOpenDetail={setKpiForHistory}
                    onCapture={setCaptureKpi}
                    onOpenVisualConfig={setVisualConfigKpi}
                    onDelete={handleDeleteKpiRequest}
                    getSemaforoRgb={getSemaforoRgb}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
        </>
      )}

      {captureKpi && (
         <CaptureModal 
           kpi_id={captureKpi.kpi_id} 
           anio={selectedYear} 
           mes={selectedMonth} 
           onClose={() => setCaptureKpi(null)} 
           onSuccess={fetchKPIs} 
         />
      )}

      {kpiForHistory && (
         <KpiDetailModal 
            kpi={kpiForHistory}
            anio={selectedYear}
            onClose={() => setKpiForHistory(null)}
         />
      )}

      {(showCreateEmpresa || empresaToEdit) && (
        <CreateEmpresaModal
          empresa={empresaToEdit}
          onClose={() => {
            setShowCreateEmpresa(false);
            setEmpresaToEdit(null);
          }}
          onSuccess={async (empresa) => {
            setShowCreateEmpresa(false);
            setEmpresaToEdit(null);
            await fetchEmpresas();
            if (!empresaToEdit) {
              setProfiles([]);
              setAreas([]);
              setSelectedEmpresaId(empresa.id);
            }
          }}
        />
      )}

      {(showCreateArea || areaToEdit) && (
        <CreateAreaModal
          empresaId={selectedEmpresaId}
          area={areaToEdit}
          onClose={() => {
            setShowCreateArea(false);
            setAreaToEdit(null);
          }}
          onSuccess={() => {
            setShowCreateArea(false);
            setAreaToEdit(null);
            fetchAreas();
          }}
        />
      )}

      {showCreateKpi && (
        <CreateKpiModal
          empresaId={selectedEmpresaId}
          onClose={() => setShowCreateKpi(false)}
          onSuccess={() => { setShowCreateKpi(false); fetchKPIs(); }}
        />
      )}

      {(showCreateWorker || profileToEdit) && (
        <CreateWorkerModal
          empresaId={selectedEmpresaId}
          profile={profileToEdit}
          onClose={() => {
            setShowCreateWorker(false);
            setProfileToEdit(null);
          }}
          onSuccess={() => {
            setShowCreateWorker(false);
            setProfileToEdit(null);
            fetchProfiles();
          }}
        />
      )}

      {profileForAssignments && (
        <WorkerAssignmentsModal
          empresaId={selectedEmpresaId}
          profile={profileForAssignments}
          onClose={() => setProfileForAssignments(null)}
          onSuccess={() => {
            setProfileForAssignments(null);
            fetchProfiles();
          }}
        />
      )}

      {kpiToDelete && (
        <ConfirmModal 
          title="Eliminar KPI Personalizado"
          message={
            <>
              ¿Estás seguro de que deseas eliminar permanentemente el KPI <strong style={{ color: '#0f172a' }}>"{kpiToDelete.kpi_nombre}"</strong>?
              <br/><br/>
              Esta acción es irreversible y eliminará todo su historial de capturas.
            </>
          }
          onConfirm={confirmDeleteKpi}
          onCancel={() => setKpiToDelete(null)}
        />
      )}
      {empresaToDeactivate && (
        <ConfirmModal
          title="Desactivar Empresa"
          message={`¿Estás seguro de que deseas desactivar la empresa "${empresaToDeactivate.nombre}"? Esta acción ocultará la empresa y todos sus datos asociados.`}
          onConfirm={deactivateEmpresa}
          onCancel={() => setEmpresaToDeactivate(null)}
        />
      )}

      {areaToDeactivate && (
        <ConfirmModal
          title="Desactivar Área"
          message={`¿Estás seguro de que deseas desactivar el área "${areaToDeactivate.nombre}"?`}
          onConfirm={deactivateArea}
          onCancel={() => setAreaToDeactivate(null)}
        />
      )}

      {profileToDeactivate && (
        <ConfirmModal
          title="Desactivar Trabajador"
          message={`¿Estás seguro de que deseas desactivar a ${profileToDeactivate.nombre}?`}
          onConfirm={deactivateProfile}
          onCancel={() => setProfileToDeactivate(null)}
        />
      )}

      {visualConfigKpi && (
        <VisualConfigModal
          kpiId={visualConfigKpi.kpi_id}
          kpiNombre={visualConfigKpi.kpi_nombre}
          currentConfig={visualConfigKpi.kpi_config?.config_json?.visual}
          onClose={() => setVisualConfigKpi(null)}
          onSave={() => {
            setVisualConfigKpi(null);
            fetchKPIs();
          }}
        />
      )}
    </div>
  );
}

export default App;

