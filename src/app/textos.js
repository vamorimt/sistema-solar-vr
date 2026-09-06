// Formatação de textos em pt-BR para painéis (VR) e cartões (desktop)
import { SOL, PLANETAS, LUAS, CINTUROES, BNCC } from '../data/corpos.js';

export const VELOCIDADES = [
  { rotulo: 'Pausado', v: 0 },
  { rotulo: 'Tempo real', v: 1 },
  { rotulo: '1 hora/s', v: 3600 },
  { rotulo: '1 dia/s', v: 86400 },
  { rotulo: '1 semana/s', v: 604800 },
  { rotulo: '1 mês/s', v: 2592000 },
  { rotulo: '1 ano/s', v: 31557600 },
];

const nf = (n, d = 0) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 });

export function fmtData(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtPeriodoDias(dias) {
  if (dias >= 365 * 1.5) return `${nf(dias / 365.25, 1)} anos`;
  return `${nf(dias, 0)} dias`;
}

export function fmtRotacao(horas) {
  if (horas > 48) return `${nf(horas / 24, 0)} dias`;
  const h = Math.floor(horas), m = Math.round((horas - h) * 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function dadosDe(id) {
  if (id === 'sol') return SOL;
  return PLANETAS.find((p) => p.id === id) || LUAS.find((l) => l.id === id) || CINTUROES.find((c) => c.id === id) || null;
}

export function tipoDe(id) {
  if (id === 'sol') return 'sol';
  if (PLANETAS.some((p) => p.id === id)) return 'planeta';
  if (LUAS.some((l) => l.id === id)) return 'lua';
  if (CINTUROES.some((c) => c.id === id)) return 'cinturao';
  return null;
}

/** Linhas de "ficha técnica" de um corpo. */
export function fichaDe(id) {
  const d = dadosDe(id), t = tipoDe(id);
  if (!d) return [];
  const l = [];
  if (t === 'sol') {
    l.push(`Diâmetro: ${nf(d.raioKm * 2)} km (109 Terras)`);
    l.push(`Temperatura: ${d.temperatura}`);
    l.push(`Rotação: ${fmtRotacao(d.rotacaoHoras)} (equador)`);
  } else if (t === 'planeta') {
    l.push(`Distância média do Sol: ${nf(d.distanciaUA, 2)} UA (${nf(d.distanciaMilhoesKm)} milhões de km)`);
    l.push(`Diâmetro: ${nf(d.raioKm * 2)} km · Gravidade: ${nf(d.gravidade, 2)} g`);
    l.push(`Ano (translação): ${fmtPeriodoDias(d.periodoOrbitalDias)} · Dia (rotação): ${fmtRotacao(d.rotacaoHoras)}`);
    l.push(`Inclinação do eixo: ${nf(d.inclinacaoEixo, 1)}° · Luas: ${d.luas}`);
    l.push(`Temperatura: ${d.temperatura}`);
  } else if (t === 'lua') {
    const p = PLANETAS.find((x) => x.id === d.planeta);
    l.push(`Lua de ${p.nome} · Diâmetro: ${nf(d.raioKm * 2)} km`);
    l.push(`Distância de ${p.nome}: ${nf(d.distanciaKm)} km · Órbita: ${nf(Math.abs(d.periodoDias), 1)} dias${d.periodoDias < 0 ? ' (retrógrada)' : ''}`);
  } else if (t === 'cinturao') {
    l.push(`Região: de ${nf(d.deUA, 1)} a ${nf(d.ateUA, 1)} UA do Sol`);
  }
  return l;
}

export function tituloDe(id) {
  const d = dadosDe(id);
  return d ? d.nome : id;
}

export function subtituloDe(id) {
  const d = dadosDe(id), t = tipoDe(id);
  if (!d) return '';
  const tipo = d.tipo || (t === 'lua' ? 'Satélite natural' : t === 'cinturao' ? 'Corpos menores' : '');
  const bncc = d.bncc ? ' · BNCC ' + d.bncc.join(', ') : '';
  return tipo + bncc;
}

export function descricaoBNCC(codigo) {
  return BNCC[codigo] || '';
}

export const AJUDA_VR = [
  'Aponte com o controle e puxe o GATILHO para selecionar um planeta ou apertar um botão.',
  'Aperte o GRIP (lateral) apontando para um corpo para viajar até ele — ou use "Viajar até aqui" no painel.',
  'Analógico DIREITO: para frente/para trás na direção do olhar; para os lados gira a visão.',
  'Analógico ESQUERDO: desloca para os lados e sobe/desce.',
  'Botão A/X: mostra ou esconde o painel. Botão B/Y: volta ao início.',
  'O menu fica preso ao controle esquerdo: vire o pulso para ver.',
].join('\n');

export const AJUDA_DESKTOP = [
  'Clique em um planeta para ver a ficha; clique duas vezes para viajar até ele.',
  'Arraste com o mouse para girar a câmera; role para aproximar.',
  'Atalhos: espaço = pausar · + / − = velocidade do tempo · O = órbitas · R = rótulos · D = distâncias reais · T = comparar tamanhos · M = missão · H = ajuda · Esc = fechar',
  'Para VR: abra este site no navegador do Pico Neo 3 e toque em "Entrar em VR".',
].join('\n');
