import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Crew } from '../data/types';

export interface ParsedAward {
  crewName: string;
  awardLabel: string;
  category: string;
  place: number;
  month: string;
}

export interface ParsedCrew {
  teamName: string;
  regionItms: string;
  branchSns: string;
  driverName: string;
  navigatorName: string;
  score: number;
  distribution: number;
  contracts: number;
  ligaPro: number;
  contacts: number;
}

export interface TrackTargets {
  distribution: number;
  contracts: number;
  ligaPro: number;
  contacts: number;
  finish: number;
}

export interface MonthlyMetrics {
  month: 'march' | 'april' | 'may';
  distribution: number;
  contracts: number;
  ligaPro: number;
  contacts: number;
}

export interface ParsedCrewMonthly {
  teamName: string;
  score: number;
  months: MonthlyMetrics[];
}

export interface ImportResult {
  crews: Crew[];
  parsedCrews: ParsedCrew[];
  parsedMonthly: ParsedCrewMonthly[];
  awards: ParsedAward[];
  trackTargets: TrackTargets;
}

interface ExcelImportProps {
  onImport: (result: ImportResult) => void;
  existingCrews: Crew[];
}

function parseAwardLabel(label: string): { category: string; place: number } | null {
  if (!label || !label.trim()) return null;
  const trimmed = label.trim();
  if (trimmed === 'Лидер месяца') return { category: 'лидер месяца', place: 0 };

  const match = trimmed.match(/^#(\d)\s+по\s+(.+)$/);
  if (!match) return null;

  const place = parseInt(match[1]);
  const rawCategory = match[2];

  const categoryMap: Record<string, string> = {
    'дистрибуции': 'дистрибуция',
    'контрактованию': 'контрактование',
    'ЛигеПро': 'ЛигеПро',
    'инфо контактам': 'инфо контакты',
    'объёму продаж': 'объём продаж',
    'количеству точек с продажами': 'количество точек',
  };

  const category = categoryMap[rawCategory] || rawCategory;
  return { category, place };
}

export default function ExcelImport({ onImport, existingCrews }: ExcelImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      // --- Parse "Трасса" sheet for targets ---
      const trackTargets: TrackTargets = {
        distribution: 1440,
        contracts: 640,
        ligaPro: 560,
        contacts: 422,
        finish: 3062,
      };

      const trackSheetName = workbook.SheetNames.find(n => n.includes('Трасса') || n.includes('трасса'));
      if (trackSheetName) {
        const trackSheet = workbook.Sheets[trackSheetName];
        const trackRows: (string | number)[][] = XLSX.utils.sheet_to_json(trackSheet, { header: 1 });
        // Row 3 (index 3) contains target values: [label, dist, contracts, liga, contacts, finish]
        // Try to find the row with "Финиш" or numeric targets
        for (const row of trackRows) {
          const label = row[0] ? String(row[0]).trim().toLowerCase() : '';
          if (label.includes('финиш') || label.includes('finish')) {
            if (row[1] !== undefined && row[1] !== '') trackTargets.distribution = Number(row[1]) || trackTargets.distribution;
            if (row[2] !== undefined && row[2] !== '') trackTargets.contracts = Number(row[2]) || trackTargets.contracts;
            if (row[3] !== undefined && row[3] !== '') trackTargets.ligaPro = Number(row[3]) || trackTargets.ligaPro;
            if (row[4] !== undefined && row[4] !== '') trackTargets.contacts = Number(row[4]) || trackTargets.contacts;
            if (row[5] !== undefined && row[5] !== '') trackTargets.finish = Number(row[5]) || trackTargets.finish;
            break;
          }
        }
      }

      // --- Parse "Экипажи" sheet (crews + scores + new metrics) ---
      const crewsSheetName = workbook.SheetNames.find(n => n.includes('Экипаж') && !n.includes('наград')) || workbook.SheetNames[0];
      const crewsSheet = workbook.Sheets[crewsSheetName];
      const crewRows: (string | number)[][] = XLSX.utils.sheet_to_json(crewsSheet, { header: 1 });

      // New column layout:
      // [0] Название экипажа
      // [1] Регион ITMS
      // [2] Филиал СНС
      // [3] Пилот ITMS (driver)
      // [4] Пилот SNS (navigator)
      // [5] Очки (total score)
      // [6] Дистрибуция
      // [7] Контракты
      // [8] Лига Про
      // [9] Контакты
      const parsedCrews: ParsedCrew[] = [];
      for (let i = 1; i < crewRows.length; i++) {
        const row = crewRows[i];
        const teamName = row[0] ? String(row[0]).trim() : '';
        if (!teamName) continue;
        parsedCrews.push({
          teamName,
          regionItms: row[1] ? String(row[1]).trim() : '',
          branchSns: row[2] ? String(row[2]).trim() : '',
          driverName: row[3] ? String(row[3]).trim() : '',
          navigatorName: row[4] ? String(row[4]).trim() : '',
          score: row[5] !== undefined && row[5] !== '' ? Number(row[5]) : 0,
          distribution: row[6] !== undefined && row[6] !== '' ? Number(row[6]) : 0,
          contracts: row[7] !== undefined && row[7] !== '' ? Number(row[7]) : 0,
          ligaPro: row[8] !== undefined && row[8] !== '' ? Number(row[8]) : 0,
          contacts: row[9] !== undefined && row[9] !== '' ? Number(row[9]) : 0,
        });
      }

      // --- Parse awards sheet (e.g. "Экипажи награды Март") ---
      const awards: ParsedAward[] = [];
      const awardsSheetName = workbook.SheetNames.find(n => n.includes('наград'));
      if (awardsSheetName) {
        const awardsSheet = workbook.Sheets[awardsSheetName];
        const awardsRows: string[][] = XLSX.utils.sheet_to_json(awardsSheet, { header: 1 });

        // Extract month from header row (row 0) or sheet name
        const monthMatch = awardsSheetName.match(/(Март|Апрель|Май)/i);
        const month = monthMatch ? monthMatch[1] : 'Март';

        for (let i = 1; i < awardsRows.length; i++) {
          const row = awardsRows[i];
          const crewName = row[0] ? String(row[0]).trim() : '';
          if (!crewName) continue;

          for (let col = 1; col < row.length; col++) {
            const label = row[col] ? String(row[col]).trim() : '';
            if (!label) continue;

            const parsed = parseAwardLabel(label);
            if (parsed) {
              awards.push({
                crewName,
                awardLabel: label,
                category: parsed.category,
                place: parsed.place,
                month,
              });
            }
          }
        }
      }

      // --- Parse "Экипажи по месяцам" sheet ---
      const parsedMonthly: ParsedCrewMonthly[] = [];
      const monthlySheetName = workbook.SheetNames.find(n => n.includes('по месяцам'));
      if (monthlySheetName) {
        const monthlySheet = workbook.Sheets[monthlySheetName];
        const monthlyRows: (string | number)[][] = XLSX.utils.sheet_to_json(monthlySheet, { header: 1 });
        // Row 0: month headers (cols 6-9 = Март, 10-13 = Апрель, 14-17 = Май)
        // Row 1: column headers
        // Row 2+: data
        for (let i = 2; i < monthlyRows.length; i++) {
          const row = monthlyRows[i];
          const teamName = row[0] ? String(row[0]).trim() : '';
          if (!teamName) continue;

          const score = row[5] !== undefined && row[5] !== '' ? Number(row[5]) : 0;
          const months: MonthlyMetrics[] = [
            {
              month: 'march',
              distribution: Number(row[6]) || 0,
              contracts: Number(row[7]) || 0,
              ligaPro: Number(row[8]) || 0,
              contacts: Number(row[9]) || 0,
            },
            {
              month: 'april',
              distribution: Number(row[10]) || 0,
              contracts: Number(row[11]) || 0,
              ligaPro: Number(row[12]) || 0,
              contacts: Number(row[13]) || 0,
            },
            {
              month: 'may',
              distribution: Number(row[14]) || 0,
              contracts: Number(row[15]) || 0,
              ligaPro: Number(row[16]) || 0,
              contacts: Number(row[17]) || 0,
            },
          ];

          parsedMonthly.push({ teamName, score, months });
        }
      }

      onImport({ crews: existingCrews, parsedCrews, parsedMonthly, awards, trackTargets });
    };
    reader.readAsArrayBuffer(file);

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="import-section">
      <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
      <button className="import-btn" onClick={() => fileRef.current?.click()}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Импортировать из Excel
      </button>
      <div className="import-hint">
        Формат: Admin.xlsx с вкладками «Экипажи», «Трасса» и «Экипажи награды»
      </div>
    </div>
  );
}
