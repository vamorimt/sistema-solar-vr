// Painel de texto/botões para VR desenhado em canvas (sem dependência de fontes externas)
import * as THREE from 'three';

const CORES = {
  fundo: 'rgba(10, 16, 34, 0.94)', borda: '#4f8ff7', titulo: '#ffffff', sub: '#9fc3ff', texto: '#e6ebf5',
  botao: '#1d2a4a', botaoHover: '#2f4d8f', primario: '#2b7cff', primarioHover: '#4a92ff', ok: '#2aa15a', erro: '#c0392b', rodape: '#8b95ad',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function quebraLinhas(ctx, texto, maxLargura) {
  const linhas = [];
  for (const paragrafo of String(texto).split('\n')) {
    const palavras = paragrafo.split(' ');
    let atual = '';
    for (const p of palavras) {
      const teste = atual ? atual + ' ' + p : p;
      if (ctx.measureText(teste).width > maxLargura && atual) {
        linhas.push(atual);
        atual = p;
      } else atual = teste;
    }
    linhas.push(atual);
  }
  return linhas;
}

export class Painel {
  constructor({ largura = 1.2, altura = 0.85, px = 1024, nome = 'painel' } = {}) {
    this.largura = largura;
    this.altura = altura;
    this.canvas = document.createElement('canvas');
    this.canvas.width = px;
    this.canvas.height = Math.round(px * altura / largura);
    this.ctx = this.canvas.getContext('2d');
    this.textura = new THREE.CanvasTexture(this.canvas);
    this.textura.colorSpace = THREE.SRGBColorSpace;
    this.textura.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: this.textura, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), mat);
    this.mesh.name = nome;
    this.mesh.userData.painel = this;
    this.mesh.renderOrder = 10;
    this.botoes = [];
    this.hover = null;
    this.conteudo = null;
    this.mesh.visible = false;
  }

  set visivel(v) { this.mesh.visible = v; }
  get visivel() { return this.mesh.visible; }

  /** conteudo: { titulo, subtitulo, texto, botoes:[{id, rotulo, primario, cor, largura}], rodape, escalaTexto } */
  mostrar(conteudo) {
    this.conteudo = conteudo;
    this.mesh.visible = true;
    this.desenhar();
  }

  esconder() {
    this.mesh.visible = false;
    this.hover = null;
  }

  setHover(id) {
    if (this.hover !== id) {
      this.hover = id;
      if (this.mesh.visible) this.desenhar();
    }
  }

  /** uv do raycast → id do botão (ou null) */
  hitTest(uv) {
    const x = uv.x * this.canvas.width;
    const y = (1 - uv.y) * this.canvas.height;
    for (const b of this.botoes) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
    }
    return null;
  }

  desenhar() {
    const c = this.conteudo || {};
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const esc = (c.escalaTexto || 1) * (W / 1024);
    const pad = 44 * esc;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CORES.fundo;
    roundRect(ctx, 2, 2, W - 4, H - 4, 28 * esc);
    ctx.fill();
    ctx.lineWidth = 4 * esc;
    ctx.strokeStyle = c.corBorda || CORES.borda;
    ctx.stroke();

    let y = pad;
    ctx.textBaseline = 'top';
    if (c.titulo) {
      ctx.fillStyle = CORES.titulo;
      ctx.font = `bold ${46 * esc}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
      for (const l of quebraLinhas(ctx, c.titulo, W - 2 * pad)) { ctx.fillText(l, pad, y); y += 54 * esc; }
      y += 6 * esc;
    }
    if (c.subtitulo) {
      ctx.fillStyle = CORES.sub;
      ctx.font = `${28 * esc}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
      for (const l of quebraLinhas(ctx, c.subtitulo, W - 2 * pad)) { ctx.fillText(l, pad, y); y += 36 * esc; }
      y += 14 * esc;
    }

    // Área dos botões (calculada antes do texto para saber quanto espaço sobra)
    this.botoes = [];
    const botoes = c.botoes || [];
    const bh = 66 * esc, gap = 16 * esc;
    ctx.font = `bold ${28 * esc}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
    const linhasBotoes = [];
    let linha = [], larguraLinha = 0;
    for (const b of botoes) {
      const bw = Math.min(W - 2 * pad, b.largura ? b.largura * esc : Math.max(150 * esc, ctx.measureText(b.rotulo).width + 44 * esc));
      if (larguraLinha + bw + (linha.length ? gap : 0) > W - 2 * pad && linha.length) {
        linhasBotoes.push(linha); linha = []; larguraLinha = 0;
      }
      linha.push({ ...b, w: bw });
      larguraLinha += bw + (linha.length > 1 ? gap : 0);
    }
    if (linha.length) linhasBotoes.push(linha);
    const alturaBotoes = linhasBotoes.length ? linhasBotoes.length * (bh + gap) : 0;
    const alturaRodape = c.rodape ? 34 * esc : 0;

    if (c.texto) {
      ctx.fillStyle = CORES.texto;
      const tam = (c.tamanhoTexto || 30) * esc;
      ctx.font = `${tam}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
      const lh = tam * 1.35;
      const maxY = H - pad - alturaBotoes - alturaRodape - lh;
      const linhas = quebraLinhas(ctx, c.texto, W - 2 * pad);
      for (let i = 0; i < linhas.length; i++) {
        if (y > maxY) { ctx.fillText('…', pad, y); break; }
        ctx.fillText(linhas[i], pad, y); y += lh;
      }
    }

    // Botões: ancorados na parte de baixo
    let by = H - pad - alturaRodape - alturaBotoes + gap;
    for (const l of linhasBotoes) {
      let bx = pad;
      for (const b of l) {
        const hover = this.hover === b.id;
        let cor = b.cor || (b.primario ? (hover ? CORES.primarioHover : CORES.primario) : (hover ? CORES.botaoHover : CORES.botao));
        if (b.cor && hover) cor = b.cor;
        ctx.fillStyle = cor;
        roundRect(ctx, bx, by, b.w, bh, 14 * esc);
        ctx.fill();
        if (hover) { ctx.lineWidth = 3 * esc; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
        ctx.fillStyle = '#ffffff';
        let fonte = 28 * esc;
        ctx.font = `bold ${fonte}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
        while (ctx.measureText(b.rotulo).width > b.w - 24 * esc && fonte > 16 * esc) {
          fonte -= 2 * esc;
          ctx.font = `bold ${fonte}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.rotulo, bx + b.w / 2, by + bh / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        this.botoes.push({ id: b.id, x: bx, y: by, w: b.w, h: bh });
        bx += b.w + gap;
      }
      by += bh + gap;
    }

    if (c.rodape) {
      ctx.fillStyle = CORES.rodape;
      ctx.font = `${22 * esc}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
      ctx.fillText(c.rodape, pad, H - pad - 22 * esc);
    }
    this.textura.needsUpdate = true;
  }
}

/** Sprite de texto (rótulo flutuante). */
export function criaRotulo(texto, { cor = '#ffffff', fundo = 'rgba(0,0,0,0.45)', tamanho = 48 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${tamanho}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
  const w = Math.ceil(ctx.measureText(texto).width) + 40;
  canvas.width = w;
  canvas.height = tamanho + 28;
  ctx.font = `bold ${tamanho}px system-ui, Segoe UI, Roboto, Arial, sans-serif`;
  ctx.fillStyle = fundo;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 16);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.userData.proporcao = canvas.width / canvas.height;
  sprite.renderOrder = 20;
  return sprite;
}

