# Escola dos Mundos — primeiro campus explorável

Protótipo WebXR para o 9º ano: pátio, nove salas visitáveis, torre de lançamento, elevador, cabine e transição para o Sistema Solar original.

## Percurso

- Computador: arraste a vista inicial; clique em Caminhar. WASD/setas movimentam, arraste para olhar, E interage. M abre o mapa.
- Celular: controle circular para caminhar, arraste para olhar. Mapa e Interagir oferecem acesso aos destinos.
- PICO Neo 3: abra em HTTPS no PICO Browser e toque em Entrar em VR. Analógico direito avança/recuа e gira em passos; esquerdo desloca lateralmente. Gatilho seleciona placas, grip visita destinos. A/X abre menu; B/Y volta ao pátio. Menu acompanha a mão esquerda.
- Torre: explore a base, entre no elevador, acesse a cabine e lance o foguete. Em VR a subida é substituída por uma transição de escurecimento. Abra o Sistema Solar e entre novamente em VR na página de destino. Use Voltar do navegador para retornar à escola.

## Referência preservada

Sistema Solar: `vamorimt/sistema-solar-vr`, commit `f9aa92064f33cf0d68e8c308321a36d6fb94a646`.
O arquivo `sistema-solar.html` é uma cópia byte a byte do `preview.html` original. Blob Git: `9835eb200c61d1204c6b83000a1b670ac8726af9`. Narrações, texturas e controles do Sistema Solar não foram alterados.
`src/controles.js` e `src/painel.js` derivam da referência; a movimentação do campus mantém o aluno no chão.

## Limites deste protótipo

As salas apresentam ambientes e temas. Não são cursos completos nem atividades avaliativas. O progresso de visita fica apenas neste dispositivo. A narração opcional do campus usa a voz pt-BR disponível no navegador; o Sistema Solar preserva os áudios originais.
A troca escola → Sistema Solar navega para outra página e encerra a sessão VR atual. Continuidade em uma única sessão é a próxima melhoria de integração.

## Desenvolvimento

`npm ci` e `npm run build`. Publique a pasta `escola` em HTTPS. Three.js 0.170.0; esbuild 0.24.0.
`node tools/check-campus.mjs` verifica construção da cena, acesso às nove salas, destinos, cancelamento do lançamento e integridade do Sistema Solar com UI/renderizador simulados. Isso não equivale a teste visual no navegador ou no headset.

## Validação realizada

Build e verificações de cena/navegação passaram. Geometria estática agrupada por material para reduzir chamadas de desenho; sem sombras dinâmicas. Texto e controles 3D presentes. Teste visual no navegador e teste de 72 fps, legibilidade e conforto no PICO permanecem pendentes. Nenhuma equivalência de desempenho com o Sistema Solar foi comprovada.

Licença do projeto de referência preservada em LICENSE. Texturas originais Solar System Scope; créditos mantidos no próprio Sistema Solar.
