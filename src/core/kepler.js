// Mecânica orbital simplificada (elementos keplerianos, época J2000)
// Resultado em UA no plano da eclíptica, convertido para o sistema de eixos do three.js (Y para cima).

const DEG = Math.PI / 180;
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 TT (aprox. UTC)
export const DIA_MS = 86400000;

export function seculosDesdeJ2000(dateMs) {
  return (dateMs - J2000_MS) / (36525 * DIA_MS);
}

export function diasDesdeJ2000(dateMs) {
  return (dateMs - J2000_MS) / DIA_MS;
}

function normalizaGraus(g) {
  g = g % 360;
  return g < 0 ? g + 360 : g;
}

// Resolve a equação de Kepler M = E - e·sin(E) (radianos)
function anomaliaExcentrica(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 12; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

/**
 * Posição heliocêntrica (UA) de um planeta na data informada.
 * Retorna { x, y, z } já nos eixos do three.js (X = γ, Y = norte da eclíptica, Z = -y_ecl).
 */
export function posicaoHeliocentrica(el, dateMs, faseExtra = 0) {
  const T = seculosDesdeJ2000(dateMs);
  const a = el.a, e = el.e;
  const I = el.i * DEG, O = el.O * DEG;
  const wbar = el.w;
  const L = el.L + el.dL * T;
  const w = (wbar - el.O) * DEG;               // argumento do periélio
  const M = normalizaGraus(L - wbar) * DEG + faseExtra; // anomalia média
  const E = anomaliaExcentrica(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  const xe = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const ye = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const ze = (sw * sI) * xp + (cw * sI) * yp;
  return { x: xe, y: ze, z: -ye };
}

/** Amostra a órbita completa (n pontos) para desenhar a linha, na época dada. */
export function amostraOrbita(el, dateMs, n = 256) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    pts.push(posicaoHeliocentrica(el, dateMs, (k / n) * Math.PI * 2));
  }
  return pts;
}

/** Ângulo de rotação (rad) de um corpo com período em horas. */
export function anguloRotacao(dateMs, periodoHoras, fase = 0) {
  const horas = diasDesdeJ2000(dateMs) * 24;
  return ((horas / periodoHoras) % 1) * Math.PI * 2 + fase;
}

/** Ângulo orbital (rad) para órbitas circulares (luas). Período negativo = retrógrada. */
export function anguloCircular(dateMs, periodoDias, fase = 0) {
  const d = diasDesdeJ2000(dateMs);
  return ((d / periodoDias) % 1) * Math.PI * 2 + fase;
}

// ---- Escalas de cena --------------------------------------------------------
// Modo didático: distâncias comprimidas (raiz quadrada) para caber em ~80 m; tamanhos ampliados.
// Modo real: 1 UA = 40 m (Netuno a ~1,2 km) — os planetas continuam com tamanho didático para serem visíveis.
export const ESCALA = {
  didatico: { distancia: (ua) => 14 * Math.sqrt(ua), rotulo: 'Distâncias comprimidas' },
  real: { distancia: (ua) => 40 * ua, rotulo: 'Distâncias reais (1 UA = 40 m)' },
};

/** Raio de cena (m) de um planeta no modo didático, a partir do raio em km (Terra ≈ 0,5 m). */
export function raioDidatico(raioKm) {
  return 0.5 * Math.pow(raioKm / 6371, 0.5);
}

/** Projeta uma posição em UA para a cena usando a função de distância do modo. */
export function projeta(posUA, modo) {
  const r = Math.hypot(posUA.x, posUA.y, posUA.z);
  if (r === 0) return { x: 0, y: 0, z: 0 };
  const s = ESCALA[modo].distancia(r) / r;
  return { x: posUA.x * s, y: posUA.y * s, z: posUA.z * s };
}
