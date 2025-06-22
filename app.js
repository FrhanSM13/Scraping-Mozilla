import puppeteer from 'puppeteer';

import { saveToJSON } from './export/saveToJSON.js';
import { saveToCSV } from './export/saveToCSV.js';
import { saveToExcel } from './export/saveToExcel.js';
import { saveToTXT } from './export/saveToTXT.js';
import { saveToPDF } from './export/saveToPDF.js';

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

    saveToJSON(articulos, 'articulos');
    saveToCSV(articulos, 'articulos');
    saveToExcel(articulos, 'articulos');
    saveToTXT(articulos, 'articulos');
    saveToPDF(articulos, 'articulos');
}

scrapeMozilla();
