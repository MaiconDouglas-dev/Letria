import * as SQLite from 'expo-sqlite';

import type { DbDriver } from './driver';

export const DB_NAME = 'passo-a-palavra.db';

/** Adapta expo-sqlite ao DbDriver. */
export async function openExpoDriver(name: string = DB_NAME): Promise<DbDriver> {
  const db = await SQLite.openDatabaseAsync(name);
  return {
    exec: (sql) => db.execAsync(sql),
    run: async (sql, params = []) => {
      const r = await db.runAsync(sql, params as SQLite.SQLiteBindParams);
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowId };
    },
    all: (sql, params = []) => db.getAllAsync(sql, params as SQLite.SQLiteBindParams) as Promise<never>,
    get: async (sql, params = []) => (await db.getFirstAsync(sql, params as SQLite.SQLiteBindParams)) as never,
    transaction: (fn) => db.withTransactionAsync(fn),
    close: () => db.closeAsync(),
  };
}
