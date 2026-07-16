/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Copy, Check } from 'lucide-react';
import { MonthlyRecord, IncidenciaDetail, ProjectSettings, Month } from '../types';
import { MONTH_LABELS } from '../data';

interface CuadroMandoSectionProps {
  records: MonthlyRecord[];
  incidencias: IncidenciaDetail[];
  settings: ProjectSettings;
  onIndicatorComputed: (kpis: { label: string; val: string }[]) => void;
}

export default function CuadroMandoSection({
  records,
  incidencias,
  settings,
  onIndicatorComputed
}: CuadroMandoSectionProps) {
  const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

  // --- COMPUTE KEY STATS IN REAL TIME ---

  const MONTH_ORDER: Month[] = [
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
    'diciembre'
  ];
  const currentMonthIdx = MONTH_ORDER.indexOf(settings.currentMonth);
  const activeMonths = MONTH_ORDER.slice(0, currentMonthIdx + 1);

  // 1. Annual preventive progress relative to overall annual total goal (mockup shows 52,28%)
  const overallAnnualTotalGoal = records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const totalRealAnual = records.filter((r) => activeMonths.includes(r.month)).reduce((acc, r) => acc + r.PLO.realizado + r.RACA.realizado + r.RACO.realizado, 0);
  const avanceAnualTrabajos = overallAnnualTotalGoal > 0 ? (totalRealAnual / overallAnnualTotalGoal) * 100 : 0;

  // 2. Cumulative compliance rate up to the active month (e.g. YTD progress vs planned YTD)
  const totalProgAnual = records
    .filter((r) => activeMonths.includes(r.month))
    .reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const pctAnual = totalProgAnual > 0 ? (totalRealAnual / totalProgAnual) * 100 : 0;

  // 3. Monthly preventive progress
  const activeRecord = records.find((r) => r.month === settings.currentMonth) || records[5];
  const totalProgMensual = activeRecord.PLO.programado + activeRecord.RACA.programado + activeRecord.RACO.programado;
  const totalRealMensual = activeRecord.PLO.realizado + activeRecord.RACA.realizado + activeRecord.RACO.realizado;
  const pctMensual = totalProgMensual > 0 ? (totalRealMensual / totalProgMensual) * 100 : 0;

  // Filter incidences to the current active year (2026) to ensure the reliability and annual metrics are strictly annual
  const activeYearIncs = incidencias.filter((i) => {
    if (!i.fecha) return false;
    const f = i.fecha.trim();
    return f.startsWith('2026') || f.endsWith('2026') || f.endsWith('/26') || f.endsWith('-26');
  });

  // 4. Reliability index (Telemando Energía) - Count only TELEMANDO subsystem incidences of the active month
  const activeIncidencias = incidencias.filter((i) => {
    if (i.month !== settings.currentMonth) return false;
    if (!i.fecha) return true;
    const f = i.fecha.trim();
    return f.startsWith('2026') || f.endsWith('2026') || f.endsWith('/26') || f.endsWith('-26');
  });
  const activeMonthTelemandoIncs = activeIncidencias.filter((i) => i.subsystem === 'TELEMANDO');
  const indicesFiabilidad = activeMonthTelemandoIncs.length;

  // 5. Availability monthly (DO) - standard (total minutes - delays) / total minutes
  const baseMinsServicio = 43200;
  const totalRetrasosMin = activeIncidencias.reduce((acc, i) => acc + i.retrasosMin, 0);
  const doMensual = baseMinsServicio > 0 ? Math.max(0, Math.min(100, ((baseMinsServicio - totalRetrasosMin) / baseMinsServicio) * 100)) : 100;

  // 6. Availability annual
  const totalRetrasosAnual = activeYearIncs.reduce((acc, i) => acc + i.retrasosMin, 0);
  const doAnual = (baseMinsServicio * 12) > 0 ? Math.max(0, Math.min(100, (((baseMinsServicio * 12) - totalRetrasosAnual) / (baseMinsServicio * 12)) * 100)) : 100;

  // Copy Feedback States
  const [copiedCol, setCopiedCol] = React.useState(false);
  const [copiedFull, setCopiedFull] = React.useState(false);

  // Formatting helpers
  const fmt = (v: number) => `${v.toFixed(2).replace('.', ',')}%`;

  // Rows strictly matching the mockup's content and structure
  const rows = [
    { id: 1, label: 'Avance Anual de los Trabajos de Mnto Preventivo', val: fmt(avanceAnualTrabajos), bg: 'bg-[#fff2cc]' },
    { id: 2, label: 'Mantenimiento Preventivo Programado', val: fmt(pctMensual), bg: 'bg-[#fff2cc]' },
    { id: 3, label: 'Mantenimiento Preventivo según Estado', val: '', bg: 'bg-[#f2f2f2]' },
    { id: 4, label: 'Mantenimiento Correctivo', val: '', bg: 'bg-[#f2f2f2]' },
    { id: 5, label: 'Índice de Fiabilidad (Telemando Energía)', val: String(indicesFiabilidad), bg: 'bg-[#fff2cc]' },
    { id: 6, label: 'Índice de Disponibilidad Mensual', val: fmt(doMensual), bg: 'bg-[#fff2cc]' },
    { id: 7, label: 'Índice de Disponibilidad Anual', val: fmt(doAnual), bg: 'bg-[#fff2cc]' },
    { id: 8, label: 'Impuntualidad de trenes mensuales', val: '', bg: 'bg-[#f2f2f2]' },
    { id: 9, label: 'Impuntualidad de trenes anuales', val: '', bg: 'bg-[#f2f2f2]' },
    { id: 10, label: 'Mantenibilidad (Mto. Preventivo mensual)', val: fmt(pctMensual), bg: 'bg-[#fff2cc]' },
    { id: 11, label: 'Mantenibilidad (Mto. Preventivo anual)', val: fmt(pctAnual), bg: 'bg-[#fff2cc]' },
    { id: 12, label: 'Mantenibilidad (T. Respuesta) [<90 min.]', val: '', bg: 'bg-[#f2f2f2]' },
    { id: 13, label: 'Mantenibilidad (T. Reparación) [<240 min.]', val: '', bg: 'bg-[#f2f2f2]' },
  ];

  // Inform parent of calculated indicators so they can be bundled in exports instantly!
  React.useEffect(() => {
    onIndicatorComputed(rows.map((r) => ({ label: r.label, val: r.val })));
  }, [avanceAnualTrabajos, pctMensual, indicesFiabilidad, doMensual, doAnual, pctAnual]);

  // Copy Column of values to clipboard (separated by \n)
  const handleCopyColumn = () => {
    const colText = rows.map(r => r.val).join('\n');
    navigator.clipboard.writeText(colText)
      .then(() => {
        setCopiedCol(true);
        setTimeout(() => setCopiedCol(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar la columna: ', err);
      });
  };

  // Copy Full Table (separated by tabs for Excel columns)
  const handleCopyFullTable = () => {
    const fullText = rows.map(r => `${r.label}\t${r.val}`).join('\n');
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar la tabla: ', err);
      });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6" id="cuadro-mando-section">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 font-display">Cuadro de Mando de Indicadores de Rendimiento (KPIs)</h3>
          <p className="text-slate-500 text-xs font-medium">Visualización sintética de los índices operativos del mes de <span className="text-amber-600 capitalize font-bold">{getMonthLabel(settings.currentMonth)} 2026</span></p>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Helper Action Bar for Copy Paste */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
          <div className="text-xs text-slate-500 max-w-md">
            <span className="font-bold text-slate-700 block mb-0.5">Integración con Archivo Oficial (Excel)</span>
            Copie la columna de valores completa con un solo clic. Los espacios vacíos se respetan perfectamente para alinearse al pegar en su archivo Excel.
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleCopyColumn}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 shadow-sm cursor-pointer ${
                copiedCol
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copiedCol ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedCol ? '¡Valores Copiados!' : 'Copiar Columna de Valores'}
            </button>
            <button
              onClick={handleCopyFullTable}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition duration-200 shadow-xs cursor-pointer ${
                copiedFull
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copiedFull ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
              {copiedFull ? '¡Tabla Copiada!' : 'Copiar Tabla Completa'}
            </button>
          </div>
        </div>

        {/* Indicators Table with exact mockup formatting */}
        <div className="overflow-x-auto rounded-xl border border-slate-250 shadow-xs bg-white">
          <table className="w-full border-collapse border border-slate-400 text-sm font-sans select-all">
            <thead>
              <tr className="bg-[#d9d9d9]">
                <th className="border border-slate-400 px-4 py-3 text-left font-bold italic text-black tracking-wide">
                  Índice
                </th>
                <th className="border border-slate-400 px-4 py-3 text-right font-bold italic text-black tracking-wide w-1/4">
                  Valor del Indicador
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`${row.bg} transition duration-100 hover:brightness-95`}>
                  <td className="border border-slate-400 px-4 py-2 text-left italic text-black font-normal">
                    {row.label}
                  </td>
                  <td className="border border-slate-400 px-4 py-2 text-right italic text-black font-bold font-mono">
                    {row.val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
