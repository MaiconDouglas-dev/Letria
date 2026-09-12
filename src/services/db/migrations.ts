import type { DbDriver } from './driver';

/**
 * Migrações versionadas via PRAGMA user_version.
 * Cada entrada roda dentro de transação; nunca editar migrações já publicadas —
 * adicionar novas ao final.
 */
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE attempts (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        selected_option TEXT,
        correct INTEGER NOT NULL,
        help_used INTEGER NOT NULL DEFAULT 0,
        hint_level INTEGER NOT NULL DEFAULT 0,
        seq INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_attempts_lesson ON attempts (lesson_id, seq);

      CREATE TABLE lesson_progress (
        lesson_id TEXT PRIMARY KEY,
        content_version TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
        activity_index INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    // Marca respostas certas dadas sem ajuda que entrega o conteúdo
    // (alvo narrado ou dica) — distingue leitura independente de guiada.
    sql: `
      ALTER TABLE attempts ADD COLUMN independent_read INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX idx_attempts_activity ON attempts (activity_id);
    `,
  },
];

/** Aplica migrações pendentes em transação. Retorna a versão final. */
export async function migrate(db: DbDriver): Promise<number> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    await db.transaction(async () => {
      await db.exec(m.sql);
      await db.exec(`PRAGMA user_version = ${m.version}`);
    });
    current = m.version;
  }
  return current;
}
