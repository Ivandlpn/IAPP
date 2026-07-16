/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Calendar, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { ProjectSettings, Month, DashboardWidgetConfig } from '../types';
import { MONTH_LABELS, CONTRACTOR_OPTIONS } from '../data';

interface ControlPanelProps {
  settings: ProjectSettings;
  onChangeSettings: (newSettings: Partial<ProjectSettings>) => void;
  widgets: DashboardWidgetConfig[];
  onToggleWidget: (id: string) => void;
}

export default function ControlPanel({
  settings,
  onChangeSettings,
  widgets,
  onToggleWidget
}: ControlPanelProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 mb-8" id="control-panel">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
        <Settings className="h-5 w-5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
        <h2 className="text-base font-bold text-slate-800 font-display">Filtros y Panel de Control Personalizable</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Month and Contractor Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Mes de Carga
            </label>
            <select
              value={settings.currentMonth}
              onChange={(e) => onChangeSettings({ currentMonth: e.target.value as Month })}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-slate-800 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium cursor-pointer transition"
              id="select-month"
            >
              {Object.entries(MONTH_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} (2026)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Empresa Mantenedora (Contratista)
            </label>
            <select
              value={settings.contractor}
              onChange={(e) => onChangeSettings({ contractor: e.target.value })}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-slate-800 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium cursor-pointer transition"
              id="select-contractor"
            >
              {CONTRACTOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Thresholds and Standards */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            Límites y Tolerancias
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Incidencias Máx. (Anual):</span>
              <input
                type="number"
                value={settings.maxPenalizacionesAnuales}
                onChange={(e) => onChangeSettings({ maxPenalizacionesAnuales: parseInt(e.target.value) || 0 })}
                className="w-16 bg-slate-50 text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Respuesta Presencia:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={settings.thresholdPresenciaMin}
                  onChange={(e) => onChangeSettings({ thresholdPresenciaMin: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-50 text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                />
                <span className="text-slate-400 text-[10px] font-medium">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Respuesta Reparación:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={settings.thresholdReparacionMin}
                  onChange={(e) => onChangeSettings({ thresholdReparacionMin: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-50 text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                />
                <span className="text-slate-400 text-[10px] font-medium">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard customization: Widget Toggles */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-rose-500" />
            Configurar Vistas Visibles
          </label>
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 max-h-[116px] overflow-y-auto">
            {widgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className={`w-full flex items-center justify-between text-left text-xs p-2 rounded-lg transition cursor-pointer ${
                  widget.visible
                    ? 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 font-semibold'
                    : 'hover:bg-slate-100/60 text-slate-400'
                }`}
              >
                <span className="truncate pr-2 font-medium">{widget.title}</span>
                {widget.visible ? (
                  <Eye className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Observations Input */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Observaciones Generales de la Carga de Datos
        </label>
        <textarea
          value={settings.observaciones}
          onChange={(e) => onChangeSettings({ observaciones: e.target.value })}
          className="w-full bg-slate-50 hover:bg-slate-100/40 text-slate-800 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-xs font-normal transition"
          rows={2}
          placeholder="Escriba observaciones relevantes para este mes de carga..."
          id="textarea-observaciones"
        />
      </div>
    </div>
  );
}
