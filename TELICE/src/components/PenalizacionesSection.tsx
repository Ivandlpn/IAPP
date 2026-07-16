/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Timer, Train, Percent } from 'lucide-react';
import { IncidenciaDetail, ProjectSettings, Month } from '../types';
import { MONTH_LABELS } from '../data';

interface PenalizacionesSectionProps {
  incidencias: IncidenciaDetail[];
  settings: ProjectSettings;
}

export default function PenalizacionesSection({ incidencias, settings }: PenalizacionesSectionProps) {
  const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

  // --- 1. FIABILIDAD (RELIABILITY) ---
  const activeMonthIncidenciasDetails = incidencias.filter((i) => {
    if (i.month !== settings.currentMonth) return false;
    if (!i.fecha) return true;
    const f = i.fecha.trim();
    return f.startsWith('2026') || f.endsWith('2026') || f.endsWith('/26') || f.endsWith('-26');
  });
  const activeMonthIncidencias = activeMonthIncidenciasDetails.length;
  
  // Filter incidences to 2026 to ensure the annual metric and penalties are strictly annual
  const activeYearIncs = incidencias.filter((i) => {
    if (!i.fecha) return false;
    const f = i.fecha.trim();
    return f.startsWith('2026') || f.endsWith('2026') || f.endsWith('/26') || f.endsWith('-26');
  });
  const acumuladoIncidenciasAnual = activeYearIncs.length;
  const maxAnual = settings.maxPenalizacionesAnuales;

  // Gauge calculations
  const pctGauge = Math.min(100, (acumuladoIncidenciasAnual / maxAnual) * 100);
  const needleRotation = -90 + (pctGauge / 100) * 180; // maps 0-100% to -90deg to +90deg

  const isPenalizacionFiabilidad = acumuladoIncidenciasAnual > maxAnual;

  // --- 2. TIEMPOS DE RESPUESTA (RESPONSE TIMES) ---
  
  const incidenciasExcedePresencia = activeMonthIncidenciasDetails.filter(
    (i) => i.tiempoPresenciaMin > settings.thresholdPresenciaMin
  ).length;

  const incidenciasExcedeReparacion = activeMonthIncidenciasDetails.filter(
    (i) => i.tiempoReparacionMin > settings.thresholdReparacionMin
  ).length;

  const isPenalizacionTiempos = incidenciasExcedePresencia > 0 || incidenciasExcedeReparacion > 0;

  // --- 3. DISPONIBILIDAD OPERACIONAL (OPERATIONAL AVAILABILITY) ---
  // Default theoretical total train operation minutes in Albacete-Alicante per month is e.g. 43200 mins.
  const baseMinsServicio = 43200;
  const totalRetrasosMin = activeMonthIncidenciasDetails.reduce((acc, i) => acc + i.retrasosMin, 0);
  const totalTrenesAfectados = activeMonthIncidenciasDetails.reduce((acc, i) => acc + i.trenesAfectados, 0);

  // DO = (tiempo total) / (tiempo total + retrasos)
  const disponibilidadOperacional =
    baseMinsServicio > 0 ? (baseMinsServicio / (baseMinsServicio + totalRetrasosMin)) * 100 : 100;

  // Penalty if availability falls below e.g. 99.8%
  const isPenalizacionDisponibilidad = disponibilidadOperacional < 99.8;

  // --- 4. PUNTUALIDAD (PUNCTUALITY) ---
  const trenesConRetrasoExcedido = activeMonthIncidenciasDetails.filter(
    (i) => i.retrasosMin > settings.thresholdRetrasoMin
  ).length;

  const isPenalizacionPuntualidad = trenesConRetrasoExcedido > 0;

  return (
    <div className="space-y-6" id="penalizaciones-section">
      
      {/* SECTION CONTAINER HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="bg-rose-50 text-rose-600 p-2 rounded-lg border border-rose-100">
            <AlertOctagon className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">Cuadro de Control de Penalizaciones</h3>
            <p className="text-slate-500 text-xs font-medium">Evaluación en tiempo real de los umbrales de servicio y penalizaciones de contrato</p>
          </div>
        </div>

        {/* 4 QUADRANTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* QUADRANT 1: FIABILIDAD */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Fiabilidad
              </h4>

              <div className="bg-white border border-slate-200/60 rounded-lg p-3 space-y-2 text-xs shadow-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Incidencias {getMonthLabel(settings.currentMonth)} 2026:</span>
                  <span className="font-mono font-bold text-slate-800">{activeMonthIncidencias}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Acumulado 2026:</span>
                  <span className="font-mono font-bold text-amber-600">{acumuladoIncidenciasAnual}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Máximo Tolerado:</span>
                  <span className="font-mono font-bold text-rose-600">{maxAnual}</span>
                </div>
              </div>

              {/* Gauge Arc representation */}
              <div className="flex flex-col items-center pt-2">
                <div className="relative w-28 h-14 overflow-hidden">
                  {/* Gauge Background (Semi-Circle Arc) */}
                  <div className="absolute top-0 left-0 w-28 h-28 rounded-full border-[10px] border-slate-100"></div>
                  {/* Color areas */}
                  <div className="absolute top-0 left-0 w-28 h-28 rounded-full border-[10px] border-transparent border-t-emerald-500 border-r-amber-500/30"></div>
                  {/* Overlaid Needle */}
                  <div
                    className="absolute bottom-0 left-1/2 w-1.5 h-12 bg-rose-500 origin-bottom rounded-full transition-transform duration-500"
                    style={{
                      transform: `translateX(-50%) rotate(${needleRotation}deg)`,
                    }}
                  ></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full"></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-2">
                  YTD: {acumuladoIncidenciasAnual} / {maxAnual} ({pctGauge.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Penalty Status box */}
            <div className={`mt-5 flex items-center justify-between p-2.5 rounded-lg text-xs font-bold ${
              isPenalizacionFiabilidad ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span>PENALIZACIÓN</span>
              <span>{isPenalizacionFiabilidad ? 'SÍ' : 'NO'}</span>
            </div>
          </div>

          {/* QUADRANT 2: TIEMPOS DE RESPUESTA */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-indigo-600" />
                Tiempos de Respuesta
              </h4>

              <div className="space-y-4 pt-2">
                <div className="bg-white border border-slate-200/60 p-3 rounded-lg text-center shadow-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold leading-none mb-1.5">
                    Tiempo Presencia &gt; {settings.thresholdPresenciaMin} min
                  </span>
                  <p className={`text-xl font-black ${incidenciasExcedePresencia > 0 ? 'text-rose-600 font-display' : 'text-emerald-600 font-display'}`}>
                    {incidenciasExcedePresencia}
                  </p>
                </div>

                <div className="bg-white border border-slate-200/60 p-3 rounded-lg text-center shadow-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold leading-none mb-1.5">
                    Tiempo Reparación &gt; {settings.thresholdReparacionMin / 60} h
                  </span>
                  <p className={`text-xl font-black ${incidenciasExcedeReparacion > 0 ? 'text-rose-600 font-display' : 'text-emerald-600 font-display'}`}>
                    {incidenciasExcedeReparacion}
                  </p>
                </div>
              </div>
            </div>

            {/* Penalty Status box */}
            <div className={`mt-5 flex items-center justify-between p-2.5 rounded-lg text-xs font-bold ${
              isPenalizacionTiempos ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span>PENALIZACIÓN</span>
              <span>{isPenalizacionTiempos ? 'SÍ' : 'NO'}</span>
            </div>
          </div>

          {/* QUADRANT 3: DISPONIBILIDAD OPERACIONAL */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-amber-600" />
                Disponibilidad (DO)
              </h4>

              <div className="bg-white border border-slate-200/60 rounded-lg p-3 space-y-2 text-xs shadow-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nº Trenes Afectados:</span>
                  <span className="font-mono font-bold text-slate-800">{totalTrenesAfectados}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Retraso acumulado:</span>
                  <span className="font-mono font-bold text-amber-600">{totalRetrasosMin} min</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Umbral Mínimo:</span>
                  <span className="font-mono font-bold text-slate-400">99,80%</span>
                </div>
              </div>

              {/* Index result display */}
              <div className="text-center py-2 bg-white border border-slate-200/60 rounded-lg shadow-xs">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">DO Calculado</span>
                <span className={`text-2xl font-black ${disponibilidadOperacional < 99.8 ? 'text-rose-600 font-display' : 'text-emerald-600 font-display'}`}>
                  {disponibilidadOperacional.toFixed(4).replace('.', ',')}%
                </span>
              </div>
            </div>

            {/* Penalty Status box */}
            <div className={`mt-5 flex items-center justify-between p-2.5 rounded-lg text-xs font-bold ${
              isPenalizacionDisponibilidad ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span>PENALIZACIÓN</span>
              <span>{isPenalizacionDisponibilidad ? 'SÍ' : 'NO'}</span>
            </div>
          </div>

          {/* QUADRANT 4: PUNTUALIDAD */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Train className="h-4 w-4 text-rose-500" />
                Puntualidad
              </h4>

              <div className="space-y-4 pt-2">
                <div className="bg-white border border-slate-200/60 p-4 rounded-lg text-center shadow-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold leading-none mb-2">
                    Retrasos de Trenes &gt; {settings.thresholdRetrasoMin} min
                  </span>
                  <p className={`text-3xl font-black ${trenesConRetrasoExcedido > 0 ? 'text-rose-600 font-display' : 'text-emerald-600 font-display'}`}>
                    {trenesConRetrasoExcedido}
                  </p>
                  <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                    Trenes retrasados por fallos imputados
                  </span>
                </div>
              </div>
            </div>

            {/* Penalty Status box */}
            <div className={`mt-5 flex items-center justify-between p-2.5 rounded-lg text-xs font-bold ${
              isPenalizacionPuntualidad ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span>PENALIZACIÓN</span>
              <span>{isPenalizacionPuntualidad ? 'SÍ' : 'NO'}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
