import React from 'react';
import { BarChart3, Calendar, Filter, Search } from 'lucide-react';
import type { Empresa } from '../types/dashboard';

interface DashboardFiltersProps {
  empresas: Empresa[];
  selectedEmpresaId: string;
  onEmpresaChange: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  areasList: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableYears: string[];
  setIsAutoPeriod: (auto: boolean) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  empresas,
  selectedEmpresaId,
  onEmpresaChange,
  searchQuery,
  onSearchChange,
  selectedArea,
  onAreaChange,
  areasList,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  availableYears,
  setIsAutoPeriod
}) => {
  return (
    <div className="header-filters" id="tour-filters">
      <div className="filter-group">
        <span className="filter-label"><BarChart3 size={14} /> EMPRESA</span>
        <select
          value={selectedEmpresaId}
          onChange={(e) => onEmpresaChange(e.target.value)}
        >
          <option value="">Selecciona una empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group global-search">
         <span className="filter-label"><Search size={14} /> BÚSQUEDA</span>
         <div style={{ position: 'relative' }}>
           <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-claro)' }} />
           <input 
             type="text" 
             placeholder="Buscar KPI..." 
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             style={{ paddingLeft: '2.2rem' }}
           />
         </div>
      </div>
      
      <div className="filter-group">
        <span className="filter-label"><Filter size={14} /> ÁREA</span>
        <select value={selectedArea} onChange={(e) => onAreaChange(e.target.value)}>
          <option value="Todas">Todas las áreas</option>
          {areasList.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label"><Calendar size={14} /> PERIODO</span>
        <div className="period-selectors">
          <select
            value={selectedYear}
            onChange={(e) => {
              setIsAutoPeriod(false);
              onYearChange(e.target.value);
            }}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setIsAutoPeriod(false);
              onMonthChange(e.target.value);
            }}
          >
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
