import { Query } from 'drizzle-orm';
import { Pool } from 'pg';
import QueryStream from 'pg-query-stream';

export async function* streamQuery<T>(
  pool: Pool,
  query: Query,
  batchSize = 100,
): AsyncGenerator<T> {
  const client = await pool.connect();

  try {
    const stream = client.query(
      new QueryStream(query.sql, query.params, { batchSize }),
    );

    for await (const row of stream) {
      yield row as T;
    }
  } finally {
    client.release();
  }
}
