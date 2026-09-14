import type { DbDriver } from '../src/services/db/driver';
import { createNodeDriver } from '../src/services/db/nodeDriver';
import { MIGRATIONS, migrate } from '../src/services/db/migrations';
import {
  countAttempts,
  countIndependentActivities,
  eraseAllProgress,
  getActivityStats,
  getLessonProgress,
  getPreference,
  getGamificationStats,
  recordAttempt,
  saveLessonProgress,
  setPreference,
} from '../src/services/db/repo';

let db: DbDriver;

beforeEach(async () => {
  db = createNodeDriver();
  await migrate(db);
});

afterEach(async () => {
  await db.close();
});

describe('migrações', () => {
  it('aplica todas as migrações até a versão mais recente', async () => {
    const latest = MIGRATIONS[MIGRATIONS.length - 1].version;
    expect(await migrate(db)).toBe(latest);
    await db.all('SELECT id, independent_read FROM attempts');
  });

  it('upgrade v1→v2 preserva tentativas antigas', async () => {
    // Reconstrói um banco parado na v1 com uma tentativa do schema antigo.
    const old = createNodeDriver();
    await old.exec(MIGRATIONS[0].sql);
    await old.exec('PRAGMA user_version = 1');
    await old.run(
      `INSERT INTO attempts (id, activity_id, lesson_id, content_version, selected_option, correct, help_used, hint_level, seq)
       VALUES ('old1', 'a1', 'lesson-01', 'v1', 'x', 1, 0, 0, 1)`,
    );
    expect(await migrate(old)).toBe(2);
    const row = await old.get<{ correct: number; independent_read: number }>('SELECT * FROM attempts WHERE id = ?', ['old1']);
    expect(row?.correct).toBe(1);
    expect(row?.independent_read).toBe(0); // registros antigos não são marcados retroativamente
    await old.close();
  });
});

describe('attempts', () => {
  const base = {
    activityId: 'a1',
    lessonId: 'lesson-01',
    contentVersion: 'v1',
    selectedOption: 'x',
    correct: true,
    helpUsed: 0,
    hintLevel: 0,
    independentRead: true,
  };

  it('registra tentativa com seq incremental', async () => {
    const a = await recordAttempt(db, base);
    const b = await recordAttempt(db, { ...base, correct: false, helpUsed: 2, independentRead: false });
    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
    expect(await countAttempts(db, 'lesson-01')).toBe(2);
  });

  it('persiste independent_read', async () => {
    await recordAttempt(db, base);
    const row = await db.get<{ independent_read: number }>('SELECT independent_read FROM attempts');
    expect(row?.independent_read).toBe(1);
  });
});

describe('estatísticas por atividade', () => {
  const rec = (activityId: string, correct: boolean, independentRead: boolean) => ({
    activityId,
    lessonId: 'l',
    contentVersion: 'v1',
    selectedOption: null,
    correct,
    helpUsed: 0,
    hintLevel: 0,
    independentRead,
  });

  it('getActivityStats agrupa tentativas, erros e leituras independentes', async () => {
    await recordAttempt(db, rec('a1', true, true));
    await recordAttempt(db, rec('a1', false, false));
    await recordAttempt(db, rec('a2', true, false));
    const s = await getActivityStats(db);
    expect(s.get('a1')).toEqual({ attempts: 2, errors: 1, independent: 1 });
    expect(s.get('a2')).toEqual({ attempts: 1, errors: 0, independent: 0 });
  });

  it('countIndependentActivities conta atividades distintas', async () => {
    await recordAttempt(db, rec('a1', true, true));
    await recordAttempt(db, rec('a1', true, true)); // mesma atividade
    await recordAttempt(db, rec('a2', true, true));
    expect(await countIndependentActivities(db)).toBe(2);
  });
});

describe('lesson_progress', () => {
  it('salva e retoma posição', async () => {
    await saveLessonProgress(db, 'lesson-01', 'v1', 'in_progress', 2);
    const p = await getLessonProgress(db, 'lesson-01');
    expect(p?.status).toBe('in_progress');
    expect(p?.activityIndex).toBe(2);
  });

  it('upsert atualiza sem duplicar', async () => {
    await saveLessonProgress(db, 'lesson-01', 'v1', 'in_progress', 1);
    await saveLessonProgress(db, 'lesson-01', 'v1', 'completed', 3);
    const p = await getLessonProgress(db, 'lesson-01');
    expect(p?.status).toBe('completed');
  });
});

describe('preferences', () => {
  it('lê e escreve', async () => {
    expect(await getPreference(db, 'soundOn')).toBeNull();
    await setPreference(db, 'soundOn', '0');
    expect(await getPreference(db, 'soundOn')).toBe('0');
  });
});

describe('eraseAllProgress', () => {
  it('remove attempts, progresso e preferências', async () => {
    await recordAttempt(db, {
      activityId: 'a1',
      lessonId: 'l',
      contentVersion: 'v1',
      selectedOption: null,
      correct: false,
      helpUsed: 0,
      hintLevel: 0,
      independentRead: false,
    });
    await saveLessonProgress(db, 'l', 'v1', 'in_progress', 1);
    await setPreference(db, 'onboarded', '1');
    await eraseAllProgress(db);
    expect(await countAttempts(db, 'l')).toBe(0);
    expect(await getLessonProgress(db, 'l')).toBeNull();
    expect(await getPreference(db, 'onboarded')).toBeNull();
  });
});

describe('getGamificationStats', () => {
  it('calcula métricas de gamificação corretamente', async () => {
    // Inicialmente zerado
    let stats = await getGamificationStats(db);
    expect(stats.completedLessons).toBe(0);
    expect(stats.wordsLearned).toBe(0);

    // Registra uma lição concluída e tentativas
    await saveLessonProgress(db, 'lesson-01', 'v1', 'completed', 3);
    await recordAttempt(db, {
      activityId: 'a1',
      lessonId: 'lesson-01',
      contentVersion: 'v1',
      selectedOption: 'onibus',
      correct: true,
      helpUsed: 0,
      hintLevel: 0,
      independentRead: true,
    });

    stats = await getGamificationStats(db);
    expect(stats.completedLessons).toBe(1);
    expect(stats.wordsLearned).toBeGreaterThan(0);
    expect(stats.stars).toBeGreaterThan(0);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });
});
