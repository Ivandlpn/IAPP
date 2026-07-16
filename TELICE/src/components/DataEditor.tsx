/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Info, Cpu, Radio, Wifi, Target, CheckCircle, Calculator, ChevronRight } from 'lucide-react';
import { MonthlyRecord, Month } from '../types';
import { MONTH_LABELS } from '../data';

interface DataEditorProps {
  records: MonthlyRecord[];
  onUpdateCell: (month: Month, subsystem: 'PLO' | 'RACA' | 'RACO', field: 'programado' | 'realizado', value: number) => void;
  currentMonth: Month;
}

export default function DataEditor({ records, onUpdateCell, currentMonth }: DataEditorProps) {
  const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6" id="data-editor-section">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100/80 shadow-2xs">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
              Editor de Datos de Origen 
              <span className="text-xs font-normal text-slate-400 font-sans">(Plantilla de Medición)</span>
            </h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Modifique la programación o ejecución de preventivos y observe la sincronización en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-50/80 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-indigo-100/60 shadow-3xs self-start sm:self-center">
          <Info className="h-3.5 w-3.5" />
          <span>Haga clic en cualquier celda para editar</span>
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-center uppercase tracking-wider text-[10px]">
              <th className="p-3.5 text-left sticky left-0 bg-slate-50/90 z-20 border-r border-slate-200/80 w-64 min-w-[240px] shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span>SISTEMA / ACTUACIONES</span>
                </div>
              </th>
              <th className="p-3.5 font-bold text-indigo-700 bg-indigo-50/30 border-r border-slate-200/80 w-24">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-indigo-500/80 font-semibold">TARGET</span>
                  <span>OBJ. ANUAL</span>
                </div>
              </th>
              {records.map((r) => {
                const isCurrent = r.month === currentMonth;
                return (
                  <th
                    key={r.month}
                    className={`p-2 min-w-[76px] capitalize font-mono text-[10px] transition-all relative ${
                      isCurrent 
                        ? 'bg-indigo-600 text-white font-extrabold border-x border-indigo-700 shadow-inner' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 bg-amber-400 text-slate-900 font-sans text-[8px] font-black rounded-b-sm border-x border-b border-amber-500 tracking-normal scale-90">
                        ACTIVO
                      </span>
                    )}
                    <span className="block mt-1">{getMonthLabel(r.month).substring(0, 3)}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            
            {/* PLO ROWS */}
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-indigo-600">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">PLO</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold border border-slate-200/40">Prog</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Puestos de Línea y Oficinas</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-slate-500 bg-slate-50/50 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.PLO.programado, 0)}
              </td>
              {records.map((r) => {
                const val = r.PLO.programado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20 border-x border-indigo-100/50' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'PLO', 'programado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-semibold border outline-hidden transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-slate-50/40 text-slate-400 border-slate-200/60 font-medium' 
                          : 'bg-white text-slate-800 border-slate-200 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">PLO</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100/40">Real</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Puestos de Línea y Oficinas</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.PLO.realizado, 0)}
              </td>
              {records.map((r) => {
                const val = r.PLO.realizado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20 border-x border-indigo-100/50' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'PLO', 'realizado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-bold border outline-hidden transition focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-emerald-50/15 text-emerald-400/80 border-emerald-100/60 font-medium' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-250/70 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>

            {/* SPACER */}
            <tr className="bg-slate-50/60 border-y border-slate-200/85">
              <td colSpan={15} className="px-4 py-1.5 text-[9px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/50">
                <span className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  SISTEMA DE RADIOCOMUNICACIONES ANALÓGICAS
                </span>
              </td>
            </tr>

            {/* RACA ROWS */}
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-indigo-600">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                    <Radio className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">RACA</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold border border-slate-200/40">Prog</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Radiocomunicaciones Analógicas</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-slate-500 bg-slate-50/50 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.RACA.programado, 0)}
              </td>
              {records.map((r) => {
                const val = r.RACA.programado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'RACA', 'programado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-semibold border outline-hidden transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-slate-50/40 text-slate-400 border-slate-200/60 font-medium' 
                          : 'bg-white text-slate-800 border-slate-200 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                    <Radio className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">RACA</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100/40">Real</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Radiocomunicaciones Analógicas</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.RACA.realizado, 0)}
              </td>
              {records.map((r) => {
                const val = r.RACA.realizado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20 shadow-3xs' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'RACA', 'realizado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-bold border outline-hidden transition focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-emerald-50/15 text-emerald-400/80 border-emerald-100/60 font-medium' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-250/70 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>

            {/* SPACER */}
            <tr className="bg-slate-50/60 border-y border-slate-200/85">
              <td colSpan={15} className="px-4 py-1.5 text-[9px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/50">
                <span className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  SISTEMA DE RADIOCOMUNICACIONES DIGITALES
                </span>
              </td>
            </tr>

            {/* RACO ROWS */}
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-indigo-600">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                    <Wifi className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">RACO</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold border border-slate-200/40">Prog</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Radiocomunicaciones Digitales</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-slate-500 bg-slate-50/50 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.RACO.programado, 0)}
              </td>
              {records.map((r) => {
                const val = r.RACO.programado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'RACO', 'programado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-semibold border outline-hidden transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-slate-50/40 text-slate-400 border-slate-200/60 font-medium' 
                          : 'bg-white text-slate-800 border-slate-200 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
            <tr className="hover:bg-slate-50/30 transition-colors">
              <td className="p-3 text-left sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                    <Wifi className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[12px]">RACO</span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100/40">Real</span>
                    </div>
                    <span className="text-slate-400 font-medium text-[9px] block leading-none mt-0.5">Radiocomunicaciones Digitales</span>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40 border-r border-slate-200/80">
                {records.reduce((acc, r) => acc + r.RACO.realizado, 0)}
              </td>
              {records.map((r) => {
                const val = r.RACO.realizado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-2 text-center font-mono transition-colors ${isCurrent ? 'bg-indigo-50/20' : ''}`}>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onUpdateCell(r.month, 'RACO', 'realizado', parseInt(e.target.value) || 0)}
                      className={`w-14 p-1.5 text-center text-xs rounded-lg font-bold border outline-hidden transition focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        val === 0 
                          ? 'bg-emerald-50/15 text-emerald-400/80 border-emerald-100/60 font-medium' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-250/70 shadow-3xs'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>

            {/* TOTAL MONTHLY SUMMARY SUM ROW */}
            <tr className="bg-slate-50/90 text-slate-800 font-bold border-t-2 border-slate-200 text-center relative z-10 shadow-xs">
              <td className="p-4.5 text-left sticky left-0 bg-slate-100/95 backdrop-blur-xs border-r border-slate-250 z-20 text-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.04)] border-l-4 border-l-indigo-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-xl border border-slate-300/60">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 text-[12px] tracking-tight block">SUMA TOTAL</span>
                    <span className="text-[10px] text-slate-500 font-semibold">(Todos los Sistemas)</span>
                  </div>
                </div>
              </td>
              <td className="p-4.5 font-mono font-black text-indigo-800 bg-indigo-50/50 border-r border-slate-250 text-[13px] shadow-inner">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-sm bg-indigo-100/80 text-[10px] text-indigo-700 border border-indigo-200 font-black">
                    {records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-[10px] text-emerald-850 border border-emerald-250 font-black">
                    {records.reduce((acc, r) => acc + r.PLO.realizado + r.RACA.realizado + r.RACO.realizado, 0)}
                  </span>
                </div>
              </td>
              {records.map((r) => {
                const sumProg = r.PLO.programado + r.RACA.programado + r.RACO.programado;
                const sumReal = r.PLO.realizado + r.RACA.realizado + r.RACO.realizado;
                const isCurrent = r.month === currentMonth;
                return (
                  <td key={r.month} className={`p-3 font-mono text-[11px] transition-all ${isCurrent ? 'bg-indigo-100/40 border-x border-indigo-200/60' : ''}`}>
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className={`block font-bold text-[10px] px-2 py-0.5 rounded-full ${sumProg === 0 ? 'bg-slate-100/50 text-slate-400 border border-slate-200/30' : 'bg-slate-100 text-slate-600 border border-slate-200/60'}`}>
                        {sumProg}
                      </span>
                      <span className={`block font-extrabold text-[10px] px-2 py-0.5 rounded-full border ${sumReal === 0 ? 'bg-emerald-50/10 text-emerald-400/70 border-emerald-100/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'}`}>
                        {sumReal}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

          </tbody>
        </table>
      </div>

    </div>
  );
}
