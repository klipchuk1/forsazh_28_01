import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Crew } from '../data/types';

interface ExcelImportProps {
  onImport: (crews: Crew[]) => void;
  existingCrews: Crew[];
}

export default function ExcelImport({ onImport, existingCrews }: ExcelImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Expected format:
      // Row 0: headers
      // Row 1+: data
      // Columns: Экипаж | Driver | Navigator | Точки Target | Точки Fact | Продажи Target | Продажи Fact | СКЮ Target | СКЮ Fact

      const updatedCrews = existingCrews.map((crew) => {
        const dataRow = rows.find((row) => row[0] && String(row[0]).trim().toLowerCase() === crew.teamName.toLowerCase());
        if (dataRow) {
          return {
            ...crew,
            metrics: {
              connectedPoints: {
                target: Number(dataRow[3]) || crew.metrics.connectedPoints.target,
                fact: Number(dataRow[4]) || crew.metrics.connectedPoints.fact,
              },
              salesVolume: {
                target: Number(dataRow[5]) || crew.metrics.salesVolume.target,
                fact: Number(dataRow[6]) || crew.metrics.salesVolume.fact,
              },
              skuCount: {
                target: Number(dataRow[7]) || crew.metrics.skuCount.target,
                fact: Number(dataRow[8]) || crew.metrics.skuCount.fact,
              },
            },
          };
        }
        return crew;
      });

      onImport(updatedCrews);
    };
    reader.readAsBinary(file);
  };

  return (
    <div className="import-section">
      <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFile} />
      <button className="import-btn" onClick={() => fileRef.current?.click()}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Импортировать KPI из Excel
      </button>
      <div className="import-hint">
        Формат: Экипаж | Driver | Navigator | Точки Plan | Точки Fact | Продажи Plan | Продажи Fact | СКЮ Plan | СКЮ Fact
      </div>
    </div>
  );
}
