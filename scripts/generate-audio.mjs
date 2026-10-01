// Gera os áudios MP3 das frases em inglês com edge-tts (vozes neurais gratuitas, sem chave)
// Saída: public/audio/*.mp3 + public/audio/manifest.json (publicados junto com o site)
//
// Pré-requisito: pip install edge-tts
// Uso: node scripts/generate-audio.mjs [--force]
//   EDGE_TTS=/caminho/do/edge-tts  para usar outro executável
//   TTS_VOICE=en-US-AvaNeural       para trocar a voz
//
// O edge-tts usa um serviço não oficial da Microsoft: gerar os arquivos uma vez e publicá-los
// garante que o app continua tocando mesmo se o serviço mudar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/audio');
const manifestPath = path.join(outDir, 'manifest.json');
const force = process.argv.includes('--force');
const edgeTts = process.env.EDGE_TTS || 'edge-tts';
const voice = process.env.TTS_VOICE || 'en-US-AvaNeural';
const SLOW_RATE = '-25%';

// Frases extras usadas fora das atividades
const EXTRA_PHRASES = [
  'Hello! Welcome to your daily English practice session.', // teste em Configurações
  'Can I have your boarding pass?', // questão padrão de nova atividade no admin
];

const source = fs
  .readFileSync(path.join(root, 'src/services/storage/initialData.ts'), 'utf8')
  .replace(/^import .*$/m, '');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'audio-')), 'initialData.ts');
fs.writeFileSync(tmp, source);
const { INITIAL_ACTIVITIES } = await import(pathToFileURL(tmp).href);

// Mesma regra da fila de revisão: frase do áudio ou, sem ela, a resposta em inglês
const phrases = new Set(EXTRA_PHRASES);
for (const activity of INITIAL_ACTIVITIES) {
  for (const q of activity.questions) {
    const text = (q.audioPhraseEn || (q.type === 'listening_choice' ? '' : q.expectedAnswer) || '').trim();
    if (text) phrases.add(text);
  }
}

const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
const sameVoice = previous?.voice === voice;
fs.mkdirSync(outDir, { recursive: true });

const synth = (text, file, rate) => {
  const args = ['--voice', voice, '--text', text, '--write-media', file];
  if (rate) args.push(`--rate=${rate}`);
  execFileSync(edgeTts, args, { stdio: 'pipe' });
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    throw new Error(`edge-tts não gerou áudio para: ${text}`);
  }
};

const entries = {};
let generated = 0;
for (const text of phrases) {
  const id = crypto.createHash('sha1').update(`${voice}|${text}`).digest('hex').slice(0, 16);
  const normal = `${id}.mp3`;
  const slow = `${id}-slow.mp3`;
  for (const [file, rate] of [[normal, null], [slow, SLOW_RATE]]) {
    const full = path.join(outDir, file);
    if (force || !sameVoice || !fs.existsSync(full)) {
      synth(text, full, rate);
      generated += 1;
    }
  }
  entries[text] = { normal: `audio/${normal}`, slow: `audio/${slow}` };
}

// Remove arquivos que não pertencem mais a nenhuma frase
const keep = new Set(Object.values(entries).flatMap((e) => [path.basename(e.normal), path.basename(e.slow)]));
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith('.mp3') && !keep.has(file)) fs.unlinkSync(path.join(outDir, file));
}

fs.writeFileSync(manifestPath, JSON.stringify({ voice, phrases: entries }, null, 2) + '\n');
console.log(`Áudios: ${phrases.size} frases, ${generated} arquivos gerados agora, voz ${voice}`);
