import PDFDocument from 'pdfkit';
import fs from 'fs';

// 使用wqy-zenhei字体，指定索引0
const fontPath = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc';
console.log('Font exists:', fs.existsSync(fontPath));

const doc = new PDFDocument({ size: 'A4' });
const chunks: Buffer[] = [];
doc.on('data', (chunk) => chunks.push(chunk));
doc.on('end', () => {
  const buffer = Buffer.concat(chunks);
  fs.writeFileSync('/tmp/test-chinese2.pdf', buffer);
  console.log('PDF size:', buffer.length);
});

try {
  // 对于TTC字体集合，需要指定字体名称或索引
  doc.registerFont('Chinese', fontPath, 'WenQuanYi Zen Hei');
  doc.font('Chinese');
  console.log('Font registered successfully');
} catch (e: any) {
  console.error('Font error:', e.message);
  // 尝试使用索引方式
  try {
    doc.registerFont('Chinese2', { fontPath, family: 'WenQuanYi Zen Hei' });
    doc.font('Chinese2');
    console.log('Font registered with family name');
  } catch (e2: any) {
    console.error('Font error 2:', e2.message);
    doc.font('Helvetica');
  }
}

doc.fontSize(24).text('餐饮选址评估报告');
doc.fontSize(14).text('测试中文内容：上海市静安区南京西路1788号');
doc.text('综合得分: 50分');
doc.text('数字测试: 0123456789');
doc.end();
