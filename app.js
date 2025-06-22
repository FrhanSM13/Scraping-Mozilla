import puppeteer from 'puppeteer';
import fs from 'fs';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

// ======== FUNCIONES DE GUARDADO ========
function saveToJSON(data, filename) {
    fs.writeFileSync(`${filename}.json`, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${filename}.json CREADO`);
}

function saveToCSV(data, filename) {
    const fields = Object.keys(data[0]);
    const parser = new Parser({ fields, defaultValue: 'N/A' });
    const csv = parser.parse(data);
    fs.writeFileSync(`${filename}.csv`, csv, 'utf-8');
    console.log(`✅ ${filename}.csv CREADO`);
}

function saveToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Artículos');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log(`✅ ${filename}.xlsx CREADO`);
}

function saveToTXT(data, filename) {
    const text = data.map(item => {
        return Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }).join('\n\n---\n\n');
    fs.writeFileSync(`${filename}.txt`, text, 'utf-8');
    console.log(`✅ ${filename}.txt CREADO`);
}

function saveToPDF(data, filename) {
    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(fs.createWriteStream(`${filename}.pdf`));

    data.forEach((item, i) => {
        doc.fontSize(12).text(`Artículo ${i + 1}`, { underline: true });
        for (const [key, value] of Object.entries(item)) {
            doc.fontSize(10).text(`${key}: ${value}`);
        }
        doc.moveDown();
    });

    doc.end();
    console.log(`✅ ${filename}.pdf CREADO`);
}

// ========== SCRAPER DE UNA PÁGINA ==========
async function scrapeMozilla() {
    const URL = 'https://hacks.mozilla.org/';
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('li.list-item.row.listing', { timeout: 60000 });

    const articulos = await page.evaluate(() => {
        const data = [];
        const elementos = document.querySelectorAll('li.list-item.row.listing');
        elementos.forEach(item => {
            const titulo = item.querySelector('h3 a')?.innerText || "Sin título";
            const resumen = item.querySelector('p')?.innerText || "Sin resumen";
            const enlace = item.querySelector('h3 a')?.href || "";
            const fecha = item.innerText.match(/Posted on\s(.+)/i)?.[1]?.trim() || "Sin fecha";
            const imagen = item.querySelector('img')?.src || "Sin imagen";
            data.push({ titulo, resumen, enlace, fecha, imagen });
        });
        return data;
    });

    // Agregar autor a cada artículo
    for (let articulo of articulos) {
        try {
            const artPage = await browser.newPage();
            await artPage.goto(articulo.enlace, { waitUntil: 'domcontentloaded', timeout: 60000 });
            const autor = await artPage.evaluate(() => {
                const el = document.querySelector('.byline .url');
                return el ? el.textContent.trim() : 'Autor no disponible';
            });
            articulo.autor = autor;
            await artPage.close();
        } catch {
            articulo.autor = 'Autor no disponible';
        }
    }

    await browser.close();

    // Guardar los datos en múltiples formatos
    saveToJSON(articulos, 'articulos');
    saveToCSV(articulos, 'articulos');
    saveToExcel(articulos, 'articulos');
    saveToTXT(articulos, 'articulos');
    saveToPDF(articulos, 'articulos');
}

scrapeMozilla();
