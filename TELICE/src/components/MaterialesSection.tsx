/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Search, PlusCircle, Trash2, Edit3, Check, X, AlertTriangle, Filter, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { MaterialItem } from '../types';
import { exportMaterialsToExcel, exportMaterialsToPDF } from '../utils/exportUtils';

interface MaterialesSectionProps {
  materiales: MaterialItem[];
  onUpdateMaterial: (id: string, updatedFields: Partial<MaterialItem>) => void;
  onDeleteMaterial: (id: string) => void;
  onAddMaterial: (newMaterial: Omit<MaterialItem, 'id'>) => void;
  contractor?: string;
}

export default function MaterialesSection({
  materiales,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddMaterial,
  contractor = 'TELICE'
}: MaterialesSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedTecnica, setSelectedTecnica] = useState<'ALL' | 'TELEMANDO' | 'RACA' | 'RACO'>('ALL');
  
  // New Material form state
  const [showForm, setShowForm] = useState(false);
  const [formNumeroIncidencia, setFormNumeroIncidencia] = useState('');
  const [formFecha, setFormFecha] = useState('31/05/2026');
  const [formTecnica, setFormTecnica] = useState<'TELEMANDO' | 'RACA' | 'RACO'>('RACA');
  const [formImputacion, setFormImputacion] = useState('Propia');
  const [formCodMaterial, setFormCodMaterial] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCantidad, setFormCantidad] = useState(1);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<MaterialItem>>({});

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumeroIncidencia.trim()) {
      alert('Por favor, especifique el número de incidencia.');
      return;
    }
    if (!formCodMaterial.trim()) {
      alert('Por favor, especifique el código de material.');
      return;
    }
    if (!formDescripcion.trim()) {
      alert('Por favor, especifique la descripción del material.');
      return;
    }

    onAddMaterial({
      numeroIncidencia: formNumeroIncidencia,
      fecha: formFecha,
      tecnica: formTecnica,
      imputacion: formImputacion,
      codMaterial: formCodMaterial,
      descripcion: formDescripcion,
      cantidad: Number(formCantidad)
    });

    // Reset Form
    setFormNumeroIncidencia('');
    setFormFecha('31/05/2026');
    setFormCodMaterial('');
    setFormDescripcion('');
    setFormCantidad(1);
    setShowForm(false);
  };

  const startEditing = (item: MaterialItem) => {
    setEditingId(item.id);
    setEditFields({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFields({});
  };

  const saveEditing = (id: string) => {
    onUpdateMaterial(id, editFields);
    setEditingId(null);
    setEditFields({});
  };

  const [selectedPeriod, setSelectedPeriod] = useState<string>('AÑO_2026');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getYearFromFecha = (fechaStr: string): number => {
    if (!fechaStr) return 0;
    const parts = fechaStr.trim().split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) return year;
    }
    return 0;
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const matchesPeriod = (mat: MaterialItem) => {
    if (selectedPeriod === 'TODOS') return true;
    const yr = getYearFromFecha(mat.fecha);
    if (selectedPeriod === 'AÑO_2026') return yr === 2026;
    if (selectedPeriod === 'AÑO_2025') return yr === 2025;
    if (selectedPeriod === 'AÑO_2024') return yr === 2024;
    if (selectedPeriod === 'AÑO_2023') return yr === 2023;
    if (selectedPeriod === 'AÑO_ANTE') return yr >= 2017 && yr <= 2022;
    if (selectedPeriod === 'CUSTOM') {
      const itemDate = parseDateString(mat.fecha);
      if (!itemDate) return false;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    }
    return true;
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'TODOS') return 'Todo el Histórico (2017 - 2026)';
    if (selectedPeriod === 'AÑO_2026') return 'Año 2026';
    if (selectedPeriod === 'AÑO_2025') return 'Año 2025';
    if (selectedPeriod === 'AÑO_2024') return 'Año 2024';
    if (selectedPeriod === 'AÑO_2023') return 'Año 2023';
    if (selectedPeriod === 'AÑO_ANTE') return 'Histórico 2017-2022';
    if (selectedPeriod === 'CUSTOM') {
      const d1 = startDate ? new Date(startDate).toLocaleDateString('es-ES') : 'Inicio';
      const d2 = endDate ? new Date(endDate).toLocaleDateString('es-ES') : 'Fin';
      return `Rango Personalizado (${d1} - ${d2})`;
    }
    return 'Periodo Seleccionado';
  };

  const filteredMateriales = materiales.filter((mat) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      mat.numeroIncidencia.toLowerCase().includes(term) ||
      mat.codMaterial.toLowerCase().includes(term) ||
      mat.descripcion.toLowerCase().includes(term) ||
      mat.imputacion.toLowerCase().includes(term);
    
    const matchesCategory = selectedTecnica === 'ALL' || mat.tecnica === selectedTecnica;
    return matchesSearch && matchesCategory && matchesPeriod(mat);
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-8" id="materiales-section">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5" id="materiales-header-container">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl" id="materiales-icon-bg">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider block">Inventario Consumido</span>
            <h3 className="text-lg font-black text-slate-800 font-display">Consumo de Materiales por Incidencia</h3>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs self-stretch sm:self-auto justify-center"
          id="btn-toggle-materiales-form"
        >
          <PlusCircle className="h-4 w-4" />
          {showForm ? 'Cerrar Formulario' : 'Añadir Material'}
        </button>
      </div>

      {/* NEW MATERIAL FORM */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleCreateMaterial}
          className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-5 space-y-4"
          id="materiales-new-form"
        >
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Nuevo Registro de Material Consumido</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">N.º Incidencia</label>
              <input
                type="text"
                value={formNumeroIncidencia}
                onChange={(e) => setFormNumeroIncidencia(e.target.value)}
                placeholder="Ej. 842/2026"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold"
                id="input-material-incidencia"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
              <input
                type="text"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                placeholder="Ej. 31/05/2026"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                id="input-material-fecha"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Técnica</label>
              <select
                value={formTecnica}
                onChange={(e) => setFormTecnica(e.target.value as 'TELEMANDO' | 'RACA' | 'RACO')}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer font-semibold"
                id="select-material-tecnica"
              >
                <option value="TELEMANDO">TELEMANDO</option>
                <option value="RACA">RACA</option>
                <option value="RACO">RACO</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Imputación</label>
              <select
                value={formImputacion}
                onChange={(e) => setFormImputacion(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                id="select-material-imputacion"
              >
                <option value="Propia">Propia</option>
                <option value="Ajena">Ajena</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cód. Material</label>
              <input
                type="text"
                value={formCodMaterial}
                onChange={(e) => setFormCodMaterial(e.target.value)}
                placeholder="Ej. 731900012"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                id="input-material-cod"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
              <input
                type="text"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Ej. Contactor Carlo Gavazzi RJ1A23D30E"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                id="input-material-desc"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                value={formCantidad}
                onChange={(e) => setFormCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                id="input-material-cant"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer"
              id="btn-cancel-material"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-xs"
              id="btn-save-material"
            >
              Registrar Consumo
            </button>
          </div>
        </motion.form>
      )}

      {/* FILTERS AND SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center" id="materiales-filters-container">
        {/* Category Toggles */}
        <div className="flex rounded-lg overflow-x-auto bg-slate-50 border border-slate-200 p-1 gap-1 flex-shrink-0" id="materiales-category-toggles">
          {(['ALL', 'TELEMANDO', 'RACA', 'RACO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTecnica(cat)}
              className={`px-3 py-1.5 text-xs rounded-md transition duration-150 font-bold whitespace-nowrap cursor-pointer ${
                selectedTecnica === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
              }`}
              id={`btn-filter-material-${cat.toLowerCase()}`}
            >
              {cat === 'ALL' ? 'Todas las Técnicas' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md" id="materiales-search-wrapper">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descripción, código o incidencia..."
            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-medium"
            id="input-search-materiales"
          />
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs" id="materiales-table-wrapper">
        <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 uppercase tracking-wider text-[10px] z-10">
              <tr>
                <th className="p-3 pl-4">N.º INCIDENCIA</th>
                <th className="p-3">FECHA</th>
                <th className="p-3">TÉCNICA</th>
                <th className="p-3">IMPUTACIÓN</th>
                <th className="p-3">CÓD. MATERIAL</th>
                <th className="p-3">DESCRIPCIÓN</th>
                <th className="p-3 text-right">CANTIDAD</th>
                <th className="p-3 text-center w-24">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMateriales.length > 0 ? (
                filteredMateriales.map((mat) => {
                  const isEditing = editingId === mat.id;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/50 transition">
                      {/* N.º INCIDENCIA */}
                      <td className="p-3 pl-4 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFields.numeroIncidencia || ''}
                            onChange={(e) => setEditFields({ ...editFields, numeroIncidencia: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-2 py-1 w-24 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none font-bold"
                          />
                        ) : (
                          mat.numeroIncidencia
                        )}
                      </td>

                      {/* FECHA */}
                      <td className="p-3 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFields.fecha || ''}
                            onChange={(e) => setEditFields({ ...editFields, fecha: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-2 py-1 w-24 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none font-mono"
                          />
                        ) : (
                          mat.fecha
                        )}
                      </td>

                      {/* TÉCNICA */}
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editFields.tecnica || 'RACA'}
                            onChange={(e) => setEditFields({ ...editFields, tecnica: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-1 py-1 w-24 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                          >
                            <option value="TELEMANDO">TELEMANDO</option>
                            <option value="RACA">RACA</option>
                            <option value="RACO">RACO</option>
                          </select>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide">
                            {mat.tecnica}
                          </span>
                        )}
                      </td>

                      {/* IMPUTACIÓN */}
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editFields.imputacion || 'Propia'}
                            onChange={(e) => setEditFields({ ...editFields, imputacion: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-1 py-1 w-20 text-xs text-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value="Propia">Propia</option>
                            <option value="Ajena">Ajena</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                            mat.imputacion.toLowerCase().includes('propia')
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {mat.imputacion}
                          </span>
                        )}
                      </td>

                      {/* CÓD. MATERIAL */}
                      <td className="p-3 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFields.codMaterial || ''}
                            onChange={(e) => setEditFields({ ...editFields, codMaterial: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-2 py-1 w-24 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none font-mono"
                          />
                        ) : (
                          mat.codMaterial
                        )}
                      </td>

                      {/* DESCRIPCIÓN */}
                      <td className="p-3 text-slate-800 font-semibold max-w-xs truncate" title={mat.descripcion}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFields.descripcion || ''}
                            onChange={(e) => setEditFields({ ...editFields, descripcion: e.target.value })}
                            className="bg-white border border-slate-200 rounded px-2 py-1 w-full text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                          />
                        ) : (
                          mat.descripcion
                        )}
                      </td>

                      {/* CANTIDAD */}
                      <td className="p-3 text-right font-mono font-black text-sm text-slate-900 pr-5">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editFields.cantidad || 1}
                            onChange={(e) => setEditFields({ ...editFields, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="bg-white border border-slate-200 rounded px-1 py-1 w-14 text-right text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none font-mono font-bold"
                          />
                        ) : (
                          mat.cantidad
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEditing(mat.id)}
                                className="p-1 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded border border-emerald-200 hover:border-emerald-600 cursor-pointer transition"
                                title="Guardar cambios"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-slate-500 hover:text-white hover:bg-slate-500 rounded border border-slate-200 hover:border-slate-500 cursor-pointer transition"
                                title="Cancelar edición"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(mat)}
                                className="p-1 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded border border-indigo-100 hover:border-indigo-600 cursor-pointer transition"
                                title="Editar fila"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('¿Está seguro de que desea eliminar este registro de material consumido?')) {
                                    onDeleteMaterial(mat.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded border border-rose-100 hover:border-rose-600 cursor-pointer transition"
                                title="Eliminar fila"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-400 italic">
                    No se han encontrado registros de materiales con los criterios especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CENTRO DE REPORTES Y DESCARGAS POR PERIODO */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-5" id="materiales-reports-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 font-display">Descargas e Informes de Materiales por Periodo</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">Configure el intervalo de tiempo y exporte informes personalizados en formatos PDF o Excel estructurados</p>
            </div>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                exportMaterialsToPDF(filteredMateriales, getPeriodLabel(), contractor);
              }}
              disabled={filteredMateriales.length === 0}
              className={`flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs`}
              title="Descargar reporte PDF con diseño ejecutivo profesional"
              id="btn-export-materials-pdf"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              onClick={() => {
                exportMaterialsToExcel(filteredMateriales, getPeriodLabel(), contractor);
              }}
              disabled={filteredMateriales.length === 0}
              className={`flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs`}
              title="Descargar base de datos filtrada en formato Excel"
              id="btn-export-materials-excel"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Period Selector Grid */}
        <div className="space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">Períodos de Consulta Históricos</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {[
                { id: 'TODOS', label: 'Histórico Completo' },
                { id: 'AÑO_2026', label: 'Año 2026' },
                { id: 'AÑO_2025', label: 'Año 2025' },
                { id: 'AÑO_2024', label: 'Año 2024' },
                { id: 'AÑO_2023', label: 'Año 2023' },
                { id: 'AÑO_ANTE', label: '2017 - 2022' },
                { id: 'CUSTOM', label: 'Personalizado...' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-3 py-2 text-xs rounded-xl transition-all duration-150 font-bold cursor-pointer border text-center ${
                    selectedPeriod === p.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  id={`btn-period-${p.id.toLowerCase()}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs if selected */}
          {selectedPeriod === 'CUSTOM' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-2xl p-4 max-w-xl"
              id="custom-date-selectors"
            >
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Inicial (Desde)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold font-mono"
                  id="input-date-start"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Final (Hasta)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold font-mono"
                  id="input-date-end"
                />
              </div>
            </motion.div>
          )}

          {/* Visual Indicator of count */}
          <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/30 rounded-xl px-3 py-2 text-xs text-indigo-800 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              <strong>{filteredMateriales.length}</strong> {filteredMateriales.length === 1 ? 'registro' : 'registros'} de consumo seleccionados para el período <strong>{getPeriodLabel()}</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
