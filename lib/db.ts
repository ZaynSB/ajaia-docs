import { neon } from "@neondatabase/serverless";

// One HTTP-based Postgres client (works in Vercel serverless functions without a connection pool).
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (see README: create .env.local)");
export const sql = neon(url);

export type User = { id: number; email: string; name: string };
export type Doc = {
  id: string;
  owner_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

// Seeded accounts: auth is mocked, so reviewers can switch user to test sharing.
const SEED_USERS = [
  { email: "alice@ajaia.test", name: "Alice" },
  { email: "bob@ajaia.test", name: "Bob" },
  { email: "carol@ajaia.test", name: "Carol" },
];

let ready: Promise<void> | null = null;

// Idempotent schema + seed, run once per server instance. Keeps setup to zero manual steps.
export function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS document_shares (
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (document_id, user_id))`;
    for (const u of SEED_USERS) {
      await sql`INSERT INTO users (email, name) VALUES (${u.email}, ${u.name}) ON CONFLICT (email) DO NOTHING`;
    }
  })().catch((e) => {
    ready = null; // let the next request retry instead of caching a failure
    throw e;
  });
  return ready;
}
