// Controles do Pico Neo 3 (WebXR): apontar + gatilho, grip, analógicos e botões A/B/X/Y
import * as THREE from 'three';

const LIMIAR_SNAP = 0.7;

export class ControlesXR {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Group} rig grupo que contém a câmera (o "corpo" do usuário)
   * @param {THREE.Camera} camera
   * @param {object} cb callbacks: alvos(), paineis(), aoHover(id|null), aoSelecionar(id), aoBotaoPainel(painel,id), aoGrip(id|null), aoMenu(), aoBotaoA(), aoBotaoB(), velocidade()
   */
  constructor(renderer, rig, camera, cb) {
    this.renderer = renderer;
    this.rig = rig;
    this.camera = camera;
    this.cb = cb;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4000;
    this._m = new THREE.Matrix4();
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this.controles = [];
    this.hoverAtual = null;      // { tipo:'corpo'|'painel', id, painel }
    this.snapPronto = true;
    this.botoesAnt = [{}, {}];
    this.maoPonteiro = 'right';

    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      const info = { indice: i, controller: c, grip, mao: null, gamepad: null, linha: this._criaLinha(), ponto: this._criaPonto(), hover: null };
      c.add(info.linha, info.ponto);
      c.addEventListener('connected', (e) => {
        info.mao = e.data.handedness || (i === 0 ? 'right' : 'left');
        info.gamepad = e.data.gamepad || null;
        c.visible = true;
        if (cb.aoConectar) cb.aoConectar(info);
      });
      c.addEventListener('disconnected', () => { info.gamepad = null; c.visible = false; });
      c.addEventListener('selectstart', () => this._aoGatilho(info));
      c.addEventListener('squeezestart', () => this._aoGrip(info));
      rig.add(c, grip);
      this.controles.push(info);
      this._criaModeloSimples(grip);
    }
  }

  _criaLinha() {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const mat = new THREE.LineBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.7 });
    const l = new THREE.Line(geo, mat);
    l.name = 'raio';
    l.scale.z = 5;
    return l;
  }

  _criaPonto() {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
    p.renderOrder = 30;
    p.visible = false;
    return p;
  }

  _criaModeloSimples(grip) {
    const g = new THREE.Group();
    const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.09, 4, 10), new THREE.MeshStandardMaterial({ color: 0x2b3350, roughness: 0.6, metalness: 0.2 }));
    corpo.rotation.x = Math.PI / 2;
    corpo.position.z = 0.02;
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 24), new THREE.MeshStandardMaterial({ color: 0x9fd0ff, emissive: 0x2a5fa0, roughness: 0.5 }));
    anel.position.z = -0.04;
    g.add(corpo, anel);
    grip.add(g);
  }

  get maoDireita() { return this.controles.find((c) => c.mao === 'right') || this.controles[0]; }
  get maoEsquerda() { return this.controles.find((c) => c.mao === 'left') || this.controles[1]; }

  _aoGatilho(info) {
    const h = info.hover;
    if (!h) return;
    if (h.tipo === 'painel') { if (h.id) this.cb.aoBotaoPainel(h.painel, h.id); }
    else this.cb.aoSelecionar(h.id);
  }

  _aoGrip(info) {
    const h = info.hover;
    this.cb.aoGrip(h && h.tipo === 'corpo' ? h.id : null);
  }

  /** Raycast a partir de um controle; retorna { tipo, id, painel, distancia } ou null */
  _apontar(info) {
    const c = info.controller;
    this._m.identity().extractRotation(c.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._m);
    // 1) painéis (prioridade)
    const paineis = this.cb.paineis().filter((m) => m.visible);
    const hp = this.raycaster.intersectObjects(paineis, false);
    if (hp.length) {
      const painel = hp[0].object.userData.painel;
      return { tipo: 'painel', id: painel.hitTest(hp[0].uv), painel, distancia: hp[0].distance };
    }
    // 2) corpos
    const ha = this.raycaster.intersectObjects(this.cb.alvos(), false);
    if (ha.length) return { tipo: 'corpo', id: ha[0].object.userData.corpoId, distancia: ha[0].distance };
    return null;
  }

  atualizar(dt) {
    if (!this.renderer.xr.isPresenting) return;
    let hoverCorpo = null;
    const paineisHover = new Map();
    for (const info of this.controles) {
      if (!info.controller.visible) continue;
      const h = this._apontar(info);
      info.hover = h;
      if (h) {
        info.linha.scale.z = Math.max(0.05, h.distancia);
        info.ponto.visible = true;
        info.ponto.position.z = -h.distancia;
        const s = Math.max(0.006, h.distancia * 0.008);
        info.ponto.scale.setScalar(s / 0.012);
        if (h.tipo === 'corpo' && !hoverCorpo) hoverCorpo = h.id;
        if (h.tipo === 'painel') paineisHover.set(h.painel, h.id);
      } else {
        info.linha.scale.z = 6;
        info.ponto.visible = false;
      }
      this._lerGamepad(info, dt);
    }
    for (const m of this.cb.paineis()) {
      const p = m.userData.painel;
      p.setHover(paineisHover.has(p) ? paineisHover.get(p) : null);
    }
    if (hoverCorpo !== this.hoverAtual) { this.hoverAtual = hoverCorpo; this.cb.aoHover(hoverCorpo); }
  }

  _lerGamepad(info, dt) {
    const gp = info.gamepad;
    if (!gp) return;
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] || 0, gp.axes[1] || 0];
    const x = Math.abs(ax[0]) > 0.15 ? ax[0] : 0;
    const y = Math.abs(ax[1]) > 0.15 ? ax[1] : 0;
    const vel = this.cb.velocidade();
    const cam = this.camera;
    if (info.mao === 'left') {
      // esquerdo: deslocar lateralmente e subir/descer
      if (x || y) {
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        const lateral = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        this.rig.position.addScaledVector(lateral, x * vel * dt);
        this.rig.position.y += -y * vel * dt * 0.8;
      }
    } else {
      // direito: avançar/recuar na direção do olhar; giro em passos (snap turn)
      if (y) {
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        this.rig.position.addScaledVector(dir, -y * vel * dt);
      }
      if (Math.abs(x) > LIMIAR_SNAP && this.snapPronto) {
        this.snapPronto = false;
        this._girar(x > 0 ? -Math.PI / 6 : Math.PI / 6);
      } else if (Math.abs(x) < 0.3) this.snapPronto = true;
    }
    // botões: 0 gatilho, 1 grip, 3 analógico (clique), 4 A/X, 5 B/Y
    const ant = this.botoesAnt[info.indice];
    const b = gp.buttons;
    const pressionado = (k) => !!(b[k] && b[k].pressed);
    if (pressionado(4) && !ant[4]) this.cb.aoBotaoA(info.mao);
    if (pressionado(5) && !ant[5]) this.cb.aoBotaoB(info.mao);
    if (pressionado(3) && !ant[3]) this.cb.aoMenu(info.mao);
    for (const k of [3, 4, 5]) ant[k] = pressionado(k);
  }

  /** Gira o rig em torno da posição atual da cabeça (para não deslocar o usuário). */
  _girar(ang) {
    this.rig.updateMatrixWorld(true);
    const cabeca = this.camera.getWorldPosition(this._v.clone());
    this.rig.position.sub(cabeca);
    this.rig.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    this.rig.position.add(cabeca);
    this.rig.rotation.y += ang;
  }
}

