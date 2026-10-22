import puppeteer from 'puppeteer-core';

(async () => {
  console.log("Starting Puppeteer with /usr/bin/chromium");
  try {
    const browser = await puppeteer.launch({ 
      executablePath: '/usr/bin/chromium', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    console.log("Browser launched");
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    console.log("Navigating to http://localhost:8090");
    await page.goto('http://localhost:8090', { waitUntil: 'networkidle0' });
    
    // Wait a bit for React to render and crash
    await new Promise(r => setTimeout(r, 2000));
    
    const text = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerText : 'NO ROOT';
    });
    console.log('--- CONTENT OF ROOT ---');
    console.log(text);
    
    // Also get the component stack if it's there
    const stack = await page.evaluate(() => {
      const pre = document.querySelector('pre');
      return pre ? pre.innerText : 'NO PRE FOUND';
    });
    console.log('--- ERROR PRE ---');
    console.log(stack);
    
    await browser.close();
    console.log("Done");
  } catch (err) {
    console.error("Puppeteer Error:", err);
  }
})();
