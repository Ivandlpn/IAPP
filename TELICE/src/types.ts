/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Month =
  | 'enero'
  | 'febrero'
  | 'marzo'
  | 'abril'
  | 'mayo'
  | 'junio'
  | 'julio'
  | 'agosto'
  | 'septiembre'
  | 'octubre'
  | 'noviembre'
  | 'diciembre';

export type SubsystemType = 'PLO' | 'RACA' | 'RACO';

export interface SubsystemMonthlyValue {
  programado: number;
  realizado: number;
}

export interface MonthlyRecord {
  month: Month;
  PLO: SubsystemMonthlyValue;
  RACA: SubsystemMonthlyValue;
  RACO: SubsystemMonthlyValue;
  // Raw incidence count for the month
  incidencesCount: number;
}

export interface IncidenciaDetail {
  id: string;
  month: Month;
  subsystem: 'TELEMANDO' | 'RACA' | 'RACO';
  tipo: 'PROPIAS' | 'PREVENTIVO' | 'AJENAS' | 'A TERCEROS';
  descripcion: string;
  tiempoPresenciaMin: number; // Presence response time (threshold 90 mins)
  tiempoReparacionMin: number; // Repair time (threshold 4 hours / 240 mins)
  trenesAfectados: number; // Number of affected trains (threshold 15 mins delay)
  retrasosMin: number; // Delay in minutes
  
  // New fields requested by user
  numeroIncidencia: string;
  fecha: string;
  tecnica: string;
  ubicacion: string;
  imputacion: string;
  observaciones: string;
}

export interface ProjectSettings {
  maxPenalizacionesAnuales: number;
  thresholdPresenciaMin: number;
  thresholdReparacionMin: number;
  thresholdRetrasoMin: number;
  currentMonth: Month;
  contractor: string;
  ambitos: string[];
  observaciones: string;
}

export interface MaterialItem {
  id: string;
  numeroIncidencia: string;
  fecha: string;
  tecnica: string;
  imputacion: string;
  codMaterial: string;
  descripcion: string;
  cantidad: number;
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}
