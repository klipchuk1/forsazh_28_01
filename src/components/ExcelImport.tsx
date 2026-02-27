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

export interface ImportResult {
  crews: Crew[];
  awards: ParsedAward[];
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

      // --- Parse "Экипажи" sheet (crews + scores) ---
      const crewsSheetName = workbook.SheetNames.find(n => n.includes('Экипаж') && !n.includes('наград')) || workbook.SheetNames[0];
      const crewsSheet = workbook.Sheets[crewsSheetName];
      const crewRows: string[][] = XLSX.utils.sheet_to_json(crewsSheet, { header: 1 });

      const updatedCrews = existingCrews.map((crew) => {
        // Match by crew name (e.g. "Экипаж 1" matches crew with id 1)
        const dataRow = crewRows.find((row) => {
          if (!row[0]) return false;
          const rowName = String(row[0]).trim().toLowerCase();
          return rowName === crew.teamName.toLowerCase() ||
                 rowName === `экипаж ${crew.id}`;
        });

        if (dataRow) {
          return {
            ...crew,
            driver: { ...crew.driver, name: dataRow[1] ? String(dataRow[1]).trim() : crew.driver.name },
            navigator: { ...crew.navigator, name: dataRow[2] ? String(dataRow[2]).trim() : crew.navigator.name },
            metrics: {
              connectedPoints: {
                target: crew.metrics.connectedPoints.target,
                fact: dataRow[3] !== undefined && dataRow[3] !== '' ? Number(dataRow[3]) : crew.metrics.connectedPoints.fact,
              },
              salesVolume: {
                target: crew.metrics.salesVolume.target,
                fact: crew.metrics.salesVolume.fact,
              },
              skuCount: {
                target: crew.metrics.skuCount.target,
                fact: crew.metrics.skuCount.fact,
              },
            },
          };
        }
        return crew;
      });

      // --- Parse awards sheet (e.g. "Экипажи награды Март") ---
      const awards: ParsedAward[] = [];
      const awardsSheetName = workbook.SheetNames.find(n => n.includes('наград'));
      if (awardsSheetName) {
        const awardsSheet = workbook.Sheets[awardsSheetName];
        const awardsRows: string[][] = XLSX.utils.sheet_to_json(awardsSheet, { header: 1 });

        // Extract month from header row (row 0) or sheet name
        const monthMatch = awardsSheetName.match(/(Март|Апрель|Май)/i);
        const month = monthMatch ? monthMatch[1] : 'Март';

        // Row 0: header ["Название Экипажа", "Март", ...]
        // Row 1+: data ["Экипаж 1", "#1 по дистрибуции", "#2 по контрактованию", ...]
        for (let i = 1; i < awardsRows.length; i++) {
          const row = awardsRows[i];
          const crewName = row[0] ? String(row[0]).trim() : '';
          if (!crewName) continue;

          // Columns 1+ contain award labels
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

      onImport({ crews: updatedCrews, awards });
    };
    reader.readAsArrayBuffer(file);

    // Reset input so the same file can be re-imported
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
        Формат: Admin.xlsx с вкладками «Экипажи» и «Экипажи награды»
      </div>
    </div>
  );
}
