/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Plus, Trash2, ShieldAlert, List, Calendar, Search, Download, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { IncidenciaDetail, Month } from '../types';
import { MONTH_LABELS } from '../data';
import { exportIncidenciasToExcel, exportIncidenciasToPDF } from '../utils/exportUtils';

interface IncidenciasSectionProps {
  incidencias: IncidenciaDetail[];
  currentMonth: Month;
  onAddIncidencia: (inc: Omit<IncidenciaDetail, 'id'>) => void;
  onDeleteIncidencia: (id: string) => void;
  contractor?: string;
}

export default function IncidenciasSection({
  incidencias,
  currentMonth,
  onAddIncidencia,
  onDeleteIncidencia,
  contractor = 'TELICE'
}: IncidenciasSectionProps) {
  const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

  // --- STATE FOR FILTERS & PERIODS ---
  const [search, setSearch] = useState('');
  const [selectedTecnica, setSelectedTecnica] = useState<'ALL' | 'TELEMANDO' | 'RACA' | 'RACO'>('ALL');
  const [selectedTrendYear, setSelectedTrendYear] = useState<number>(2026);

  const getYearFromFecha = (fechaStr: string): number => {
    if (!fechaStr) return 0;
    const trimmed = fechaStr.trim();
    
    // Try splitting by /
    let parts = trimmed.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) return year;
    }
    
    // Try splitting by -
    parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        if (!isNaN(year)) return year;
      } else {
        const year = parseInt(parts[2], 10);
        if (!isNaN(year)) return year;
      }
    }
    
    // Fallback checks
    if (trimmed.includes('2026')) return 2026;
    if (trimmed.includes('2025')) return 2025;
    if (trimmed.includes('2024')) return 2024;
    if (trimmed.includes('2023')) return 2023;
    if (trimmed.includes('2022')) return 2022;
    if (trimmed.includes('2021')) return 2021;
    if (trimmed.includes('2020')) return 2020;
    if (trimmed.includes('2019')) return 2019;
    if (trimmed.includes('2018')) return 2018;
    if (trimmed.includes('2017')) return 2017;
    return 0;
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(/[\/\-]/);
    if (parts.length === 3) {
      // If YYYY-MM-DD
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    return null;
  };

  const matchesPeriod = (inc: IncidenciaDetail) => {
    if (inc.month !== currentMonth) return false;
    const yr = getYearFromFecha(inc.fecha);
    return yr === 2026 || yr === 0;
  };

  const getPeriodLabel = () => {
    return `Mes de ${getMonthLabel(currentMonth)} 2026`;
  };

  // Filtered Incidencias for table
  const filteredIncidencias = incidencias.filter((inc) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (inc.numeroIncidencia || '').toLowerCase().includes(term) ||
      (inc.ubicacion || '').toLowerCase().includes(term) ||
      (inc.observaciones || inc.descripcion || '').toLowerCase().includes(term) ||
      (inc.imputacion || inc.tipo || '').toLowerCase().includes(term);
    
    // Convert subsystem to ALL or compare
    const matchesCategory = selectedTecnica === 'ALL' || inc.subsystem === selectedTecnica;
    return matchesSearch && matchesCategory && matchesPeriod(inc);
  });

  // --- MATRIX CALCULATIONS (FOR SELECTED MONTH) ---
  const activeIncidencias = incidencias.filter((i) => {
    if (i.month !== currentMonth) return false;
    const yr = getYearFromFecha(i.fecha);
    return yr === 2026 || yr === 0;
  });

  const subsystems: ('TELEMANDO' | 'RACA' | 'RACO')[] = ['TELEMANDO', 'RACA', 'RACO'];
  const categories: ('PROPIAS' | 'PREVENTIVO' | 'AJENAS' | 'A TERCEROS')[] = [
    'PROPIAS',
    'PREVENTIVO',
    'AJENAS',
    'A TERCEROS',
  ];

  // Initialize Matrix
  const matrix: Record<string, Record<string, number>> = {
    TELEMANDO: { PROPIAS: 0, PREVENTIVO: 0, AJENAS: 0, 'A TERCEROS': 0 },
    RACA: { PROPIAS: 0, PREVENTIVO: 0, AJENAS: 0, 'A TERCEROS': 0 },
    RACO: { PROPIAS: 0, PREVENTIVO: 0, AJENAS: 0, 'A TERCEROS': 0 },
  };

  activeIncidencias.forEach((i) => {
    const sub = i.subsystem;
    const cat = i.tipo;
    if (matrix[sub] && matrix[sub][cat] !== undefined) {
      matrix[sub][cat]++;
    }
  });

  // Totals for active month
  const categoryTotals = {
    PROPIAS: activeIncidencias.filter((i) => i.tipo === 'PROPIAS').length,
    PREVENTIVO: activeIncidencias.filter((i) => i.tipo === 'PREVENTIVO').length,
    AJENAS: activeIncidencias.filter((i) => i.tipo === 'AJENAS').length,
    'A TERCEROS': activeIncidencias.filter((i) => i.tipo === 'A TERCEROS').length,
  };
  const activeMonthTotal = activeIncidencias.length;

  // --- ANNUAL MONTHLY TREND COUNTS ---
  const allMonths: Month[] = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const annualTrend = allMonths.map((m) => {
    const count = incidencias.filter(
      (i) => i.month === m && getYearFromFecha(i.fecha) === selectedTrendYear
    ).length;
    return {
      monthKey: m,
      monthLabel: getMonthLabel(m).substring(0, 3).toUpperCase(),
      incidencias: count,
    };
  });

  const grandTotalIncidencias = annualTrend.reduce((acc, t) => acc + t.incidencias, 0);

  // --- CHART DATA FOR CHOSEN MONTH ---
  const activeMonthChartData = subsystems.map((sub) => ({
    name: sub,
    PROPIAS: activeIncidencias.filter((i) => i.subsystem === sub && i.tipo === 'PROPIAS').length,
    PREVENTIVO: activeIncidencias.filter((i) => i.subsystem === sub && i.tipo === 'PREVENTIVO').length,
    AJENAS: activeIncidencias.filter((i) => i.subsystem === sub && i.tipo === 'AJENAS').length,
    ATERCEROS: activeIncidencias.filter((i) => i.subsystem === sub && i.tipo === 'A TERCEROS').length,
  }));

  // --- STATE FOR NEW INCIDENT FORM ---
  const [showForm, setShowForm] = useState(false);
  const [formNumero, setFormNumero] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formTecnica, setFormTecnica] = useState<string>('TELEMANDO');
  const [formUbicacion, setFormUbicacion] = useState('');
  const [formImputacion, setFormImputacion] = useState('Propia');
  const [formObservaciones, setFormObservaciones] = useState('Cerrado');

  const [formPresencia, setFormPresencia] = useState(30);
  const [formReparacion, setFormReparacion] = useState(90);
  const [formTrenes, setFormTrenes] = useState(0);
  const [formRetrasos, setFormRetrasos] = useState(0);

  const getMonthFromDate = (dateStr: string): Month => {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      const months: Month[] = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return months[monthIndex] || 'enero';
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      const monthIndex = parseInt(parts[1], 10) - 1;
      const months: Month[] = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return months[monthIndex] || 'enero';
    }
    return 'enero';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumero.trim()) {
      alert('Por favor especifique el N.º de incidencia.');
      return;
    }
    if (!formFecha) {
      alert('Por favor especifique la fecha.');
      return;
    }
    if (!formUbicacion.trim()) {
      alert('Por favor especifique la ubicación.');
      return;
    }

    // Format fecha from YYYY-MM-DD to DD/MM/YYYY for presentation
    let formattedFecha = formFecha;
    if (formFecha.includes('-')) {
      const parts = formFecha.split('-');
      formattedFecha = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const calculatedMonth = getMonthFromDate(formFecha);

    // Map tecnica to subsystem
    let calculatedSubsystem: 'TELEMANDO' | 'RACA' | 'RACO' = 'TELEMANDO';
    if (formTecnica.includes('RACA')) calculatedSubsystem = 'RACA';
    else if (formTecnica.includes('RACO')) calculatedSubsystem = 'RACO';

    // Map imputacion to tipo
    let calculatedTipo: 'PROPIAS' | 'PREVENTIVO' | 'AJENAS' | 'A TERCEROS' = 'PROPIAS';
    if (formImputacion.toLowerCase().includes('propia')) {
      calculatedTipo = 'PROPIAS';
    } else if (formImputacion.toLowerCase().includes('preventivo')) {
      calculatedTipo = 'PREVENTIVO';
    } else {
      calculatedTipo = 'AJENAS';
    }

    onAddIncidencia({
      month: calculatedMonth,
      subsystem: calculatedSubsystem,
      tipo: calculatedTipo,
      descripcion: `Incidencia ${formNumero} (${formTecnica}) en ${formUbicacion}: ${formObservaciones}`,
      tiempoPresenciaMin: Number(formPresencia),
      tiempoReparacionMin: Number(formReparacion),
      trenesAfectados: Number(formTrenes),
      retrasosMin: Number(formRetrasos),
      numeroIncidencia: formNumero,
      fecha: formattedFecha,
      tecnica: formTecnica,
      ubicacion: formUbicacion,
      imputacion: formImputacion,
      observaciones: formObservaciones,
    });

    // Reset Form
    setFormNumero('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormTecnica('TELEMANDO');
    setFormUbicacion('');
    setFormImputacion('Propia');
    setFormObservaciones('Cerrado');
    setFormPresencia(30);
    setFormReparacion(90);
    setFormTrenes(0);
    setFormRetrasos(0);
    setShowForm(false);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-8" id="incidencias-section">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">Control de Fiabilidad e Incidencias Operativas</h3>
            <p className="text-slate-500 text-xs font-medium">Análisis de disponibilidad, tiempos de presencia, fallos de red y registro de eventos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition duration-200 shadow-xs cursor-pointer"
          id="btn-add-incidencia"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Incidencia</span>
        </button>
      </div>

      {/* NEW INCIDENT FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 animate-fadeIn" id="form-add-incidencia">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            Formulario de Registro de Incidencia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">N.º INCIDENCIA</label>
              <input
                type="text"
                value={formNumero}
                onChange={(e) => setFormNumero(e.target.value)}
                placeholder="Ej. 105/2026 (*)"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">FECHA</label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">TÉCNICA</label>
              <select
                value={formTecnica}
                onChange={(e) => setFormTecnica(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="RACO">RACO</option>
                <option value="TELEMANDO">TELEMANDO</option>
                <option value="RACA">RACA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">UBICACIÓN</label>
              <input
                type="text"
                value={formUbicacion}
                onChange={(e) => setFormUbicacion(e.target.value)}
                placeholder="Ej. Las Chozas"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">IMPUTACIÓN</label>
              <select
                value={formImputacion}
                onChange={(e) => setFormImputacion(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="Propia">Propia</option>
                <option value="Ajena">Ajena</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">OBSERVACIONES</label>
              <input
                type="text"
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                placeholder="Ej. Cerrado"
                className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ADVANCED FIELDS COLLAPSIBLE */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <details className="group">
              <summary className="flex justify-between items-center p-3 text-xs font-bold text-slate-700 bg-slate-100/50 cursor-pointer select-none">
                <span>Campos de penalización de contrato (Métricas Avanzadas - Opcional)</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiempo Presencia (min)</label>
                  <input
                    type="number"
                    value={formPresencia}
                    onChange={(e) => setFormPresencia(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiempo Reparación (min)</label>
                  <input
                    type="number"
                    value={formReparacion}
                    onChange={(e) => setFormReparacion(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Trenes con Retraso</label>
                  <input
                    type="number"
                    value={formTrenes}
                    onChange={(e) => setFormTrenes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Retraso Acumulado (min)</label>
                  <input
                    type="number"
                    value={formRetrasos}
                    onChange={(e) => setFormRetrasos(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-4 py-2 rounded transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2 rounded font-bold transition cursor-pointer"
            >
              Guardar Incidencia
            </button>
          </div>
        </form>
      )}

      {/* Distribution matrix and Month chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TÉCNICA / IMPUTACIÓN matrix */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Imputación Mensual por Subsistema ({getMonthLabel(currentMonth)} 2026)
            </h4>
            <span className="text-xs font-bold text-indigo-650">
              Total Mes: {activeMonthTotal}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">TÉCNICA / IMPUTACIÓN</th>
                  <th className="p-3 text-center">PROPIAS</th>
                  <th className="p-3 text-center">PREVENTIVO</th>
                  <th className="p-3 text-center">AJENAS</th>
                  <th className="p-3 text-center">A TERCEROS</th>
                  <th className="p-3 text-center bg-indigo-500/[0.03] font-bold text-indigo-900">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {subsystems.map((sub) => (
                  <tr key={sub} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-800">{sub}</td>
                    <td className="p-3 text-center font-mono">{matrix[sub].PROPIAS || '-'}</td>
                    <td className="p-3 text-center font-mono">{matrix[sub].PREVENTIVO || '-'}</td>
                    <td className="p-3 text-center font-mono">{matrix[sub].AJENAS || '-'}</td>
                    <td className="p-3 text-center font-mono">{matrix[sub]['A TERCEROS'] || '-'}</td>
                    <td className="p-3 text-center font-mono font-bold bg-slate-50">
                      {Object.values(matrix[sub]).reduce((a, b) => a + b, 0) || '-'}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50 text-slate-800 font-bold border-t border-slate-200">
                  <td className="p-3 text-indigo-650">TOTAL</td>
                  <td className="p-3 text-center font-mono text-indigo-650">{categoryTotals.PROPIAS || '-'}</td>
                  <td className="p-3 text-center font-mono text-indigo-650">{categoryTotals.PREVENTIVO || '-'}</td>
                  <td className="p-3 text-center font-mono text-indigo-650">{categoryTotals.AJENAS || '-'}</td>
                  <td className="p-3 text-center font-mono text-indigo-650">{categoryTotals['A TERCEROS'] || '-'}</td>
                  <td className="p-3 text-center font-mono font-black text-indigo-700 bg-indigo-50 border-l border-indigo-100">
                    {activeMonthTotal || '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recharts chart */}
        <div id="chart-distribucion-incidencias" className="lg:col-span-5 bg-slate-50 border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Distribución por Tipo de Incidencia ({getMonthLabel(currentMonth)} 2026)
          </h4>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeMonthChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} stroke="#64748b" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="PROPIAS" stackId="a" fill="#3b82f6" name="Propias" />
                <Bar dataKey="PREVENTIVO" stackId="a" fill="#10b981" name="Preventivo" />
                <Bar dataKey="AJENAS" stackId="a" fill="#f59e0b" name="Ajenas" />
                <Bar dataKey="ATERCEROS" stackId="a" fill="#ef4444" name="Terceros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Jan-Dec annual counts bar trend */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Histórico de Frecuencia de Incidencias Mensuales (Año Natural {selectedTrendYear})
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Año Natural:</span>
            <select
              value={selectedTrendYear}
              onChange={(e) => setSelectedTrendYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              id="select-fiabilidad-trend-year"
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((y) => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spreadsheet Row display style */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="p-3 text-left">MES</th>
                {annualTrend.map((t) => {
                  const isHighlighted = selectedTrendYear === 2026 && t.monthKey === currentMonth;
                  return (
                    <th key={t.monthKey} className={`p-3 font-mono ${isHighlighted ? 'bg-indigo-50 text-indigo-900 font-bold border-x border-indigo-100' : ''}`}>
                      {t.monthLabel}
                    </th>
                  );
                })}
                <th className="p-3 bg-indigo-50 text-indigo-700 font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-100">
              <tr>
                <td className="p-3 text-left font-semibold text-slate-800 bg-slate-50/50">INCIDENCIAS</td>
                {annualTrend.map((t) => {
                  const isHighlighted = selectedTrendYear === 2026 && t.monthKey === currentMonth;
                  return (
                    <td
                      key={t.monthKey}
                      className={`p-3 font-mono font-bold ${
                        t.incidencias > 0 ? 'text-amber-600 bg-amber-500/[0.02]' : 'text-slate-400'
                      } ${isHighlighted ? 'border-2 border-indigo-500 font-black text-indigo-700 bg-indigo-500/[0.04]' : ''}`}
                    >
                      {t.incidencias}
                    </td>
                  );
                })}
                <td className="p-3 font-mono font-black text-indigo-700 bg-indigo-50 border-l border-slate-200">
                  {grandTotalIncidencias}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Incidents List Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <List className="h-4 w-4 text-indigo-600" />
            Registro Técnico y Log de Alertas
          </h4>
          
          {/* SEARCH & FILTER CONTROLS FOR LOG TABLE */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto" id="incidencias-table-filters">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Buscar por N.º, ubicación, observaciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                id="search-incidencias"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedTecnica}
                onChange={(e) => setSelectedTecnica(e.target.value as 'ALL' | 'TELEMANDO' | 'RACA' | 'RACO')}
                className="bg-transparent border-none text-slate-600 text-xs font-semibold focus:outline-none cursor-pointer"
                id="filter-incidencias-tecnica"
              >
                <option value="ALL">Todas las Técnicas</option>
                <option value="TELEMANDO">TELEMANDO</option>
                <option value="RACA">RACA</option>
                <option value="RACO">RACO</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto shadow-xs">
          {filteredIncidencias.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50/50">
              No hay incidencias que coincidan con los filtros seleccionados en este período ({getPeriodLabel()}).
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 uppercase tracking-wider text-[10px] z-10">
                <tr>
                  <th className="p-3">N.º INCIDENCIA</th>
                  <th className="p-3">FECHA</th>
                  <th className="p-3">TÉCNICA</th>
                  <th className="p-3">UBICACIÓN</th>
                  <th className="p-3">IMPUTACIÓN</th>
                  <th className="p-3">OBSERVACIONES</th>
                  <th className="p-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650 bg-white">
                {filteredIncidencias.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-800">{inc.numeroIncidencia || inc.id}</td>
                    <td className="p-3 font-mono text-slate-600">{inc.fecha || `${getMonthLabel(inc.month)} 2026`}</td>
                    <td className="p-3">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded text-[10px] font-bold">
                        {inc.tecnica || inc.subsystem}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{inc.ubicacion || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                        (inc.imputacion || inc.tipo).toLowerCase().includes('propia') ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inc.imputacion || inc.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 italic max-w-xs truncate font-medium" title={inc.observaciones || inc.descripcion}>
                      {inc.observaciones || inc.descripcion}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteIncidencia(inc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar Incidencia"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CENTRO DE REPORTES Y DESCARGAS POR PERIODO */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-5" id="incidencias-reports-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 font-display">Descargas e Informes de Incidencias por Periodo</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">Configure el intervalo de tiempo y exporte informes personalizados de incidencias en formatos PDF o Excel estructurados</p>
            </div>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={async () => {
                let chartImg = '';
                try {
                  const el = document.getElementById('chart-distribucion-incidencias');
                  if (el) {
                    const { toPng } = await import('html-to-image');
                    chartImg = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff' });
                  }
                } catch (err) {
                  console.error("Error capturing incidences chart:", err);
                }
                exportIncidenciasToPDF(filteredIncidencias, getPeriodLabel(), contractor, chartImg);
              }}
              disabled={filteredIncidencias.length === 0}
              className={`flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs`}
              title="Descargar reporte de incidencias PDF con diseño ejecutivo profesional"
              id="btn-export-incidencias-pdf"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              onClick={() => {
                exportIncidenciasToExcel(filteredIncidencias, getPeriodLabel(), contractor);
              }}
              disabled={filteredIncidencias.length === 0}
              className={`flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs`}
              title="Descargar base de datos filtrada de incidencias en formato Excel"
              id="btn-export-incidencias-excel"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Active Month Information Banner */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/30 rounded-xl px-3 py-2 text-xs text-indigo-800 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              Mostrando y exportando exclusivamente las <strong>{filteredIncidencias.length}</strong> incidencias registradas en el mes de <strong>{getMonthLabel(currentMonth).toUpperCase()} 2026</strong>.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
