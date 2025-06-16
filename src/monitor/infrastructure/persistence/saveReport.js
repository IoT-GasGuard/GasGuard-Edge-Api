import { getDb } from './sqlite.js';

export async function saveReport(report) {
  const db = await getDb();

  await db.run(
    `INSERT INTO reports (date, time, deviceId, gasLevel, duration, actions, resolved)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      report.date,
      report.time,
      report.deviceId,
      report.gasLevel,
      report.duration,
      JSON.stringify(report.actions),
      report.resolved ? 1 : 0
    ]
  );

  console.log("Reporte guardado en SQLite");
}
