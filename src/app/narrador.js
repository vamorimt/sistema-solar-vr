// Narrador: toca assets/audio/<id>.mp3; se não existir, usa a voz do navegador (speechSynthesis) em pt-BR;
// em último caso, apenas espera o tempo estimado de leitura (a legenda fica no painel).
export class Narrador {
  constructor({ base = 'assets/audio/', fontes = null } = {}) {
    this.base = base;
    this.fontes = fontes; // { id: dataURI } no preview em arquivo único
    this.audio = null;
    this.utter = null;
    this.timer = null;
    this.token = 0;
    this.tokenSeq = 0;
    this.volume = 1;
    this.cacheFalha = new Set();
    this.mudo = false;
  }

  get suportaVoz() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  get falando() { return this.token !== 0; }

  _vozPtBR() {
    if (!this.suportaVoz) return null;
    const vozes = window.speechSynthesis.getVoices();
    return vozes.find((v) => /pt[-_]BR/i.test(v.lang) && /google|microsoft|natural|neural/i.test(v.name))
      || vozes.find((v) => /pt[-_]BR/i.test(v.lang))
      || vozes.find((v) => /^pt/i.test(v.lang))
      || null;
  }

  /** Fala o texto do id. Resolve quando termina (ou quando é interrompida por parar()). */
  falar(id, texto) {
    this.parar();
    const meu = ++this.tokenSeq;
    this.token = meu;
    return new Promise((resolve) => {
      const fim = () => {
        if (this.token !== meu) return; // já foi interrompida/substituída
        this.token = 0;
        this.audio = null;
        this.utter = null;
        resolve();
      };
      this._resolverAtual = () => { if (this.token === meu) { this.token = 0; resolve(); } };
      if (this.mudo) { this._silencio(texto, fim); return; }
      const url = this.fontes ? this.fontes[id] : (this.cacheFalha.has(id) ? null : this.base + id + '.mp3');
      if (url) {
        const a = new Audio(url);
        a.volume = this.volume;
        a.preload = 'auto';
        this.audio = a;
        let caiu = false;
        const fallback = () => {
          if (caiu || this.token !== meu) return;
          caiu = true;
          this.cacheFalha.add(id);
          this.audio = null;
          this._voz(texto, fim, meu);
        };
        a.addEventListener('ended', fim);
        a.addEventListener('error', fallback);
        a.play().catch(fallback);
        return;
      }
      this._voz(texto, fim, meu);
    });
  }

  _voz(texto, fim, meu) {
    if (this.suportaVoz) {
      const u = new SpeechSynthesisUtterance(texto);
      const voz = this._vozPtBR();
      if (voz) u.voice = voz;
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.onend = fim;
      u.onerror = () => { if (this.token === meu) this._silencio(texto, fim); };
      this.utter = u;
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        return;
      } catch (e) { /* cai no silêncio */ }
    }
    this._silencio(texto, fim);
  }

  _silencio(texto, fim) {
    const palavras = texto.split(/\s+/).length;
    this.timer = setTimeout(fim, Math.max(4000, (palavras / 2.4) * 1000));
  }

  /** Interrompe a fala atual (a promessa pendente é resolvida). */
  parar() {
    if (this.audio) { try { this.audio.pause(); } catch (e) { /* ignora */ } this.audio = null; }
    if (this.utter && this.suportaVoz) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignora */ } this.utter = null; }
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this._resolverAtual) { const r = this._resolverAtual; this._resolverAtual = null; r(); }
    this.token = 0;
  }
}
