import puppeteer from 'puppeteer';

import { saveToJSON } from './modulos/saveToJSON.js';
import { saveToCSV } from './modulos/saveToCSV.js';
import { saveToExcel } from './modulos/saveToExcel.js';
import { saveToTXT } from './modulos/saveToTXT.js';
import { saveToPDF } from './modulos/saveToPDF.js';

async function scrapeMozilla() {
    const URL = 'https://hacks.mozilla.org/';
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('li.list-item.row.listing', { timeout: 60000 });

    let articulos = [];
    let haySiguiente = true;
    let urlAnterior = '';

    while (haySiguiente) {
        const nuevosArticulos = await page.evaluate(() => {
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

        // Agregar autores
        for (let articulo of nuevosArticulos) {
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

        articulos = articulos.concat(nuevosArticulos);

        // Verificar si hay más artículos
        const siguiente = await page.$('h3.read-more a') || await page.$('nav.nav-paging a');
        if (siguiente) {
            const urlSiguiente = await page.evaluate(el => el.href, siguiente);
            const urlActual = page.url();
            if (urlSiguiente === urlAnterior || urlSiguiente === urlActual) break;
            urlAnterior = urlActual;

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                siguiente.click()
            ]);
            await page.waitForSelector('li.list-item.row.listing', { timeout: 60000 });
        } else {
            haySiguiente = false;
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