import { DataType, newDb } from "pg-mem";
import { applyMigrations, MIGRATIONS, type Queryable } from "./db.js";

function preserveBinaryParameters(target: Queryable): Queryable & { end: () => Promise<void> } {
  const wrapped: Queryable & { end: () => Promise<void> } = {
    query: (text, params) => {
      let sql = text;
      const values = params?.map((value, index) => {
        if (!Buffer.isBuffer(value)) return value;
        const position = index + 1;
        sql = sql.replace(new RegExp(`\\$${position}(?!\\d)`, "g"), `decode($${position}, 'base64')`);
        return value.toString("base64");
      });
      return target.query(sql, values);
    },
    end: async () => {
      await (target as Queryable & { end?: () => Promise<void> }).end?.();
    },
  };
  if (target.connect) {
    wrapped.connect = async () => preserveBinaryParameters(await target.connect!());
  }
  if (target.release) wrapped.release = () => target.release!();
  return wrapped;
}

/** Ephemeral local database for UI and bot smoke testing without PostgreSQL. */
export async function createDevMemoryPool(): Promise<Queryable & { end: () => Promise<void> }> {
  const memory = newDb();
  memory.public.registerFunction({
    name: "decode",
    args: [DataType.text, DataType.text],
    returns: DataType.bytea,
    implementation: (value: string, encoding: string) => {
      if (encoding !== "base64") throw new Error("unsupported decode encoding");
      return Buffer.from(value, "base64");
    },
  });
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  await applyMigrations(pool, MIGRATIONS);
  return preserveBinaryParameters(pool);
}
