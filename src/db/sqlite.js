import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function getDb() {
  const db = await open({
    filename: '/app/data/reports.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      device TEXT,
      gasLevel REAL,
      duration TEXT,
      actions TEXT,
      resolved INTEGER
    )
  `);

  return db;
}
