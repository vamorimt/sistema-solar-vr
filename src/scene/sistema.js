// Construção da cena: Sol, planetas, luas, anéis, órbitas, cinturões e céu estrelado
import * as THREE from 'three';
import { SOL, PLANETAS, LUAS, CINTUROES, RAIO_TERRA_KM } from '../data/corpos.js';
import { posicaoHeliocentrica, amostraOrbita, anguloRotacao, anguloCircular, projeta, raioDidatico, ESCALA } from '../core/kepler.js';
import { criaRotulo } from '../ui/painel.js';

const DEG = Math.PI / 180;
const RAIO_SOL_DIDATICO = 3.0;

function texturaGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.25, 'rgba(255,200,90,0.55)');
  g.addColorStop(0.6, 'rgba(255,140,40,0.12)');
  g.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaPonto() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let TEX_PONTO = null;

function geometriaAnel(interno, externo, segmentos = 128) {
  const geo = new THREE.RingGeometry(interno, externo, segmentos, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - interno) / (externo - interno), 0.5);
  }
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function materialCorpo(tex, cor, opts = {}) {
  if (tex) return new THREE.MeshPhongMaterial({ map: tex, shininess: opts.shininess ?? 6, specular: 0x222222, ...opts.extra });
  return new THREE.MeshPhongMaterial({ color: cor, shininess: 6, specular: 0x222222 });
}

export class SistemaSolar {
  /**
   * @param {Record<string, THREE.Texture>} tex texturas carregadas por nome lógico
   */
  constructor(tex) {
    this.tex = tex;
    this.group = new THREE.Group();
    this.group.name = 'sistema';
    this.grupoOrbitas = new THREE.Group();
    this.grupoRotulos = new THREE.Group();
    this.group.add(this.grupoOrbitas, this.grupoRotulos);
    this.modo = 'didatico';
    this.corpos = new Map();
    this.selecionaveis = [];
    this._v = new THREE.Vector3();

    this._criaCeu();
    this._criaSol();
    for (const p of PLANETAS) this._criaPlaneta(p);
    for (const l of LUAS) this._criaLua(l);
    for (const c of CINTUROES) this._criaCinturao(c);
    this._criaOrbitas();
    this._criaDestaques();
    this._criaEstacaoTamanhos();
  }

  // ---------- construção ----------
  _criaCeu() {
    const geo = new THREE.SphereGeometry(3000, 48, 24);
    const mat = new THREE.MeshBasicMaterial({ map: this.tex.estrelas || null, color: this.tex.estrelas ? 0xcfd6e6 : 0x05070f, side: THREE.BackSide, depthWrite: false });
    this.ceu = new THREE.Mesh(geo, mat);
    this.ceu.name = 'ceu';
    this.ceu.rotation.x = -60 * DEG; // Via Láctea inclinada em relação à eclíptica
    this.ceu.rotation.z = 20 * DEG;
    this.group.add(this.ceu);
  }

  _criaSol() {
    const g = new THREE.Group();
    const raio = RAIO_SOL_DIDATICO;
    const mat = new THREE.MeshBasicMaterial({ map: this.tex.sol || null, color: this.tex.sol ? 0xffffff : 0xffcc55 });
    const malha = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 48), mat);
    malha.name = 'sol';
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaGlow(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 }));
    glow.scale.setScalar(raio * 5.5);
    glow.renderOrder = -1;
    const luz = new THREE.PointLight(0xfff4e0, 2.2, 0, 0);
    g.add(malha, glow, luz);
    this.group.add(g);
    const corpo = { id: 'sol', tipo: 'sol', dados: SOL, grupo: g, malha, raio, spin: malha, glow };
    corpo.rotulo = this._novoRotulo('Sol', '#ffd27a');
    this.corpos.set('sol', corpo);
    this.selecionaveis.push(malha);
    malha.userData.corpoId = 'sol';
  }

  _criaPlaneta(p) {
    const raio = raioDidatico(p.raioKm);
    const g = new THREE.Group();          // posição orbital
    const eixo = new THREE.Group();       // inclinação do eixo
    eixo.rotation.z = -p.inclinacaoEixo * DEG;
    const tex = this.tex[p.textura];
    const extra = {};
    if (p.id === 'terra') {
      if (this.tex.terraEspecular) extra.specularMap = this.tex.terraEspecular;
      if (this.tex.terraNormal) { extra.normalMap = this.tex.terraNormal; extra.normalScale = new THREE.Vector2(0.55, 0.55); }
    }
    const mat = materialCorpo(tex, p.cor, { shininess: p.id === 'terra' ? 18 : 5, extra: p.id === 'terra' ? { ...extra, specular: 0x444444 } : {} });
    const malha = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 48), mat);
    malha.name = p.id;
    malha.userData.corpoId = p.id;
    eixo.add(malha);

    let nuvens = null;
    if (p.id === 'terra' && this.tex.terraNuvens) {
      nuvens = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.012, 64, 48), new THREE.MeshLambertMaterial({ map: this.tex.terraNuvens, transparent: true, depthWrite: false, opacity: 0.95 }));
      eixo.add(nuvens);
    }
    if (p.aneis) {
      const geoAnel = geometriaAnel(raio * p.aneis.interno, raio * p.aneis.externo);
      const texAnel = this.tex[p.aneis.textura];
      const matAnel = new THREE.MeshLambertMaterial({ map: texAnel || null, color: texAnel ? 0xffffff : 0xccbb99, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: p.id === 'urano' ? 0.7 : 1 });
      const anel = new THREE.Mesh(geoAnel, matAnel);
      anel.name = p.id + '-aneis';
      anel.userData.corpoId = p.id;
      eixo.add(anel);
      this.selecionaveis.push(anel);
    }
    g.add(eixo);
    this.group.add(g);
    const corpo = { id: p.id, tipo: 'planeta', dados: p, grupo: g, eixo, malha, raio, spin: malha, nuvens, luas: [] };
    corpo.rotulo = this._novoRotulo(p.nome);
    this.corpos.set(p.id, corpo);
    this.selecionaveis.push(malha);
  }

  _criaLua(l) {
    const pai = this.corpos.get(l.planeta);
    if (!pai) return;
    const razaoR = l.raioKm / pai.dados.raioKm;
    const raio = pai.raio * THREE.MathUtils.clamp(Math.pow(razaoR, 0.7), 0.12, 0.5);
    const dist = pai.raio * (2 + 1.5 * Math.log10(l.distanciaKm / pai.dados.raioKm));
    const orbita = new THREE.Group(); // plano orbital (inclinado como o equador do planeta, exceto a Lua)
    orbita.rotation.z = -(l.id === 'lua' ? 5.1 : pai.dados.inclinacaoEixo) * DEG;
    const pivo = new THREE.Group();
    const tex = this.tex[l.textura];
    const malha = new THREE.Mesh(new THREE.SphereGeometry(raio, 32, 24), materialCorpo(tex, l.cor));
    malha.name = l.id;
    malha.userData.corpoId = l.id;
    malha.position.x = dist;
    pivo.add(malha);
    orbita.add(pivo);
    // linha da órbita da lua
    const pts = [];
    for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * dist, 0, Math.sin(a) * dist)); }
    const linha = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8899bb, transparent: true, opacity: 0.35 }));
    orbita.add(linha);
    pai.grupo.add(orbita);
    const corpo = { id: l.id, tipo: 'lua', dados: l, grupo: pivo, malha, raio, spin: malha, pai, dist, orbitaLinha: linha, fase: Math.random() * Math.PI * 2 };
    corpo.rotulo = this._novoRotulo(l.nome, '#cfd8ff', 40);
    this.corpos.set(l.id, corpo);
    this.selecionaveis.push(malha);
    pai.luas.push(corpo);
  }

  _criaCinturao(c) {
    const n = c.quantidade;
    const base = new Float32Array(n * 3); // (rUA, theta, yFrac)
    for (let i = 0; i < n; i++) {
      const r = c.deUA + (c.ateUA - c.deUA) * (0.5 + 0.5 * (Math.random() + Math.random() - 1) * 0.9 + 0.5 * (Math.random() - 0.5) * 0.4);
      base[i * 3] = THREE.MathUtils.clamp(r, c.deUA, c.ateUA);
      base[i * 3 + 1] = Math.random() * Math.PI * 2;
      base[i * 3 + 2] = (Math.random() + Math.random() + Math.random() - 1.5) * 0.06;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    if (!TEX_PONTO) TEX_PONTO = texturaPonto();
    const mat = new THREE.PointsMaterial({ color: c.cor, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, map: TEX_PONTO, alphaTest: 0.05 });
    const pontos = new THREE.Points(geo, mat);
    pontos.name = c.id;
    // área de seleção invisível (toro)
    const hit = new THREE.Mesh(new THREE.TorusGeometry(1, 0.5, 8, 96), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.rotation.x = Math.PI / 2;
    hit.userData.corpoId = c.id;
    hit.name = c.id + '-hit';
    const g = new THREE.Group();
    g.add(pontos, hit);
    this.group.add(g);
    const corpo = { id: c.id, tipo: 'cinturao', dados: c, grupo: g, malha: hit, pontos, base, raio: 1, hit };
    corpo.rotulo = this._novoRotulo(c.nome, '#e0d6c2', 40);
    this.corpos.set(c.id, corpo);
    this.selecionaveis.push(hit);
    this._projetaCinturao(corpo);
  }

  _projetaCinturao(corpo) {
    const f = ESCALA[this.modo].distancia;
    const pos = corpo.pontos.geometry.attributes.position;
    const b = corpo.base;
    for (let i = 0; i < pos.count; i++) {
      const r = f(b[i * 3]), th = b[i * 3 + 1];
      pos.setXYZ(i, Math.cos(th) * r, b[i * 3 + 2] * r, Math.sin(th) * r);
    }
    pos.needsUpdate = true;
    corpo.pontos.geometry.computeBoundingSphere();
    const rIn = f(corpo.dados.deUA), rOut = f(corpo.dados.ateUA);
    const rMid = (rIn + rOut) / 2, tubo = (rOut - rIn) / 2;
    corpo.hit.scale.set(rMid, rMid, 1);
    corpo.hit.geometry.dispose();
    corpo.hit.geometry = new THREE.TorusGeometry(1, tubo / rMid, 8, 128);
    corpo.rMid = rMid;
    corpo.pontos.material.size = this.modo === 'real' ? 0.2 : 0.07;
    // ponto de referência (para viagem/rótulo): ângulo fixo
    corpo.referencia = new THREE.Vector3(Math.cos(0.6) * rMid, 0, Math.sin(0.6) * rMid);
    corpo.raio = tubo;
  }

  _criaOrbitas() {
    this.grupoOrbitas.clear();
    const agora = Date.now();
    for (const p of PLANETAS) {
      const pts = amostraOrbita(p.elementos, agora, 360).map((q) => { const s = projeta(q, this.modo); return new THREE.Vector3(s.x, s.y, s.z); });
      const linha = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: p.cor, transparent: true, opacity: 0.55 }));
      linha.name = 'orbita-' + p.id;
      this.grupoOrbitas.add(linha);
    }
  }

  _criaDestaques() {
    const mk = (cor, op) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.035, 64), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, side: THREE.DoubleSide, depthTest: false, depthWrite: false }));
      m.renderOrder = 15; m.visible = false; this.group.add(m); return m;
    };
    this.anelHover = mk(0xffffff, 0.6);
    this.anelSelecao = mk(0x66ccff, 0.95);
  }

  _novoRotulo(texto, cor = '#ffffff', tamanho = 48) {
    const s = criaRotulo(texto, { cor, tamanho });
    this.grupoRotulos.add(s);
    return s;
  }

  // ---------- estação "Comparar tamanhos" (escala real de tamanhos, Terra = 1 m) ----------
  _criaEstacaoTamanhos() {
    const g = new THREE.Group();
    g.name = 'estacao-tamanhos';
    g.visible = false;
    const escala = (km) => 0.5 * (km / RAIO_TERRA_KM);
    const itens = [];
    for (const p of PLANETAS) {
      itens.push({ dados: p, raio: escala(p.raioKm), extra: p.aneis ? p.aneis.externo : 1, tex: this.tex[p.textura] });
      if (p.id === 'terra') itens.push({ dados: LUAS[0], raio: escala(LUAS[0].raioKm), extra: 1, tex: this.tex.lua });
    }
    let x = 0;
    const posicoes = [];
    for (const it of itens) {
      const largura = it.raio * it.extra;
      x += largura;
      posicoes.push(x);
      x += largura + (it.raio < 1 ? 2.2 : 1.6);
    }
    const total = x - 1.6;
    this.estacaoLargura = total;
    this.estacaoItens = [];
    itens.forEach((it, i) => {
      const px = posicoes[i] - total / 2;
      const eixo = new THREE.Group();
      eixo.position.set(px, Math.max(it.raio, 0.6) + 0.2, 0);
      eixo.rotation.z = -(it.dados.inclinacaoEixo || 0) * DEG;
      const m = new THREE.Mesh(new THREE.SphereGeometry(it.raio, 48, 32), materialCorpo(it.tex, it.dados.cor));
      m.userData.corpoId = it.dados.id;
      eixo.add(m);
      if (it.dados.aneis) {
        const anel = new THREE.Mesh(geometriaAnel(it.raio * it.dados.aneis.interno, it.raio * it.dados.aneis.externo), new THREE.MeshLambertMaterial({ map: this.tex[it.dados.aneis.textura] || null, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
        eixo.add(anel);
      }
      g.add(eixo);
      const diametro = Math.round(it.dados.raioKm * 2).toLocaleString('pt-BR');
      const rot = criaRotulo(`${it.dados.nome} · ${diametro} km`, { tamanho: 44 });
      // corpos pequenos: rótulos escalonados em altura para não se sobreporem
      const degrau = it.raio < 1 ? 0.8 + (i % 3) * 1.0 : 0.35;
      rot.position.set(px, eixo.position.y + it.raio * (it.dados.aneis ? 1.35 : 1.15) + degrau, 0);
      g.add(rot);
      this.estacaoItens.push({ malha: m, rotulo: rot, dados: it.dados });
    });
    // Sol ao fundo, em escala (raio ≈ 54,6 m)
    const rSol = escala(SOL.raioKm);
    const sol = new THREE.Mesh(new THREE.SphereGeometry(rSol, 96, 64), new THREE.MeshBasicMaterial({ map: this.tex.sol || null, color: this.tex.sol ? 0xffffff : 0xffcc55 }));
    sol.position.set(0, rSol * 0.35, -rSol - 60);
    const rotSol = criaRotulo(`Sol · ${Math.round(SOL.raioKm * 2).toLocaleString('pt-BR')} km`, { tamanho: 44, cor: '#ffd27a' });
    rotSol.position.set(0, rSol * 1.4, -rSol - 60);
    g.add(sol, rotSol);
    this.estacaoSolRotulo = rotSol;
    const luzEstacao = new THREE.DirectionalLight(0xffffff, 1.6);
    luzEstacao.position.set(-30, 40, 50);
    g.add(luzEstacao, new THREE.AmbientLight(0x60708a, 0.7));
    const piso = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshBasicMaterial({ color: 0x0c1226, transparent: true, opacity: 0.6 }));
    piso.rotation.x = -Math.PI / 2;
    g.add(piso);
    const grade = new THREE.GridHelper(120, 60, 0x2a3a66, 0x182440);
    grade.position.y = 0.01;
    g.add(grade);
    this.estacao = g;
  }

  // ---------- atualização por quadro ----------
  setModo(modo) {
    if (this.modo === modo) return;
    this.modo = modo;
    this._criaOrbitas();
    for (const c of this.corpos.values()) if (c.tipo === 'cinturao') this._projetaCinturao(c);
  }

  setOrbitasVisiveis(v) { this.grupoOrbitas.visible = v; for (const c of this.corpos.values()) if (c.orbitaLinha) c.orbitaLinha.visible = v; }
  setRotulosVisiveis(v) { this.grupoRotulos.visible = v; }
  setEstacaoVisivel(v) { this.estacao.visible = v; this.group.visible = !v; }

  /** Posição mundial de um corpo (ou referência do cinturão). */
  posicaoDe(id, alvo = new THREE.Vector3()) {
    const c = this.corpos.get(id);
    if (!c) return alvo.set(0, 0, 0);
    if (c.tipo === 'cinturao') return alvo.copy(c.referencia);
    return c.malha.getWorldPosition(alvo);
  }

  atualizar(dateMs, cameraPos, selecionadoId, hoverId) {
    const modo = this.modo;
    // Sol
    const sol = this.corpos.get('sol');
    sol.spin.rotation.y = anguloRotacao(dateMs, SOL.rotacaoHoras);
    // Planetas
    for (const p of PLANETAS) {
      const c = this.corpos.get(p.id);
      const pos = projeta(posicaoHeliocentrica(p.elementos, dateMs), modo);
      c.grupo.position.set(pos.x, pos.y, pos.z);
      c.spin.rotation.y = anguloRotacao(dateMs, p.rotacaoHoras);
      if (c.nuvens) c.nuvens.rotation.y = anguloRotacao(dateMs, p.rotacaoHoras * 0.92);
      for (const l of c.luas) {
        // rotação síncrona: a lua gira junto com o pivô, mostrando sempre a mesma face
        l.grupo.rotation.y = anguloCircular(dateMs, l.dados.periodoDias, l.fase);
      }
    }
    // Rótulos e destaques
    const v = this._v;
    for (const c of this.corpos.values()) {
      const r = c.rotulo;
      if (!r) continue;
      if (c.tipo === 'cinturao') v.copy(c.referencia); else c.malha.getWorldPosition(v);
      const d = v.distanceTo(cameraPos);
      if (c.tipo === 'lua' && d > 25 && c.id !== 'lua') { r.visible = false; continue; }
      if (c.tipo === 'lua' && d > 60) { r.visible = false; continue; }
      r.visible = true;
      const alt = THREE.MathUtils.clamp(d * 0.05, 0.12, 8);
      r.position.set(v.x, v.y + c.raio * (c.tipo === 'cinturao' ? 0 : 1.25) + alt * 0.7, v.z);
      r.scale.set(alt * r.userData.proporcao, alt, 1);
    }
    this._posicionaAnel(this.anelSelecao, selecionadoId, cameraPos);
    this._posicionaAnel(this.anelHover, hoverId !== selecionadoId ? hoverId : null, cameraPos);
  }

  _posicionaAnel(anel, id, cameraPos) {
    const c = id ? this.corpos.get(id) : null;
    if (!c || c.tipo === 'cinturao') { anel.visible = false; return; }
    c.malha.getWorldPosition(anel.position);
    const s = c.raio * (c.dados.aneis ? c.dados.aneis.externo * 1.15 : 1.45);
    anel.scale.set(s, s, s);
    anel.lookAt(cameraPos);
    anel.visible = true;
  }

  /** Atualiza rótulos da estação de tamanhos (escala pela distância). */
  atualizarEstacao(cameraPos) {
    const v = this._v;
    for (const it of this.estacaoItens) {
      it.rotulo.getWorldPosition(v);
      const alt = THREE.MathUtils.clamp(v.distanceTo(cameraPos) * 0.028, 0.15, 4);
      it.rotulo.scale.set(alt * it.rotulo.userData.proporcao, alt, 1);
    }
    const alt = THREE.MathUtils.clamp(this.estacaoSolRotulo.position.distanceTo(cameraPos) * 0.045, 0.2, 12);
    this.estacaoSolRotulo.scale.set(alt * this.estacaoSolRotulo.userData.proporcao, alt, 1);
  }
}
