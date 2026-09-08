// Teste automatizado (desktop): carrega o site em Chromium headless, verifica erros de console e captura telas.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat, mkdir } from 'fs/promises';
import { extname, join } from 'path';

const raiz = new URL('..', import.meta.url).pathname;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.map': 'application/json', '.json': 'application/json', '.mp3': 'audio/mpeg' };
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
await mkdir(saida, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
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
await page.waitForTimeout(4000);
await page.screenshot({ path: `${saida}/02-terra.png` });
const fichaTerra = await page.textContent('#hud-cartao .corpo');

// Ritmo: cicla e confere o relógio
await page.click('#hud-ritmo');
await page.waitForTimeout(300);
const ritmoTxt = await page.textContent('#hud-ritmo');
const fichaTerra2 = await page.textContent('#hud-cartao .corpo');

// Saturno + quiz
await page.click('#hud-chips button[data-corpo="saturno"]');
await page.waitForTimeout(4000);
await page.screenshot({ path: `${saida}/03-saturno.png` });
await page.click('#hud-cartao button[data-id="quiz"]');
await page.waitForTimeout(300);
await page.click('#hud-cartao button[data-id="resp0"]');
await page.waitForTimeout(300);
const resultado = await page.textContent('#hud-cartao h2');
await page.screenshot({ path: `${saida}/04-quiz-resultado.png` });

// Viagem guiada (narração silenciada e encurtada para o teste)
await page.evaluate(() => { window.SSVR.narrador.mudo = true; window.SSVR.narrador._silencio = (t, fim) => setTimeout(fim, 600); });
await page.click('#hud-missao');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${saida}/05-viagem-abertura.png` });
const abertura = await page.textContent('#hud-cartao h2');
// avança automaticamente (filme) até a Terra (checkpoint) — cada parada ≈ 1,4 s viagem + 0,6 s narração + 2,5 s pausa
await page.waitForFunction(() => document.querySelector('#hud-cartao h2')?.textContent.startsWith('Checkpoint'), null, { timeout: 90000 });
await page.screenshot({ path: `${saida}/06-checkpoint-terra.png` });
const checkpoint = await page.textContent('#hud-cartao h2');
await page.click('#hud-cartao button[data-id="resp0"]');
await page.waitForTimeout(400);
await page.click('#hud-cartao button[data-id="continuarMissao"]');
await page.waitForTimeout(4500);
await page.screenshot({ path: `${saida}/07-viagem-lua.png` });
const lua = await page.textContent('#hud-cartao h2');
// pausa o filme e sai
await page.click('#hud-cartao button[data-id="filme"]');
await page.waitForTimeout(300);
const btnFilme = await page.textContent('#hud-cartao button[data-id="filme"]');
await page.click('#hud-cartao button[data-id="sairMissao"]');

// Distâncias reais e estação de tamanhos
await page.click('#hud-modo');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${saida}/08-real.png` });
await page.click('#hud-modo');
await page.click('#hud-estacao');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${saida}/09-tamanhos.png` });
await page.click('#hud-estacao');
await page.waitForTimeout(800);

const info = await page.evaluate(() => ({ vr: document.querySelector('#VRButton')?.textContent, data: document.querySelector('#hud-data')?.textContent, versao: window.SSVR.versao }));
console.log(JSON.stringify({ resultadoQuiz: resultado, ritmoTxt, relogio: fichaTerra2.includes('Ritmo atual'), abertura, checkpoint, lua, btnFilme, info, erros, avisos: avisos.slice(0, 10) }, null, 2));
await browser.close();
servidor.close();
process.exit(erros.length ? 1 : 0);
