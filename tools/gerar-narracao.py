#!/usr/bin/env python3
"""Gera a narração da Viagem Guiada (assets/audio/<id>.mp3) a partir de src/data/narracao.json.

Dois motores:
  --motor edge   (padrão) vozes neurais da Microsoft via edge-tts — qualidade alta, precisa de internet.
                 pip install edge-tts
  --motor piper  voz offline (piper-tts) — indique o modelo com --modelo caminho/para/voz.onnx

Exemplos (na pasta do projeto):
  python tools/gerar-narracao.py                       # voz pt-BR-FranciscaNeural
  python tools/gerar-narracao.py --voz pt-BR-AntonioNeural
  python tools/gerar-narracao.py --motor piper --modelo pt-br-edresson-low.onnx

Depois de gerar, rode `npm run preview` para embutir o áudio no dist/preview.html.
"""
import argparse, asyncio, json, os, shutil, subprocess, sys, tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON = os.path.join(RAIZ, 'src', 'data', 'narracao.json')
SAIDA = os.path.join(RAIZ, 'assets', 'audio')


def carregar():
    with open(JSON, encoding='utf-8') as f:
        return json.load(f)


def para_mp3(entrada, saida):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', entrada, '-ac', '1', '-ar', '24000', '-b:a', '64k', saida], check=True)


async def gerar_edge(textos, voz, taxa):
    import edge_tts
    for id_, texto in textos.items():
        destino = os.path.join(SAIDA, f'{id_}.mp3')
        com = edge_tts.Communicate(texto, voz, rate=taxa)
        await com.save(destino)
        print('ok', destino)


def gerar_piper(textos, modelo, piper_bin):
    for id_, texto in textos.items():
        with tempfile.TemporaryDirectory() as tmp:
            wav = os.path.join(tmp, 'v.wav')
            subprocess.run([piper_bin, '--model', modelo, '--output_file', wav, '--sentence_silence', '0.35'], input=texto.encode('utf-8'), check=True, stderr=subprocess.DEVNULL)
            destino = os.path.join(SAIDA, f'{id_}.mp3')
            para_mp3(wav, destino)
            print('ok', destino)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--motor', choices=['edge', 'piper'], default='edge')
    p.add_argument('--voz', default='pt-BR-FranciscaNeural', help='voz do edge-tts (pt-BR-FranciscaNeural, pt-BR-AntonioNeural, pt-BR-ThalitaNeural)')
    p.add_argument('--taxa', default='-5%', help='velocidade do edge-tts, ex.: -10%%, +0%%')
    p.add_argument('--modelo', help='arquivo .onnx da voz do piper')
    p.add_argument('--piper', default=shutil.which('piper') or 'piper', help='executável do piper')
    p.add_argument('--so', nargs='*', help='gerar apenas estes ids')
    a = p.parse_args()
    textos = carregar()
    if a.so:
        textos = {k: v for k, v in textos.items() if k in a.so}
    os.makedirs(SAIDA, exist_ok=True)
    if a.motor == 'edge':
        try:
            asyncio.run(gerar_edge(textos, a.voz, a.taxa))
        except ImportError:
            sys.exit('Instale o edge-tts:  pip install edge-tts')
    else:
        if not a.modelo:
            sys.exit('Informe --modelo caminho/para/voz.onnx')
        gerar_piper(textos, a.modelo, a.piper)
    print(f'{len(textos)} arquivos em {SAIDA}')


if __name__ == '__main__':
    main()
