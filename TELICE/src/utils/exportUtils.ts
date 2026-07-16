/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { MonthlyRecord, IncidenciaDetail, ProjectSettings, Month, MaterialItem } from '../types';
import { MONTH_LABELS } from '../data';

// Helper to format percentages
const fmtPct = (val: number) => `${val.toFixed(2).replace('.', ',')}%`;

// Helper to translate months
const getMonthLabel = (m: Month) => MONTH_LABELS[m] || m;

export async function exportToExcel(
  records: MonthlyRecord[],
  incidencias: IncidenciaDetail[],
  settings: ProjectSettings,
  kpis: { label: string; val: string }[],
  charts?: {
    chartMonthlyImg?: string;
    chartAnnualImg?: string;
    chartIncidenciasImg?: string;
  }
) {
  const wb = new ExcelJS.Workbook();

  // Color Definitions (Hex without #)
  const COLOR_PRIMARY = '0F2B50';      // Navy / Adif style
  const COLOR_SECONDARY = '1B4F72';    // Dark Blue
  const COLOR_GREEN_HEAD = '1D8348';   // Soft Green
  const COLOR_CRIMSON_HEAD = '922B21'; // Soft Crimson
  const COLOR_GRAY_HEAD = '5D6D7E';    // Grey Slate
  
  const BORDER_STYLE: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'D5D8DC' } },
    left: { style: 'thin', color: { argb: 'D5D8DC' } },
    bottom: { style: 'thin', color: { argb: 'D5D8DC' } },
    right: { style: 'thin', color: { argb: 'D5D8DC' } }
  };

  // -------------------------------------------------------------
  // TAB 1: Cuadro de Mando
  // -------------------------------------------------------------
  const wsKpis = wb.addWorksheet('Cuadro de Mando', { views: [{ showGridLines: true }] });
  wsKpis.columns = [{ width: 45 }, { width: 30 }];

  // Title Block
  wsKpis.mergeCells('A2:B2');
  const titleCell = wsKpis.getCell('A2');
  titleCell.value = 'CUADRO DE MANDO - TELEMANDO DE ENERGÍA';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsKpis.getRow(2).height = 28;

  // Metadata Block
  const metaRows = [
    ['Mes de Carga:', `${getMonthLabel(settings.currentMonth)} 2026`],
    ['Contratista:', settings.contractor],
    ['Ámbitos:', settings.ambitos.join(', ')],
    ['Observaciones:', settings.observaciones || 'Sin observaciones']
  ];

  metaRows.forEach((r, idx) => {
    const row = wsKpis.getRow(idx + 4);
    row.getCell(1).value = r[0];
    row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: '4A5568' } };
    row.getCell(2).value = r[1];
    row.getCell(2).font = { name: 'Arial', size: 10 };
    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
    });
  });

  // KPI Table
  const kpiStartRow = 10;
  wsKpis.getCell(`A${kpiStartRow}`).value = 'Indicador';
  wsKpis.getCell(`B${kpiStartRow}`).value = 'Valor del Indicador';
  
  const kpiHeadRow = wsKpis.getRow(kpiStartRow);
  kpiHeadRow.height = 24;
  kpiHeadRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SECONDARY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  kpis.forEach((k, idx) => {
    const rNum = kpiStartRow + 1 + idx;
    const row = wsKpis.getRow(rNum);
    row.height = 20;
    row.getCell(1).value = k.label;
    row.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };
    row.getCell(2).value = k.val;
    row.getCell(2).font = { name: 'Arial', size: 9.5 };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      // Alternate background for table styling
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F4F4' } };
      }
    });
  });

  // -------------------------------------------------------------
  // TAB 2: Plan de Mantenimiento Preventivo
  // -------------------------------------------------------------
  const wsPreventivo = wb.addWorksheet('Mantenimiento Preventivo', { views: [{ showGridLines: true }] });
  
  // Set column widths
  wsPreventivo.columns = [
    { width: 15 }, // Subsistema
    { width: 22 }, // Actuaciones
    { width: 18 }, // Objetivo Anual
    { width: 24 }, // Consecucion Acumulada
    ...Array(12).fill(0).map(() => ({ width: 13 })) // Ene - Dic
  ];

  const headers = [
    'SUBSISTEMA',
    'Actuaciones',
    'OBJETIVO ANUAL',
    'CONSECUCION ACUMULADA',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const headRow = wsPreventivo.getRow(2);
  headRow.height = 26;
  headers.forEach((h, colIdx) => {
    const cell = headRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GREEN_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER_STYLE;
  });

  const subsystems: ('PLO' | 'RACA' | 'RACO')[] = ['PLO', 'RACA', 'RACO'];
  let currentProw = 3;

  subsystems.forEach((sub) => {
    // Programado Row
    const progRow = wsPreventivo.getRow(currentProw++);
    progRow.height = 18;
    progRow.getCell(1).value = sub;
    progRow.getCell(2).value = 'Programado';
    progRow.getCell(3).value = records.reduce((acc, r) => acc + r[sub].programado, 0);
    progRow.getCell(4).value = records.reduce((acc, r) => acc + r[sub].realizado, 0);
    records.forEach((r, idx) => {
      progRow.getCell(5 + idx).value = r[sub].programado;
    });

    // Realizado Row
    const realRow = wsPreventivo.getRow(currentProw++);
    realRow.height = 18;
    realRow.getCell(1).value = sub;
    realRow.getCell(2).value = 'Realizado';
    realRow.getCell(3).value = records.reduce((acc, r) => acc + r[sub].programado, 0); // same target
    realRow.getCell(4).value = records.reduce((acc, r) => acc + r[sub].realizado, 0);
    records.forEach((r, idx) => {
      realRow.getCell(5 + idx).value = r[sub].realizado;
    });

    // % Cumplimiento Row
    const pctRow = wsPreventivo.getRow(currentProw++);
    pctRow.height = 18;
    pctRow.getCell(1).value = sub;
    pctRow.getCell(2).value = '% Grado Cumplimiento';
    
    const totalProg = records.reduce((acc, r) => acc + r[sub].programado, 0);
    const totalReal = records.reduce((acc, r) => acc + r[sub].realizado, 0);
    pctRow.getCell(3).value = totalProg > 0 ? fmtPct((totalReal / totalProg) * 100) : '0,00%';
    pctRow.getCell(4).value = '100,00%';
    records.forEach((r, idx) => {
      const p = r[sub].programado;
      const re = r[sub].realizado;
      pctRow.getCell(5 + idx).value = p > 0 ? fmtPct((re / p) * 100) : '0,00%';
    });

    // Apply borders and fonts for these subsystem rows
    for (let r = currentProw - 3; r < currentProw; r++) {
      const row = wsPreventivo.getRow(r);
      row.eachCell((cell) => {
        cell.border = BORDER_STYLE;
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      // Subsystem cell merge or left aligned
      row.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    }

    // Insert an empty spacer row
    wsPreventivo.getRow(currentProw++).height = 8;
  });

  // Total Summary Row
  const totalProgAll = records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const totalRealAll = records.reduce((acc, r) => acc + r.PLO.realizado + r.RACA.realizado + r.RACO.realizado, 0);

  const tProgRow = wsPreventivo.getRow(currentProw++);
  tProgRow.height = 20;
  tProgRow.getCell(1).value = 'TOTAL';
  tProgRow.getCell(2).value = 'Programado';
  tProgRow.getCell(3).value = totalProgAll;
  tProgRow.getCell(4).value = totalRealAll;
  records.forEach((r, idx) => {
    tProgRow.getCell(5 + idx).value = r.PLO.programado + r.RACA.programado + r.RACO.programado;
  });

  const tRealRow = wsPreventivo.getRow(currentProw++);
  tRealRow.height = 20;
  tRealRow.getCell(1).value = 'TOTAL';
  tRealRow.getCell(2).value = 'Realizado';
  tRealRow.getCell(3).value = totalProgAll;
  tRealRow.getCell(4).value = totalRealAll;
  records.forEach((r, idx) => {
    tRealRow.getCell(5 + idx).value = r.PLO.realizado + r.RACA.realizado + r.RACO.realizado;
  });

  const tPctRow = wsPreventivo.getRow(currentProw++);
  tPctRow.height = 20;
  tPctRow.getCell(1).value = 'TOTAL';
  tPctRow.getCell(2).value = '% Grado Cumplimiento';
  tPctRow.getCell(3).value = totalProgAll > 0 ? fmtPct((totalRealAll / totalProgAll) * 100) : '0,00%';
  tPctRow.getCell(4).value = '100,00%';
  records.forEach((r, idx) => {
    const p = r.PLO.programado + r.RACA.programado + r.RACO.programado;
    const re = r.PLO.realizado + r.RACA.realizado + r.RACO.realizado;
    tPctRow.getCell(5 + idx).value = p > 0 ? fmtPct((re / p) * 100) : '0,00%';
  });

  // Format Total Rows
  for (let r = currentProw - 3; r < currentProw; r++) {
    const row = wsPreventivo.getRow(r);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '95A5A6' } },
        bottom: { style: r === currentProw - 1 ? 'double' : 'thin', color: { argb: '2C3E50' } },
        left: { style: 'thin', color: { argb: 'D5D8DC' } },
        right: { style: 'thin', color: { argb: 'D5D8DC' } }
      };
      cell.font = { name: 'Arial', size: 9.5, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAEDED' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // -------------------------------------------------------------
  // TAB 3: Registro de Incidencias
  // -------------------------------------------------------------
  const wsIncidencias = wb.addWorksheet('Incidencias', { views: [{ showGridLines: true }] });
  wsIncidencias.columns = [
    { width: 18 }, // N.º Incidencia
    { width: 16 }, // Fecha
    { width: 15 }, // Técnica
    { width: 22 }, // Ubicación
    { width: 20 }, // Imputación
    { width: 60 }  // Observaciones
  ];

  const incHeaders = ['N.º INCIDENCIA', 'FECHA', 'TÉCNICA', 'UBICACIÓN', 'IMPUTACIÓN', 'OBSERVACIONES'];
  const incHeadRow = wsIncidencias.getRow(2);
  incHeadRow.height = 24;
  incHeaders.forEach((h, colIdx) => {
    const cell = incHeadRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CRIMSON_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  incidencias.forEach((i, idx) => {
    const rNum = idx + 3;
    const row = wsIncidencias.getRow(rNum);
    row.height = 19;
    row.getCell(1).value = i.numeroIncidencia || i.id;
    row.getCell(2).value = i.fecha || `${getMonthLabel(i.month)} 2026`;
    row.getCell(3).value = i.tecnica || i.subsystem;
    row.getCell(4).value = i.ubicacion || 'N/A';
    row.getCell(5).value = i.imputacion || i.tipo;
    row.getCell(6).value = i.observaciones || 'Cerrado';

    row.eachCell((cell, cellIdx) => {
      cell.border = BORDER_STYLE;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: cellIdx === 6 ? 'left' : 'center' 
      };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FDEDEC' } }; // Light crimson tint
      }
    });
  });

  // -------------------------------------------------------------
  // TAB 4: Gráficos de Tendencias
  // -------------------------------------------------------------
  const wsGraficos = wb.addWorksheet('Gráficos y Tendencias', { views: [{ showGridLines: true }] });
  
  // Basic widths for columns
  wsGraficos.columns = [
    { width: 25 }, // Concept / Subsystem
    { width: 45 }, // ASCII / Space
    { width: 18 }  // Percentage
  ];

  // Professional sheet title block
  wsGraficos.mergeCells('A2:C2');
  const gTitleCell = wsGraficos.getCell('A2');
  gTitleCell.value = 'CUADRO DE MANDOS - INFORME GRÁFICO DE RENDIMIENTO';
  gTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  gTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  gTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsGraficos.getRow(2).height = 28;

  let currentGRow = 4;

  // Section 1: Grado de Cumplimiento Sub-sistemas
  wsGraficos.getCell(`A${currentGRow}`).value = '1. CUMPLIMIENTO ANUAL POR SUBSISTEMA (YTD)';
  wsGraficos.getCell(`A${currentGRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_SECONDARY } };
  currentGRow++;

  const gHeadRow = wsGraficos.getRow(currentGRow++);
  gHeadRow.getCell(1).value = 'Subsistema';
  gHeadRow.getCell(2).value = 'Progreso Visual';
  gHeadRow.getCell(3).value = 'Porcentaje';
  gHeadRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  subsystems.forEach((sub) => {
    const totalProgSub = records.reduce((acc, r) => acc + r[sub].programado, 0);
    const totalRealSub = records.reduce((acc, r) => acc + r[sub].realizado, 0);
    const pct = totalProgSub > 0 ? (totalRealSub / totalProgSub) * 100 : 0;
    
    // ASCII Bar
    const filledCount = Math.min(20, Math.max(0, Math.round(pct / 5)));
    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(20 - filledCount);
    const bar = `[${filled}${empty}]`;
    
    const row = wsGraficos.getRow(currentGRow++);
    row.getCell(1).value = sub;
    row.getCell(2).value = bar;
    row.getCell(3).value = fmtPct(pct);
    row.eachCell((cell, cIdx) => {
      cell.border = BORDER_STYLE;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  // Global Total Bar
  const globalProg = records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const globalReal = records.reduce((acc, r) => acc + r.PLO.realizado + r.RACA.realizado + r.RACO.realizado, 0);
  const globalPct = globalProg > 0 ? (globalReal / globalProg) * 100 : 0;
  const globalFilledCount = Math.min(20, Math.max(0, Math.round(globalPct / 5)));
  const globalBar = `[${'█'.repeat(globalFilledCount)}${'░'.repeat(20 - globalFilledCount)}]`;
  
  const gTotalRow = wsGraficos.getRow(currentGRow++);
  gTotalRow.getCell(1).value = 'TOTAL GLOBAL';
  gTotalRow.getCell(2).value = globalBar;
  gTotalRow.getCell(3).value = fmtPct(globalPct);
  gTotalRow.eachCell((cell, cIdx) => {
    cell.border = BORDER_STYLE;
    cell.font = { name: 'Arial', size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAEDED' } };
    cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
  });

  currentGRow += 2;

  // Section 2: Cumplimiento Histórico Mensual
  wsGraficos.getCell(`A${currentGRow}`).value = '2. EVOLUCIÓN MENSUAL HISTÓRICA (AÑO 2026)';
  wsGraficos.getCell(`A${currentGRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_SECONDARY } };
  currentGRow++;

  const gHeadRow2 = wsGraficos.getRow(currentGRow++);
  gHeadRow2.getCell(1).value = 'Mes';
  gHeadRow2.getCell(2).value = 'Progreso Visual';
  gHeadRow2.getCell(3).value = 'Porcentaje';
  gHeadRow2.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  records.forEach((r) => {
    const mProg = r.PLO.programado + r.RACA.programado + r.RACO.programado;
    const mReal = r.PLO.realizado + r.RACA.realizado + r.RACO.realizado;
    const mPct = mProg > 0 ? (mReal / mProg) * 100 : 0;
    const mFilledCount = Math.min(20, Math.max(0, Math.round(mPct / 5)));
    const mBar = `[${'█'.repeat(mFilledCount)}${'░'.repeat(20 - mFilledCount)}]`;
    
    const row = wsGraficos.getRow(currentGRow++);
    row.getCell(1).value = getMonthLabel(r.month);
    row.getCell(2).value = mBar;
    row.getCell(3).value = fmtPct(mPct);
    row.eachCell((cell, cIdx) => {
      cell.border = BORDER_STYLE;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  currentGRow += 2;

  // Section 3: Histórico de Incidencias
  wsGraficos.getCell(`A${currentGRow}`).value = '3. HISTÓRICO ANUAL DE INCIDENCIAS MENSUALES';
  wsGraficos.getCell(`A${currentGRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_SECONDARY } };
  currentGRow++;

  const gHeadRow3 = wsGraficos.getRow(currentGRow++);
  gHeadRow3.getCell(1).value = 'Mes';
  gHeadRow3.getCell(2).value = 'Frecuencia';
  gHeadRow3.getCell(3).value = 'Gráfica de Frecuencia';
  gHeadRow3.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  const allMonths: Month[] = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  allMonths.forEach((m) => {
    const count = incidencias.filter((i) => i.month === m).length;
    const mBar = '■'.repeat(count);
    
    const row = wsGraficos.getRow(currentGRow++);
    row.getCell(1).value = getMonthLabel(m);
    row.getCell(2).value = count;
    row.getCell(3).value = mBar;
    row.eachCell((cell, cIdx) => {
      cell.border = BORDER_STYLE;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: cIdx === 3 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  // Now, EMBED THE ACTUAL HIGH-QUALITY PNG CHARTS if available!
  // We'll place them on the right side of the sheet (starting at Column E, i.e. col index 5)
  for (let c = 5; c <= 15; c++) {
    wsGraficos.getColumn(c).width = 12;
  }

  // 1. Monthly Chart Placement (Col E, Row 4)
  if (charts?.chartMonthlyImg) {
    wsGraficos.getCell('E3').value = 'GRÁFICO COMPACTO - EJECUCIÓN PREVENTIVO MENSUAL';
    wsGraficos.getCell('E3').font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_PRIMARY } };
    try {
      const imgId = wb.addImage({
        base64: charts.chartMonthlyImg,
        extension: 'png',
      });
      wsGraficos.addImage(imgId, {
        tl: { col: 4, row: 3 }, // Column E, Row 4 (0-indexed: col 4, row 3)
        ext: { width: 550, height: 260 }
      });
    } catch (err) {
      console.error("Error writing Monthly Chart to Excel:", err);
    }
  }

  // 2. Annual Accumulative Chart Placement (Col E, Row 18)
  if (charts?.chartAnnualImg) {
    wsGraficos.getCell('E17').value = 'PROGRESO GLOBAL ACUMULADO ANUAL (YTD)';
    wsGraficos.getCell('E17').font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_PRIMARY } };
    try {
      const imgId = wb.addImage({
        base64: charts.chartAnnualImg,
        extension: 'png',
      });
      wsGraficos.addImage(imgId, {
        tl: { col: 4, row: 17 }, // Column E, Row 18 (0-indexed: col 4, row 17)
        ext: { width: 550, height: 160 }
      });
    } catch (err) {
      console.error("Error writing Annual Chart to Excel:", err);
    }
  }

  // 3. Incidencias Chart Placement (Col E, Row 27)
  if (charts?.chartIncidenciasImg) {
    wsGraficos.getCell('E26').value = 'DISTRIBUCIÓN Y EVOLUCIÓN MENSUAL DE INCIDENCIAS';
    wsGraficos.getCell('E26').font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_PRIMARY } };
    try {
      const imgId = wb.addImage({
        base64: charts.chartIncidenciasImg,
        extension: 'png',
      });
      wsGraficos.addImage(imgId, {
        tl: { col: 4, row: 26 }, // Column E, Row 27 (0-indexed: col 4, row 26)
        ext: { width: 550, height: 280 }
      });
    } catch (err) {
      console.error("Error writing Incidencias Chart to Excel:", err);
    }
  }

  // -------------------------------------------------------------
  // Generate and Download File
  // -------------------------------------------------------------
  const filename = `Informe_Seguimiento_${settings.contractor}_${settings.currentMonth}_2026.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function exportToPDF(
  records: MonthlyRecord[],
  incidencias: IncidenciaDetail[],
  settings: ProjectSettings,
  kpis: { label: string; val: string }[],
  charts?: {
    chartMonthlyImg?: string;
    chartAnnualImg?: string;
    chartIncidenciasImg?: string;
  }
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Modern Professional Corporate Style Header
  doc.setFillColor(15, 43, 80); // Deep Blue Adif style
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Adif/Ineco Text simulated logos in elegant layout
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ADIF ALTA VELOCIDAD', 14, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CONTRATO DE SERVICIOS DE MANTENIMIENTO - TELEMANDO DE ENERGÍA', 14, 22);
  doc.text('LÍNEA ALTA VELOCIDAD MADRID - LEVANTE | ALBACETE - ALICANTE', 14, 27);

  // Top Right metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`CONTRATISTA: ${settings.contractor}`, pageWidth - 14, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Periodo de informe: ${getMonthLabel(settings.currentMonth).toUpperCase()} 2026`, pageWidth - 14, 21, { align: 'right' });
  doc.text(`Fecha Exportación: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Ámbitos: ${settings.ambitos.join(', ')}`, pageWidth - 14, 31, { align: 'right' });

  let currentY = 48;

  // Title section
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. RESUMEN EJECUTIVO (CUADRO DE MANDO)', 14, currentY);
  currentY += 6;

  // KPIs Table
  const kpiRows = kpis.map((k) => [k.label, k.val]);
  autoTable(doc, {
    startY: currentY,
    head: [['Indicador de Rendimiento', 'Valor de Referencia']],
    body: kpiRows,
    theme: 'striped',
    headStyles: { fillColor: [24, 62, 110], fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY + 40;
    }
  });

  currentY += 10;

  // Title 2: Preventative maintenance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. RESUMEN DE MANTENIMIENTO PREVENTIVO ANUAL Y MENSUAL', 14, currentY);
  currentY += 6;

  // Calculate annual totals
  const totalProg = records.reduce((acc, r) => acc + r.PLO.programado + r.RACA.programado + r.RACO.programado, 0);
  const totalReal = records.reduce((acc, r) => acc + r.PLO.realizado + r.RACA.realizado + r.RACO.realizado, 0);
  const pctAnual = totalProg > 0 ? (totalReal / totalProg) * 100 : 0;

  // Filter current active month
  const activeRecord = records.find((r) => r.month === settings.currentMonth);
  const mProg = activeRecord ? activeRecord.PLO.programado + activeRecord.RACA.programado + activeRecord.RACO.programado : 0;
  const mReal = activeRecord ? activeRecord.PLO.realizado + activeRecord.RACA.realizado + activeRecord.RACO.realizado : 0;
  const mPct = mProg > 0 ? (mReal / mProg) * 100 : 0;

  const preventivosSummary = [
    ['PREVENTIVO ANUAL (Acumulado hasta la fecha) 2026', `${totalReal} / ${totalProg} Actuaciones`, fmtPct(pctAnual)],
    [`PREVENTIVO MENSUAL (${getMonthLabel(settings.currentMonth)} 2026)`, `${mReal} / ${mProg} Actuaciones`, fmtPct(mPct)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Concepto de Seguimiento', 'Volumen de Actuaciones', 'Grado de Cumplimiento']],
    body: preventivosSummary,
    theme: 'grid',
    headStyles: { fillColor: [44, 95, 45], fontSize: 9 }, // Soft green
    bodyStyles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY + 30;
    }
  });

  currentY += 10;

  // Subsystem Breakdown Table
  const subRows = ['PLO', 'RACA', 'RACO'].map((sub) => {
    const actSub = sub as 'PLO' | 'RACA' | 'RACO';
    const subProgAnual = records.reduce((acc, r) => acc + r[actSub].programado, 0);
    const subRealAnual = records.reduce((acc, r) => acc + r[actSub].realizado, 0);
    const subPctAnual = subProgAnual > 0 ? (subRealAnual / subProgAnual) * 100 : 0;

    const subProgMensual = activeRecord ? activeRecord[actSub].programado : 0;
    const subRealMensual = activeRecord ? activeRecord[actSub].realizado : 0;
    const subPctMensual = subProgMensual > 0 ? (subRealMensual / subProgMensual) * 100 : 0;

    return [
      sub,
      `${subRealMensual} / ${subProgMensual} (${fmtPct(subPctMensual)})`,
      `${subRealAnual} / ${subProgAnual} (${fmtPct(subPctAnual)})`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Subsistema / Red', `Mes Actual (${getMonthLabel(settings.currentMonth)} 2026)`, 'Acumulado Anual 2026']],
    body: subRows,
    theme: 'striped',
    headStyles: { fillColor: [70, 80, 95], fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY + 30;
    }
  });

  // Page 3: Preventative Maintenance Charts (if available)
  if (charts?.chartMonthlyImg || charts?.chartAnnualImg) {
    doc.addPage();
    doc.setFillColor(15, 43, 80);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REPRESENTACIONES GRÁFICAS - MANTENIMIENTO PREVENTIVO', 14, 10);
    
    let py = 25;
    if (charts.chartMonthlyImg) {
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11);
      doc.text('2.1 Distribución y Ejecución de Preventivos Mensuales (Redes vs Total)', 14, py);
      py += 6;
      doc.addImage(charts.chartMonthlyImg, 'PNG', 14, py, pageWidth - 28, 80);
      py += 88;
    }
    
    if (charts.chartAnnualImg) {
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11);
      doc.text('2.2 Progreso Global Acumulado Anual (YTD)', 14, py);
      py += 6;
      doc.addImage(charts.chartAnnualImg, 'PNG', 14, py, pageWidth - 28, 48);
    }
  }

  // Page 4: Incidencias Table
  doc.addPage();
  doc.setFillColor(15, 43, 80);
  doc.rect(0, 0, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('SEGUIMIENTO DE PROYECTO - TELEMANDO DE ENERGÍA', 14, 10);

  currentY = 25;

  // Title 3: Incidencias
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. REGISTRO DE INCIDENCIAS Y TIEMPOS DE RESPUESTA', 14, currentY);
  currentY += 6;

  const activeIncidencias = incidencias.filter(i => i.month === settings.currentMonth);
  
  // Filter historical incidences to the active year 2026 for accurate annual counting
  const activeYearIncs = incidencias.filter((i) => {
    const parts = i.fecha.split(/[\/\-]/);
    const year = parts[parts.length - 1];
    return year === '2026';
  });
  const totalIncidenciasAnual = activeYearIncs.length;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Incidencias del mes actual (${getMonthLabel(settings.currentMonth)} 2026): ${activeIncidencias.length}`, 14, currentY);
  doc.text(`Incidencias acumuladas en el año 2026: ${totalIncidenciasAnual} (Límite admisible: ${settings.maxPenalizacionesAnuales})`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 6;

  const incRows = incidencias.map((i) => [
    i.numeroIncidencia || i.id,
    i.fecha || `${getMonthLabel(i.month)} 2026`,
    i.tecnica || i.subsystem,
    i.ubicacion || 'N/A',
    i.imputacion || i.tipo,
    i.observaciones || 'Cerrado',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N.º Incidencia', 'Fecha', 'Técnica', 'Ubicación', 'Imputación', 'Observaciones']],
    body: incRows,
    theme: 'grid',
    headStyles: { fillColor: [130, 40, 40], fontSize: 8 }, // Crimson dark for incidences
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY + 50;
    }
  });

  // Page 5: Incidencias Chart & Final Valuation
  if (charts?.chartIncidenciasImg) {
    doc.addPage();
    doc.setFillColor(15, 43, 80);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REPRESENTACIÓN GRÁFICA - FIABILIDAD DE SERVICIO', 14, 10);
    
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(11);
    doc.text('3.1 Distribución Mensual por Tipo de Incidencia', 14, 25);
    
    doc.addImage(charts.chartIncidenciasImg, 'PNG', 14, 31, pageWidth - 28, 80);
    currentY = 125;
  } else {
    if (currentY + 60 > doc.internal.pageSize.height) {
      doc.addPage();
      doc.setFillColor(15, 43, 80);
      doc.rect(0, 0, pageWidth, 15, 'F');
      currentY = 25;
    } else {
      currentY += 10;
    }
  }

  // Signatures or footer area
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. VALORACIÓN FINAL', 14, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const statusSummary = totalIncidenciasAnual > settings.maxPenalizacionesAnuales
    ? 'ALERTA: Se ha excedido el número máximo anual de incidencias tolerables. Se sugiere aplicar plan de contingencia.'
    : 'CONTRATO AL DÍA: Todos los indicadores operativos, de respuesta, de disponibilidad y de preventivos se encuentran dentro de las directrices y umbrales pactados en el contrato.';

  doc.text(statusSummary, 14, currentY);
  currentY += 15;

  // Signatures lines
  doc.line(14, currentY, 70, currentY);
  doc.line(pageWidth - 70, currentY, pageWidth - 14, currentY);
  
  doc.setFontSize(8);
  doc.text('Fdo. Responsable ADIF', 14, currentY + 5);
  doc.text(`Fdo. Responsable ${settings.contractor}`, pageWidth - 14, currentY + 5, { align: 'right' });

  // Save PDF
  const pdfFilename = `Informe_Seguimiento_${settings.contractor}_${settings.currentMonth}_2026.pdf`;
  doc.save(pdfFilename);
}

export function exportMaterialsToExcel(
  materiales: MaterialItem[],
  periodLabel: string,
  contractor: string
) {
  const wb = XLSX.utils.book_new();

  const excelData = [
    ['HISTÓRICO DE CONSUMO DE MATERIALES - TELEMANDO', ''],
    ['Periodo del informe:', periodLabel],
    ['Contratista:', contractor],
    ['Fecha de Exportación:', new Date().toLocaleDateString('es-ES')],
    ['Total de Registros:', materiales.length],
    ['Total Unidades Consumidas:', materiales.reduce((sum, m) => sum + m.cantidad, 0)],
    ['', ''],
    ['N.º INCIDENCIA', 'FECHA', 'TÉCNICA', 'IMPUTACIÓN', 'CÓD. MATERIAL', 'DESCRIPCIÓN', 'CANTIDAD']
  ];

  materiales.forEach((m) => {
    excelData.push([
      m.numeroIncidencia,
      m.fecha,
      m.tecnica,
      m.imputacion,
      m.codMaterial,
      m.descripcion,
      String(m.cantidad)
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Basic column widths auto-fit
  const max_cols = [18, 15, 15, 18, 18, 55, 12];
  ws['!cols'] = max_cols.map(w => ({ wch: w }));

  XLSX.utils.book_append_sheet(wb, ws, 'Histórico Materiales');

  const safePeriod = periodLabel.replace(/[\s\/|:\-*?<>]/g, '_');
  XLSX.writeFile(wb, `Historico_Materiales_${safePeriod}.xlsx`);
}

export function exportMaterialsToPDF(
  materiales: MaterialItem[],
  periodLabel: string,
  contractor: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Header Branded Banner
  doc.setFillColor(15, 43, 80); // Deep Blue Adif style
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ADIF ALTA VELOCIDAD', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE TELEMANDO DE ENERGÍA - SEGUIMIENTO DE MATERIALES', 14, 18);
  doc.text('LÍNEA ALTA VELOCIDAD MADRID - LEVANTE | ALBACETE - ALICANTE', 14, 23);

  // Metadata block top-right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`CONTRATISTA: ${contractor}`, pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Periodo: ${periodLabel.toUpperCase()}`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`Exportado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Consumo: ${materiales.reduce((sum, m) => sum + m.cantidad, 0)} unidades en ${materiales.length} actuaciones`, pageWidth - 14, 27, { align: 'right' });

  let currentY = 44;

  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`REGISTRO HISTÓRICO DE MATERIALES (${periodLabel.toUpperCase()})`, 14, currentY);
  currentY += 5;

  const tableBody = materiales.map((m) => [
    m.numeroIncidencia,
    m.fecha,
    m.tecnica,
    m.imputacion,
    m.codMaterial,
    m.descripcion,
    m.cantidad
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N.º Incidencia', 'Fecha', 'Técnica', 'Imputación', 'Cód. Material', 'Descripción', 'Cant.']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [15, 43, 80], fontSize: 8.5, halign: 'left' },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 18, fontStyle: 'normal' },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 12, halign: 'right' }
    },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const str = `Página ${(doc as any).getNumberOfPages()}`;
      doc.text(str, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const pageHeight = doc.internal.pageSize.height;

  let targetY = finalY;
  if (finalY + 30 > pageHeight) {
    doc.addPage();
    doc.setFillColor(15, 43, 80);
    doc.rect(0, 0, pageWidth, 8, 'F');
    targetY = 20;
  }

  doc.setFillColor(245, 247, 250);
  doc.rect(14, targetY, pageWidth - 28, 22, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(14, targetY, pageWidth - 28, 22, 'S');

  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESUMEN DE AUDITORÍA Y LIQUIDACIÓN:', 18, targetY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`- Total de repuestos imputados: ${materiales.reduce((sum, m) => sum + m.cantidad, 0)} unidades.`, 18, targetY + 12);
  doc.text(`- Total de incidencias atendidas con consumo de material: ${new Set(materiales.map(m => m.numeroIncidencia)).size} incidencias distintas.`, 18, targetY + 17);

  const safePeriod = periodLabel.replace(/[\s\/|:\-*?<>]/g, '_');
  doc.save(`Historico_Materiales_${safePeriod}.pdf`);
}

export function exportIncidenciasToExcel(
  incidencias: IncidenciaDetail[],
  periodLabel: string,
  contractor: string
) {
  const wb = XLSX.utils.book_new();

  const excelData = [
    ['HISTÓRICO DE INCIDENCIAS - TELEMANDO DE ENERGÍA', ''],
    ['Periodo del informe:', periodLabel],
    ['Contratista:', contractor],
    ['Fecha de Exportación:', new Date().toLocaleDateString('es-ES')],
    ['Total de Registros:', incidencias.length],
    ['', ''],
    [
      'N.º INCIDENCIA',
      'FECHA',
      'TÉCNICA',
      'UBICACIÓN',
      'IMPUTACIÓN',
      'OBSERVACIONES',
      'T. PRESENCIA (MIN)',
      'T. REPARACIÓN (MIN)',
      'TRENES AFECTADOS',
      'RETRASO (MIN)'
    ]
  ];

  incidencias.forEach((i) => {
    excelData.push([
      i.numeroIncidencia,
      i.fecha,
      i.tecnica,
      i.ubicacion,
      i.imputacion,
      i.observaciones,
      String(i.tiempoPresenciaMin),
      String(i.tiempoReparacionMin),
      String(i.trenesAfectados),
      String(i.retrasosMin)
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Columns width auto-fit
  const max_cols = [18, 15, 15, 25, 18, 15, 20, 20, 18, 15];
  ws['!cols'] = max_cols.map(w => ({ wch: w }));

  XLSX.utils.book_append_sheet(wb, ws, 'Histórico Incidencias');

  const safePeriod = periodLabel.replace(/[\s\/|:\-*?<>]/g, '_');
  XLSX.writeFile(wb, `Historico_Incidencias_${safePeriod}.xlsx`);
}

export function exportIncidenciasToPDF(
  incidencias: IncidenciaDetail[],
  periodLabel: string,
  contractor: string,
  chartImg?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Header Branded Banner - Crimson Wine style for Incidencias
  doc.setFillColor(114, 28, 36); // Crimson Red
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ADIF ALTA VELOCIDAD', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE TELEMANDO DE ENERGÍA - HISTÓRICO DE INCIDENCIAS', 14, 18);
  doc.text('LÍNEA ALTA VELOCIDAD MADRID - LEVANTE | ALBACETE - ALICANTE', 14, 23);

  // Metadata block top-right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`CONTRATISTA: ${contractor}`, pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Periodo: ${periodLabel.toUpperCase()}`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`Exportado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Total incidencias: ${incidencias.length}`, pageWidth - 14, 27, { align: 'right' });

  let currentY = 44;

  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`REGISTRO HISTÓRICO DE INCIDENCIAS (${periodLabel.toUpperCase()})`, 14, currentY);
  currentY += 5;

  const tableBody = incidencias.map((i) => [
    i.numeroIncidencia,
    i.fecha,
    i.tecnica,
    i.ubicacion,
    i.imputacion,
    i.observaciones,
    i.tiempoPresenciaMin,
    i.tiempoReparacionMin,
    i.retrasosMin
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N.º Incidencia', 'Fecha', 'Técnica', 'Ubicación', 'Imputación', 'Observaciones', 'T. Pres.', 'T. Rep.', 'Retraso']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [114, 28, 36], fontSize: 8.5, halign: 'left' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16 },
      2: { cellWidth: 20 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 18 },
      5: { cellWidth: 16 },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 14, halign: 'center' }
    },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const str = `Página ${(doc as any).getNumberOfPages()}`;
      doc.text(str, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const pageHeight = doc.internal.pageSize.height;

  let targetY = finalY;
  if (chartImg) {
    doc.addPage();
    // Branded header for the charts/summary page
    doc.setFillColor(114, 28, 36);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTÓRICO DE INCIDENCIAS - ANÁLISIS GRÁFICO', 14, 10);
    
    // Title of chart
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(11);
    doc.text('Distribución de Incidencias por Subsistema y Tipo', 14, 25);
    
    // Draw chart image
    doc.addImage(chartImg, 'PNG', 14, 31, pageWidth - 28, 85);
    
    targetY = 128;
  } else {
    if (finalY + 25 > pageHeight) {
      doc.addPage();
      doc.setFillColor(114, 28, 36);
      doc.rect(0, 0, pageWidth, 8, 'F');
      targetY = 20;
    }
  }

  // Summary box
  doc.setFillColor(245, 247, 250);
  doc.rect(14, targetY, pageWidth - 28, 20, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(14, targetY, pageWidth - 28, 20, 'S');

  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESUMEN DE INCIDENCIAS OPERATIVAS:', 18, targetY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`- Total de incidencias registradas en el periodo: ${incidencias.length} incidencias.`, 18, targetY + 12);
  
  const totalRetrasos = incidencias.reduce((sum, i) => sum + i.retrasosMin, 0);
  doc.text(`- Suma total de demoras acumuladas en trenes: ${totalRetrasos} minutos.`, 18, targetY + 16);

  const safePeriod = periodLabel.replace(/[\s\/|:\-*?<>]/g, '_');
  doc.save(`Historico_Incidencias_${safePeriod}.pdf`);
}

