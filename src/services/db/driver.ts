/**
 * Driver de banco: interface mínima async.
 * Produção usa expo-sqlite (expoDriver); testes usam node:sqlite (nodeDriver).
 */
export interface DbDriver {
  /** Executa SQL sem parâmetros (DDL, PRAGMA). */
  exec(sql: string): Promise<void>;
  /** INSERT/UPDATE/DELETE com parâmetros posicionais. */
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  /** SELECT → todas as linhas. */
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  /** SELECT → primeira linha ou null. */
  get<T>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Executa fn dentro de transação; rollback em caso de erro. */
  transaction(fn: () => Promise<void>): Promise<void>;
  close(): Promise<void>;
}
