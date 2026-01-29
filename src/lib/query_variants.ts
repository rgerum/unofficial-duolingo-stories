// Note: This file is DEPRECATED legacy code with MySQL-style queries.
// The codebase now uses PostgreSQL with the `sql` tagged template literal.
// These functions are not compatible with the current database setup.
// Keeping for reference only - do not use.

interface DataWithId {
  id: number;
  [key: string]: unknown;
}

export async function update_query(
  _table_name: string,
  _data: DataWithId,
): Promise<unknown> {
  throw new Error(
    "DEPRECATED: update_query uses MySQL syntax and is not compatible with postgres.js",
  );
}

export async function insert_query(
  _table_name: string,
  _data: Record<string, unknown>,
): Promise<number> {
  throw new Error(
    "DEPRECATED: insert_query uses MySQL syntax and is not compatible with postgres.js",
  );
}
