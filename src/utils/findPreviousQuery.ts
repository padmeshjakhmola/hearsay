import { sql } from "drizzle-orm";
import { db } from "../database/drizzle.js";
import { users } from "../database/schema.js";

export async function findMostSimilarQuery(embedding: number[]): Promise<any> {
  const result = await db.execute(
    sql`
          SELECT *, embedding <=> ${sql.raw(
            `'[${embedding.join(",")}]'::vector`
          )} as similarity
          FROM ${users}
          ORDER BY embedding <=> ${sql.raw(
            `'[${embedding.join(",")}]'::vector`
          )}
          LIMIT 1
        `
  );
  return result.rows?.[0] ?? null;
}
