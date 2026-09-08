// Gera versões de arquivo único (texturas 1k embutidas em base64):
//   dist/preview.html  — página completa, abre direto no navegador (duplo clique) ou pode ser hospedada
//   dist/artifact.html — mesmo conteúdo sem <html>/<head>/<body> (para publicação como Artifact)
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const raiz = new URL('..', import.meta.url).pathname;
const MAPA = {
  sol: 'sun.jpg', mercurio: 'mercury.jpg', venus: 'venus_surface.jpg', terra: 'earth_daymap.jpg',
  terraNuvens: 'earth_clouds_1024.png', terraNormal: 'earth_normal.jpg', terraEspecular: 'earth_specular.jpg',
  marte: 'mars.jpg', jupiter: 'jupiter.jpg', saturno: 'saturn.jpg', urano: 'uranus.jpg', netuno: 'neptune.jpg',
  lua: 'moon.jpg', anelSaturno: 'saturn_ring.png', anelUrano: 'uranus_ring.png', estrelas: 'stars_2k.jpg',
};

const texturas = {};
for (const [k, f] of Object.entries(MAPA)) {
  const buf = await readFile(join(raiz, 'assets/textures-1k', f));
  const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
  texturas[k] = `data:${mime};base64,${buf.toString('base64')}`;
}
// narração (mp3) embutida, se existir
const narracao = {};
try {
  const { readdir } = await import('fs/promises');
  for (const f of await readdir(join(raiz, 'assets/audio'))) {
    if (!f.endsWith('.mp3')) continue;
    const buf = await readFile(join(raiz, 'assets/audio', f));
    narracao[f.replace('.mp3', '')] = `data:audio/mpeg;base64,${buf.toString('base64')}`;
  }
} catch (e) { /* sem áudio */ }
let app = await readFile(join(raiz, 'dist/app.js'), 'utf8');
app = app.replace(/\/\/# sourceMappingURL=.*$/m, '').replace(/<\/script/gi, '<\\/script');

const head = `<title>Sistema Solar VR</title>
<meta name="description" content="Experiência educacional imersiva sobre o Sistema Solar (BNCC, Fundamental II) — versão de pré-visualização com texturas reduzidas.">
<style>html,body{margin:0;background:#02040a;color:#e6ebf5;overflow:hidden;height:100%}</style>`;
const corpo = `<script>window.__TEXTURAS__=${JSON.stringify(texturas)};window.__NARRACAO__=${JSON.stringify(narracao)};</script>
<script>${app}</script>`;

await mkdir(join(raiz, 'dist'), { recursive: true });
await writeFile(join(raiz, 'dist/artifact.html'), `${head}\n${corpo}\n`);
await writeFile(join(raiz, 'dist/preview.html'), `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${corpo}\n</body>\n</html>\n`);
const tam = (await readFile(join(raiz, 'dist/preview.html'))).length;
console.log(`preview.html: ${(tam / 1048576).toFixed(2)} MB (${Object.keys(narracao).length} narrações embutidas)`);
