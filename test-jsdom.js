import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Loading dist/index.html...");
  const htmlRaw = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf-8');
  const html = htmlRaw.replace(/(src|href)="\//g, `$1="file://${__dirname}/dist/`);
  
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: `file://${__dirname}/dist/index.html`,
    pretendToBeVisual: true
  });

  const window = dom.window;

  // Mock some browser APIs that might be missing
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        importKey: async () => ({}),
        encrypt: async () => new Uint8Array(),
        decrypt: async () => new Uint8Array(),
      },
      getRandomValues: (arr) => arr,
    }
  });
  window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
  };
  window.Worker = class {
    constructor() {}
    postMessage() {}
    terminate() {}
  };

  window.addEventListener("error", (event) => {
    console.error("JSDOM ERROR:", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("JSDOM PROMISE REJECTION:", event.reason);
  });

  setTimeout(() => {
    console.log("Root content length:", dom.window.document.getElementById('root').innerHTML.length);
    console.log("Root content sample:", dom.window.document.getElementById('root').innerHTML.substring(0, 200));
    console.log("Splash hidden?", dom.window.document.getElementById('fittrack-splash').classList.contains('hidden'));
    console.log("Finished JSDOM execution.");
    process.exit(0);
  }, 3000);
}

run().catch(console.error);
