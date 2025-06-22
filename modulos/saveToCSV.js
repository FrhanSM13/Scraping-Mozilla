import fs from 'fs';
import { Parser } from 'json2csv';

export function saveToCSV(data, filename) {
    const fields = Object.keys(data[0]);
    const parser = new Parser({ fields, defaultValue: 'N/A' });
    const csv = parser.parse(data);
    fs.writeFileSync(`${filename}.csv`, csv, 'utf-8');
    console.log(`✅ ${filename}.csv CREADO`);
}