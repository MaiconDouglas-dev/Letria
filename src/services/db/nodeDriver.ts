import type { DbDriver } from './driver';

type NodeStatement = {
  run: (...params: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
};
type NodeDatabase = {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
};

/**
 * Driver de teste sobre node:sqlite (Node >= 22.5) — sem dependências nativas.
 * Usa ':memory:' por padrão para isolamento total entre testes.
 */
export function createNodeDriver(path: string = ':memory:'): DbDriver {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (p: string) => NodeDatabase };
  const db = new DatabaseSync(path);

  return {
    exec: async (sql) => {
      db.exec(sql);
    },
    run: async (sql, params = []) => {
      const r = db.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    all: async (sql, params = []) => db.prepare(sql).all(...params) as never,
    get: async (sql, params = []) => (db.prepare(sql).get(...params) ?? null) as never,
    transaction: async (fn) => {
      db.exec('BEGIN');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    close: async () => {
      db.close();
    },
  };
}
