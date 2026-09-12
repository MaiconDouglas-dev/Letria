#!/usr/bin/env node
/**
 * Gera placeholders de áudio pt-BR para TODO o conteúdo falado do app.
 *
 * Lê:
 *   - content/ui-audio.json        (mapa chave → texto falado)
 *   - content/lessons/*.json       (objetos { key, text } encontrados em qualquer nível)
 *
 * Produz:
 *   - assets/audio/<chave>.m4a     (voz `say` do macOS → AAC via afconvert)
 *   - src/generated/audioManifest.ts (mapa chave → require() estático do Metro)
 *
 * PLACEHOLDER: voz sintética do macOS, apenas para desenvolvimento.
 * Substituir por gravações profissionais antes do piloto (seção 6 da especificação).
 *
 * Uso: node scripts/gen-audio.mjs [voz]   (padrão: Luciana)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const OUT_AUDIO = join(ROOT, 'assets', 'audio');
const MANIFEST = join(ROOT, 'src', 'generated', 'audioManifest.ts');
const VOICE = process.argv[2] ?? 'Luciana';
const RATE = '170'; // levemente mais lento — público idoso

/** Coleta todos os pares {key,text} de um objeto, em qualquer profundidade. */
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

// Strings de UI: mapa plano chave → texto.
const uiAudio = JSON.parse(readFileSync(join(CONTENT, 'ui-audio.json'), 'utf8'));
for (const [key, text] of Object.entries(uiAudio)) refs.set(key, text);

// Lições: pares {key,text} embutidos.
for (const file of readdirSync(join(CONTENT, 'lessons')).filter((f) => f.endsWith('.json'))) {
  collectAudioRefs(JSON.parse(readFileSync(join(CONTENT, 'lessons', file), 'utf8')), refs);
}

// Frases de progresso com números — sem TTS dinâmico no app, então geramos
// uma frase completa por valor possível (totais lidos do módulo).
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
        : `Você terminou ${numExtenso(n)} lições de ${numExtenso(totalLicoes)}.`,
  );
}
// "Atividades sem ajuda" pode crescer com repetição — gera 0..50 (o app limita a exibição).
for (let n = 0; n <= 50; n++) {
  refs.set(
    `progress/estrelas-${n}`,
    n === 0
      ? 'Você ainda não respondeu nenhuma atividade sem ajuda. Pedir ajuda faz parte de aprender.'
      : n === 1
        ? 'Você respondeu uma atividade sem precisar de ajuda.'
        : `Você respondeu ${numExtenso(n)} atividades sem precisar de ajuda.`,
  );
}

if (refs.size === 0) {
  console.error('Nenhum texto falado encontrado em content/.');
  process.exit(1);
}

let generated = 0;
const keys = [];
for (const [key, text] of [...refs.entries()].sort()) {
  if (!/^[a-z0-9][a-z0-9\-/]*$/i.test(key)) {
    console.error(`Chave de áudio inválida: "${key}" (use letras, números, - e /)`);
    process.exit(1);
  }
  const m4a = join(OUT_AUDIO, `${key}.m4a`);
  const aiff = join(OUT_AUDIO, `${key}.aiff`);
  mkdirSync(dirname(m4a), { recursive: true });
  try {
    execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', aiff, text], { stdio: 'pipe' });
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', aiff, m4a], { stdio: 'pipe' });
    rmSync(aiff);
  } catch (e) {
    console.error(`Falha ao gerar "${key}" — este script precisa do macOS (say + afconvert).`);
    process.exit(1);
  }
  generated += 1;
  keys.push(key);
}

const lines = keys.map((k) => `  '${k}': require('../../assets/audio/${k}.m4a'),`).join('\n');
writeFileSync(
  MANIFEST,
  `// AUTOGERADO por scripts/gen-audio.mjs — não edite manualmente.
// Mapeia chave de áudio → asset empacotado (require estático para o Metro).
// Áudios são PLACEHOLDERS de desenvolvimento — substituir por gravações profissionais.
export const AUDIO_MANIFEST: Record<string, number> = {
${lines}
};
`,
);

console.log(`✔ ${generated} áudios gerados em assets/audio/ (voz: ${VOICE})`);
console.log(`✔ manifesto atualizado: src/generated/audioManifest.ts`);
