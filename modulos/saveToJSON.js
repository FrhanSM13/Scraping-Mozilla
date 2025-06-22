import fs from 'fs';

export function saveToJSON(data, filename) {
    fs.writeFileSync(`${filename}.json`, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${filename}.json CREADO`);
}