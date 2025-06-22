import fs from 'fs';
import PDFDocument from 'pdfkit';

export function saveToPDF(data, filename) {
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