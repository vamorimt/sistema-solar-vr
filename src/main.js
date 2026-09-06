// Sistema Solar VR — ponto de entrada
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SistemaSolar } from './scene/sistema.js';
import { Painel } from './ui/painel.js';
import { HUD, CSS } from './ui/hud.js';
import { ControlesXR } from './xr/controles.js';
import { PLANETAS, LUAS, CINTUROES, MISSAO } from './data/corpos.js';
import { VELOCIDADES, fmtData, fichaDe, tituloDe, subtituloDe, dadosDe, AJUDA_VR, AJUDA_DESKTOP } from './app/textos.js';

const VERSAO = '0.1.0';
const MANIFESTO = {
  sol: '2k_sun.jpg', mercurio: '2k_mercury.jpg', venus: '2k_venus_surface.jpg', terra: '2k_earth_daymap.jpg',
  terraNuvens: 'earth_clouds_1024.png', terraNormal: 'earth_normal_2048.jpg', terraEspecular: 'earth_specular_2048.jpg',
  marte: '2k_mars.jpg', jupiter: '2k_jupiter.jpg', saturno: '2k_saturn.jpg', urano: '2k_uranus.jpg', netuno: '2k_neptune.jpg',
  lua: '2k_moon.jpg', anelSaturno: 'saturn_ring.png', anelUrano: 'uranus_ring.png', estrelas: 'stars_4k.jpg',
};
const LINEARES = new Set(['terraNormal', 'terraEspecular']);
const CREDITOS = 'Dados: NASA / JPL · Texturas: Solar System Scope (CC BY 4.0), three.js';

// ---------------------------------------------------------------- estado
const estado = {
  data: Date.now(), vel: 3, pausado: false, modo: 'didatico', orbitas: true, rotulos: true, estacao: false,
  selecionado: null, hover: null, seguindo: null, missao: null, conteudo: null, tween: null, painelAberto: false,
};
let progresso = { quiz: {}, missaoEtapa: 0 };
try { progresso = { ...progresso, ...(JSON.parse(localStorage.getItem('ssvr.progresso') || '{}')) }; } catch (e) { /* sem armazenamento */ }
function salvarProgresso() { try { localStorage.setItem('ssvr.progresso', JSON.stringify(progresso)); } catch (e) { /* ignora */ } }

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
camera.position.set(0, 12, 34);
const rig = new THREE.Group();
rig.name = 'rig';
rig.add(camera);
scene.add(rig);
scene.add(new THREE.AmbientLight(0x2a3a5c, 0.9));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;
controls.maxDistance = 4000;
controls.target.set(0, 0, 0);

// Painéis VR (vivem dentro do rig para acompanhar o usuário)
const painelInfo = new Painel({ largura: 1.25, altura: 0.9, px: 1024, nome: 'painel-info' });
const painelMenu = new Painel({ largura: 0.34, altura: 0.30, px: 680, nome: 'painel-menu' });
rig.add(painelInfo.mesh);

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
    aoConectar: (info) => { if (info.mao === 'left') { info.grip.add(painelMenu.mesh); painelMenu.mesh.position.set(0, 0.09, -0.11); painelMenu.mesh.rotation.x = -Math.PI / 3; painelMenu.visivel = true; atualizarMenu(true); } },
    velocidade: velocidadeLocomocao,
  });
  criarBotaoVR();
  configurarDesktop();
  hud.setEstado(estado);
  hud.setVelocidade(VELOCIDADES[estado.vel].rotulo, estado.pausado);
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
    if (estado.estacao) { rig.position.set(0, 0, 22); rig.rotation.set(0, 0, 0); }
    else { rig.position.set(0, 2.5, 26); rig.rotation.set(0, 0, 0); }
    setTimeout(() => { mostrarBoasVindas(); }, 1200);
  });
  renderer.xr.addEventListener('sessionend', () => {
    controls.enabled = true;
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    camera.position.set(0, 12, 34);
    controls.target.set(0, 0, 0);
    estado.seguindo = null;
    painelInfo.esconder();
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

/** Posiciona o painel de informações à frente da cabeça (coordenadas do rig). */
function posicionarPainel() {
  rig.updateMatrixWorld(true);
  camera.getWorldPosition(vCam);
  camera.getWorldDirection(vTmp);
  vTmp.y = 0;
  if (vTmp.lengthSq() < 1e-4) vTmp.set(0, 0, -1);
  vTmp.normalize();
  // painel um pouco à esquerda do olhar, para não cobrir o corpo observado
  vTmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42);
  const pos = vTmp2.copy(vCam).addScaledVector(vTmp, 1.5);
  pos.y = vCam.y - 0.1;
  painelInfo.mesh.position.copy(rig.worldToLocal(pos.clone()));
  const olhar = rig.worldToLocal(vCam.clone());
  painelInfo.mesh.lookAt(olhar);
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
  if (renderer.xr.isPresenting && (estavaFechado || reposicionar)) posicionarPainel();
  painelInfo.mostrar(c);
  if (!renderer.xr.isPresenting) painelInfo.mesh.visible = false; // no desktop o conteúdo vai para o cartão 2D
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
      ? 'Você está flutuando acima do plano do Sistema Solar. O Sol está à sua frente. Aponte para um planeta e puxe o gatilho para conhecê-lo, ou comece pela Missão Guiada.\n\n' + AJUDA_VR
      : 'Explore o Sistema Solar em 3D. Clique nos planetas para conhecer cada um, ou siga a Missão Guiada com perguntas ao final de cada parada.\n\n' + AJUDA_DESKTOP,
    botoes: [{ id: 'missao', rotulo: 'Missão guiada', primario: true }, { id: 'fechar', rotulo: 'Explorar livremente' }, { id: 'ajuda', rotulo: 'Ajuda' }],
    rodape: `v${VERSAO} · ${CREDITOS}`,
    tamanhoTexto: 26,
  }, true);
}

function conteudoInfo(id) {
  const d = dadosDe(id);
  if (!d) return null;
  const texto = d.resumo + '\n\n' + fichaDe(id).join('\n');
  const botoes = [];
  if (!estado.estacao) botoes.push({ id: 'viajar', rotulo: 'Viajar até aqui', primario: true });
  if (d.fatos) botoes.push({ id: 'fatos', rotulo: 'Curiosidades' });
  if (d.quiz) botoes.push({ id: 'quiz', rotulo: progresso.quiz[id]?.acertou ? 'Quiz ✓' : 'Quiz' });
  if (estado.missao) botoes.push({ id: 'voltarMissao', rotulo: 'Voltar à missão' });
  botoes.push({ id: 'fechar', rotulo: 'Fechar' });
  return { titulo: tituloDe(id), subtitulo: subtituloDe(id), texto, botoes, rodape: CREDITOS, tamanhoTexto: 27 };
}

function conteudoFatos(id) {
  const d = dadosDe(id);
  return {
    titulo: `${d.nome} · Curiosidades`, subtitulo: subtituloDe(id),
    texto: d.fatos.map((f) => '• ' + f).join('\n'),
    botoes: [{ id: 'info', rotulo: 'Voltar' }, ...(d.quiz ? [{ id: 'quiz', rotulo: 'Quiz', primario: true }] : []), { id: 'fechar', rotulo: 'Fechar' }],
    tamanhoTexto: 29,
  };
}

function conteudoQuiz(id) {
  const d = dadosDe(id), q = d.quiz;
  return {
    titulo: `Quiz · ${d.nome}`, subtitulo: 'Escolha a resposta correta', texto: q.pergunta,
    botoes: [...q.opcoes.map((o, i) => ({ id: 'resp' + i, rotulo: o, largura: 936 })), { id: 'info', rotulo: 'Voltar' }],
    tamanhoTexto: 30,
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
  mostrarConteudo({
    titulo: acertou ? 'Correto!' : 'Ainda não…',
    subtitulo: q.pergunta,
    texto: (acertou ? '' : `A resposta certa é: ${q.opcoes[q.correta]}\n\n`) + q.explicacao,
    corBorda: acertou ? '#2aa15a' : '#c0392b',
    botoes: [
      ...q.opcoes.map((o, k) => ({ id: 'x' + k, rotulo: o, largura: 936, cor: k === q.correta ? '#2aa15a' : (k === i ? '#c0392b' : '#1d2a4a') })),
      ...(acertou ? [] : [{ id: 'quiz', rotulo: 'Tentar de novo' }]),
      { id: estado.missao ? 'voltarMissao' : 'info', rotulo: 'Continuar', primario: true },
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

// ---------------------------------------------------------------- missão guiada
function iniciarMissao(etapa = 0) {
  estado.missao = { etapa };
  hud.setEstado(estado);
  irEtapa(etapa);
}

function irEtapa(n) {
  if (!estado.missao) return;
  if (n >= MISSAO.length) return finalizarMissao();
  if (n < 0) n = 0;
  const e = MISSAO[n];
  estado.missao.etapa = n;
  progresso.missaoEtapa = n;
  salvarProgresso();
  if (estado.estacao) sairEstacao();
  const d = e.corpo !== 'escala' ? dadosDe(e.corpo) : null;
  if (d) { estado.selecionado = e.corpo; viajar(e.corpo); }
  const botoes = [];
  if (e.corpo === 'escala') botoes.push({ id: 'modo', rotulo: estado.modo === 'real' ? 'Voltar às distâncias didáticas' : 'Ativar distâncias reais', primario: true });
  else botoes.push({ id: 'info', rotulo: 'Ficha de ' + d.nome });
  if (d && d.quiz) botoes.push({ id: 'quiz', rotulo: progresso.quiz[e.corpo]?.acertou ? 'Quiz ✓' : 'Quiz', primario: e.corpo !== 'escala' });
  if (n > 0) botoes.push({ id: 'anterior', rotulo: '◀ Anterior' });
  botoes.push({ id: 'proxima', rotulo: n === MISSAO.length - 1 ? 'Concluir' : 'Próxima ▶' });
  botoes.push({ id: 'sairMissao', rotulo: 'Sair' });
  mostrarConteudo({ titulo: e.titulo, subtitulo: `Missão guiada · parada ${n + 1} de ${MISSAO.length}`, texto: e.texto, botoes, tamanhoTexto: 29, corBorda: '#f2b84b' }, true);
}

function finalizarMissao() {
  const ids = MISSAO.map((e) => e.corpo).filter((c) => dadosDe(c)?.quiz);
  const acertos = ids.filter((c) => progresso.quiz[c]?.acertou).length;
  estado.missao = null;
  hud.setEstado(estado);
  mostrarConteudo({
    titulo: 'Missão concluída!', subtitulo: 'Você percorreu o Sistema Solar do Sol ao Cinturão de Kuiper',
    texto: `Quizzes acertados: ${acertos} de ${ids.length}.\n\nO que você aprendeu: o Sol concentra quase toda a massa; os 4 planetas rochosos ficam perto do Sol e os 4 gigantes, longe; entre eles há o Cinturão de Asteroides; além de Netuno, o Cinturão de Kuiper. E, acima de tudo: o Sistema Solar é quase todo espaço vazio.`,
    botoes: [{ id: 'missao', rotulo: 'Refazer a missão' }, { id: 'estacao', rotulo: 'Comparar tamanhos' }, { id: 'fechar', rotulo: 'Explorar livremente', primario: true }],
    corBorda: '#2aa15a', tamanhoTexto: 28,
  }, true);
}

// ---------------------------------------------------------------- ações
function aoBotao(id) {
  const sel = estado.selecionado;
  if (id.startsWith('resp')) return responderQuiz(sel, Number(id.slice(4)));
  if (id.startsWith('x')) return; // botões de resultado (inertes)
  switch (id) {
    case 'viajar': if (sel) viajar(sel); return;
    case 'info': if (sel) mostrarConteudo(conteudoInfo(sel)); return;
    case 'fatos': if (sel) mostrarConteudo(conteudoFatos(sel)); return;
    case 'quiz': if (sel && dadosDe(sel)?.quiz) mostrarConteudo(conteudoQuiz(sel)); return;
    case 'fechar': fecharPainel(); return;
    case 'ajuda': mostrarConteudo(conteudoAjuda(), true); return;
    case 'missao': iniciarMissao(0); return;
    case 'voltarMissao': if (estado.missao) irEtapa(estado.missao.etapa); else fecharPainel(); return;
    case 'proxima': if (estado.missao) irEtapa(estado.missao.etapa + 1); return;
    case 'anterior': if (estado.missao) irEtapa(estado.missao.etapa - 1); return;
    case 'sairMissao': estado.missao = null; hud.setEstado(estado); fecharPainel(); return;
    case 'modo': alternarModo(); if (estado.missao) irEtapa(estado.missao.etapa); return;
    case 'estacao': if (estado.estacao) sairEstacao(); else entrarEstacao(); return;
    case 'inicio': voltarInicio(); return;
    case 'tempo-': mudarVelocidade(-1); return;
    case 'tempo+': mudarVelocidade(1); return;
    case 'pausa': estado.pausado = !estado.pausado; hud.setVelocidade(VELOCIDADES[estado.vel].rotulo, estado.pausado); atualizarMenu(true); return;
    case 'orbitas': estado.orbitas = !estado.orbitas; sistema.setOrbitasVisiveis(estado.orbitas); hud.setEstado(estado); atualizarMenu(true); return;
    case 'rotulos': estado.rotulos = !estado.rotulos; sistema.setRotulosVisiveis(estado.rotulos); hud.setEstado(estado); atualizarMenu(true); return;
    default: return;
  }
}

function acaoHUD(acao) {
  if (acao === 'modo') { alternarModo(); return; }
  aoBotao(acao);
}

function mudarVelocidade(delta) {
  estado.vel = THREE.MathUtils.clamp(estado.vel + delta, 0, VELOCIDADES.length - 1);
  estado.pausado = false;
  hud.setVelocidade(VELOCIDADES[estado.vel].rotulo, false);
  atualizarMenu(true);
}

function alternarModo() {
  estado.modo = estado.modo === 'real' ? 'didatico' : 'real';
  sistema.setModo(estado.modo);
  if (!estado.seguindo && !estado.estacao) { estado.selecionado = estado.selecionado || 'terra'; viajar(estado.selecionado); }
  hud.setEstado(estado);
  atualizarMenu(true);
}

function selecionar(id, mostrar = true) {
  if (!id) return;
  estado.selecionado = id;
  if (mostrar) mostrarConteudo(conteudoInfo(id));
}

function voltarInicio() {
  if (estado.estacao) sairEstacao();
  estado.seguindo = null;
  estado.tween = null;
  if (renderer.xr.isPresenting) { rig.position.set(0, 2.5, 26); rig.rotation.set(0, 0, 0); }
  else { estado.tween = { t: 0, dur: 1.2, camDe: camera.position.clone(), camPara: new THREE.Vector3(0, 12, 34), alvoDe: controls.target.clone(), alvoPara: new THREE.Vector3(0, 0, 0) }; }
  fecharPainel();
}

/** Viaja até um corpo e passa a segui-lo. */
function viajar(id) {
  const c = sistema.corpos.get(id);
  if (!c) return;
  if (estado.estacao) sairEstacao();
  const alvo = sistema.posicaoDe(id, new THREE.Vector3());
  const raioVisual = c.dados.aneis ? c.raio * c.dados.aneis.externo : c.raio;
  const dist = Math.max(raioVisual * 3.0, 1.2);
  // ponto de vista pelo lado iluminado, ligeiramente acima
  const paraSol = new THREE.Vector3(0, 0, 0).sub(alvo);
  if (paraSol.lengthSq() < 1e-6) paraSol.set(0, 0, 1);
  paraSol.normalize();
  const lateral = new THREE.Vector3().crossVectors(paraSol, new THREE.Vector3(0, 1, 0)).normalize();
  const dirVista = paraSol.multiplyScalar(0.75).addScaledVector(lateral, 0.6).add(new THREE.Vector3(0, 0.3, 0)).normalize();
  const cabecaAlvo = alvo.clone().addScaledVector(dirVista, dist);
  if (renderer.xr.isPresenting) {
    camera.getWorldDirection(vTmp);
    const yawAtual = Math.atan2(-vTmp.x, -vTmp.z);
    const dirAlvo = alvo.clone().sub(cabecaAlvo);
    const yawDesejado = Math.atan2(-dirAlvo.x, -dirAlvo.z);
    rig.rotation.y += yawDesejado - yawAtual;
    rig.updateMatrixWorld();
    const cabecaLocal = camera.position.clone().applyQuaternion(rig.quaternion);
    rig.position.copy(cabecaAlvo).sub(cabecaLocal);
    if (estado.painelAberto) posicionarPainel();
  } else {
    estado.tween = { t: 0, dur: 1.4, camDe: camera.position.clone(), offset: dirVista.clone().multiplyScalar(dist), alvoDe: controls.target.clone(), corpo: id };
  }
  estado.seguindo = { id, ultima: alvo.clone() };
  hud.setDica(`Seguindo ${tituloDe(id)} · pressione B/Y ou "Início" para voltar`);
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
  atualizarMenu(true);
  mostrarConteudo(conteudoEstacao(), true);
}

function sairEstacao() {
  estado.estacao = false;
  sistema.setEstacaoVisivel(false);
  if (renderer.xr.isPresenting) { rig.position.set(0, 2.5, 26); rig.rotation.set(0, 0, 0); }
  else { camera.position.set(0, 12, 34); controls.target.set(0, 0, 0); }
  hud.setEstado(estado);
  atualizarMenu(true);
  if (estado.conteudo && estado.conteudo.titulo?.startsWith('Comparar')) fecharPainel();
}

// ---------------------------------------------------------------- menu VR (controle esquerdo)
let menuUltimaData = '';
function atualizarMenu(forcar = false) {
  if (!painelMenu.visivel && !forcar) return;
  const dataTxt = fmtData(estado.data);
  if (!forcar && dataTxt === menuUltimaData) return;
  menuUltimaData = dataTxt;
  painelMenu.mostrar({
    titulo: dataTxt,
    subtitulo: `${estado.pausado ? 'Pausado' : VELOCIDADES[estado.vel].rotulo} · ${estado.modo === 'real' ? 'distâncias reais' : 'distâncias didáticas'}`,
    botoes: [
      { id: 'tempo-', rotulo: '− tempo', largura: 200 }, { id: 'pausa', rotulo: estado.pausado ? 'Continuar' : 'Pausar', largura: 220 }, { id: 'tempo+', rotulo: '+ tempo', largura: 200 },
      { id: 'orbitas', rotulo: estado.orbitas ? 'Órbitas: sim' : 'Órbitas: não', largura: 300 }, { id: 'rotulos', rotulo: estado.rotulos ? 'Rótulos: sim' : 'Rótulos: não', largura: 300 },
      { id: 'modo', rotulo: estado.modo === 'real' ? 'Distâncias didáticas' : 'Distâncias reais', largura: 380, primario: true }, { id: 'estacao', rotulo: estado.estacao ? 'Voltar ao sistema' : 'Comparar tamanhos', largura: 380 },
      { id: 'missao', rotulo: 'Missão guiada', largura: 300 }, { id: 'ajuda', rotulo: 'Ajuda', largura: 160 }, { id: 'inicio', rotulo: 'Início', largura: 160 },
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
      case '+': case '=': mudarVelocidade(1); break;
      case '-': case '_': mudarVelocidade(-1); break;
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
  if (!estado.pausado) estado.data += VELOCIDADES[estado.vel].v * dt * 1000;
  camera.getWorldPosition(vCam);
  if (!estado.estacao) {
    sistema.atualizar(estado.data, vCam, estado.selecionado, estado.hover);
    seguir();
  } else sistema.atualizarEstacao(vCam);
  controlesXR.atualizar(dt);
  if (!renderer.xr.isPresenting) { animarCamera(dt); if (!estado.tween) controls.update(); }
  acumHUD += dt;
  if (acumHUD > 0.25) { acumHUD = 0; hud.setData(fmtData(estado.data)); if (renderer.xr.isPresenting) atualizarMenu(); }
  renderer.render(scene, camera);
}

iniciar().catch((e) => { console.error(e); hud.setCarregando(1, 'Erro ao iniciar: ' + e.message); });
