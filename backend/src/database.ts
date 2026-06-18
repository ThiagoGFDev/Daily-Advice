import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema } from './models/types.js'; // Lembrar do .js no nodenext!

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db.json');

// LER O ARQUIVO
export async function readDatabase(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    // SE NÃO EXISTE ELE CRIA
    return { users: [], favorites: [] };
  }
}

// SALVAR OS DADOS
export async function writeDatabase(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}