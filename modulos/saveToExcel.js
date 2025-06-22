import fs from 'fs';
import * as XLSX from 'xlsx';

export function saveToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Artículos');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log(`✅ ${filename}.xlsx CREADO`);
}