// Interface 2D (desktop/celular): barra superior, cartão lateral, atalhos e tela de carregamento
export class HUD {
  constructor(cb) {
    this.cb = cb;
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div class="topo">
        <div class="marca"><strong>Sistema Solar VR</strong><span>Ciências · Fundamental II</span></div>
        <div class="tempo">
          <button data-acao="pausa" id="hud-pausa" title="Pausar / continuar">⏸</button>
          <button data-acao="ritmo" id="hud-ritmo" class="ritmo" title="Muda a velocidade do tempo">Ritmo: meses ▸</button>
          <span class="vel" id="hud-vel">1 s = 1 dia</span>
          <span class="data" id="hud-data"></span>
        </div>
        <div class="toggles">
          <button data-acao="orbitas" id="hud-orbitas" class="ativo">Órbitas</button>
          <button data-acao="rotulos" id="hud-rotulos" class="ativo">Rótulos</button>
          <button data-acao="modo" id="hud-modo">Distâncias reais</button>
          <button data-acao="estacao" id="hud-estacao">Comparar tamanhos</button>
          <button data-acao="missao" id="hud-missao" class="destaque">Missão guiada</button>
          <button data-acao="ajuda" id="hud-ajuda">?</button>
        </div>
      </div>
      <div class="cartao" id="hud-cartao" hidden></div>
      <div class="rodape">
        <div class="chips" id="hud-chips"></div>
        <div class="dica" id="hud-dica">Clique em um planeta para saber mais · duplo clique para viajar</div>
      </div>
      <div class="carregando" id="hud-carregando"><div><strong>Sistema Solar VR</strong><div class="barra"><span id="hud-barra"></span></div><small id="hud-carregando-txt">Carregando texturas…</small></div></div>
    `;
    document.body.appendChild(root);
    this.root = root;
    root.querySelectorAll('[data-acao]').forEach((b) => b.addEventListener('click', () => cb.aoAcao(b.dataset.acao)));
    this.cartao = root.querySelector('#hud-cartao');
    this.cartao.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (b) cb.aoBotao(b.dataset.id);
    });
  }

  setChips(lista) {
    const el = this.root.querySelector('#hud-chips');
    el.innerHTML = lista.map((c) => `<button data-corpo="${c.id}" style="--c:${c.cor}">${c.nome}</button>`).join('');
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.cb.aoChip(b.dataset.corpo)));
  }

  setData(txt) { this.root.querySelector('#hud-data').textContent = txt; }
  setRitmo(ritmo, pausado) {
    this.root.querySelector('#hud-ritmo').textContent = `${ritmo.rotulo} ▸`;
    this.root.querySelector('#hud-vel').textContent = pausado ? 'pausado' : ritmo.descricao;
    this.root.querySelector('#hud-pausa').textContent = pausado ? '▶' : '⏸';
  }
  setEstado({ orbitas, rotulos, modo, estacao, missao }) {
    this.root.querySelector('#hud-orbitas').classList.toggle('ativo', !!orbitas);
    this.root.querySelector('#hud-rotulos').classList.toggle('ativo', !!rotulos);
    const m = this.root.querySelector('#hud-modo');
    m.textContent = modo === 'real' ? 'Distâncias didáticas' : 'Distâncias reais';
    m.classList.toggle('ativo', modo === 'real');
    const e = this.root.querySelector('#hud-estacao');
    e.textContent = estacao ? 'Voltar ao Sistema Solar' : 'Comparar tamanhos';
    e.classList.toggle('ativo', !!estacao);
    this.root.querySelector('#hud-missao').classList.toggle('ativo', !!missao);
  }
  setDica(txt) { this.root.querySelector('#hud-dica').textContent = txt; }

  /** conteudo no mesmo formato do Painel VR */
  mostrarCartao(c) {
    if (!c) { this.cartao.hidden = true; return; }
    const esc = (s) => String(s).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const paragrafos = c.texto ? String(c.texto).split('\n').map((p) => p.trim() ? `<p>${esc(p)}</p>` : '').join('') : '';
    const botoes = (c.botoes || []).map((b) => `<button data-id="${b.id}" class="${b.primario ? 'primario' : ''}" ${b.cor ? `style="background:${b.cor}"` : ''}>${esc(b.rotulo)}</button>`).join('');
    this.cartao.innerHTML = `
      ${c.titulo ? `<h2>${esc(c.titulo)}</h2>` : ''}
      ${c.subtitulo ? `<div class="sub">${esc(c.subtitulo)}</div>` : ''}
      <div class="corpo">${paragrafos}</div>
      <div class="botoes">${botoes}</div>
      ${c.rodape ? `<div class="rodape-cartao">${esc(c.rodape)}</div>` : ''}`;
    this.cartao.hidden = false;
  }

  setCarregando(frac, txt) {
    const el = this.root.querySelector('#hud-carregando');
    if (frac == null) { el.classList.add('some'); setTimeout(() => el.remove(), 600); return; }
    this.root.querySelector('#hud-barra').style.width = Math.round(frac * 100) + '%';
    if (txt) this.root.querySelector('#hud-carregando-txt').textContent = txt;
  }
}

export const CSS = `
  html, body { margin:0; height:100%; background:#02040a; color:#e6ebf5; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; overflow:hidden; }
  canvas { display:block; }
  #hud { position:fixed; inset:0; pointer-events:none; z-index:5; }
  #hud .topo { position:absolute; top:0; left:0; right:0; display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; padding:10px 14px; background:linear-gradient(rgba(2,4,10,.85), rgba(2,4,10,0)); pointer-events:auto; }
  #hud .marca { display:flex; flex-direction:column; line-height:1.1; margin-right:auto; }
  #hud .marca strong { font-size:17px; letter-spacing:.2px; }
  #hud .marca span { font-size:12px; color:#9fb3d9; }
  #hud .tempo, #hud .toggles { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  #hud button { background:rgba(20,30,60,.85); color:#e6ebf5; border:1px solid rgba(120,150,220,.35); border-radius:10px; padding:7px 12px; font-size:13px; cursor:pointer; transition:background .15s; }
  #hud button:hover { background:rgba(50,80,150,.9); }
  #hud button.ativo { background:#2b7cff; border-color:#2b7cff; }
  #hud button.destaque { border-color:#f2b84b; color:#ffd98a; }
  #hud .vel { min-width:78px; text-align:center; font-size:12px; color:#b9c6e6; }
  #hud button.ritmo { border-color:#8fd0ff; font-weight:600; }
  #hud .data { font-size:12px; color:#b9c6e6; margin-left:6px; font-variant-numeric: tabular-nums; }
  #hud .cartao { position:absolute; right:14px; top:96px; width:min(400px, calc(100vw - 28px)); max-height:calc(100vh - 200px); overflow:auto; background:rgba(8,13,30,.92); border:1px solid rgba(120,150,220,.35); border-radius:16px; padding:18px 20px; pointer-events:auto; backdrop-filter: blur(8px); box-shadow:0 10px 40px rgba(0,0,0,.5); }
  #hud .cartao h2 { margin:0 0 4px; font-size:22px; }
  #hud .cartao .sub { color:#9fc3ff; font-size:13px; margin-bottom:10px; }
  #hud .cartao .corpo p { margin:0 0 8px; font-size:14px; line-height:1.45; }
  #hud .cartao .botoes { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  #hud .cartao .botoes button { flex:1 1 auto; }
  #hud .cartao .botoes button.primario { background:#2b7cff; border-color:#2b7cff; font-weight:600; }
  #hud .cartao .rodape-cartao { margin-top:10px; font-size:12px; color:#8b95ad; }
  #hud .rodape { position:absolute; left:0; right:0; bottom:0; padding:10px 14px 14px; display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; background:linear-gradient(rgba(2,4,10,0), rgba(2,4,10,.8)); }
  #hud .chips { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; pointer-events:auto; }
  #hud .chips button { padding:5px 10px; font-size:12px; border-left:4px solid var(--c, #888); }
  #hud .dica { font-size:12px; color:#9fb3d9; text-align:center; }
  #hud .carregando { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#02040a; pointer-events:auto; transition:opacity .5s; z-index:20; }
  #hud .carregando.some { opacity:0; pointer-events:none; }
  #hud .carregando > div { text-align:center; width:min(360px, 80vw); }
  #hud .carregando strong { font-size:22px; }
  #hud .barra { height:8px; background:rgba(255,255,255,.1); border-radius:8px; margin:14px 0 8px; overflow:hidden; }
  #hud .barra span { display:block; height:100%; width:0; background:linear-gradient(90deg,#2b7cff,#8fd0ff); transition:width .2s; }
  #hud small { color:#9fb3d9; }
  #VRButton { z-index:6 !important; font-family: inherit !important; border-radius:12px !important; bottom:64px !important; }
  @media (max-width: 720px) {
    #hud .topo { padding:8px 10px; gap:6px 10px; }
    #hud .marca span { display:none; }
    #hud .cartao { right:8px; left:8px; width:auto; top:auto; bottom:110px; max-height:45vh; }
    #hud .toggles button { padding:6px 8px; font-size:12px; }
    #hud .dica { display:none; }
  }
`;
