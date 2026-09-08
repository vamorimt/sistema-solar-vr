# Sistema Solar VR · Ciências (Fundamental II)

Experiência educacional imersiva sobre o Sistema Solar, feita em **WebXR** (three.js) para o **Pico Neo 3**, mas que também roda em computador e celular. Alinhada à BNCC (EF06CI13, EF08CI12-13, EF09CI14-17).

**Versão 0.2.0** — viagem guiada narrada, ritmo do tempo simplificado, painéis sempre de frente.

## O que já funciona

- Sol, 8 planetas, 7 luas (Lua, Io, Europa, Ganimedes, Calisto, Titã, Tritão), anéis de Saturno e Urano, Cinturão de Asteroides e Cinturão de Kuiper, céu com a Via Láctea.
- **Posições reais**: os planetas ficam onde estão de verdade na data simulada (elementos keplerianos J2000 do JPL). Rotação com o período e a inclinação do eixo de cada planeta (Vênus e Urano giram "ao contrário").
- **Ritmo do tempo** em três passos nomeados pelo que se vê — *dias* (1 s = 1 h: rotação), *meses* (1 s = 1 dia: luas e órbitas internas), *anos* (1 s = 1 mês: órbitas externas) — mais pausa. A ficha de cada corpo mostra um "relógio": quanto tempo real leva um dia e um ano dali no ritmo atual.
- **Dois modos de distância**: didático (comprimido, cabe em ~80 m) e real (1 UA = 40 m) — para mostrar que o Sistema Solar é quase todo vazio.
- **Estação "Comparar tamanhos"**: todos os corpos em escala real de tamanho (Terra = 1 m), com o Sol de 109 m ao fundo.
- **Ficha de cada corpo** em pt-BR (distância, diâmetro, gravidade, ano, dia, luas, temperatura), curiosidades e **quiz** com feedback e explicação.
- **Viagem guiada narrada** ("filme"): 16 paradas do Sol ao Cinturão de Kuiper e à escala real, com narração em áudio (pt-BR), legenda no painel, ritmo do tempo ajustado em cada parada, 4 checkpoints com pergunta e fade suave entre teletransportes. Pode ser assistida no automático ou passo a passo; termina de volta na exploração livre.
- **VR**: apontar + gatilho, grip para viajar, analógicos para se mover/girar, menu flutuando sobre o controle esquerdo, painéis que se viram sempre para o usuário.
- **Desktop/celular**: mouse/toque, atalhos de teclado, cartão lateral com o mesmo conteúdo.

## Como testar no Pico Neo 3

WebXR só funciona em **HTTPS** (ou `localhost`). Um arquivo aberto direto do armazenamento do óculos **não** entra em VR.

1. Publique a pasta em um endereço HTTPS (GitHub Pages, abaixo).
2. No óculos, abra o **Pico Browser** (ou o navegador **Wolvic**, gratuito na loja) e acesse a URL.
3. Toque em **"Entrar em VR"** na parte de baixo da página e aceite a permissão.
4. Controles: gatilho = selecionar · grip = viajar até o corpo apontado · analógico direito = andar / girar · analógico esquerdo = lateral / subir-descer · A/X = abre/fecha o painel · B/Y = volta ao início. O menu flutua acima do controle esquerdo (levante a mão). O botão "Ritmo ▸" dos painéis muda a velocidade do tempo.

## Publicar no GitHub Pages (grátis, HTTPS)

```bash
git init
git add .
git commit -m "Sistema Solar VR v0.1"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/sistema-solar-vr.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/sistema-solar-vr/`.

O arquivo `.nojekyll` já está incluído e o `dist/app.js` compilado também, então não é preciso nenhum passo de build no GitHub.

## Narração em áudio

Os textos ficam em `src/data/narracao.json`; o áudio em `assets/audio/<id>.mp3`. Os arquivos incluídos foram gerados com uma voz offline (piper, `pt-br-edresson-low`). Para uma voz neural de alta qualidade, gere de novo no seu computador (precisa de internet):

```bash
pip install edge-tts
python tools/gerar-narracao.py                 # voz pt-BR-FranciscaNeural (feminina)
python tools/gerar-narracao.py --voz pt-BR-AntonioNeural
npm run preview                                # reembute o áudio no dist/preview.html
```

Se um arquivo de áudio não existir, o site usa a voz do navegador (speechSynthesis) e, sem ela, apenas a legenda.

## Desenvolvimento

```bash
npm install          # instala three.js e esbuild
npm run dev          # servidor local em http://localhost:8080 com recompilação automática
npm run build        # gera dist/app.js (minificado)
npm run preview      # gera dist/preview.html (arquivo único com texturas 1k embutidas)
```

`dist/preview.html` abre com duplo clique em qualquer computador — útil para mostrar o projeto sem hospedar. Ele também pode ser enviado ao GitHub renomeado como `index.html` (um único arquivo, ~6 MB) quando não der para subir as pastas.

Para testar em VR a partir do computador sem publicar, é preciso servir com HTTPS na rede local (ex.: `npx local-web-server --https` ou um túnel como `ngrok http 8080`) e abrir o endereço no óculos.

## Estrutura

```
index.html                 página (carrega dist/app.js)
src/main.js                aplicação: estado, viagens, missão, quiz, HUD, VR
src/data/corpos.js         DADOS e TEXTOS didáticos (edite aqui o conteúdo)
src/core/kepler.js         mecânica orbital + escalas de cena
src/scene/sistema.js       construção 3D (corpos, órbitas, cinturões, estação de tamanhos)
src/ui/painel.js           painéis/rótulos em canvas para VR
src/ui/hud.js              interface 2D (desktop/celular)
src/xr/controles.js        controles do Pico (raio, gatilho, grip, analógicos)
src/app/textos.js          formatação pt-BR, ritmos do tempo, relógio comparativo, ajuda
src/app/narrador.js        narração (mp3 → voz do navegador → legenda)
src/data/narracao.json     TEXTO NARRADO de cada parada da viagem
assets/audio/              narração em mp3 (gerada por tools/gerar-narracao.py)
assets/textures/           texturas 2k (site)  ·  assets/textures-1k/ (preview)
tools/                     build do preview e teste automatizado (Playwright)
docs/PLANO.md              plano pedagógico e roteiro de versões
```

## Créditos e licenças

- Dados astronômicos: NASA Planetary Fact Sheet e JPL (elementos keplerianos aproximados, J2000).
- Texturas dos planetas, Sol e Lua: [Solar System Scope](https://www.solarsystemscope.com/textures/) — CC BY 4.0.
- Nuvens, relevo e brilho oceânico da Terra: exemplos do three.js — MIT.
- Anéis de Saturno/Urano e céu estrelado: Planet Pixel Emporium (James Hastings-Trew) — uso livre com crédito.
- Código: MIT.
