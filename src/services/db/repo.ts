import type { DbDriver } from './driver';

export interface AttemptRecord {
  id: string;
  activityId: string;
  lessonId: string;
  contentVersion: string;
  selectedOption: string | null;
  correct: boolean;
  /** Quantidade de ajuda usada (repetições de instrução, áudio de opções, dicas). */
  helpUsed: number;
  hintLevel: number;
  /** true = resposta certa sem alvo narrado e sem dicas (leitura/resposta independente). */
  independentRead: boolean;
  seq: number;
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  lessonId: string;
  contentVersion: string;
  status: LessonStatus;
  activityIndex: number;
  updatedAt: string;
}

/** Id local único o suficiente para registros offline (não é uuid global). */
function localId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function nextSeq(db: DbDriver, lessonId: string): Promise<number> {
  const row = await db.get<{ m: number | null }>('SELECT MAX(seq) AS m FROM attempts WHERE lesson_id = ?', [lessonId]);
  return (row?.m ?? 0) + 1;
}

export async function recordAttempt(db: DbDriver, a: Omit<AttemptRecord, 'id' | 'seq'>): Promise<AttemptRecord> {
  const rec: AttemptRecord = { ...a, id: localId(), seq: await nextSeq(db, a.lessonId) };
  await db.run(
    `INSERT INTO attempts (id, activity_id, lesson_id, content_version, selected_option, correct, help_used, hint_level, independent_read, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [rec.id, rec.activityId, rec.lessonId, rec.contentVersion, rec.selectedOption, rec.correct ? 1 : 0, rec.helpUsed, rec.hintLevel, rec.independentRead ? 1 : 0, rec.seq],
  );
  return rec;
}

/** Estatísticas por atividade — base da seleção de revisão. */
export interface ActivityStats {
  attempts: number;
  errors: number;
  /** Respostas certas com independent_read = 1. */
  independent: number;
}

export async function getActivityStats(db: DbDriver): Promise<Map<string, ActivityStats>> {
  const rows = await db.all<{ activity_id: string; attempts: number; errors: number; independent: number }>(
    `SELECT activity_id,
            COUNT(*) AS attempts,
            SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS errors,
            SUM(CASE WHEN independent_read = 1 THEN 1 ELSE 0 END) AS independent
     FROM attempts GROUP BY activity_id`,
  );
  return new Map(rows.map((r) => [r.activity_id, { attempts: r.attempts, errors: r.errors, independent: r.independent }]));
}

/** Atividades distintas respondidas de forma independente — para a tela de progresso. */
export async function countIndependentActivities(db: DbDriver): Promise<number> {
  const row = await db.get<{ n: number }>('SELECT COUNT(DISTINCT activity_id) AS n FROM attempts WHERE independent_read = 1');
  return row?.n ?? 0;
}

export async function getLessonProgress(db: DbDriver, lessonId: string): Promise<LessonProgress | null> {
  const row = await db.get<{
    lesson_id: string;
    content_version: string;
    status: LessonStatus;
    activity_index: number;
    updated_at: string;
  }>('SELECT * FROM lesson_progress WHERE lesson_id = ?', [lessonId]);
  if (!row) return null;
  return {
    lessonId: row.lesson_id,
    contentVersion: row.content_version,
    status: row.status,
    activityIndex: row.activity_index,
    updatedAt: row.updated_at,
  };
}

/** Salva progresso por posição real de atividade — não por abertura de tela. */
export async function saveLessonProgress(
  db: DbDriver,
  lessonId: string,
  contentVersion: string,
  status: LessonStatus,
  activityIndex: number,
): Promise<void> {
  await db.run(
    `INSERT INTO lesson_progress (lesson_id, content_version, status, activity_index, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(lesson_id) DO UPDATE SET
       content_version = excluded.content_version,
       status = excluded.status,
       activity_index = excluded.activity_index,
       updated_at = excluded.updated_at`,
    [lessonId, contentVersion, status, activityIndex],
  );
}

/** Progresso de todas as lições — para escolher a próxima a continuar. */
export async function getAllLessonProgress(db: DbDriver): Promise<Map<string, LessonProgress>> {
  const rows = await db.all<{
    lesson_id: string;
    content_version: string;
    status: LessonStatus;
    activity_index: number;
    updated_at: string;
  }>('SELECT * FROM lesson_progress');
  return new Map(
    rows.map((r) => [
      r.lesson_id,
      { lessonId: r.lesson_id, contentVersion: r.content_version, status: r.status, activityIndex: r.activity_index, updatedAt: r.updated_at },
    ]),
  );
}

export async function getPreference(db: DbDriver, key: string): Promise<string | null> {
  const row = await db.get<{ value: string }>('SELECT value FROM preferences WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setPreference(db: DbDriver, key: string, value: string): Promise<void> {
  await db.run('INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

export async function countAttempts(db: DbDriver, lessonId: string): Promise<number> {
  const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM attempts WHERE lesson_id = ?', [lessonId]);
  return row?.n ?? 0;
}

export interface GamificationStats {
  streakDays: number;
  wordsLearned: number;
  stars: number;
  completedLessons: number;
}

/** Retorna as métricas de gamificação para o cabeçalho e tela de conquistas */
export async function getGamificationStats(db: DbDriver): Promise<GamificationStats> {
  // Lições concluídas
  const completedRow = await db.get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM lesson_progress WHERE status = 'completed'"
  );
  const completedLessons = completedRow?.n ?? 0;

  // Atividades respondidas corretamente de forma independente
  const correctRow = await db.get<{ n: number }>(
    'SELECT COUNT(DISTINCT activity_id) AS n FROM attempts WHERE correct = 1'
  );
  const correctActivities = correctRow?.n ?? 0;

  // Palavras aprendidas: cada atividade concluída ensina palavras reais
  const wordsLearned = Math.max(correctActivities, completedLessons * 4);

  // Estrelas: 3 por lição concluída + 1 por atividade independente
  const stars = completedLessons * 3 + Math.floor(correctActivities / 2);

  // Cálculo de dias ativos consecutivos (ofensiva sem culpa)
  const daysRows = await db.all<{ d: string }>(
    "SELECT DISTINCT strftime('%Y-%m-%d', created_at) AS d FROM attempts ORDER BY d DESC"
  );
  let streak = 0;
  if (daysRows.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const firstDay = daysRows[0].d;

    // Se praticou hoje ou ontem, a sequência está viva
    if (firstDay === today || firstDay === yesterday) {
      streak = daysRows.length;
    }
  }

  return {
    streakDays: streak,
    wordsLearned,
    stars,
    completedLessons,
  };
}

/**
 * Apaga todo o progresso local (attempts + progresso + preferências).
 * Usado por "Apagar meu progresso" — exige confirmação dupla na UI.
 */
export async function eraseAllProgress(db: DbDriver): Promise<void> {
  await db.transaction(async () => {
    await db.run('DELETE FROM attempts');
    await db.run('DELETE FROM lesson_progress');
    await db.run('DELETE FROM preferences');
  });
}
