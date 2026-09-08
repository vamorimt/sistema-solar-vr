// Formatação de textos em pt-BR para painéis (VR) e cartões (desktop)
import { SOL, PLANETAS, LUAS, CINTUROES, BNCC } from '../data/corpos.js';

// Ritmos do tempo simulado (segundos simulados por segundo real), nomeados pelo que se vê
export const RITMOS = [
  { id: 'dias', rotulo: 'Ritmo: dias', curto: 'dias', v: 3600, descricao: '1 segundo = 1 hora', ve: 'a rotação dos planetas (o dia e a noite)' },
  { id: 'meses', rotulo: 'Ritmo: meses', curto: 'meses', v: 86400, descricao: '1 segundo = 1 dia', ve: 'as luas girando e os planetas próximos do Sol andando' },
  { id: 'anos', rotulo: 'Ritmo: anos', curto: 'anos', v: 2592000, descricao: '1 segundo = 1 mês', ve: 'as órbitas dos planetas distantes' },
];
export function ritmoPorId(id) { return Math.max(0, RITMOS.findIndex((r) => r.id === id)); }

const nf = (n, d = 0) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 });

export function fmtData(ms) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
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

/** Duração em segundos reais → texto curto ("12 s", "3 min", "2 h", "5 dias"). */
export function fmtDuracaoReal(seg) {
  if (seg < 1) return 'menos de 1 s';
  if (seg < 90) return `${nf(seg, seg < 10 ? 1 : 0)} s`;
  if (seg < 5400) return `${nf(seg / 60, 0)} min`;
  if (seg < 129600) return `${nf(seg / 3600, seg < 36000 ? 1 : 0)} h`;
  if (seg < 86400 * 400) return `${nf(seg / 86400, 0)} dias`;
  return `${nf(seg / (86400 * 365.25), 1)} anos`;
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

/** "Relógio" comparativo: quanto tempo real leva um dia e um ano deste corpo no ritmo atual. */
export function relogioDe(id, ritmo, pausado) {
  const d = dadosDe(id), t = tipoDe(id);
  if (!d || !ritmo) return '';
  if (pausado) return 'Tempo pausado.';
  const partes = [];
  if (t === 'sol') partes.push(`uma volta do Sol sobre si mesmo leva ${fmtDuracaoReal(d.rotacaoHoras * 3600 / ritmo.v)}`);
  if (t === 'planeta') {
    partes.push(`1 dia daqui (uma volta sobre si mesmo) passa em ${fmtDuracaoReal(d.rotacaoHoras * 3600 / ritmo.v)}`);
    partes.push(`1 ano daqui (uma volta ao redor do Sol) leva ${fmtDuracaoReal(d.periodoOrbitalDias * 86400 / ritmo.v)}`);
  }
  if (t === 'lua') partes.push(`uma volta ao redor do planeta leva ${fmtDuracaoReal(Math.abs(d.periodoDias) * 86400 / ritmo.v)}`);
  if (!partes.length) return '';
  return `Ritmo atual (${ritmo.descricao}): ${partes.join('; ')}.`;
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
  'Aperte o GRIP (lateral) apontando para um corpo para viajar até ele — ou use "Viajar até aqui".',
  'Analógico DIREITO: para frente/para trás na direção do olhar; para os lados gira a visão.',
  'Analógico ESQUERDO: desloca para os lados e sobe/desce.',
  'Botão A/X: mostra ou esconde o painel. Botão B/Y: volta ao início.',
  'O botão "Ritmo" nos painéis muda a velocidade do tempo: dias (rotação), meses (luas e órbitas próximas), anos (órbitas distantes).',
  'O menu flutua acima do controle esquerdo: levante a mão para ver.',
].join('\n');

export const AJUDA_DESKTOP = [
  'Clique em um planeta para ver a ficha; clique duas vezes para viajar até ele.',
  'Arraste com o mouse para girar a câmera; role para aproximar.',
  'Ritmo do tempo: dias (rotação), meses (luas e órbitas próximas), anos (órbitas distantes).',
  'Atalhos: espaço = pausar · + / − = ritmo · O = órbitas · R = rótulos · D = distâncias reais · T = comparar tamanhos · M = missão · H = ajuda · Esc = fechar',
  'Para VR: abra este site no navegador do Pico Neo 3 e toque em "Entrar em VR".',
].join('\n');
