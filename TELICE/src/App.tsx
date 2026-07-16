/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Eye, Download, Info, CheckCircle, RotateCcw, Calendar, Activity, AlertCircle, AlertOctagon, LayoutDashboard, Database, Package, Pencil } from 'lucide-react';
import { toPng } from 'html-to-image';

import { MonthlyRecord, IncidenciaDetail, ProjectSettings, DashboardWidgetConfig, Month, MaterialItem } from './types';
import {
  INITIAL_MONTHLY_RECORDS,
  INITIAL_INCIDENCIAS_DETAILS,
  DEFAULT_SETTINGS,
  DEFAULT_WIDGETS,
  MONTH_LABELS,
  DEFAULT_MATERIALES
} from './data';

import Header from './components/Header';
import PreventivosSection from './components/PreventivosSection';
import IncidenciasSection from './components/IncidenciasSection';
import PenalizacionesSection from './components/PenalizacionesSection';
import CuadroMandoSection from './components/CuadroMandoSection';
import DataEditor from './components/DataEditor';
import MaterialesSection from './components/MaterialesSection';

import { exportToExcel, exportToPDF } from './utils/exportUtils';

export default function App() {
  // --- CORE STATE ---
  const [records, setRecords] = useState<MonthlyRecord[]>(() => {
    try {
      const stored = localStorage.getItem('telemando_records');
      return stored ? JSON.parse(stored) : INITIAL_MONTHLY_RECORDS;
    } catch {
      return INITIAL_MONTHLY_RECORDS;
    }
  });

  const [incidencias, setIncidencias] = useState<IncidenciaDetail[]>(() => {
    try {
      const stored = localStorage.getItem('telemando_incidencias');
      if (stored) {
        const parsed = JSON.parse(stored) as IncidenciaDetail[];
        if (parsed.length > 0 && !parsed[0].numeroIncidencia) {
          localStorage.setItem('telemando_incidencias', JSON.stringify(INITIAL_INCIDENCIAS_DETAILS));
          return INITIAL_INCIDENCIAS_DETAILS;
        }
        return parsed;
      }
      return INITIAL_INCIDENCIAS_DETAILS;
    } catch {
      return INITIAL_INCIDENCIAS_DETAILS;
    }
  });

  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const stored = localStorage.getItem('telemando_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const stored = localStorage.getItem('telemando_widgets');
      if (stored) {
        let parsed = JSON.parse(stored) as DashboardWidgetConfig[];
        // Check if we need to migrate/reset because of structural changes or old names
        const hasMateriales = parsed.some((w) => w.id === 'materiales');
        const hasCorrectTitles = parsed.some((w) => w.title === 'Preventivo Mensual' || w.title === 'Preventivos Mensual');
        if (!hasMateriales || !hasCorrectTitles || parsed.length !== DEFAULT_WIDGETS.length) {
          localStorage.setItem('telemando_widgets', JSON.stringify(DEFAULT_WIDGETS));
          return DEFAULT_WIDGETS;
        }
        // Force title updates for consistency
        parsed = parsed.map(w => {
          if (w.id === 'incidencias') return { ...w, title: 'Fiabilidad' };
          if (w.id === 'preventivos-anual') return { ...w, title: 'Preventivo Anual' };
          if (w.id === 'preventivos-mensual') return { ...w, title: 'Preventivo Mensual' };
          return w;
        });
        return parsed;
      }
      return DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const [materiales, setMateriales] = useState<MaterialItem[]>(() => {
    try {
      const stored = localStorage.getItem('telemando_materiales');
      if (stored) {
        const parsed = JSON.parse(stored) as MaterialItem[];
        if (parsed.length <= 5) {
          localStorage.setItem('telemando_materiales', JSON.stringify(DEFAULT_MATERIALES));
          return DEFAULT_MATERIALES;
        }
        return parsed;
      }
      return DEFAULT_MATERIALES;
    } catch {
      return DEFAULT_MATERIALES;
    }
  });

  const [computedKpis, setComputedKpis] = useState<{ label: string; val: string }[]>([]);
  
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [activeSection, setActiveSection] = useState<string>('preventivos-mensual');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'source-data'>('dashboard');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('widget-wrapper-', '');
            setActiveSection(id);
          }
        });
      },
      { threshold: 0.1, rootMargin: '-100px 0px -40% 0px' }
    );

    widgets.forEach((w) => {
      const el = document.getElementById(`widget-wrapper-${w.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [widgets]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`widget-wrapper-${id}`);
    if (element) {
      const yOffset = -90; // offset to clear sticky Month Filter
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  // --- SAVE STATE HELPER ---
  const saveState = (
    newRecords: MonthlyRecord[],
    newIncidencias: IncidenciaDetail[],
    newSettings: ProjectSettings,
    newWidgets: DashboardWidgetConfig[]
  ) => {
    localStorage.setItem('telemando_records', JSON.stringify(newRecords));
    localStorage.setItem('telemando_incidencias', JSON.stringify(newIncidencias));
    localStorage.setItem('telemando_settings', JSON.stringify(newSettings));
    localStorage.setItem('telemando_widgets', JSON.stringify(newWidgets));
    setLastUpdated(new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // --- CORE STATE HANDLERS ---
  const handleUpdateCell = (
    month: Month,
    subsystem: 'PLO' | 'RACA' | 'RACO',
    field: 'programado' | 'realizado',
    value: number
  ) => {
    const updated = records.map((r) => {
      if (r.month === month) {
        return {
          ...r,
          [subsystem]: {
            ...r[subsystem],
            [field]: value,
          },
        };
      }
      return r;
    });
    setRecords(updated);
    saveState(updated, incidencias, settings, widgets);
  };

  const handleAddIncidencia = (newInc: Omit<IncidenciaDetail, 'id'>) => {
    const id = `inc-${Date.now()}`;
    const fullInc: IncidenciaDetail = { ...newInc, id };
    const updated = [fullInc, ...incidencias];
    setIncidencias(updated);
    saveState(records, updated, settings, widgets);
  };

  const handleDeleteIncidencia = (id: string) => {
    const updated = incidencias.filter((i) => i.id !== id);
    setIncidencias(updated);
    saveState(records, updated, settings, widgets);
  };

  const handleChangeSettings = (newSettings: Partial<ProjectSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveState(records, incidencias, updated, widgets);
  };

  const handleToggleWidget = (id: string) => {
    const updated = widgets.map((w) => {
      if (w.id === id) {
        return { ...w, visible: !w.visible };
      }
      return w;
    });
    setWidgets(updated);
    saveState(records, incidencias, settings, updated);
  };

  const handleUpdateMaterial = (id: string, updatedFields: Partial<MaterialItem>) => {
    const updated = materiales.map((mat) => {
      if (mat.id === id) {
        return {
          ...mat,
          ...updatedFields,
        };
      }
      return mat;
    });
    setMateriales(updated);
    localStorage.setItem('telemando_materiales', JSON.stringify(updated));
    setLastUpdated(new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleDeleteMaterial = (id: string) => {
    const updated = materiales.filter((mat) => mat.id !== id);
    setMateriales(updated);
    localStorage.setItem('telemando_materiales', JSON.stringify(updated));
    setLastUpdated(new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleAddMaterial = (newMat: Omit<MaterialItem, 'id'>) => {
    const id = `mat-${Date.now()}`;
    const fullMat = { ...newMat, id };
    const updated = [...materiales, fullMat];
    setMateriales(updated);
    localStorage.setItem('telemando_materiales', JSON.stringify(updated));
    setLastUpdated(new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de que desea restablecer todos los datos a sus valores iniciales?')) {
      setRecords(INITIAL_MONTHLY_RECORDS);
      setIncidencias(INITIAL_INCIDENCIAS_DETAILS);
      setSettings(DEFAULT_SETTINGS);
      setWidgets(DEFAULT_WIDGETS);
      setMateriales(DEFAULT_MATERIALES);
      localStorage.setItem('telemando_materiales', JSON.stringify(DEFAULT_MATERIALES));
      saveState(INITIAL_MONTHLY_RECORDS, INITIAL_INCIDENCIAS_DETAILS, DEFAULT_SETTINGS, DEFAULT_WIDGETS);
    }
  };

  // --- EXPORT OPERATIONS ---
  const captureCharts = async () => {
    const originalTab = currentTab;
    if (originalTab !== 'dashboard') {
      setCurrentTab('dashboard');
      // Wait for tab switch and animations/charts to mount and render fully
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    const combinedMonthlyEl = document.getElementById('chart-preventivos-mensual-combinado');
    const annualEl = document.getElementById('chart-preventivos-anual-acumulado');
    const incidenciasEl = document.getElementById('chart-distribucion-incidencias');

    let chartMonthlyImg = '';
    let chartAnnualImg = '';
    let chartIncidenciasImg = '';

    const options = {
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        padding: '10px'
      }
    };

    if (combinedMonthlyEl) {
      try {
        chartMonthlyImg = await toPng(combinedMonthlyEl, options);
      } catch (err) {
        console.error("Error capturing monthly chart:", err);
      }
    }
    if (annualEl) {
      try {
        chartAnnualImg = await toPng(annualEl, options);
      } catch (err) {
        console.error("Error capturing annual chart:", err);
      }
    }
    if (incidenciasEl) {
      try {
        chartIncidenciasImg = await toPng(incidenciasEl, options);
      } catch (err) {
        console.error("Error capturing incidencias chart:", err);
      }
    }

    if (originalTab !== 'dashboard') {
      setCurrentTab(originalTab);
    }

    return { chartMonthlyImg, chartAnnualImg, chartIncidenciasImg };
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const charts = await captureCharts();
      await exportToExcel(records, incidencias, settings, computedKpis, charts);
    } catch (err) {
      console.error("Error exporting Excel:", err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const charts = await captureCharts();
      exportToPDF(records, incidencias, settings, computedKpis, charts);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // --- RENDERING CONFIG ---
  // Sorted list of widgets
  const activeWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Visual Subtle Glowing Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-[90%] w-full mx-auto space-y-8 relative">
        
        {/* HEADER SECTION */}
        <Header
          settings={settings}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onResetData={handleResetData}
          lastUpdated={lastUpdated}
          isExportingPDF={isExportingPDF}
          isExportingExcel={isExportingExcel}
        />

        {/* STICKY ANCHORED MONTH FILTER (ALWAYS VISIBLE) */}
        <div className="sticky top-2 z-50 bg-white/95 backdrop-blur-md border border-indigo-100/80 rounded-2xl shadow-md p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition duration-200" id="sticky-month-filter">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100 flex-shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 font-display">Filtro Temporal de Visualización y Registro</h3>
              <p className="text-slate-500 text-[10px] font-medium">Sincronización instantánea de preventivos, incidencias y KPIs para todo el cuadro de mandos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider hidden lg:inline flex-shrink-0">Mes de Trabajo:</span>
            <div className="flex rounded-lg overflow-x-auto bg-slate-50 border border-slate-200 p-1 w-full md:w-auto max-w-full scrollbar-none gap-0.5">
              {Object.entries(MONTH_LABELS).map(([key, label]) => {
                const isSelected = settings.currentMonth === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleChangeSettings({ currentMonth: key as Month })}
                    className={`px-3 py-1 text-xs rounded-md transition duration-150 font-bold whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                    }`}
                  >
                    {label.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TWO-COLUMN GRID LAYOUT (SIDEBAR + MAIN CONTENT AREA) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* STICKY SIDEBAR NAVIGATION */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-28 space-y-4" id="sidebar-navigation">
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 space-y-3">
              <div className="px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Navegación</span>
                <h4 className="text-xs font-black text-slate-800 font-display">Secciones del Informe</h4>
              </div>
              <nav className="space-y-1">
                {activeWidgets.filter((w) => w.visible && w.id !== 'source-data').map((w) => {
                  const isActive = currentTab === 'dashboard' && activeSection === w.id;

                  const getIcon = (id: string) => {
                    switch (id) {
                      case 'preventivos-anual': return <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      case 'preventivos-mensual': return <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      case 'incidencias': return <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      case 'materiales': return <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      case 'penalizaciones': return <AlertOctagon className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      case 'cuadro-mando': return <LayoutDashboard className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                      default: return <LayoutGrid className="h-4 w-4 mt-0.5 flex-shrink-0" />;
                    }
                  };
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setCurrentTab('dashboard');
                        setTimeout(() => {
                          scrollToSection(w.id);
                        }, 60);
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition duration-150 cursor-pointer text-left ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-2 shadow-xs'
                          : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      {getIcon(w.id)}
                      <span className="whitespace-normal break-words leading-relaxed">{w.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Separated highlighted button for "Origen de datos" */}
              {activeWidgets.some((w) => w.id === 'source-data' && w.visible) && (
                <div className="pt-2">
                  <div className="my-2.5 border-t border-slate-200/60"></div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block px-2 mb-1.5">
                    Modificación de Datos
                  </span>
                  <button
                    onClick={() => setCurrentTab('source-data')}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 text-xs font-black rounded-xl transition duration-200 cursor-pointer text-left border ${
                      currentTab === 'source-data'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-600/10'
                        : 'bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`h-4 w-4 flex-shrink-0 ${currentTab === 'source-data' ? 'text-white' : 'text-indigo-600'}`} />
                      <span className="whitespace-normal break-words leading-none">
                        Origen de Datos
                      </span>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors duration-150 ${
                      currentTab === 'source-data'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full space-y-8 min-w-0">
            {currentTab === 'dashboard' ? (
              <div className="space-y-8">
                {/* WORKSPACE SECTIONS GRID */}
                <div className="space-y-12" id="dashboard-widgets-grid">
                  <AnimatePresence>
                    {activeWidgets
                      .filter((w) => w.id !== 'source-data')
                      .map((w, idx) => {
                        if (!w.visible) return null;

                        return (
                          <React.Fragment key={w.id}>
                            {/* 3. SEPARADORES CLAROS DE SECCIÓN */}
                            {idx > 0 && (
                              <div className="py-4 flex items-center" id={`separator-before-${w.id}`}>
                                <div className="w-full border-t-2 border-slate-200/70 border-dashed"></div>
                              </div>
                            )}

                            <motion.div
                              id={`widget-wrapper-${w.id}`}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.3 }}
                              className="rounded-2xl overflow-hidden scroll-mt-24"
                            >
                              {w.id === 'preventivos-anual' && (
                                <PreventivosSection records={records} currentMonth={settings.currentMonth} showOnly="anual" />
                              )}

                              {w.id === 'preventivos-mensual' && (
                                <PreventivosSection records={records} currentMonth={settings.currentMonth} showOnly="mensual" />
                              )}

                              {w.id === 'incidencias' && (
                                <IncidenciasSection
                                  incidencias={incidencias}
                                  currentMonth={settings.currentMonth}
                                  onAddIncidencia={handleAddIncidencia}
                                  onDeleteIncidencia={handleDeleteIncidencia}
                                  contractor={settings.contractor}
                                />
                              )}

                              {w.id === 'materiales' && (
                                <MaterialesSection
                                  materiales={materiales}
                                  onUpdateMaterial={handleUpdateMaterial}
                                  onDeleteMaterial={handleDeleteMaterial}
                                  onAddMaterial={handleAddMaterial}
                                  contractor={settings.contractor}
                                />
                              )}

                              {w.id === 'penalizaciones' && (
                                <PenalizacionesSection incidencias={incidencias} settings={settings} />
                              )}

                              {w.id === 'cuadro-mando' && (
                                <CuadroMandoSection
                                  records={records}
                                  incidencias={incidencias}
                                  settings={settings}
                                  onIndicatorComputed={(kpis) => setComputedKpis(kpis)}
                                />
                              )}
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
                id="widget-wrapper-source-data"
              >
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Panel de Configuración de Datos</span>
                    <h3 className="text-xl font-extrabold font-display">Editor Independiente de Datos de Origen</h3>
                    <p className="text-indigo-100 text-xs mt-1">Modifique los valores de preventivos programados y ejecutados para cada mes del año. Los cambios se propagarán inmediatamente al cuadro de mando y gráficos.</p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Volver al Informe Principal
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <DataEditor
                    records={records}
                    onUpdateCell={handleUpdateCell}
                    currentMonth={settings.currentMonth}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ACCESSIBILITY & FOOTER INFORMATION */}
        <footer className="text-center text-xs text-slate-400 mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-medium text-slate-500">© 2026 ADIF Alta Velocidad — Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-2 items-center text-slate-400 font-medium">
            <span>Versión 2.0.1</span>
            <span>•</span>
            <span>Contrato: Telemando Albacete-Alicante</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
