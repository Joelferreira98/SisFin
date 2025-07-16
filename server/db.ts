import dotenv from "dotenv";
dotenv.config();

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada!");
  console.error("Verifique se o arquivo .env está configurado corretamente.");
  console.error("Execute: node test-env.js para verificar variáveis de ambiente");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

