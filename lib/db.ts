// lib/db.ts
// Database client abstraction using @vercel/postgres
// Swap this out with a full ORM (e.g. Prisma) if needed later

import { sql } from '@vercel/postgres';
export { sql };

/**
 * Helper to safely query – returns rows or throws a clean error.
 */
export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await sql<T>(strings as TemplateStringsArray, ...(values as Parameters<typeof sql>[1][]));
  return result.rows;
}
