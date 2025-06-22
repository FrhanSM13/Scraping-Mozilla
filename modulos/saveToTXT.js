import fs from 'fs';

export function saveToTXT(data, filename) {
    const text = data.map(item => {
        return Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }).join('\n\n---\n\n');
    fs.writeFileSync(`${filename}.txt`, text, 'utf-8');
    console.log(`✅ ${filename}.txt CREADO`);
}