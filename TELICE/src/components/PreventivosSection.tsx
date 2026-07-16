/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Check, AlertTriangle, Activity, TrendingUp, Copy, Download } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { MonthlyRecord, Month } from '../types';
import { MONTH_LABELS } from '../data';

interface PreventivosSectionProps {
  records: MonthlyRecord[];
  currentMonth: Month;
  showOnly?: 'mensual' | 'anual';
}

const renderConseguidoLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) return null;

  const fitsInside = height > 22;
  if (fitsInside) {
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        {numValue.toFixed(1).replace('.', ',')}%
      </text>
    );
  } else {
    const isRightHalf = x > 120;
    const labelX = isRightHalf ? x - 15 : x + width + 15;
    const textAnchor = isRightHalf ? 'end' : 'start';
    const lineEndX = isRightHalf ? labelX + 3 : labelX - 3;
    
    return (
      <g>
        <line
          x1={x + width / 2}
          y1={y + height / 2}
          x2={lineEndX}
          y2={y + height / 2}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        <text
          x={labelX}
          y={y + height / 2 + 3}
          fill="#475569"
          textAnchor={textAnchor}
          fontSize={9}
          fontWeight="extrabold"
        >
          {numValue.toFixed(1).replace('.', ',')}%
        </text>
      </g>
    );
  }
};

const renderPendienteLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) return null;

  const fitsInside = height > 22;
  if (fitsInside) {
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        {numValue.toFixed(1).replace('.', ',')}%
      </text>
    );
  } else {
    return (
      <g>
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y - 6}
          stroke="#475569"
          strokeWidth={1}
        />
        <text
          x={x + width / 2}
          y={y - 10}
          fill="#475569"
          textAnchor="middle"
          fontSize={9}
          fontWeight="extrabold"
        >
          {numValue.toFixed(1).replace('.', ',')}%
        </text>
      </g>
    );
  }
};

const renderDesviacionPositivaLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) return null;

  const fitsInside = height > 22;
  if (fitsInside) {
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        +{numValue.toFixed(1).replace('.', ',')}%
      </text>
    );
  } else {
    return (
      <g>
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y - 6}
          stroke="#3b82f6"
          strokeWidth={1}
        />
        <text
          x={x + width / 2}
          y={y - 10}
          fill="#1d4ed8"
          textAnchor="middle"
          fontSize={9}
          fontWeight="extrabold"
        >
          +{numValue.toFixed(1).replace('.', ',')}%
        </text>
      </g>
    );
  }
};

export default function PreventivosSection({ records, currentMonth, showOnly }: PreventivosSectionProps) {
  const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

  const monthlyChartRef = React.useRef<HTMLDivElement>(null);
  const monthlyTotalChartRef = React.useRef<HTMLDivElement>(null);
  const annualChartRef = React.useRef<HTMLDivElement>(null);
  const monthlyChartsCombinedRef = React.useRef<HTMLDivElement>(null);

  const [copyStateMonthly, setCopyStateMonthly] = React.useState<'idle' | 'success' | 'fallback' | 'error'>('idle');
  const [copyStateMonthlyTotal, setCopyStateMonthlyTotal] = React.useState<'idle' | 'success' | 'fallback' | 'error'>('idle');
  const [copyStateAnnual, setCopyStateAnnual] = React.useState<'idle' | 'success' | 'fallback' | 'error'>('idle');
  const [copyStateMonthlyCombined, setCopyStateMonthlyCombined] = React.useState<'idle' | 'success' | 'fallback' | 'error'>('idle');

  const handleCopyChart = async (
    ref: React.RefObject<HTMLDivElement | null>,
    setCopyState: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'fallback' | 'error'>>,
    filename: string
  ) => {
    if (!ref.current) return;
    try {
      // Focus the window first to satisfy browser requirements for clipboard operations
      window.focus();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const blob = await toBlob(ref.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        filter: (node) => {
          if (node instanceof HTMLElement && node.getAttribute('data-screenshot-exclude') === 'true') {
            return false;
          }
          return true;
        }
      });

      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          setCopyState('success');
          setTimeout(() => setCopyState('idle'), 2000);
        } catch (clipboardError) {
          console.warn('Clipboard write blocked, attempting fallback to download:', clipboardError);
          // If clipboard write is blocked (e.g. inside sandboxed iframe without clipboard-write permission),
          // fallback to downloading the image automatically.
          const dataUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${filename}.png`;
          link.href = dataUrl;
          link.click();
          URL.revokeObjectURL(dataUrl);

          setCopyState('fallback');
          setTimeout(() => setCopyState('idle'), 3000);
        }
      } else {
        throw new Error('No blob generated');
      }
    } catch (error) {
      console.error('Error copying image:', error);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  const handleDownloadChart = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        filter: (node) => {
          if (node instanceof HTMLElement && node.getAttribute('data-screenshot-exclude') === 'true') {
            return false;
          }
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // --- ANNUAL CALCULATIONS ---
  const subsystems: ('PLO' | 'RACA' | 'RACO')[] = ['PLO', 'RACA', 'RACO'];

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
  const currentMonthIdx = MONTH_ORDER.indexOf(currentMonth);
  const activeMonths = MONTH_ORDER.slice(0, currentMonthIdx + 1);

  const annualStats = subsystems.map((sub) => {
    // Expected programado up to currentMonth
    const ytdGoal = records
      .filter((r) => activeMonths.includes(r.month))
      .reduce((acc, r) => acc + r[sub].programado, 0);

    const totalDone = records.reduce((acc, r) => acc + r[sub].realizado, 0);
    const annualTotalGoal = records.reduce((acc, r) => acc + r[sub].programado, 0);
    
    // Progress relative to the final annual total goal (Avance respecto al Anual)
    const pctOfAnnual = annualTotalGoal > 0 ? (totalDone / annualTotalGoal) * 100 : 0;
    
    // Deviation over what is expected up to that month (planned) (Desviación respecto a lo planificado)
    const deviation = ytdGoal > 0 ? ((totalDone - ytdGoal) / ytdGoal) * 100 : 0;
    
    // % Accumulated relative to the plan up to that month
    const pctAccumulated = ytdGoal > 0 ? (totalDone / ytdGoal) * 100 : 0;

    return {
      sub,
      totalGoal: ytdGoal,
      totalDone,
      deviation,
      pctAccumulated,
      pctOfAnnual,
      fullAnnualGoal: annualTotalGoal,
    };
  });

  const annualTotalGoal = annualStats.reduce((acc, s) => acc + s.totalGoal, 0);
  const annualTotalDone = annualStats.reduce((acc, s) => acc + s.totalDone, 0);
  const annualTotalPct = annualTotalGoal > 0 ? (annualTotalDone / annualTotalGoal) * 100 : 0;
  const annualTotalDeviation = annualTotalGoal > 0 ? ((annualTotalDone - annualTotalGoal) / annualTotalGoal) * 100 : 0;

  // Compute the overall annual total goal (for 12 months)
  const overallAnnualTotalGoal = records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const overallPctOfAnnual = overallAnnualTotalGoal > 0 ? (annualTotalDone / overallAnnualTotalGoal) * 100 : 0;

  // Setup horizontal stacked bar data (to match mockup format precisely)
  const executedPct = overallAnnualTotalGoal > 0 ? (annualTotalDone / overallAnnualTotalGoal) * 100 : 0;
  const plannedYtdPct = overallAnnualTotalGoal > 0 ? (annualTotalGoal / overallAnnualTotalGoal) * 100 : 0;

  let ejecutadoVal = executedPct;
  let desviacionNegVal = 0;
  let desviacionPosVal = 0;
  let pendienteVal = Math.max(0, 100 - executedPct);

  if (executedPct < plannedYtdPct) {
    ejecutadoVal = executedPct;
    desviacionNegVal = plannedYtdPct - executedPct;
    pendienteVal = 100 - plannedYtdPct;
  } else {
    ejecutadoVal = plannedYtdPct;
    desviacionPosVal = executedPct - plannedYtdPct;
    pendienteVal = 100 - executedPct;
  }

  const annualStackedData = [
    {
      name: 'Porcentaje Ejecución',
      'EJECUTADO': parseFloat(ejecutadoVal.toFixed(2)),
      'DESVIACIÓN -': parseFloat(desviacionNegVal.toFixed(2)),
      'DESVIACIÓN +': parseFloat(desviacionPosVal.toFixed(2)),
      'PENDIENTE 2026': parseFloat(pendienteVal.toFixed(2)),
    }
  ];

  const xTicks = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, 10, ..., 100

  // Grouped bar chart data for the annual progress visualizer
  const annualChartDataGrouped = [
    ...subsystems.map((sub) => {
      const stat = annualStats.find(s => s.sub === sub)!;
      return {
        name: sub,
        'Avance s/ Anual': parseFloat(stat.pctOfAnnual.toFixed(2)),
        'Desviación s/ Plan': parseFloat(stat.deviation.toFixed(2)),
      };
    }),
    {
      name: 'TOTAL',
      'Avance s/ Anual': parseFloat(overallPctOfAnnual.toFixed(2)),
      'Desviación s/ Plan': parseFloat(annualTotalDeviation.toFixed(2)),
    }
  ];

  // --- MONTHLY CALCULATIONS (For activeMonth) ---
  const activeRecord = records.find((r) => r.month === currentMonth) || records[5]; // default to June

  const monthlyStats = subsystems.map((sub) => {
    const prog = activeRecord[sub].programado;
    const real = activeRecord[sub].realizado;
    const consecucion = prog > 0 ? (real / prog) * 100 : 0;
    const deviation = prog > 0 ? ((real - prog) / prog) * 100 : 0;
    const deviationPlus = real > prog ? ((real - prog) / prog) * 100 : 0;
    const deviationMinus = real < prog ? ((prog - real) / prog) * 100 : 0;

    return {
      sub,
      prog,
      real,
      consecucion,
      deviation,
      deviationPlus,
      deviationMinus,
    };
  });

  const monthlyTotalProg = monthlyStats.reduce((acc, s) => acc + s.prog, 0);
  const monthlyTotalReal = monthlyStats.reduce((acc, s) => acc + s.real, 0);
  const monthlyTotalConsecucion = monthlyTotalProg > 0 ? (monthlyTotalReal / monthlyTotalProg) * 100 : 0;
  const monthlyTotalDeviation = monthlyTotalProg > 0 ? ((monthlyTotalReal - monthlyTotalProg) / monthlyTotalProg) * 100 : 0;

  // Monthly Subsystems Chart Data
  const monthlyChartData: {
    name: string;
    Conseguido: number;
    Pendiente: number;
    DesviacionPositiva: number;
  }[] = monthlyStats.map((s) => {
    const conseguido = Math.min(s.consecucion, 100);
    const pendiente = Math.max(0, 100 - s.consecucion);
    const desviacionPositiva = Math.max(0, s.consecucion - 100);
    return {
      name: s.sub,
      Conseguido: parseFloat(conseguido.toFixed(2)),
      Pendiente: parseFloat(pendiente.toFixed(2)),
      DesviacionPositiva: parseFloat(desviacionPositiva.toFixed(2)),
    };
  });

  // Independent Monthly Total Chart Data
  const totalConseguido = Math.min(monthlyTotalConsecucion, 100);
  const totalPendiente = Math.max(0, 100 - monthlyTotalConsecucion);
  const totalDesviacionPositiva = Math.max(0, monthlyTotalConsecucion - 100);
  const monthlyTotalChartData: {
    name: string;
    Conseguido: number;
    Pendiente: number;
    DesviacionPositiva: number;
  }[] = [{
    name: 'TOTAL',
    Conseguido: parseFloat(totalConseguido.toFixed(2)),
    Pendiente: parseFloat(totalPendiente.toFixed(2)),
    DesviacionPositiva: parseFloat(totalDesviacionPositiva.toFixed(2)),
  }];

  return (
    <div className="space-y-8" id="preventivos-section">
      
      {/* 1. SECCIÓN MENSUAL */}
      {(!showOnly || showOnly === 'mensual') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Seguimiento Preventivo Mensual (Mes: <span className="text-emerald-600 capitalize font-extrabold">{getMonthLabel(currentMonth)} 2026</span>)</h3>
              <p className="text-slate-500 text-xs font-medium">Análisis detallado de la consecución preventiva programada para el mes</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" data-screenshot-exclude="true">
            <button
              onClick={() => handleCopyChart(monthlyChartsCombinedRef, setCopyStateMonthlyCombined, `mantenimiento-preventivo-mensual-combinadas-${getMonthLabel(currentMonth).toLowerCase()}-2026`)}
              title="Copiar ambas gráficas mensuales juntas"
              className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition ${
                copyStateMonthlyCombined === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : copyStateMonthlyCombined === 'fallback'
                  ? 'bg-blue-50 text-blue-750 border-blue-200'
                  : copyStateMonthlyCombined === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-200 shadow-xs'
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>
                {copyStateMonthlyCombined === 'success' ? '¡Gráficas Copiadas!' : 'Copiar Ambas'}
              </span>
            </button>
            <button
              onClick={() => handleDownloadChart(monthlyChartsCombinedRef, `mantenimiento-preventivo-mensual-combinadas-${getMonthLabel(currentMonth).toLowerCase()}-2026`)}
              title="Descargar ambas gráficas mensuales como imagen"
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Descargar Ambas</span>
            </button>
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-100">
              Mantenimiento Mensual
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Table */}
          <div className="xl:col-span-5 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3">SISTEMA (RED)</th>
                    <th className="p-3 text-right">PREVISTO</th>
                    <th className="p-3 text-right">EJECUTADO</th>
                    <th className="p-3 text-right">CONSECUCIÓN</th>
                    <th className="p-3 text-right">EJECUTADO %</th>
                    <th className="p-3 text-right">DESVIACIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {monthlyStats.map((stat) => (
                    <tr key={stat.sub} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-semibold text-slate-800">{stat.sub}</td>
                      <td className="p-3 text-right font-mono font-medium">{stat.prog}</td>
                      <td className="p-3 text-right font-mono font-medium">{stat.real}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50">
                        {stat.consecucion.toFixed(2).replace('.', ',')}%
                      </td>
                      <td className="p-3 text-right font-mono font-medium">{stat.consecucion.toFixed(2).replace('.', ',')}%</td>
                      <td className={`p-3 text-right font-mono font-medium ${
                        stat.deviation > 0 
                          ? 'text-emerald-600' 
                          : stat.deviation < 0 
                          ? 'text-rose-600' 
                          : 'text-slate-400'
                      }`}>
                        {stat.deviation > 0 ? '+' : ''}
                        {stat.deviation.toFixed(2).replace('.', ',')}%
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-indigo-50/70 text-indigo-950 font-extrabold border-t-2 border-indigo-200 text-xs shadow-inner hover:bg-indigo-100/60 transition">
                    <td className="p-3 font-black text-indigo-900 tracking-wider">TOTAL</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{monthlyTotalProg}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{monthlyTotalReal}</td>
                    <td className="p-3 text-right font-mono text-emerald-800 bg-emerald-100/50 border-l border-emerald-200 font-black">
                      {monthlyTotalConsecucion.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{monthlyTotalConsecucion.toFixed(2).replace('.', ',')}%</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      monthlyTotalDeviation > 0 
                        ? 'text-emerald-700' 
                        : monthlyTotalDeviation < 0 
                        ? 'text-rose-700' 
                        : 'text-slate-500'
                    }`}>
                      {monthlyTotalDeviation > 0 ? '+' : ''}
                      {monthlyTotalDeviation.toFixed(2).replace('.', ',')}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Success Box */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full border border-emerald-200/50">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ejecución del mantenimiento preventivo mensual</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Grado total de consecución mensual para {getMonthLabel(currentMonth)} 2026</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-700 font-display">
                  {monthlyTotalConsecucion.toFixed(2).replace('.', ',')}%
                </span>
              </div>
            </div>
          </div>

          {/* Contenedor combinado de las dos gráficas */}
          <div 
            ref={monthlyChartsCombinedRef} 
            id="chart-preventivos-mensual-combinado"
            className="xl:col-span-7 grid grid-cols-1 md:grid-cols-7 gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-200/40"
          >
            {/* Bar Chart Subsystems */}
            <div 
              ref={monthlyChartRef}
              className="md:col-span-4 bg-slate-50 border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between shadow-xs relative"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Redes Telemando (%)
                </h4>
                <div className="flex items-center gap-1" data-screenshot-exclude="true">
                  <button
                    onClick={() => handleCopyChart(monthlyChartRef, setCopyStateMonthly, `mantenimiento-preventivo-mensual-${getMonthLabel(currentMonth).toLowerCase()}-2026`)}
                    title="Copiar gráfica"
                    className={`p-1 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition rounded-md border ${
                      copyStateMonthly === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : copyStateMonthly === 'fallback'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : copyStateMonthly === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Copy className="h-2.5 w-2.5" />
                    <span>
                      {copyStateMonthly === 'success' ? 'Copiado' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9 }} />
                    <YAxis domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]} tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: 9 }} />
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 10 }} />
                    <Bar dataKey="Conseguido" stackId="a" fill="#10b981" name="CONSEGUIDO">
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-conseguido-${index}`} fill="#10b981" />
                      ))}
                      <LabelList dataKey="Conseguido" content={renderConseguidoLabel} />
                    </Bar>
                    <Bar dataKey="Pendiente" stackId="a" fill="#ef4444" name="PENDIENTE">
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-pendiente-${index}`} fill="#ef4444" />
                      ))}
                      <LabelList dataKey="Pendiente" content={renderPendienteLabel} />
                    </Bar>
                    <Bar dataKey="DesviacionPositiva" stackId="a" fill="#3b82f6" name="DESVIACIÓN POSITIVA" radius={[4, 4, 0, 0]}>
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-desviacion-${index}`} fill="#3b82f6" />
                      ))}
                      <LabelList dataKey="DesviacionPositiva" content={renderDesviacionPositivaLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-2.5 mt-4 text-[9px] font-bold text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#10b981] rounded-xs"></span>
                  <span>CONSEGUIDO</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#ef4444] rounded-xs"></span>
                  <span>PENDIENTE</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#3b82f6] rounded-xs"></span>
                  <span>DESVIACIÓN +</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Total */}
            <div 
              ref={monthlyTotalChartRef}
              className="md:col-span-3 bg-slate-50 border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between shadow-xs relative"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  TOTAL (%)
                </h4>
                <div className="flex items-center gap-1" data-screenshot-exclude="true">
                  <button
                    onClick={() => handleCopyChart(monthlyTotalChartRef, setCopyStateMonthlyTotal, `mantenimiento-preventivo-total-${getMonthLabel(currentMonth).toLowerCase()}-2026`)}
                    title="Copiar gráfica"
                    className={`p-1 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition rounded-md border ${
                      copyStateMonthlyTotal === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : copyStateMonthlyTotal === 'fallback'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : copyStateMonthlyTotal === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Copy className="h-2.5 w-2.5" />
                    <span>
                      {copyStateMonthlyTotal === 'success' ? 'Copiado' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTotalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9 }} />
                    <YAxis domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]} tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: 9 }} />
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 10 }} />
                    <Bar dataKey="Conseguido" stackId="a" fill="#10b981" name="CONSEGUIDO">
                      {monthlyTotalChartData.map((entry, index) => (
                        <Cell key={`cell-total-conseguido-${index}`} fill="#10b981" />
                      ))}
                      <LabelList dataKey="Conseguido" content={renderConseguidoLabel} />
                    </Bar>
                    <Bar dataKey="Pendiente" stackId="a" fill="#ef4444" name="PENDIENTE">
                      {monthlyTotalChartData.map((entry, index) => (
                        <Cell key={`cell-total-pendiente-${index}`} fill="#ef4444" />
                      ))}
                      <LabelList dataKey="Pendiente" content={renderPendienteLabel} />
                    </Bar>
                    <Bar dataKey="DesviacionPositiva" stackId="a" fill="#3b82f6" name="DESVIACIÓN POSITIVA" radius={[4, 4, 0, 0]}>
                      {monthlyTotalChartData.map((entry, index) => (
                        <Cell key={`cell-total-desviacion-${index}`} fill="#3b82f6" />
                      ))}
                      <LabelList dataKey="DesviacionPositiva" content={renderDesviacionPositivaLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-2.5 mt-4 text-[9px] font-bold text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#10b981] rounded-xs"></span>
                  <span>CONSEGUIDO</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#ef4444] rounded-xs"></span>
                  <span>PENDIENTE</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#3b82f6] rounded-xs"></span>
                  <span>DESVIACIÓN +</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 2. SECCIÓN ANUAL */}
      {(!showOnly || showOnly === 'anual') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Preventivo Anual (Acumulado 2026)</h3>
              <p className="text-slate-500 text-xs font-medium">Resumen del progreso total anual y grado de cumplimiento</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-slate-100 border border-slate-250/60 px-2.5 py-1 rounded-md">
              Vista Anual
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3">SISTEMA (RED)</th>
                    <th className="p-3 text-right">PREVISTO ANUAL</th>
                    <th className="p-3 text-right">PREVISTO HASTA {getMonthLabel(currentMonth).toUpperCase()}</th>
                    <th className="p-3 text-right">REALIZADO YTD</th>
                    <th className="p-3 text-right">DESVIACIÓN YTD</th>
                    <th className="p-3 text-right">% ACUMULADO YTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {annualStats.map((stat) => (
                    <tr key={stat.sub} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-semibold text-slate-800">{stat.sub}</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700 bg-slate-50/35">{stat.fullAnnualGoal}</td>
                      <td className="p-3 text-right font-mono font-medium">{stat.totalGoal}</td>
                      <td className="p-3 text-right font-mono font-medium">{stat.totalDone}</td>
                      <td className={`p-3 text-right font-mono font-medium ${
                        stat.deviation > 0 
                          ? 'text-emerald-600' 
                          : stat.deviation < 0 
                          ? 'text-rose-600' 
                          : 'text-slate-400'
                      }`}>
                        {stat.deviation > 0 ? '+' : ''}
                        {stat.deviation.toFixed(2).replace('.', ',')}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600 bg-indigo-500/[0.02]">
                        {stat.pctAccumulated.toFixed(2).replace('.', ',')}%
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-indigo-50/70 text-indigo-950 font-extrabold border-t-2 border-indigo-200 text-xs shadow-inner hover:bg-indigo-100/60 transition">
                    <td className="p-3 font-black text-indigo-900 tracking-wider">TOTAL</td>
                    <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-indigo-100/[0.05]">{overallAnnualTotalGoal}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{annualTotalGoal}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{annualTotalDone}</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      annualTotalDeviation > 0 
                        ? 'text-emerald-700' 
                        : annualTotalDeviation < 0 
                        ? 'text-rose-700' 
                        : 'text-slate-500'
                    }`}>
                      {annualTotalDeviation > 0 ? '+' : ''}
                      {annualTotalDeviation.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-800 bg-indigo-100/50 border-l border-emerald-200 font-black">
                      {annualTotalPct.toFixed(2).replace('.', ',')}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sub-KPI Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Previsto Acumulado (Hasta {getMonthLabel(currentMonth)})</span>
                <p className="text-lg font-black text-indigo-600 mt-1 font-display">{annualTotalGoal} <span className="text-xs font-semibold text-slate-500">Act.</span></p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Realizado Acumulado</span>
                <p className="text-lg font-black text-emerald-600 mt-1 font-display">{annualTotalDone} <span className="text-xs font-semibold text-slate-500">Act.</span></p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Grado de Avance (YTD)</span>
                <p className="text-lg font-black text-indigo-700 mt-1 font-display">{annualTotalPct.toFixed(2).replace('.', ',')}%</p>
              </div>
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-4" data-screenshot-exclude="true">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Progreso Global Anual</h4>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyChart(annualChartRef, setCopyStateAnnual, 'mantenimiento-preventivo-anual-acumulado')}
                  title="Copiar gráfica como imagen (o descargar como alternativa)"
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    copyStateAnnual === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : copyStateAnnual === 'fallback'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : copyStateAnnual === 'error'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Copy className="h-3 w-3" />
                  <span>
                    {copyStateAnnual === 'success'
                      ? 'Copiado'
                      : copyStateAnnual === 'fallback'
                      ? 'Descargado'
                      : copyStateAnnual === 'error'
                      ? 'Error'
                      : 'Copiar'}
                  </span>
                </button>
                <button
                  onClick={() => handleDownloadChart(annualChartRef, 'mantenimiento-preventivo-anual-acumulado')}
                  title="Descargar gráfica como imagen"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="h-3 w-3" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            {/* Blue-bordered box matching the user's mockup precisely */}
            <div 
              ref={annualChartRef}
              id="chart-preventivos-anual-acumulado"
              className="flex-1 flex flex-col justify-center bg-white border border-sky-400 p-6 rounded-[24px] shadow-xs relative min-h-[290px]"
            >
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={annualStackedData}
                    margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      ticks={xTicks}
                      tickFormatter={(v) => v % 10 === 0 ? `${v}%` : ''}
                      stroke="#64748b"
                      style={{ fontSize: 9 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={30}
                      tick={false}
                      axisLine={false}
                      label={{
                        value: 'Porcentaje Ejecución',
                        angle: -90,
                        position: 'insideLeft',
                        offset: -5,
                        style: {
                          textAnchor: 'middle',
                          fill: '#475569',
                          fontSize: 10,
                          fontWeight: '600'
                        }
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => `${parseFloat(value).toFixed(2).replace('.', ',')}%`}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 11 }}
                    />
                    <Bar dataKey="EJECUTADO" stackId="a" fill="#002060" barSize={50} name="EJECUTADO">
                      <LabelList
                        dataKey="EJECUTADO"
                        position="center"
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          if (value === undefined || value === null || value < 8) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 4}
                              fill="#ffffff"
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {parseFloat(value).toFixed(2).replace('.', ',')}%
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    <Bar dataKey="DESVIACIÓN -" stackId="a" fill="#ff0000" barSize={50} name="DESVIACIÓN -">
                      <LabelList
                        dataKey="DESVIACIÓN -"
                        position="center"
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          if (value === undefined || value === null || value < 8) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 4}
                              fill="#ffffff"
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="bold"
                            >
                              -{parseFloat(value).toFixed(2).replace('.', ',')}%
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    <Bar dataKey="DESVIACIÓN +" stackId="a" fill="#22c55e" barSize={50} name="DESVIACIÓN +">
                      <LabelList
                        dataKey="DESVIACIÓN +"
                        position="center"
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          if (value === undefined || value === null || value < 8) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 4}
                              fill="#ffffff"
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="bold"
                            >
                              +{parseFloat(value).toFixed(2).replace('.', ',')}%
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    <Bar dataKey="PENDIENTE 2026" stackId="a" fill="#d9d9d9" barSize={50} name="PENDIENTE 2026">
                      <LabelList
                        dataKey="PENDIENTE 2026"
                        position="center"
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          if (value === undefined || value === null || value < 8) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 4}
                              fill="#333333"
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {parseFloat(value).toFixed(2).replace('.', ',')}%
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Exact Centered Legend with bold tags */}
              <div className="flex flex-wrap justify-center items-center gap-6 mt-6 text-xs font-bold text-slate-700 tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#002060] rounded-sm"></span>
                  <span>EJECUTADO</span>
                </div>
                {executedPct < plannedYtdPct ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#ff0000] rounded-sm"></span>
                    <span>DESVIACIÓN -</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#22c55e] rounded-sm"></span>
                    <span>DESVIACIÓN +</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#d9d9d9] rounded-sm"></span>
                  <span>PENDIENTE 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
