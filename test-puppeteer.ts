import puppeteer from 'puppeteer';
import fs from 'fs';

async function test() {
  console.log('Starting Puppeteer test...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Browser launched');
    
    const page = await browser.newPage();
    console.log('Page created');
    
    await page.setContent('<html><body><h1>测试中文内容</h1><p>这是一个PDF测试</p></body></html>');
    console.log('Content set');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    console.log('PDF generated, size:', pdfBuffer.length);
    
    fs.writeFileSync('/tmp/puppeteer-test.pdf', pdfBuffer);
    console.log('PDF saved to /tmp/puppeteer-test.pdf');
    
    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
