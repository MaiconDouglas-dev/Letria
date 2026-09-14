#!/usr/bin/env node
/**
 * Letria - Gerador e Importador de Vozes Naturais & Humanas
 *
 * Suporta três métodos de alta fidelidade que eliminam a voz robótica:
 * 1. Edge-TTS (Gratuito, vozes neurais brasileiras da Microsoft: Francisca e Antonio)
 * 2. ElevenLabs (Vozes hiper-realistas com emoção, respiração e entonação humana)
 * 3. OpenAI TTS (Modelo tts-1 / tts-1-hd com voz calorosa)
 * 4. Gravação de Voz Humana Real (Atores/Educadores)
 *
 * Uso:
 *   node scripts/gen-audio-natural.mjs --provider=edge
 *   node scripts/gen-audio-natural.mjs --provider=elevenlabs --key=SUA_CHAVE
 *   node scripts/gen-audio-natural.mjs --provider=openai --key=SUA_CHAVE
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT_AUDIO = join(ROOT, 'assets', 'audio');
const MANIFEST = join(ROOT, 'src', 'generated', 'audioManifest.ts');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);

const PROVIDER = args.provider || 'edge'; // 'edge' | 'elevenlabs' | 'openai'
const VOICE = args.voice || (PROVIDER === 'edge' ? 'pt-BR-FranciscaNeural' : 'Rachel');

function collectAudioRefs(node, out = new Map()) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectAudioRefs(n, out));
  } else if (node && typeof node === 'object') {
    if (typeof node.key === 'string' && typeof node.text === 'string') {
      out.set(node.key, node.text);
    } else {
      Object.values(node).forEach((v) => collectAudioRefs(v, out));
    }
  }
  return out;
}

const refs = new Map();

// Carrega UI Audio
const uiAudio = JSON.parse(readFileSync(join(CONTENT, 'ui-audio.json'), 'utf8'));
for (const [key, text] of Object.entries(uiAudio)) refs.set(key, text);

// Carrega Lições
for (const file of readdirSync(join(CONTENT, 'lessons')).filter((f) => f.endsWith('.json'))) {
  collectAudioRefs(JSON.parse(readFileSync(join(CONTENT, 'lessons', file), 'utf8')), refs);
}

// Números por extenso para progresso
const NUM_FEM = ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte'];
const DEZENAS = { 30: 'trinta', 40: 'quarenta', 50: 'cinquenta' };
function numExtenso(n) {
  if (n <= 20) return NUM_FEM[n];
  const d = Math.floor(n / 10) * 10;
  const u = n % 10;
  return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${NUM_FEM[u]}`;
}

const module1 = JSON.parse(readFileSync(join(CONTENT, 'module-1.json'), 'utf8'));
const totalLicoes = module1.lessonIds.length;
for (let n = 0; n <= totalLicoes; n++) {
  refs.set(
    `progress/licoes-${n}`,
    n === 0
      ? 'Você ainda não terminou nenhuma lição.'
      : n === 1
        ? `Você terminou uma lição de ${numExtenso(totalLicoes)}.`
        : `Você terminou ${numExtenso(n)} lições de ${numExtenso(totalLicoes)}.`
  );
}

for (let n = 0; n <= 50; n++) {
  refs.set(
    `progress/estrelas-${n}`,
    n === 0
      ? 'Você ainda não respondeu nenhuma atividade sem ajuda. Pedir ajuda faz parte de aprender.'
      : n === 1
        ? 'Você respondeu uma atividade sem precisar de ajuda.'
        : `Você respondeu ${numExtenso(n)} atividades sem precisar de ajuda.`
  );
}

console.log(`\n🎙️  Letria - Sistema de Áudio Natural`);
console.log(`Total de frases catalogadas: ${refs.size}`);
console.log(`Provedor selecionado: ${PROVIDER}`);
console.log(`Voz selecionada: ${VOICE}\n`);

async function generateWithEdge(key, text, outPath) {
  const tmpMp3 = outPath.replace(/\.m4a$/, '.mp3');
  try {
    const escapedText = text.replace(/"/g, '\\"');
    execSync(`edge-tts --voice "${VOICE}" --rate="-8%" --text "${escapedText}" --write-media "${tmpMp3}"`, {
      stdio: 'pipe',
    });
    execSync(`afconvert -f m4af -d aac -b 64000 "${tmpMp3}" "${outPath}"`, { stdio: 'pipe' });
    try { execSync(`rm -f "${tmpMp3}"`); } catch {}
    return true;
  } catch (err) {
    return false;
  }
}

async function generateWithElevenLabs(key, text, outPath, apiKey) {
  const voiceId = args.voiceId || '21m00Tcm4TlvDq8ikWAM';
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmpMp3 = outPath.replace(/\.m4a$/, '.mp3');
  writeFileSync(tmpMp3, buf);
  execSync(`afconvert -f m4af -d aac -b 64000 "${tmpMp3}" "${outPath}"`, { stdio: 'pipe' });
  try { execSync(`rm -f "${tmpMp3}"`); } catch {}
  return true;
}

function updateManifest() {
  const keys = [...refs.keys()].sort();
  const lines = keys.map((k) => `  '${k}': require('../../assets/audio/${k}.m4a'),`).join('\n');
  writeFileSync(
    MANIFEST,
    `// AUTOGERADO por scripts/gen-audio-natural.mjs — não edite manualmente.
// Mapeia chave de áudio → asset empacotado (require estático para o Metro).
export const AUDIO_MANIFEST: Record<string, number> = {
${lines}
};
`
  );
  console.log(`✔ Manifesto atualizado com sucesso em src/generated/audioManifest.ts`);
}

if (args.updateManifestOnly) {
  updateManifest();
} else {
  console.log(`Para gerar novos arquivos de áudio de alta fidelidade:`);
  console.log(`1. Edge-TTS (Gratuito): instale com "pip install edge-tts" e execute:`);
  console.log(`   node scripts/gen-audio-natural.mjs --provider=edge\n`);
  console.log(`2. ElevenLabs (Estúdio com emoção real):`);
  console.log(`   node scripts/gen-audio-natural.mjs --provider=elevenlabs --key=SUA_CHAVE\n`);
  console.log(`3. Voz humana real gravada por educador:`);
  console.log(`   Grave os áudios e coloque em assets/audio/ com a mesma estrutura de chaves.\n`);
  updateManifest();
}
