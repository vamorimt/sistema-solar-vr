// Dados astronômicos e conteúdo didático (pt-BR) — Ensino Fundamental II (6º–9º ano)
// Fontes dos valores: NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov) e JPL
// "Keplerian Elements for Approximate Positions of the Major Planets" (época J2000).
// Texturas: Solar System Scope (CC BY 4.0), three.js (MIT) e Planet Pixel Emporium.

export const RAIO_TERRA_KM = 6371;
export const UA_KM = 149597870.7;

// Elementos keplerianos J2000 (a em UA, ângulos em graus). dL = taxa de longitude média (graus/século).
const ELEMENTOS = {
  mercurio: { a: 0.38709927, e: 0.20563593, i: 7.00497902,  L: 252.25032350, w: 77.45779628,  O: 48.33076593,  dL: 149472.67411175 },
  venus:    { a: 0.72333566, e: 0.00677672, i: 3.39467605,  L: 181.97909950, w: 131.60246718, O: 76.67984255,  dL: 58517.81538729 },
  terra:    { a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, w: 102.93768193, O: 0.0,          dL: 35999.37244981 },
  marte:    { a: 1.52371034, e: 0.09339410, i: 1.84969142,  L: -4.55343205,  w: -23.94362959, O: 49.55953891,  dL: 19140.30268499 },
  jupiter:  { a: 5.20288700, e: 0.04838624, i: 1.30439695,  L: 34.39644051,  w: 14.72847983,  O: 100.47390909, dL: 3034.74612775 },
  saturno:  { a: 9.53667594, e: 0.05386179, i: 2.48599187,  L: 49.95424423,  w: 92.59887831,  O: 113.66242448, dL: 1222.49362201 },
  urano:    { a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451, w: 170.95427630, O: 74.01692503,  dL: 428.48202785 },
  netuno:   { a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969, w: 44.96476227,  O: 131.78422574, dL: 218.45945325 },
};

export const SOL = {
  id: 'sol', nome: 'Sol', tipo: 'Estrela (anã amarela, classe G2V)', cor: 0xffcc55,
  raioKm: 695700, rotacaoHoras: 609.12, inclinacaoEixo: 7.25, textura: 'sol',
  temperatura: 'Superfície: ~5.500 °C · Núcleo: ~15 milhões °C',
  resumo: 'O Sol é uma estrela: uma enorme esfera de gás (hidrogênio e hélio) que produz luz e calor por fusão nuclear. Ele concentra 99,8% de toda a massa do Sistema Solar, e é a sua gravidade que mantém os planetas em órbita.',
  fatos: [
    'Cabem cerca de 1,3 milhão de Terras dentro do Sol.',
    'A luz do Sol leva 8 minutos e 20 segundos para chegar à Terra.',
    'O Sol tem cerca de 4,6 bilhões de anos e está na metade da vida.',
    'Ele gira sobre si mesmo em ~25 dias no equador e ~35 dias perto dos polos.',
  ],
  bncc: ['EF09CI14', 'EF09CI17'],
  quiz: {
    pergunta: 'O que mantém os planetas girando em torno do Sol?',
    opcoes: ['A gravidade do Sol', 'O vento solar', 'O magnetismo da Terra', 'A luz do Sol'],
    correta: 0,
    explicacao: 'A enorme massa do Sol cria uma atração gravitacional que "prende" os planetas em suas órbitas.',
  },
};

export const PLANETAS = [
  {
    id: 'mercurio', nome: 'Mercúrio', tipo: 'Planeta rochoso', cor: 0x9e9e9e, textura: 'mercurio',
    raioKm: 2439.7, distanciaUA: 0.387, distanciaMilhoesKm: 57.9, periodoOrbitalDias: 87.97,
    rotacaoHoras: 1407.6, inclinacaoEixo: 0.03, gravidade: 0.38, luas: 0,
    temperatura: '-180 °C (noite) a 430 °C (dia)', elementos: ELEMENTOS.mercurio,
    resumo: 'O menor planeta e o mais próximo do Sol. Quase não tem atmosfera, por isso a diferença de temperatura entre o dia e a noite é a maior do Sistema Solar. Sua superfície é coberta de crateras, parecida com a da Lua.',
    fatos: [
      'Um ano em Mercúrio dura só 88 dias terrestres.',
      'Um dia (rotação completa) dura 59 dias terrestres.',
      'Apesar de ser o mais próximo do Sol, não é o mais quente — Vênus é.',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'Por que Mercúrio tem uma variação tão grande de temperatura entre o dia e a noite?',
      opcoes: ['Porque quase não tem atmosfera para reter o calor', 'Porque está muito longe do Sol', 'Porque gira muito rápido', 'Porque é feito de gelo'],
      correta: 0,
      explicacao: 'Sem uma atmosfera densa, o calor do lado iluminado escapa rapidamente para o espaço quando chega a noite.',
    },
  },
  {
    id: 'venus', nome: 'Vênus', tipo: 'Planeta rochoso', cor: 0xe6c68a, textura: 'venus',
    raioKm: 6051.8, distanciaUA: 0.723, distanciaMilhoesKm: 108.2, periodoOrbitalDias: 224.7,
    rotacaoHoras: 5832.5, inclinacaoEixo: 177.4, gravidade: 0.90, luas: 0,
    temperatura: '~465 °C (o planeta mais quente)', elementos: ELEMENTOS.venus,
    resumo: 'Quase do tamanho da Terra, mas com uma atmosfera densíssima de gás carbônico que causa um efeito estufa extremo: a superfície é quente o bastante para derreter chumbo. Gira "ao contrário" (rotação retrógrada) e muito devagar.',
    fatos: [
      'Um dia em Vênus (243 dias terrestres) é mais longo que o seu ano (225 dias).',
      'A pressão na superfície é 92 vezes maior que na Terra.',
      'É o objeto mais brilhante do céu depois do Sol e da Lua — a "estrela d\'alva".',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'Vênus é o planeta mais quente do Sistema Solar. Qual é a principal causa?',
      opcoes: ['Efeito estufa causado por sua atmosfera densa de CO₂', 'Ser o planeta mais próximo do Sol', 'Ter muitos vulcões ativos', 'Girar muito rápido'],
      correta: 0,
      explicacao: 'A atmosfera de Vênus prende o calor do Sol, como um cobertor — um efeito estufa muito mais forte que o da Terra.',
    },
  },
  {
    id: 'terra', nome: 'Terra', tipo: 'Planeta rochoso', cor: 0x3f7fd0, textura: 'terra',
    raioKm: 6371, distanciaUA: 1.0, distanciaMilhoesKm: 149.6, periodoOrbitalDias: 365.25,
    rotacaoHoras: 23.934, inclinacaoEixo: 23.44, gravidade: 1.0, luas: 1,
    temperatura: 'Média de 15 °C', elementos: ELEMENTOS.terra,
    resumo: 'Nosso planeta. O único lugar conhecido com vida e com água líquida na superfície. A inclinação do eixo de rotação (23,4°) é o que causa as estações do ano; a rotação causa o dia e a noite; a translação em torno do Sol define o ano.',
    fatos: [
      '71% da superfície é coberta por oceanos.',
      'A Terra gira a cerca de 1.670 km/h no equador.',
      'A atmosfera nos protege da radiação e dos meteoros.',
    ],
    bncc: ['EF06CI13', 'EF06CI14', 'EF08CI13'],
    quiz: {
      pergunta: 'O que causa o dia e a noite na Terra?',
      opcoes: ['A rotação da Terra em torno do próprio eixo', 'A translação da Terra ao redor do Sol', 'A Lua cobrindo o Sol', 'O Sol girando ao redor da Terra'],
      correta: 0,
      explicacao: 'A Terra gira sobre si mesma uma vez a cada ~24 horas; o lado voltado para o Sol tem dia, o outro tem noite.',
    },
  },
  {
    id: 'marte', nome: 'Marte', tipo: 'Planeta rochoso', cor: 0xc1613c, textura: 'marte',
    raioKm: 3389.5, distanciaUA: 1.524, distanciaMilhoesKm: 227.9, periodoOrbitalDias: 687,
    rotacaoHoras: 24.62, inclinacaoEixo: 25.19, gravidade: 0.38, luas: 2,
    temperatura: 'Média de -63 °C', elementos: ELEMENTOS.marte,
    resumo: 'O "planeta vermelho" — a cor vem do óxido de ferro (ferrugem) no solo. Tem o maior vulcão do Sistema Solar (Monte Olimpo, 22 km de altura), calotas polares de gelo e sinais de que já teve rios e lagos. É o alvo das próximas missões tripuladas.',
    fatos: [
      'Um dia marciano (sol) dura 24 h 37 min — quase igual ao nosso.',
      'Suas duas luas, Fobos e Deimos, são pequenas e irregulares.',
      'A atmosfera é fina (1% da terrestre) e feita principalmente de CO₂.',
    ],
    bncc: ['EF09CI14', 'EF09CI16'],
    quiz: {
      pergunta: 'Por que Marte é chamado de "planeta vermelho"?',
      opcoes: ['Por causa do óxido de ferro (ferrugem) no solo', 'Porque é muito quente', 'Porque tem lava na superfície', 'Porque reflete a luz do Sol'],
      correta: 0,
      explicacao: 'O solo de Marte é rico em minerais de ferro oxidado, que dão a cor avermelhada.',
    },
  },
  {
    id: 'jupiter', nome: 'Júpiter', tipo: 'Planeta gigante gasoso', cor: 0xd8b48c, textura: 'jupiter',
    raioKm: 69911, distanciaUA: 5.203, distanciaMilhoesKm: 778.5, periodoOrbitalDias: 4332.6,
    rotacaoHoras: 9.925, inclinacaoEixo: 3.13, gravidade: 2.53, luas: 95,
    temperatura: 'Média de -110 °C (topo das nuvens)', elementos: ELEMENTOS.jupiter,
    resumo: 'O maior planeta: cabem mais de 1.300 Terras dentro dele. É feito principalmente de hidrogênio e hélio, sem superfície sólida. A Grande Mancha Vermelha é uma tempestade maior que a Terra que dura há séculos.',
    fatos: [
      'Tem o dia mais curto do Sistema Solar: menos de 10 horas.',
      'Suas 4 maiores luas (Io, Europa, Ganimedes e Calisto) foram descobertas por Galileu em 1610.',
      'Sua gravidade "protege" a Terra desviando muitos cometas e asteroides.',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'O que é a Grande Mancha Vermelha de Júpiter?',
      opcoes: ['Uma tempestade gigante maior que a Terra', 'Um vulcão', 'Um oceano de lava', 'Uma cratera de impacto'],
      correta: 0,
      explicacao: 'É um anticiclone (tempestade) observado há mais de 300 anos, com ventos de centenas de km/h.',
    },
  },
  {
    id: 'saturno', nome: 'Saturno', tipo: 'Planeta gigante gasoso', cor: 0xe3d3a3, textura: 'saturno',
    raioKm: 58232, distanciaUA: 9.537, distanciaMilhoesKm: 1434, periodoOrbitalDias: 10759,
    rotacaoHoras: 10.656, inclinacaoEixo: 26.73, gravidade: 1.07, luas: 274,
    temperatura: 'Média de -140 °C', elementos: ELEMENTOS.saturno, aneis: { interno: 1.24, externo: 2.27, textura: 'anelSaturno' },
    resumo: 'Famoso pelos anéis, feitos de bilhões de pedaços de gelo e rocha — de grãos de poeira a blocos do tamanho de casas. É o planeta menos denso: se existisse uma banheira grande o bastante, Saturno flutuaria na água.',
    fatos: [
      'Os anéis têm cerca de 280 mil km de largura, mas só ~10 m a 1 km de espessura.',
      'Titã, sua maior lua, tem atmosfera densa e lagos de metano líquido.',
      'Em 2025 novas descobertas elevaram para mais de 270 o número de luas conhecidas.',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'Do que são feitos os anéis de Saturno?',
      opcoes: ['Pedaços de gelo e rocha', 'Gás quente', 'Poeira de ferro', 'Lava solidificada'],
      correta: 0,
      explicacao: 'São bilhões de partículas de gelo (principalmente) e rocha orbitando o planeta.',
    },
  },
  {
    id: 'urano', nome: 'Urano', tipo: 'Planeta gigante de gelo', cor: 0x9fd8e0, textura: 'urano',
    raioKm: 25362, distanciaUA: 19.19, distanciaMilhoesKm: 2871, periodoOrbitalDias: 30688,
    rotacaoHoras: 17.24, inclinacaoEixo: 97.77, gravidade: 0.89, luas: 28,
    temperatura: 'Média de -195 °C', elementos: ELEMENTOS.urano, aneis: { interno: 1.6, externo: 2.0, textura: 'anelUrano' },
    resumo: 'Um gigante de gelo, azul-esverdeado por causa do metano na atmosfera. Sua característica mais estranha: o eixo de rotação é "deitado" (98°), então ele gira de lado — cada polo tem 42 anos de luz seguidos de 42 anos de escuridão.',
    fatos: [
      'Foi o primeiro planeta descoberto com telescópio (William Herschel, 1781).',
      'É o planeta com a atmosfera mais fria do Sistema Solar.',
      'Tem anéis finos e escuros, descobertos em 1977.',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'O que há de especial no eixo de rotação de Urano?',
      opcoes: ['Está quase deitado (~98°), então o planeta gira de lado', 'É perfeitamente vertical', 'Muda de direção todo ano', 'Aponta sempre para o Sol'],
      correta: 0,
      explicacao: 'A inclinação de ~98° faz Urano girar "rolando" pela órbita, com estações extremas.',
    },
  },
  {
    id: 'netuno', nome: 'Netuno', tipo: 'Planeta gigante de gelo', cor: 0x3b5bdb, textura: 'netuno',
    raioKm: 24622, distanciaUA: 30.07, distanciaMilhoesKm: 4495, periodoOrbitalDias: 60182,
    rotacaoHoras: 16.11, inclinacaoEixo: 28.32, gravidade: 1.14, luas: 16,
    temperatura: 'Média de -200 °C', elementos: ELEMENTOS.netuno,
    resumo: 'O planeta mais distante do Sol. Azul intenso, com os ventos mais fortes do Sistema Solar (mais de 2.000 km/h). Recebe 900 vezes menos luz solar que a Terra. Sua maior lua, Tritão, orbita "ao contrário".',
    fatos: [
      'Foi descoberto em 1846 por cálculos matemáticos antes de ser visto.',
      'Um ano em Netuno dura quase 165 anos terrestres.',
      'A sonda Voyager 2 é a única que já o visitou (1989).',
    ],
    bncc: ['EF09CI14'],
    quiz: {
      pergunta: 'Quanto dura, aproximadamente, um ano em Netuno?',
      opcoes: ['165 anos terrestres', '12 anos terrestres', '1 ano terrestre', '88 dias terrestres'],
      correta: 0,
      explicacao: 'Quanto mais longe do Sol, mais longa a órbita: Netuno leva ~165 anos para dar uma volta.',
    },
  },
];

// Luas principais. distanciaKm = raio médio da órbita; periodoDias = período orbital.
export const LUAS = [
  { id: 'lua', nome: 'Lua', planeta: 'terra', raioKm: 1737.4, distanciaKm: 384400, periodoDias: 27.32, textura: 'lua', cor: 0xbbbbbb,
    resumo: 'O único satélite natural da Terra. Sempre mostra a mesma face para nós, porque gira sobre si mesma no mesmo tempo em que orbita a Terra (rotação síncrona). As fases da Lua acontecem porque vemos partes diferentes do lado iluminado pelo Sol.',
    fatos: ['Está se afastando da Terra ~3,8 cm por ano.', 'A gravidade da Lua causa as marés.', '12 pessoas já caminharam na Lua (missões Apollo, 1969–1972).'],
    bncc: ['EF08CI12'],
    quiz: { pergunta: 'Por que vemos sempre a mesma face da Lua?', opcoes: ['Porque ela gira sobre si mesma no mesmo tempo em que orbita a Terra', 'Porque ela não gira', 'Porque a Terra a esconde', 'Porque o Sol ilumina só um lado'], correta: 0, explicacao: 'Rotação síncrona: 27,3 dias para girar e 27,3 dias para orbitar — o mesmo lado fica sempre voltado para a Terra.' } },
  { id: 'io', nome: 'Io', planeta: 'jupiter', raioKm: 1821.6, distanciaKm: 421700, periodoDias: 1.77, cor: 0xd9c46a,
    resumo: 'O corpo com mais vulcões ativos do Sistema Solar: as marés causadas por Júpiter "amassam" seu interior e o aquecem.' },
  { id: 'europa', nome: 'Europa', planeta: 'jupiter', raioKm: 1560.8, distanciaKm: 671000, periodoDias: 3.55, cor: 0xd8cfc0,
    resumo: 'Coberta por uma casca de gelo, com um oceano de água líquida por baixo — um dos lugares mais promissores para procurar vida fora da Terra.' },
  { id: 'ganimedes', nome: 'Ganimedes', planeta: 'jupiter', raioKm: 2634.1, distanciaKm: 1070400, periodoDias: 7.15, cor: 0x9a9384,
    resumo: 'A maior lua do Sistema Solar — maior que o planeta Mercúrio. É a única lua com campo magnético próprio.' },
  { id: 'calisto', nome: 'Calisto', planeta: 'jupiter', raioKm: 2410.3, distanciaKm: 1882700, periodoDias: 16.69, cor: 0x6f6a60,
    resumo: 'Uma das superfícies mais antigas e cheias de crateras do Sistema Solar.' },
  { id: 'tita', nome: 'Titã', planeta: 'saturno', raioKm: 2574.7, distanciaKm: 1221870, periodoDias: 15.95, cor: 0xd9a441,
    resumo: 'A única lua com atmosfera densa. Tem rios, lagos e chuva — mas de metano líquido, a -180 °C.' },
  { id: 'tritao', nome: 'Tritão', planeta: 'netuno', raioKm: 1353.4, distanciaKm: 354760, periodoDias: -5.88, cor: 0xc9c2d4,
    resumo: 'Orbita Netuno no sentido contrário à rotação do planeta (órbita retrógrada) — provavelmente foi capturado do Cinturão de Kuiper. Tem gêiseres de nitrogênio.' },
];

export const CINTUROES = [
  { id: 'cinturao', nome: 'Cinturão de Asteroides', deUA: 2.2, ateUA: 3.2, quantidade: 3500, cor: 0xa89a86,
    resumo: 'Região entre Marte e Júpiter com milhões de asteroides — "sobras" da formação do Sistema Solar. Ceres, o maior deles, é um planeta anão. Apesar da quantidade, o espaço entre eles é enorme: sondas o atravessam sem risco.',
    bncc: ['EF09CI14'],
    quiz: { pergunta: 'Onde fica o Cinturão de Asteroides?', opcoes: ['Entre Marte e Júpiter', 'Entre a Terra e Marte', 'Depois de Netuno', 'Entre Mercúrio e Vênus'], correta: 0, explicacao: 'O cinturão principal fica entre as órbitas de Marte e Júpiter, a cerca de 2 a 3,5 UA do Sol.' } },
  { id: 'kuiper', nome: 'Cinturão de Kuiper', deUA: 30, ateUA: 50, quantidade: 3000, cor: 0x8fa3c9,
    resumo: 'Região gelada além de Netuno, onde vivem Plutão e outros planetas anões, além de muitos cometas. Plutão foi reclassificado como planeta anão em 2006 porque não "limpou" a vizinhança de sua órbita.',
    bncc: ['EF09CI14'],
    quiz: { pergunta: 'Por que Plutão deixou de ser considerado planeta em 2006?', opcoes: ['Porque não "limpou" a vizinhança de sua órbita', 'Porque é muito frio', 'Porque não tem luas', 'Porque é feito de gás'], correta: 0, explicacao: 'Pela definição da União Astronômica Internacional, um planeta precisa dominar gravitacionalmente sua órbita — Plutão divide a região com muitos outros corpos.' } },
];

// Descrições curtas das habilidades da BNCC usadas no projeto (para o modo professor)
export const BNCC = {
  EF06CI13: 'Selecionar argumentos e evidências que demonstrem a esfericidade da Terra.',
  EF06CI14: 'Inferir que as mudanças na sombra de uma vara (gnômon) ao longo do dia em diferentes períodos do ano são uma evidência dos movimentos relativos entre a Terra e o Sol.',
  EF08CI12: 'Justificar, por meio da construção de modelos e da observação da Lua no céu, a ocorrência das fases da Lua e dos eclipses, com base nas posições relativas entre Sol, Terra e Lua.',
  EF08CI13: 'Representar os movimentos de rotação e translação da Terra e analisar o papel da inclinação do eixo de rotação da Terra em relação à sua órbita na ocorrência das estações do ano, com a utilização de modelos tridimensionais.',
  EF09CI14: 'Descrever a composição e a estrutura do Sistema Solar (Sol, planetas rochosos, planetas gigantes gasosos e corpos menores), assim como a localização do Sistema Solar na nossa Galáxia (a Via Láctea) e dela no Universo.',
  EF09CI15: 'Relacionar diferentes leituras do céu e explicações sobre a origem da Terra, do Sol ou do Sistema Solar às necessidades de distintas culturas.',
  EF09CI16: 'Selecionar argumentos sobre a viabilidade da sobrevivência humana fora da Terra, com base nas condições necessárias à vida, nas características dos planetas e nas distâncias e nos tempos envolvidos em viagens interplanetárias e interestelares.',
  EF09CI17: 'Analisar o ciclo evolutivo do Sol (nascimento, vida e morte) baseado no conhecimento das etapas de evolução de estrelas de diferentes dimensões e os efeitos desse processo no nosso planeta.',
};

// Roteiro da Missão Guiada (trilha de aprendizagem consistente)
export const MISSAO = [
  { corpo: 'sol', titulo: 'Parada 1 · O Sol', texto: 'Tudo começa aqui. Observe o tamanho do Sol em relação aos planetas ao redor. Ele é uma estrela — e a única fonte de luz e calor do Sistema Solar.' },
  { corpo: 'mercurio', titulo: 'Parada 2 · Mercúrio', texto: 'O primeiro dos quatro planetas rochosos. Repare como sua órbita é a mais rápida: acelere o tempo no menu e compare com os outros.' },
  { corpo: 'venus', titulo: 'Parada 3 · Vênus', texto: 'Parecido com a Terra em tamanho, mas um "forno" por causa do efeito estufa. Observe a rotação lenta e ao contrário.' },
  { corpo: 'terra', titulo: 'Parada 4 · Terra e Lua', texto: 'Nossa casa. Repare no eixo inclinado (23,4°) — ele causa as estações — e na Lua girando ao redor. Acelere o tempo para ver a Lua completar uma volta (~27 dias).' },
  { corpo: 'marte', titulo: 'Parada 5 · Marte', texto: 'O último planeta rochoso. Compare a cor e o tamanho com a Terra. Marte é o próximo destino das viagens tripuladas.' },
  { corpo: 'cinturao', titulo: 'Parada 6 · Cinturão de Asteroides', texto: 'A fronteira entre os planetas rochosos e os gigantes. Milhões de rochas, mas muito espaço vazio entre elas.' },
  { corpo: 'jupiter', titulo: 'Parada 7 · Júpiter', texto: 'O gigante. Veja as faixas de nuvens e as 4 luas galileanas girando bem rápido ao redor dele.' },
  { corpo: 'saturno', titulo: 'Parada 8 · Saturno', texto: 'Os anéis são finíssimos em comparação com a largura. Procure Titã, a lua com atmosfera.' },
  { corpo: 'urano', titulo: 'Parada 9 · Urano', texto: 'Repare que ele gira "deitado". Os anéis ficam quase na vertical em relação à órbita.' },
  { corpo: 'netuno', titulo: 'Parada 10 · Netuno', texto: 'O mais distante. Daqui o Sol parece só uma estrela brilhante. Tritão orbita ao contrário.' },
  { corpo: 'kuiper', titulo: 'Parada 11 · Cinturão de Kuiper', texto: 'Além de Netuno: o reino dos planetas anões, como Plutão, e dos cometas.' },
  { corpo: 'escala', titulo: 'Parada 12 · A escala real', texto: 'Até agora as distâncias estavam comprimidas para caber na sala. Ative as "distâncias reais" no menu e veja como o Sistema Solar é, na verdade, quase todo espaço vazio.' },
];
