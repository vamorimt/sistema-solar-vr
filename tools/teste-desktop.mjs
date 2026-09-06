// Teste automatizado (desktop): carrega o site em Chromium headless, verifica erros de console e captura telas.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join } from 'path';

const raiz = new URL('..', import.meta.url).pathname;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.map': 'application/json', '.json': 'application/json' };
const servidor = createServer(async (req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = join(raiz, caminho);
  try {
    await stat(arquivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] || 'application/octet-stream' });
    res.end(await readFile(arquivo));
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => servidor.listen(8123, r));

const saida = process.argv[2] || '/tmp/ssvr-capturas';
const { mkdir } = await import('fs/promises');
await mkdir(saida, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const erros = [], avisos = [];
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); else if (m.type() === 'warning') avisos.push(m.text()); });
page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
await page.goto('http://localhost:8123/', { waitUntil: 'load' });
await page.waitForFunction(() => !document.querySelector('#hud-carregando'), null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${saida}/01-inicio.png` });

// fecha boas-vindas, viaja até a Terra via chip
await page.click('#hud-cartao button[data-id="fechar"]');
await page.click('#hud-chips button[data-corpo="terra"]');
await page.waitForTimeout(2200);
await page.screenshot({ path: `${saida}/02-terra.png` });

// Saturno
await page.click('#hud-chips button[data-corpo="saturno"]');
await page.waitForTimeout(2200);
await page.screenshot({ path: `${saida}/03-saturno.png` });

// Quiz de Saturno
await page.click('#hud-cartao button[data-id="quiz"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${saida}/04-quiz.png` });
await page.click('#hud-cartao button[data-id="resp0"]');
await page.waitForTimeout(300);
const resultado = await page.textContent('#hud-cartao h2');
await page.screenshot({ path: `${saida}/05-quiz-resultado.png` });

// Missão guiada
await page.click('#hud-missao');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${saida}/06-missao.png` });
await page.click('#hud-cartao button[data-id="proxima"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${saida}/07-missao-mercurio.png` });

// Distâncias reais
await page.click('#hud-modo');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${saida}/08-real.png` });
await page.click('#hud-modo');

// Estação de tamanhos
await page.click('#hud-estacao');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${saida}/09-tamanhos.png` });
await page.click('#hud-estacao');
await page.waitForTimeout(800);
await page.screenshot({ path: `${saida}/10-volta.png` });

const info = await page.evaluate(() => ({ vr: document.querySelector('#VRButton')?.textContent, data: document.querySelector('#hud-data')?.textContent }));
console.log(JSON.stringify({ resultadoQuiz: resultado, info, erros, avisos: avisos.slice(0, 10) }, null, 2));
await browser.close();
servidor.close();
process.exit(erros.length ? 1 : 0);
