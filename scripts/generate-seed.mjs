// Gera database/seed.sql a partir de src/services/storage/initialData.ts
// Uso: node scripts/generate-seed.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/services/storage/initialData.ts'), 'utf8')
  .replace(/^import .*$/m, '');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'seed-')), 'initialData.ts');
fs.writeFileSync(tmp, source);
const { INITIAL_ACTIVITIES } = await import(pathToFileURL(tmp).href);

// IDs fixos: mantém os UUIDs das atividades já publicadas no banco
const ACTIVITY_UUIDS = {
  'act-air-01': 'a1111111-1111-4111-8111-111111111101',
  'act-air-02': 'a1111111-1111-4111-8111-111111111102',
  'act-air-03': 'a1111111-1111-4111-8111-111111111103',
  'act-air-04': 'a1111111-1111-4111-8111-111111111104',
  'act-hot-05': 'b2222222-2222-4222-8222-222222222205',
  'act-hot-06': 'b2222222-2222-4222-8222-222222222206',
  'act-hot-07': 'b2222222-2222-4222-8222-222222222207',
  'act-hot-08': 'b2222222-2222-4222-8222-222222222208',
  'act-res-09': 'c3333333-3333-4333-8333-333333333309',
  'act-res-10': 'c3333333-3333-4333-8333-333333333310',
  'act-res-11': 'c3333333-3333-4333-8333-333333333311',
  'act-res-12': 'c3333333-3333-4333-8333-333333333312',
};

// Atividades novas: UUID fixo derivado do id, para o seed não duplicar ao rodar de novo
const activityUuid = (id) => {
  if (ACTIVITY_UUIDS[id]) return ACTIVITY_UUIDS[id];
  const h = crypto.createHash('sha1').update(`activity:${id}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const q = (v) => (v === undefined || v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `ARRAY[${a.map(q).join(', ')}]::text[]` : `'{}'::text[]`);
const json = (v) => (v ? `${q(JSON.stringify(v))}::jsonb` : 'NULL');

const activityRows = [];
const questionRows = [];
const questionIds = [];
let questionIndex = 0;

for (const act of INITIAL_ACTIVITIES) {
  const actId = activityUuid(act.id);
  activityRows.push(
    `  (${q(actId)}, 1, ${q(act.title)}, ${q(act.description)}, ${q(act.category)}, ${q(act.modality)}, ${q(act.level)}, ${act.estimatedMinutes}, ${act.isPublished}, ${q(act.createdAt)})`
  );
  act.questions.forEach((question, i) => {
    questionIndex += 1;
    const qId = `d0000000-0000-4000-8000-${questionIndex.toString(16).padStart(12, '0')}`;
    questionIds.push(q(qId));
    questionRows.push(
      `  (${q(qId)}, ${q(actId)}, ${q(question.type)}, ${q(question.promptPt)}, ${q(question.promptEn)}, ${q(question.audioPhraseEn)}, ${json(question.options)}, ${q(question.correctOptionId)}, ${q(question.expectedAnswer)}, ${arr(question.acceptedVariations)}, ${arr(question.scrambledWords)}, ${q(question.explanationPt)}, ${i + 1})`
    );
  });
}

const activityIds = INITIAL_ACTIVITIES.map((a) => q(activityUuid(a.id))).join(', ');

const sql = `-- SEED DE DADOS INICIAIS: ${activityRows.length} ATIVIDADES E ${questionRows.length} QUESTÕES (PostgreSQL / Supabase)
-- Inglês Fácil: Básico 1 a 3 (Connectivity 1) e Intermediário (Basic Grammar in Use)
-- ARQUIVO GERADO por scripts/generate-seed.mjs a partir de src/services/storage/initialData.ts — não edite à mão.
-- Pode ser executado várias vezes: atualiza o conteúdo sem duplicar questões.

BEGIN;

INSERT INTO public.activities (id, version, title, description, category, modality, level, estimated_minutes, is_published, created_at)
VALUES
${activityRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  modality = EXCLUDED.modality,
  level = EXCLUDED.level,
  estimated_minutes = EXCLUDED.estimated_minutes,
  created_at = EXCLUDED.created_at,
  updated_at = timezone('utc'::text, now());

-- Remove questões antigas (sem ID fixo) das atividades do seed
DELETE FROM public.questions
WHERE activity_id IN (${activityIds})
  AND id NOT IN (${questionIds.join(', ')});

INSERT INTO public.questions (id, activity_id, type, prompt_pt, prompt_en, audio_phrase_en, options, correct_option_id, expected_answer, accepted_variations, scrambled_words, explanation_pt, sort_order)
VALUES
${questionRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  prompt_pt = EXCLUDED.prompt_pt,
  prompt_en = EXCLUDED.prompt_en,
  audio_phrase_en = EXCLUDED.audio_phrase_en,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  expected_answer = EXCLUDED.expected_answer,
  accepted_variations = EXCLUDED.accepted_variations,
  scrambled_words = EXCLUDED.scrambled_words,
  explanation_pt = EXCLUDED.explanation_pt,
  sort_order = EXCLUDED.sort_order;

COMMIT;

-- Conferência
SELECT a.title, a.is_published, count(q.id) AS questoes
FROM public.activities a LEFT JOIN public.questions q ON q.activity_id = a.id
GROUP BY a.id, a.title, a.is_published ORDER BY a.id;
`;

fs.writeFileSync(path.join(root, 'database/seed.sql'), sql);
console.log(`seed.sql gerado: ${activityRows.length} atividades, ${questionRows.length} questões`);
