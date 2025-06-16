import { sendToSpring } from "../infrastructure/websocket/stompClient.js";
import { saveReport } from "../infrastructure/persistence/saveReport.js";
import { v4 as uuidv4 } from "uuid";
import { AlertSession } from "../domain/models/AlertSession.js";

const activeAlerts = new Map();

export async function processGasMessage(json, publishReport) {
  const { deviceId, status, ppm, protocols } = json;
  const now = Date.now();
  const value = Number((ppm * 71).toFixed(2));

  json.timestamp = new Date(now).toISOString();

  if (status === "ALERT" || status === "WARNING") {
    if (!activeAlerts.has(deviceId)) {
      activeAlerts.set(deviceId, new AlertSession(now, value, protocols));
    } else {
      const session = activeAlerts.get(deviceId);
      session.updateLevel(value);
      session.updateProtocols(protocols);
    }
  }

  if (status === "NORMAL" && activeAlerts.has(deviceId)) {
    const session = activeAlerts.get(deviceId);
    const { minutes, seconds } = session.getDuration(now);

    const report = {
      reportId: uuidv4(),
      date: new Date().toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
      time: new Date().toLocaleTimeString("es-PE", {
        timeZone: "America/Lima",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      }),
      deviceId,
      gasLevel: session.peakGasLevel,
      duration: `${minutes}:${seconds}`,
      actions: session.protocols,
      resolved: true
    };

    const reportToStore = {
      ...report,
      actions: report.actions.map(code => {
        switch (code) {
          case 1: return "Windows Opened";
          case 2: return "Power Supply Shut Off";
          case 3: return "Alert sent to emergency contacts";
          default: return "Unknown";
        }
      })
    };

    await saveReport(reportToStore);
    publishReport(report);

    activeAlerts.delete(deviceId);
  }

  sendToSpring(json);
}
