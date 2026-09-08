# Sistema Solar VR — plano pedagógico e roteiro de versões

## 1. Diagnóstico

**Objetivo:** um site em VR (Pico Neo 3) em que alunos do Ensino Fundamental II aprendam o Sistema Solar de forma interativa, com modelos realistas e aprendizado consistente (não só "passeio bonito").

**Restrições técnicas que moldam o projeto**

- O Pico Neo 3 roda WebXR pelo Pico Browser (e pelo Wolvic). WebXR exige HTTPS — por isso a hospedagem (GitHub Pages) faz parte do produto, não é detalhe.
- O chip (Snapdragon XR2) pede cenas leves: texturas 2k, poucas luzes, sem sombras dinâmicas, ~72 fps.
- Texto em VR precisa ser grande e curto. Cada painel tem no máximo ~8 linhas.
- Distâncias reais tornam os planetas invisíveis; tamanhos reais tornam a sala inviável. A solução didática é ter **modos de escala explícitos** e transformar a própria distorção em conteúdo ("por que não dá para desenhar em escala?").

**Público:** 6º–9º ano. Linguagem direta, sem jargão sem explicação; números sempre com comparação ("cabem 1.300 Terras em Júpiter").

## 2. Estratégia

### Habilidades da BNCC cobertas

| Código | Habilidade (resumo) | Onde aparece na experiência |
|---|---|---|
| EF06CI13 | Evidências da esfericidade da Terra | Terra em 3D, terminador dia/noite |
| EF06CI14 | Movimentos relativos Terra–Sol (gnômon) | Rotação da Terra com tempo acelerado (v0.3: sombra de um gnômon) |
| EF08CI12 | Fases da Lua e eclipses | Lua orbitando a Terra com face iluminada (v0.3: estação Sol-Terra-Lua) |
| EF08CI13 | Rotação, translação e inclinação do eixo → estações | Eixo inclinado 23,4°, translação real (v0.3: estação das estações) |
| EF09CI14 | Composição e estrutura do Sistema Solar; localização na Via Láctea | Missão guiada, cinturões, modos de escala, céu com Via Láctea |
| EF09CI15 | Leituras do céu em diferentes culturas | v0.4: constelações indígenas e greco-romanas |
| EF09CI16 | Viabilidade da vida fora da Terra; distâncias e tempos de viagem | Fichas (temperatura, gravidade, atmosfera); v0.3: "quanto tempo leva para chegar?" |
| EF09CI17 | Ciclo evolutivo do Sol | Ficha do Sol; v0.4: linha do tempo do Sol |

### Desenho da aprendizagem (para ser consistente)

1. **Exploração livre** sempre disponível — o aluno escolhe para onde ir; o sistema mostra a ficha e sugere o quiz.
2. **Viagem guiada narrada** com 16 paradas em ordem (Sol → Netuno → Kuiper → escala real), no automático ("filme") ou passo a passo. Cada parada: 1 ideia central narrada; 4 checkpoints com pergunta, feedback imediato e explicação. Progresso salvo no dispositivo.
3. **Comparações sensoriais** que só a VR entrega: estar ao lado de Júpiter em escala, ver o Sol de 109 m, "sentir" o vazio das distâncias reais.
4. **Tempo como variável**: acelerar para ver Mercúrio dar 4 voltas enquanto a Terra dá 1 (relação distância × período, base para Kepler no Ensino Médio).
5. **Modo professor** (v0.3): roteiro de aula, relatório de acertos da turma, códigos BNCC visíveis.

## 3. Ação — roteiro de versões

### v0.1 (entregue) — base testável
Cena completa, posições reais, tempo, dois modos de distância, estação de tamanhos, fichas, curiosidades, quiz, missão guiada, VR com controles do Pico, desktop/celular, preview em arquivo único.

### v0.2 (entregue) — viagem narrada e correções do primeiro teste em família
Feedback do teste (06/09): experiência aprovada; a exploração livre funcionou. Ajustes pedidos e feitos:
- Painel "ao contrário": corrigido (orientação em coordenadas de mundo + painéis sempre virados para a cabeça; menu flutua sobre o controle esquerdo).
- Data/hora que mudava rápido demais: retirada do VR; no lugar, um "relógio" por planeta na ficha (quanto tempo real leva um dia e um ano dali) e explicação de por que a Terra gira rápido e Vênus parece parado.
- Controle de tempo difícil no VR: virou um botão "Ritmo ▸" com três passos (dias / meses / anos) presente em todos os painéis.
- Missão guiada virou um **filme narrado** com 16 paradas, áudio pt-BR, ritmo por parada, 4 checkpoints e retorno à exploração livre; menos cliques (a narração já traz o conteúdo; a ficha é opcional).
- Curiosidade sobre a cor de Mercúrio (cinza, não vermelho); fade entre teletransportes.

### v0.3 — luas, estações temáticas e voz
- **Missões das luas** (pedido do teste): uma viagem curta por planeta — Terra/Lua (fases), Júpiter (galileanas), Saturno (Titã, anéis de perto), Netuno (Tritão retrógrado).
- Narração com voz neural (gerar com `tools/gerar-narracao.py` no PC) e trilha ambiente discreta.
- Estação **Sol–Terra–Lua** (fases e eclipses, EF08CI12) e estação **Estações do ano** (EF08CI13).
- Modelos dos controles do Pico; vinheta ao mover com o analógico; modo professor (relatório de acertos).

### v0.4 — profundidade e acessibilidade
- Gnômon virtual (EF06CI14) e "viagem até Marte: quanto tempo?" (EF09CI16).
- Narração em áudio pt-BR dos painéis (TTS gravado) e legendas maiores.
- Modo "só olhar" (gaze) para turmas sem controle.
- Texturas 4k/8k opcionais para PC; nuvens em movimento; luzes noturnas da Terra.

### v0.5 — cultura e universo
- Constelações (greco-romanas e indígenas brasileiras) no céu (EF09CI15).
- Linha do tempo do Sol (EF09CI17) e "onde estamos na Via Láctea".
- Multiusuário simples (professor guia a turma) — avaliar viabilidade.

## 4. Como avaliar cada versão

- **Técnica**: 72 fps estáveis no Pico Neo 3; sem erros de console; texto legível a 1,5 m.
- **Pedagógica**: teste com 3–5 alunos: conseguem chegar sozinhos ao fim da missão? Acertos por pergunta (identificar perguntas ambíguas). Perguntar o que aprenderam sem olhar a tela.
- **Conforto**: ninguém com enjoo em 15 min de uso (ajustar velocidade de locomoção e snap turn).

## 5. Decisões registradas

- Público-alvo: Fundamental II (6º–9º ano). Hospedagem: GitHub Pages. Interação: controles do Pico (gaze como fallback futuro).
- Tamanhos dos planetas no modo órbita são ampliados (raiz quadrada do raio real) e isso é dito ao aluno; a estação de tamanhos usa escala real.
- Conteúdo em `src/data/corpos.js` para que professores possam editar textos e perguntas sem mexer no código.
