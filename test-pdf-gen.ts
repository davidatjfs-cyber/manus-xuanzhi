import PDFDocument from 'pdfkit';
import fs from 'fs';

const fontPath = '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf';
console.log('Font exists:', fs.existsSync(fontPath));

const doc = new PDFDocument({ size: 'A4' });
const chunks: Buffer[] = [];
doc.on('data', (chunk) => chunks.push(chunk));
doc.on('end', () => {
  const buffer = Buffer.concat(chunks);
  fs.writeFileSync('/tmp/test-chinese.pdf', buffer);
  console.log('PDF size:', buffer.length);
  console.log('PDF header:', buffer.slice(0, 10).toString());
});

try {
  doc.registerFont('Chinese', fontPath);
  doc.font('Chinese');
  console.log('Font registered successfully');
} catch (e: any) {
  console.error('Font error:', e.message);
  doc.font('Helvetica');
}

doc.fontSize(24).text('餐饮选址评估报告');
doc.fontSize(14).text('测试中文内容：上海市静安区南京西路1788号');
doc.text('综合得分: 50分');
doc.end();
