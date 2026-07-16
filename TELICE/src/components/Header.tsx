/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { ProjectSettings } from '../types';

interface HeaderProps {
  settings: ProjectSettings;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onResetData: () => void;
  lastUpdated: string;
  isExportingPDF?: boolean;
  isExportingExcel?: boolean;
}

export default function Header({
  settings,
  onExportPDF,
  onExportExcel,
  onResetData,
  lastUpdated,
  isExportingPDF = false,
  isExportingExcel = false
}: HeaderProps) {
  return (
    <header className="bg-white text-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-200/80 mb-8" id="app-header">
      {/* Logos & Branding Bar */}
      <div className="bg-slate-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-600/10 px-3 py-1.5 rounded-lg border border-indigo-100">
            <span className="text-indigo-600 font-extrabold tracking-wider text-sm font-display">adif</span>
            <span className="text-indigo-900/80 text-[10px] font-bold leading-none border-l border-indigo-200 pl-2">ALTA VELOCIDAD</span>
          </div>
          <div className="text-slate-300 font-mono text-xs hidden sm:inline-block">|</div>
          <div className="text-slate-600 font-semibold tracking-wider text-xs bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs">
            MANTENEDOR: <span className="text-indigo-600 font-extrabold">{settings.contractor}</span>
          </div>
        </div>

        {/* Action Button Suite */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetData}
            disabled={isExportingExcel || isExportingPDF}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 border border-slate-200 shadow-xs cursor-pointer"
            title="Restablecer datos predeterminados"
            id="btn-reset"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-hover" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
          
          <button
            onClick={onExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 shadow-xs shadow-emerald-600/10 cursor-pointer"
            id="btn-export-excel"
          >
            <FileSpreadsheet className={`h-3.5 w-3.5 ${isExportingExcel ? 'animate-spin' : ''}`} />
            <span>{isExportingExcel ? 'Generando...' : 'Excel'}</span>
          </button>
          
          <button
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 shadow-xs shadow-rose-600/10 cursor-pointer"
            id="btn-export-pdf"
          >
            <FileText className={`h-3.5 w-3.5 ${isExportingPDF ? 'animate-spin' : ''}`} />
            <span>{isExportingPDF ? 'Generando...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Metadata Display */}
      <div className="p-6 md:p-8 bg-linear-to-b from-white to-slate-50/20 border-l-4 border-l-indigo-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-indigo-700 font-mono text-[10px] font-bold uppercase tracking-wider bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-150 shadow-2xs">
            SEGUIMIENTO DE CONTRATO
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-150 text-[10px] font-bold tracking-wider uppercase shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            CONTRATO ACTIVO
          </span>
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-4 leading-tight font-display">
          Mantenimiento de las Instalaciones de Telemando de Energía
        </h1>
        <p className="text-slate-500 text-sm mt-2 max-w-4xl leading-relaxed">
          Línea de Alta Velocidad Madrid – Levante. Tramo: <span className="text-slate-800 font-semibold">Albacete - Alicante</span>.
        </p>

        {/* Info Pill Badges */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 items-center">
          <div className="flex items-center gap-1.5">Año fiscal: <strong className="text-indigo-900 font-bold bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100/40">2026</strong></div>
          <div className="text-slate-200 hidden sm:inline">•</div>
          <div className="flex items-center gap-1.5">Última actualización: <strong className="text-slate-700 font-semibold">{lastUpdated}</strong></div>
        </div>
      </div>
    </header>
  );
}
