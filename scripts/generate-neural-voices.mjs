import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT_AUDIO = join(ROOT, 'assets', 'audio');
const MANIFEST = join(ROOT, 'src', 'generated', 'audioManifest.ts');

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

// 1. Carrega UI Audio
const uiAudio = JSON.parse(readFileSync(join(CONTENT, 'ui-audio.json'), 'utf8'));
for (const [key, text] of Object.entries(uiAudio)) refs.set(key, text);

// 2. Carrega Lições
for (const file of readdirSync(join(CONTENT, 'lessons')).filter((f) => f.endsWith('.json'))) {
  collectAudioRefs(JSON.parse(readFileSync(join(CONTENT, 'lessons', file), 'utf8')), refs);
}

// 3. Números por extenso para progresso
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

console.log(`\n🎙️  Letria - Gerador de Vozes Neurais de Alta Fidelidade (Microsoft pt-BR-FranciscaNeural)`);
console.log(`Total de frases catalogadas: ${refs.size}\n`);

async function generateSingle(tts, key, text) {
  const outPath = join(OUT_AUDIO, `${key}.m4a`);
  const parentDir = dirname(outPath);
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

  const tmpMp3 = join('/tmp', `letria_${key.replace(/[/\\?%*:|"<>]/g, '_')}_${Date.now()}.mp3`);
  try {
    const { audioStream } = tts.toStream(text);
    const fs = await import('node:fs');
    const writeStream = fs.createWriteStream(tmpMp3);
    audioStream.pipe(writeStream);
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    execSync(`afconvert -f m4af -d aac -b 64000 "${tmpMp3}" "${outPath}"`, { stdio: 'pipe' });
    try { execSync(`rm -f "${tmpMp3}"`); } catch {}
    return true;
  } catch (err) {
    console.error(`Falha ao gerar ${key}:`, err.message);
    try { execSync(`rm -f "${tmpMp3}"`); } catch {}
    return false;
  }
}

async function main() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('pt-BR-FranciscaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let successCount = 0;
  let failCount = 0;
  const entries = [...refs.entries()];

  for (let i = 0; i < entries.length; i++) {
    const [key, text] = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] Gerando ${key}... `);
    const ok = await generateSingle(tts, key, text);
    if (ok) {
      console.log('✓');
      successCount++;
    } else {
      console.log('✗');
      failCount++;
    }
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\n🎉 Concluído: ${successCount} gerados com sucesso, ${failCount} falhas.`);

  const keys = [...refs.keys()].sort();
  const lines = keys.map((k) => `  '${k}': require('../../assets/audio/${k}.m4a'),`).join('\n');
  writeFileSync(
    MANIFEST,
    `// AUTOGERADO por scripts/generate-neural-voices.mjs — não edite manualmente.
// Mapeia chave de áudio → asset empacotado (require estático para o Metro).
export const AUDIO_MANIFEST: Record<string, number> = {
${lines}
};
`
  );
  console.log(`✔ Manifesto atualizado com sucesso em src/generated/audioManifest.ts\n`);
}

main().catch(console.error);
