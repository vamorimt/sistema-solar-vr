// Sistema Solar VR — ponto de entrada
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SistemaSolar } from './scene/sistema.js';
import { Painel } from './ui/painel.js';
import { HUD, CSS } from './ui/hud.js';
import { ControlesXR } from './xr/controles.js';
import { Narrador } from './app/narrador.js';
import { PLANETAS, LUAS, CINTUROES, MISSAO, NARRACAO } from './data/corpos.js';
import { RITMOS, ritmoPorId, fmtData, fichaDe, relogioDe, tituloDe, subtituloDe, dadosDe, AJUDA_VR, AJUDA_DESKTOP } from './app/textos.js';

const VERSAO = '0.2.0';
const MANIFESTO = {
  sol: '2k_sun.jpg', mercurio: '2k_mercury.jpg', venus: '2k_venus_surface.jpg', terra: '2k_earth_daymap.jpg',
  terraNuvens: 'earth_clouds_1024.png', terraNormal: 'earth_normal_2048.jpg', terraEspecular: 'earth_specular_2048.jpg',
  marte: '2k_mars.jpg', jupiter: '2k_jupiter.jpg', saturno: '2k_saturn.jpg', urano: '2k_uranus.jpg', netuno: '2k_neptune.jpg',
  lua: '2k_moon.jpg', anelSaturno: 'saturn_ring.png', anelUrano: 'uranus_ring.png', estrelas: 'stars_4k.jpg',
};
const LINEARES = new Set(['terraNormal', 'terraEspecular']);
const CREDITOS = 'Dados: NASA / JPL · Texturas: Solar System Scope (CC BY 4.0), three.js';
const POSICAO_INICIAL_VR = new THREE.Vector3(0, 2.5, 26);
const CAMERA_INICIAL = new THREE.Vector3(0, 12, 34);

// ---------------------------------------------------------------- estado
const estado = {
  data: Date.now(), ritmo: 1, pausado: false, modo: 'didatico', orbitas: true, rotulos: true, estacao: false,
  selecionado: null, hover: null, seguindo: null, missao: null, filme: true, filmeSuspenso: false,
  conteudo: null, tween: null, painelAberto: false,
};
let missaoSeq = 0;
let progresso = { quiz: {}, missaoEtapa: 0 };
try { progresso = { ...progresso, ...(JSON.parse(localStorage.getItem('ssvr.progresso') || '{}')) }; } catch (e) { /* sem armazenamento */ }
function salvarProgresso() { try { localStorage.setItem('ssvr.progresso', JSON.stringify(progresso)); } catch (e) { /* ignora */ } }
const ritmoAtual = () => RITMOS[estado.ritmo];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- base
const style = document.createElement('style');
style.textContent = CSS;
document.head.appendChild(style);

const hud = new HUD({ aoAcao: acaoHUD, aoBotao: aoBotao, aoChip: (id) => { selecionar(id); viajar(id); } });
hud.setChips([{ id: 'sol', nome: 'Sol', cor: '#ffcc55' }, ...PLANETAS.map((p) => ({ id: p.id, nome: p.nome, cor: '#' + p.cor.toString(16).padStart(6, '0') })), { id: 'lua', nome: 'Lua', cor: '#bbbbbb' }, ...CINTUROES.map((c) => ({ id: c.id, nome: c.nome.replace('Cinturão de ', 'C. '), cor: '#' + c.cor.toString(16).padStart(6, '0') }))]);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(0.6);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 8000);
camera.position.copy(CAMERA_INICIAL);
const rig = new THREE.Group();
rig.name = 'rig';
rig.add(camera);
scene.add(rig);
scene.add(new THREE.AmbientLight(0x2a3a5c, 0.9));

// escurecimento (fade) para teletransportes confortáveis em VR
const fade = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
fade.position.z = -0.4;
fade.renderOrder = 100;
fade.visible = false;
camera.add(fade);
let fadeAlvo = 0, fadeVel = 0;
function fadePara(alvo, dur) {
  fadeAlvo = alvo;
  fadeVel = dur > 0 ? 1 / dur : 1e6;
  fade.visible = true;
  return new Promise((r) => setTimeout(r, dur * 1000));
}
function atualizarFade(dt) {
  if (!fade.visible) return;
  const m = fade.material;
  const passo = fadeVel * dt;
  m.opacity = m.opacity < fadeAlvo ? Math.min(fadeAlvo, m.opacity + passo) : Math.max(fadeAlvo, m.opacity - passo);
  if (m.opacity === 0 && fadeAlvo === 0) fade.visible = false;
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;
controls.maxDistance = 4000;
controls.target.set(0, 0, 0);

// Painéis VR (dentro do rig, para acompanhar o usuário)
const painelInfo = new Painel({ largura: 1.25, altura: 0.95, px: 1024, nome: 'painel-info' });
const painelMenu = new Painel({ largura: 0.34, altura: 0.28, px: 680, nome: 'painel-menu' });
rig.add(painelInfo.mesh, painelMenu.mesh);
let menuAtivo = false; // vira true quando o controle esquerdo conecta (só em VR)

const narrador = new Narrador({ fontes: window.__NARRACAO__ || null });

let sistema = null;
let controlesXR = null;
const vTmp = new THREE.Vector3(), vTmp2 = new THREE.Vector3(), vCam = new THREE.Vector3();

// ---------------------------------------------------------------- carregamento
async function carregarTexturas() {
  const base = window.__TEXTURAS_BASE__ || 'assets/textures/';
  const fontes = window.__TEXTURAS__ || null;
  const loader = new THREE.TextureLoader();
  const chaves = Object.keys(MANIFESTO);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  let feitas = 0;
  const tex = {};
  await Promise.all(chaves.map((k) => new Promise((res) => {
    const url = fontes ? fontes[k] : base + MANIFESTO[k];
    const fim = () => { feitas++; hud.setCarregando(feitas / chaves.length); res(); };
    if (!url) return fim();
    loader.load(url, (t) => {
      t.colorSpace = LINEARES.has(k) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      tex[k] = t;
      fim();
    }, undefined, () => { console.warn('Textura não carregada:', k, url); fim(); });
  })));
  return tex;
}

async function iniciar() {
  hud.setCarregando(0.02, 'Carregando texturas…');
  const tex = await carregarTexturas();
  hud.setCarregando(1, 'Montando o Sistema Solar…');
  sistema = new SistemaSolar(tex);
  scene.add(sistema.group, sistema.estacao);
  controlesXR = new ControlesXR(renderer, rig, camera, {
    alvos: () => (estado.estacao ? sistema.estacaoItens.map((i) => i.malha) : sistema.selecionaveis),
    paineis: () => [painelInfo.mesh, painelMenu.mesh],
    aoHover: (id) => { estado.hover = id; },
    aoSelecionar: (id) => { if (estado.selecionado === id && estado.painelAberto) viajar(id); else selecionar(id); },
    aoBotaoPainel: (painel, id) => aoBotao(id),
    aoGrip: (id) => { const alvo = id || estado.selecionado; if (alvo) { selecionar(alvo, false); viajar(alvo); } },
    aoMenu: () => alternarPainel(),
    aoBotaoA: () => alternarPainel(),
    aoBotaoB: () => voltarInicio(),
    aoConectar: (info) => { if (info.mao === 'left') { menuAtivo = true; atualizarMenu(); } },
    velocidade: velocidadeLocomocao,
  });
  criarBotaoVR();
  configurarDesktop();
  hud.setEstado(estado);
  hud.setRitmo(ritmoAtual(), estado.pausado);
  hud.setData(fmtData(estado.data));
  if (narrador.suportaVoz) window.speechSynthesis.getVoices(); // aquece a lista de vozes
  setTimeout(() => hud.setCarregando(null), 300);
  mostrarBoasVindas();
  renderer.setAnimationLoop(loop);
}

// ---------------------------------------------------------------- VR
function criarBotaoVR() {
  const b = document.createElement('button');
  b.id = 'VRButton';
  Object.assign(b.style, { position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '64px', padding: '12px 22px', border: '1px solid #8fd0ff', background: 'rgba(20,40,80,.9)', color: '#fff', font: '600 15px system-ui, sans-serif', cursor: 'pointer', zIndex: 6 });
  document.body.appendChild(b);
  const xr = navigator.xr;
  if (!xr) {
    b.textContent = window.isSecureContext ? 'VR não disponível neste navegador' : 'VR exige HTTPS';
    b.disabled = true;
    b.style.opacity = 0.6;
    return;
  }
  xr.isSessionSupported('immersive-vr').then((ok) => {
    if (!ok) { b.textContent = 'VR não disponível neste dispositivo'; b.disabled = true; b.style.opacity = 0.6; return; }
    b.textContent = 'Entrar em VR';
    let sessao = null;
    b.onclick = async () => {
      if (sessao) { sessao.end(); return; }
      try {
        sessao = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'layers'] });
        sessao.addEventListener('end', () => { sessao = null; b.textContent = 'Entrar em VR'; });
        await renderer.xr.setSession(sessao);
        b.textContent = 'Sair do VR';
      } catch (e) { console.error(e); b.textContent = 'Não foi possível iniciar o VR'; }
    };
  });
  renderer.xr.addEventListener('sessionstart', () => {
    controls.enabled = false;
    estado.seguindo = null;
    estado.tween = null;
    narrador.parar();
    if (estado.missao) { estado.missao = null; hud.setEstado(estado); }
    if (estado.estacao) { rig.position.set(-16, 0, 14); rig.rotation.set(0, 0, 0); }
    else { rig.position.copy(POSICAO_INICIAL_VR); rig.rotation.set(0, 0, 0); }
    setTimeout(() => { mostrarBoasVindas(); }, 1200);
  });
  renderer.xr.addEventListener('sessionend', () => {
    controls.enabled = true;
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    camera.position.copy(CAMERA_INICIAL);
    controls.target.set(0, 0, 0);
    estado.seguindo = null;
    narrador.parar();
    painelInfo.esconder();
    menuAtivo = false;
    painelMenu.visivel = false;
  });
}

function velocidadeLocomocao() {
  if (!sistema) return 2;
  if (estado.estacao) return 4;
  camera.getWorldPosition(vCam);
  let menor = Infinity;
  for (const c of sistema.corpos.values()) {
    if (c.tipo === 'cinturao') continue;
    c.malha.getWorldPosition(vTmp);
    const d = vTmp.distanceTo(vCam) - c.raio;
    if (d < menor) menor = d;
  }
  return THREE.MathUtils.clamp(menor * 0.9, 0.6, estado.modo === 'real' ? 400 : 40);
}

/** Coloca o painel de informações à frente e um pouco à esquerda da cabeça (coordenadas do rig). */
function posicionarPainel() {
  rig.updateMatrixWorld(true);
  camera.getWorldPosition(vCam);
  camera.getWorldDirection(vTmp);
  vTmp.y = 0;
  if (vTmp.lengthSq() < 1e-4) vTmp.set(0, 0, -1);
  vTmp.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.38);
  const pos = vTmp2.copy(vCam).addScaledVector(vTmp, 1.5);
  pos.y = vCam.y - 0.1;
  painelInfo.mesh.position.copy(rig.worldToLocal(pos.clone()));
  orientarPaineis();
}

/** Mantém os painéis sempre de frente para a cabeça (evita vê-los "ao contrário"). */
function orientarPaineis() {
  camera.getWorldPosition(vCam);
  if (painelInfo.mesh.visible) {
    painelInfo.mesh.updateMatrixWorld();
    vTmp.setFromMatrixPosition(painelInfo.mesh.matrixWorld);
    painelInfo.mesh.lookAt(vCam.x, vTmp.y, vCam.z);
  }
  if (menuAtivo && controlesXR) {
    const esq = controlesXR.maoEsquerda;
    const rastreado = !!(esq && esq.controller.visible);
    painelMenu.mesh.visible = rastreado;
    if (rastreado) {
      esq.grip.getWorldPosition(vTmp);
      vTmp.y += 0.17;
      painelMenu.mesh.position.copy(rig.worldToLocal(vTmp.clone()));
      painelMenu.mesh.updateMatrixWorld();
      painelMenu.mesh.lookAt(vCam.x, vTmp.y - 0.05, vCam.z);
    }
  }
}

function alternarPainel() {
  if (estado.painelAberto) fecharPainel();
  else if (estado.conteudo) mostrarConteudo(estado.conteudo, true);
  else mostrarBoasVindas();
}

// ---------------------------------------------------------------- conteúdo / painéis
function mostrarConteudo(c, reposicionar = false) {
  estado.conteudo = c;
  const estavaFechado = !estado.painelAberto;
  estado.painelAberto = true;
  painelInfo.mostrar(c);
  if (renderer.xr.isPresenting) { if (estavaFechado || reposicionar) posicionarPainel(); }
  else painelInfo.mesh.visible = false; // no desktop o conteúdo vai para o cartão 2D
  hud.mostrarCartao(c);
}

function fecharPainel() {
  estado.painelAberto = false;
  painelInfo.esconder();
  hud.mostrarCartao(null);
}

function mostrarBoasVindas() {
  const emVR = renderer.xr.isPresenting;
  mostrarConteudo({
    titulo: 'Bem-vindo ao Sistema Solar VR',
    subtitulo: 'Ciências da Natureza · Ensino Fundamental II · BNCC EF06CI13, EF08CI12-13, EF09CI14-17',
    texto: emVR
      ? 'Você está flutuando acima do Sistema Solar, com o Sol à sua frente. "Assistir a viagem" leva você de planeta em planeta com narração; ou aponte para um planeta e puxe o gatilho para explorar por conta própria.\n\n' + AJUDA_VR
      : 'Explore o Sistema Solar em 3D. "Assistir a viagem" leva você de planeta em planeta com narração e perguntas; ou clique nos planetas para explorar por conta própria.\n\n' + AJUDA_DESKTOP,
    botoes: [{ id: 'missao', rotulo: 'Assistir a viagem', primario: true }, { id: 'fechar', rotulo: 'Explorar livremente' }, { id: 'ajuda', rotulo: 'Ajuda' }],
    rodape: `v${VERSAO} · ${CREDITOS}`,
    tamanhoTexto: 25,
  }, true);
}

function botaoRitmo() { return { id: 'ritmo', rotulo: `${ritmoAtual().rotulo} ▸` }; }

function conteudoInfo(id) {
  const d = dadosDe(id);
  if (!d) return null;
  const texto = d.resumo + '\n\n' + fichaDe(id).join('\n') + '\n\n' + relogioDe(id, ritmoAtual(), estado.pausado);
  const botoes = [];
  if (!estado.estacao) botoes.push({ id: 'viajar', rotulo: 'Viajar até aqui', primario: true });
  if (d.fatos) botoes.push({ id: 'fatos', rotulo: 'Curiosidades' });
  if (d.quiz) botoes.push({ id: 'quiz', rotulo: progresso.quiz[id]?.acertou ? 'Quiz ✓' : 'Quiz' });
  botoes.push(botaoRitmo());
  if (estado.missao) botoes.push({ id: 'voltarMissao', rotulo: 'Voltar à viagem' });
  botoes.push({ id: 'fechar', rotulo: 'Fechar' });
  return { titulo: tituloDe(id), subtitulo: subtituloDe(id), texto, botoes, rodape: CREDITOS, tamanhoTexto: 26 };
}

function conteudoFatos(id) {
  const d = dadosDe(id);
  return {
    titulo: `${d.nome} · Curiosidades`, subtitulo: subtituloDe(id),
    texto: d.fatos.map((f) => '• ' + f).join('\n'),
    botoes: [{ id: 'info', rotulo: 'Voltar' }, ...(d.quiz ? [{ id: 'quiz', rotulo: 'Quiz', primario: true }] : []), ...(estado.missao ? [{ id: 'voltarMissao', rotulo: 'Voltar à viagem' }] : []), { id: 'fechar', rotulo: 'Fechar' }],
    tamanhoTexto: 28,
  };
}

function conteudoQuiz(id, checkpoint = false) {
  const d = dadosDe(id), q = d.quiz;
  return {
    titulo: checkpoint ? `Checkpoint · ${d.nome}` : `Quiz · ${d.nome}`,
    subtitulo: checkpoint ? 'Responda para continuar a viagem' : 'Escolha a resposta correta',
    texto: q.pergunta,
    botoes: [...q.opcoes.map((o, i) => ({ id: 'resp' + i, rotulo: o, largura: 936 })), { id: checkpoint ? 'voltarMissao' : 'info', rotulo: 'Voltar' }],
    tamanhoTexto: 30, corBorda: checkpoint ? '#f2b84b' : undefined,
  };
}

function responderQuiz(id, i) {
  const d = dadosDe(id), q = d.quiz;
  const acertou = i === q.correta;
  const p = progresso.quiz[id] || { tentativas: 0, acertou: false };
  p.tentativas++;
  p.acertou = p.acertou || acertou;
  progresso.quiz[id] = p;
  salvarProgresso();
  const total = Object.values(progresso.quiz).filter((x) => x.acertou).length;
  const emMissao = !!estado.missao;
  mostrarConteudo({
    titulo: acertou ? 'Correto!' : 'Ainda não…',
    subtitulo: q.pergunta,
    texto: (acertou ? '' : `A resposta certa é: ${q.opcoes[q.correta]}\n\n`) + q.explicacao,
    corBorda: acertou ? '#2aa15a' : '#c0392b',
    botoes: [
      ...q.opcoes.map((o, k) => ({ id: 'x' + k, rotulo: o, largura: 936, cor: k === q.correta ? '#2aa15a' : (k === i ? '#c0392b' : '#1d2a4a') })),
      ...(acertou ? [] : [{ id: 'quiz', rotulo: 'Tentar de novo' }]),
      { id: emMissao ? 'continuarMissao' : 'info', rotulo: emMissao ? 'Continuar a viagem' : 'Continuar', primario: true },
    ],
    rodape: `Quizzes acertados: ${total} de ${[...PLANETAS, ...CINTUROES, LUAS[0]].length + 1}`,
    tamanhoTexto: 28,
  });
}

function conteudoAjuda() {
  return { titulo: 'Como usar', texto: renderer.xr.isPresenting ? AJUDA_VR : AJUDA_DESKTOP, botoes: [{ id: 'fechar', rotulo: 'Entendi', primario: true }], tamanhoTexto: 27, rodape: CREDITOS };
}

function conteudoEstacao() {
  return {
    titulo: 'Comparar tamanhos (escala real)', subtitulo: 'Terra = 1 m de diâmetro · BNCC EF09CI14',
    texto: 'Aqui todos os corpos estão na proporção real de tamanho. Se a Terra tivesse 1 metro de diâmetro, Júpiter teria 11 m, e o Sol, ao fundo, 109 m. Ande até os planetas para comparar — e repare como Mercúrio e a Lua ficam minúsculos.',
    botoes: [{ id: 'estacao', rotulo: 'Voltar ao Sistema Solar', primario: true }, { id: 'fechar', rotulo: 'Fechar' }],
    tamanhoTexto: 28,
  };
}

// ---------------------------------------------------------------- missão guiada (filme narrado)
function iniciarMissao(etapa = 0) {
  estado.missao = { etapa, token: 0 };
  estado.filmeSuspenso = false;
  hud.setEstado(estado);
  irEtapa(etapa);
}

function conteudoMissao(e, n) {
  const ultimo = n === MISSAO.length - 1;
  const botoes = [{ id: 'repetir', rotulo: 'Ouvir de novo' }];
  if (e.corpo) botoes.push({ id: 'info', rotulo: 'Ficha' });
  if (e.checkpoint) botoes.push({ id: 'checkpoint', rotulo: progresso.quiz[e.checkpoint]?.acertou ? 'Checkpoint ✓' : 'Checkpoint' });
  botoes.push(botaoRitmo());
  botoes.push({ id: 'filme', rotulo: estado.filme && !estado.filmeSuspenso ? 'Pausar filme' : 'Continuar filme' });
  botoes.push({ id: 'proxima', rotulo: ultimo ? 'Concluir' : 'Próxima ▶', primario: true });
  botoes.push({ id: 'sairMissao', rotulo: 'Sair' });
  return {
    titulo: e.titulo,
    subtitulo: `Viagem guiada · parada ${n + 1} de ${MISSAO.length} · ${ritmoAtual().descricao}`,
    texto: NARRACAO[e.id] || '',
    botoes, tamanhoTexto: 27, corBorda: '#f2b84b',
  };
}

async function irEtapa(n) {
  if (!estado.missao) return;
  if (n < 0) n = 0;
  if (n >= MISSAO.length) return finalizarMissao();
  const e = MISSAO[n];
  const token = ++missaoSeq;
  estado.missao.etapa = n;
  estado.missao.token = token;
  estado.missao.checkpointPendente = !!e.checkpoint;
  progresso.missaoEtapa = n;
  salvarProgresso();
  narrador.parar();
  if (estado.estacao) sairEstacao();
  if (e.modo && e.modo !== estado.modo) setModo(e.modo);
  setRitmo(ritmoPorId(e.ritmo));
  if (e.corpo) { estado.selecionado = e.corpo; await viajar(e.corpo, { fator: e.distancia || 1 }); }
  else await irInicio();
  if (!estado.missao || estado.missao.token !== token) return;
  mostrarConteudo(conteudoMissao(e, n), true);
  await narrador.falar(e.id, NARRACAO[e.id] || e.titulo);
  if (!estado.missao || estado.missao.token !== token) return;
  if (e.id === 'fim') { await esperar(1500); if (estado.missao && estado.missao.token === token) finalizarMissao(); return; }
  if (e.checkpoint && !progresso.quiz[e.checkpoint]?.acertou) {
    estado.selecionado = e.checkpoint;
    mostrarConteudo(conteudoQuiz(e.checkpoint, true));
    return; // segue quando o aluno responder
  }
  if (estado.filme && !estado.filmeSuspenso) {
    await esperar(2500);
    if (estado.missao && estado.missao.token === token) irEtapa(n + 1);
  }
}

function finalizarMissao() {
  const ids = MISSAO.map((e) => e.checkpoint).filter(Boolean);
  const acertos = ids.filter((c) => progresso.quiz[c]?.acertou).length;
  estado.missao = null;
  narrador.parar();
  hud.setEstado(estado);
  mostrarConteudo({
    titulo: 'Viagem concluída!', subtitulo: 'Do Sol ao Cinturão de Kuiper',
    texto: `Checkpoints acertados: ${acertos} de ${ids.length}.\n\nO que vimos: o Sol concentra quase toda a massa; os 4 planetas rochosos ficam perto do Sol e os 4 gigantes, longe; entre eles, o Cinturão de Asteroides; além de Netuno, o Cinturão de Kuiper. Cada planeta tem o seu próprio dia e o seu próprio ano — e o Sistema Solar é quase todo espaço vazio.\n\nAgora explore livremente: aponte para qualquer planeta ou lua.`,
    botoes: [{ id: 'fechar', rotulo: 'Explorar livremente', primario: true }, { id: 'estacao', rotulo: 'Comparar tamanhos' }, { id: 'missao', rotulo: 'Ver de novo' }],
    corBorda: '#2aa15a', tamanhoTexto: 27,
  }, true);
}

function continuarMissao(avancar) {
  if (!estado.missao) return fecharPainel();
  const n = estado.missao.etapa;
  if (avancar || (estado.filme && !estado.filmeSuspenso)) irEtapa(n + 1);
  else mostrarConteudo(conteudoMissao(MISSAO[n], n));
}

// ---------------------------------------------------------------- ações
function aoBotao(id) {
  const sel = estado.selecionado;
  if (id.startsWith('resp')) return responderQuiz(sel, Number(id.slice(4)));
  if (id.startsWith('x')) return; // botões de resultado (inertes)
  const suspendeFilme = ['info', 'fatos', 'quiz', 'checkpoint', 'ajuda', 'estacao'].includes(id);
  if (estado.missao && suspendeFilme) { estado.filmeSuspenso = true; narrador.parar(); }
  switch (id) {
    case 'viajar': if (sel) viajar(sel); return;
    case 'info': if (sel) mostrarConteudo(conteudoInfo(sel)); return;
    case 'fatos': if (sel) mostrarConteudo(conteudoFatos(sel)); return;
    case 'quiz': if (sel && dadosDe(sel)?.quiz) mostrarConteudo(conteudoQuiz(sel, !!estado.missao && MISSAO[estado.missao.etapa].checkpoint === sel)); return;
    case 'checkpoint': { const c = estado.missao && MISSAO[estado.missao.etapa].checkpoint; if (c) { estado.selecionado = c; mostrarConteudo(conteudoQuiz(c, true)); } return; }
    case 'fechar': fecharPainel(); return;
    case 'ajuda': mostrarConteudo(conteudoAjuda(), true); return;
    case 'missao': estado.filme = true; iniciarMissao(0); return;
    case 'repetir': if (estado.missao) { const e = MISSAO[estado.missao.etapa]; narrador.falar(e.id, NARRACAO[e.id] || e.titulo); } return;
    case 'filme': estado.filme = !(estado.filme && !estado.filmeSuspenso); estado.filmeSuspenso = false; if (estado.missao) { if (estado.filme && !narrador.falando) irEtapa(estado.missao.etapa + 1); else mostrarConteudo(conteudoMissao(MISSAO[estado.missao.etapa], estado.missao.etapa)); } return;
    case 'voltarMissao': if (estado.missao) mostrarConteudo(conteudoMissao(MISSAO[estado.missao.etapa], estado.missao.etapa)); else fecharPainel(); return;
    case 'continuarMissao': estado.filmeSuspenso = false; continuarMissao(false); return;
    case 'proxima': if (estado.missao) { estado.filmeSuspenso = false; irEtapa(estado.missao.etapa + 1); } return;
    case 'anterior': if (estado.missao) { estado.filmeSuspenso = false; irEtapa(estado.missao.etapa - 1); } return;
    case 'sairMissao': estado.missao = null; narrador.parar(); hud.setEstado(estado); fecharPainel(); return;
    case 'modo': alternarModo(); return;
    case 'estacao': if (estado.estacao) sairEstacao(); else entrarEstacao(); return;
    case 'inicio': voltarInicio(); return;
    case 'ritmo': setRitmo((estado.ritmo + 1) % RITMOS.length); reexibirConteudo(); return;
    case 'pausa': estado.pausado = !estado.pausado; hud.setRitmo(ritmoAtual(), estado.pausado); atualizarMenu(); reexibirConteudo(); return;
    case 'orbitas': estado.orbitas = !estado.orbitas; sistema.setOrbitasVisiveis(estado.orbitas); hud.setEstado(estado); atualizarMenu(); return;
    case 'rotulos': estado.rotulos = !estado.rotulos; sistema.setRotulosVisiveis(estado.rotulos); hud.setEstado(estado); atualizarMenu(); return;
    default: return;
  }
}

/** Redesenha o painel atual quando algo que ele mostra mudou (ritmo, pausa). */
function reexibirConteudo() {
  if (!estado.painelAberto || !estado.conteudo) return;
  const c = estado.conteudo;
  if (estado.missao && c.corBorda === '#f2b84b' && c.subtitulo?.startsWith('Viagem guiada')) mostrarConteudo(conteudoMissao(MISSAO[estado.missao.etapa], estado.missao.etapa));
  else if (estado.selecionado && c.titulo === tituloDe(estado.selecionado)) mostrarConteudo(conteudoInfo(estado.selecionado));
  else { c.botoes = (c.botoes || []).map((b) => (b.id === 'ritmo' ? botaoRitmo() : b)); mostrarConteudo(c); }
}

function acaoHUD(acao) {
  if (acao === 'modo') { alternarModo(); return; }
  aoBotao(acao);
}

function setRitmo(indice) {
  estado.ritmo = THREE.MathUtils.clamp(indice, 0, RITMOS.length - 1);
  estado.pausado = false;
  hud.setRitmo(ritmoAtual(), false);
  atualizarMenu();
}

function setModo(modo) {
  estado.modo = modo;
  sistema.setModo(modo);
  hud.setEstado(estado);
  atualizarMenu();
}

function alternarModo() {
  setModo(estado.modo === 'real' ? 'didatico' : 'real');
  if (!estado.seguindo && !estado.estacao) { estado.selecionado = estado.selecionado || 'terra'; viajar(estado.selecionado); }
}

function selecionar(id, mostrar = true) {
  if (!id) return;
  estado.selecionado = id;
  if (mostrar) mostrarConteudo(conteudoInfo(id));
}

async function voltarInicio() {
  if (estado.missao) { estado.missao = null; narrador.parar(); hud.setEstado(estado); }
  fecharPainel();
  await irInicio();
}

/** Volta ao ponto de vista inicial (acima do sistema, Sol à frente). */
async function irInicio() {
  if (estado.estacao) sairEstacao();
  estado.seguindo = null;
  estado.tween = null;
  if (renderer.xr.isPresenting) {
    await fadePara(1, 0.3);
    rig.position.copy(POSICAO_INICIAL_VR);
    rig.rotation.set(0, 0, 0);
    rig.updateMatrixWorld(true);
    if (estado.painelAberto) posicionarPainel();
    await fadePara(0, 0.4);
  } else {
    estado.tween = { t: 0, dur: 1.4, camDe: camera.position.clone(), camPara: CAMERA_INICIAL.clone(), alvoDe: controls.target.clone(), alvoPara: new THREE.Vector3(0, 0, 0) };
    await esperar(1400);
  }
  hud.setDica('Clique em um planeta para saber mais · duplo clique para viajar');
}

/** Viaja até um corpo (com fade em VR) e passa a segui-lo. */
async function viajar(id, { fator = 1 } = {}) {
  const c = sistema.corpos.get(id);
  if (!c) return;
  if (estado.estacao) sairEstacao();
  const alvo = sistema.posicaoDe(id, new THREE.Vector3());
  const raioVisual = c.dados.aneis ? c.raio * c.dados.aneis.externo : c.raio;
  const dist = Math.max(raioVisual * 3.0, 1.2) * fator;
  // ponto de vista pelo lado iluminado, ligeiramente acima
  const paraSol = new THREE.Vector3(0, 0, 0).sub(alvo);
  if (paraSol.lengthSq() < 1e-6) paraSol.set(0, 0, 1);
  paraSol.normalize();
  const lateral = new THREE.Vector3().crossVectors(paraSol, new THREE.Vector3(0, 1, 0)).normalize();
  const dirVista = paraSol.multiplyScalar(0.75).addScaledVector(lateral, 0.6).add(new THREE.Vector3(0, 0.3, 0)).normalize();
  hud.setDica(`Seguindo ${tituloDe(id)} · pressione B/Y ou "Início" para voltar`);
  if (renderer.xr.isPresenting) {
    await fadePara(1, 0.3);
    const alvoAgora = sistema.posicaoDe(id, new THREE.Vector3());
    const cabecaAlvo = alvoAgora.clone().addScaledVector(dirVista, dist);
    rig.updateMatrixWorld(true);
    camera.getWorldDirection(vTmp);
    const yawAtual = Math.atan2(-vTmp.x, -vTmp.z);
    const dirAlvo = alvoAgora.clone().sub(cabecaAlvo);
    const yawDesejado = Math.atan2(-dirAlvo.x, -dirAlvo.z);
    rig.rotation.y += yawDesejado - yawAtual;
    rig.updateMatrixWorld(true);
    const cabecaLocal = camera.position.clone().applyQuaternion(rig.quaternion);
    rig.position.copy(cabecaAlvo).sub(cabecaLocal);
    rig.updateMatrixWorld(true);
    estado.seguindo = { id, ultima: alvoAgora.clone() };
    if (estado.painelAberto) posicionarPainel();
    await fadePara(0, 0.4);
  } else {
    estado.tween = { t: 0, dur: 1.4, camDe: camera.position.clone(), offset: dirVista.clone().multiplyScalar(dist), alvoDe: controls.target.clone(), corpo: id };
    estado.seguindo = { id, ultima: alvo.clone() };
    await esperar(1400);
  }
}

function seguir() {
  if (!estado.seguindo) return;
  const pos = sistema.posicaoDe(estado.seguindo.id, vTmp);
  const delta = vTmp2.subVectors(pos, estado.seguindo.ultima);
  if (delta.lengthSq() > 0) {
    if (renderer.xr.isPresenting) rig.position.add(delta);
    else { camera.position.add(delta); controls.target.add(delta); if (estado.tween) { estado.tween.camDe.add(delta); estado.tween.alvoDe.add(delta); } }
    estado.seguindo.ultima.copy(pos);
  }
}

function animarCamera(dt) {
  const t = estado.tween;
  if (!t) return;
  t.t += dt / t.dur;
  const k = t.t >= 1 ? 1 : 1 - Math.pow(1 - t.t, 3);
  let camPara, alvoPara;
  if (t.corpo) { alvoPara = sistema.posicaoDe(t.corpo, new THREE.Vector3()); camPara = alvoPara.clone().add(t.offset); }
  else { camPara = t.camPara; alvoPara = t.alvoPara; }
  camera.position.lerpVectors(t.camDe, camPara, k);
  controls.target.lerpVectors(t.alvoDe, alvoPara, k);
  if (t.t >= 1) estado.tween = null;
}

function entrarEstacao() {
  estado.estacao = true;
  estado.seguindo = null;
  estado.tween = null;
  sistema.setEstacaoVisivel(true);
  if (renderer.xr.isPresenting) { rig.position.set(-16, 0, 14); rig.rotation.set(0, 0, 0); }
  else { camera.position.set(-22, 4, 20); controls.target.set(-13, 2, 0); }
  hud.setEstado(estado);
  atualizarMenu();
  mostrarConteudo(conteudoEstacao(), true);
}

function sairEstacao() {
  estado.estacao = false;
  sistema.setEstacaoVisivel(false);
  if (renderer.xr.isPresenting) { rig.position.copy(POSICAO_INICIAL_VR); rig.rotation.set(0, 0, 0); }
  else { camera.position.copy(CAMERA_INICIAL); controls.target.set(0, 0, 0); }
  hud.setEstado(estado);
  atualizarMenu();
  if (estado.conteudo && estado.conteudo.titulo?.startsWith('Comparar')) fecharPainel();
}

// ---------------------------------------------------------------- menu VR (flutua sobre o controle esquerdo)
function atualizarMenu() {
  if (!menuAtivo) return;
  painelMenu.mostrar({
    titulo: estado.pausado ? 'Tempo pausado' : `Ritmo: ${ritmoAtual().curto} · ${ritmoAtual().descricao}`,
    subtitulo: estado.modo === 'real' ? 'Distâncias reais (1 UA = 40 m)' : 'Distâncias comprimidas (didáticas)',
    botoes: [
      { id: 'pausa', rotulo: estado.pausado ? 'Continuar' : 'Pausar', largura: 240 }, { id: 'ritmo', rotulo: `Ritmo: ${ritmoAtual().curto} ▸`, largura: 360 },
      { id: 'orbitas', rotulo: estado.orbitas ? 'Órbitas: sim' : 'Órbitas: não', largura: 300 }, { id: 'rotulos', rotulo: estado.rotulos ? 'Rótulos: sim' : 'Rótulos: não', largura: 300 },
      { id: 'modo', rotulo: estado.modo === 'real' ? 'Distâncias didáticas' : 'Distâncias reais', largura: 380, primario: true }, { id: 'estacao', rotulo: estado.estacao ? 'Voltar ao sistema' : 'Comparar tamanhos', largura: 380 },
      { id: 'missao', rotulo: 'Assistir a viagem', largura: 330 }, { id: 'ajuda', rotulo: 'Ajuda', largura: 150 }, { id: 'inicio', rotulo: 'Início', largura: 150 },
    ],
    escalaTexto: 1.15,
  });
}

// ---------------------------------------------------------------- desktop
function configurarDesktop() {
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let down = null;
  const el = renderer.domElement;
  const apontar = (ev) => {
    mouse.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const alvos = estado.estacao ? sistema.estacaoItens.map((i) => i.malha) : sistema.selecionaveis;
    const hits = ray.intersectObjects(alvos, false);
    return hits.length ? hits[0].object.userData.corpoId : null;
  };
  el.addEventListener('pointermove', (ev) => {
    if (renderer.xr.isPresenting) return;
    const id = apontar(ev);
    estado.hover = id;
    el.style.cursor = id ? 'pointer' : 'default';
  });
  el.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
  el.addEventListener('pointerup', (ev) => {
    if (!down || renderer.xr.isPresenting) return;
    const moveu = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6;
    down = null;
    if (moveu) return;
    const id = apontar(ev);
    if (id) selecionar(id);
  });
  el.addEventListener('dblclick', (ev) => { const id = apontar(ev); if (id) { selecionar(id); viajar(id); } });
  window.addEventListener('keydown', (ev) => {
    if (ev.target && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) return;
    switch (ev.key) {
      case ' ': ev.preventDefault(); aoBotao('pausa'); break;
      case '+': case '=': setRitmo(estado.ritmo + 1); reexibirConteudo(); break;
      case '-': case '_': setRitmo(estado.ritmo - 1); reexibirConteudo(); break;
      case 'o': case 'O': aoBotao('orbitas'); break;
      case 'r': case 'R': aoBotao('rotulos'); break;
      case 'd': case 'D': alternarModo(); break;
      case 't': case 'T': aoBotao('estacao'); break;
      case 'm': case 'M': aoBotao('missao'); break;
      case 'h': case 'H': aoBotao('ajuda'); break;
      case 'i': case 'I': voltarInicio(); break;
      case 'Escape': fecharPainel(); break;
      default: break;
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let acumHUD = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!estado.pausado) estado.data += ritmoAtual().v * dt * 1000;
  camera.getWorldPosition(vCam);
  if (!estado.estacao) {
    sistema.atualizar(estado.data, vCam, estado.selecionado, estado.hover);
    seguir();
  } else sistema.atualizarEstacao(vCam);
  controlesXR.atualizar(dt);
  if (renderer.xr.isPresenting) { rig.updateMatrixWorld(true); orientarPaineis(); }
  else { animarCamera(dt); if (!estado.tween) controls.update(); }
  atualizarFade(dt);
  acumHUD += dt;
  if (acumHUD > 1) { acumHUD = 0; hud.setData(fmtData(estado.data)); }
  renderer.render(scene, camera);
}

// gancho para depuração e testes automatizados
window.SSVR = { estado, narrador, irEtapa, aoBotao, versao: VERSAO };

iniciar().catch((e) => { console.error(e); hud.setCarregando(1, 'Erro ao iniciar: ' + e.message); });
