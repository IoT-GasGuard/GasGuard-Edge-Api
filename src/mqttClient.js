import mqtt from "mqtt";
import { sendToSpring } from "./stompClient.js";
import { saveReport } from "./db/saveReport.js";
import { v4 as uuidv4 } from "uuid";

const brokerUrl = "mqtt://mosquitto:1883";
const topic = "gg/gas";
const publishReportsTopic = "gg/reports"

const client = mqtt.connect(brokerUrl);

const activeAlerts = new Map();

function publishReport(report) {
  client.publish(publishReportsTopic, JSON.stringify(report), { qos: 1 }, (err) => {
    if (err) {
      console.error("Error al publicar el reporte: ", err);
    } else {
      console.log("Rpeorte publicado en topic:", publishReportsTopic);

    }
  });
}

client.on("connect", () => {
  console.log("Conectado a MQTT");
  client.subscribe(topic, (err) => {
    if (!err) console.log(`Suscrito a: ${topic}`);
  });
});

client.on("message", (topic, message) => {
  (async () => {
    const payload = message.toString();
    console.log("Mensaje recibido:", payload);

    try {
      const json = JSON.parse(payload);

      const { deviceId, status, ppm } = json;
      const now = Date.now();

      json.timestamp = new Date(now).toISOString();

      if (status === "ALERT" || status === "WARNING") {
        const value = (ppm * 71).toFixed(2)
        if (!activeAlerts.has(deviceId)) {
          activeAlerts.set(deviceId, {
            startTime: now,
            peakGasLevel: Number(value),
            protocols: json.protocols
          });
        } else {
          const prevValue = activeAlerts.get(deviceId);

          prevValue.protocols = json.protocols

          const newGasLevel = Number(value);
          if (newGasLevel > prevValue.peakGasLevel) {
            prevValue.peakGasLevel = newGasLevel;
          }

          activeAlerts.set(deviceId, prevValue);
        }
      }

      if (status === "NORMAL" && activeAlerts.has(deviceId)) {

        const current = activeAlerts.get(deviceId);

        const protocols = current.protocols;

        const starTime = current.startTime;
        const durationsMs = now - starTime;
        const durationSec = Math.floor(durationsMs / 1000);
        const durationMin = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;

        const date = new Date().toLocaleDateString('es-PE', { timeZone: "America/Lima" });
        const time = new Date().toLocaleTimeString('es-PE', {
          timeZone: "America/Lima",
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })

        const report = {
          reportId: uuidv4(),
          date: date,
          time: time,
          device: deviceId,
          gasLevel: current.peakGasLevel,
          duration: `${durationMin}:${seconds}`,
          actions: protocols,
          resolved: true
        }

        const reportCopy = { ...report }
        reportCopy.actions = [];

        report.actions.forEach(element => {
          switch (element) {
            case 1:
              reportCopy.actions.push("Windows Opened");
              break;

            case 2:
              reportCopy.actions.push("Power Supply Shut Off");
              break;

            case 3:
              reportCopy.actions.push("Alert sent to emergency contacts");
              break;

            default:
              break;
          }
        });
        // save to SQLITE local DB
        await saveReport(reportCopy);
        // publish to reports topic
        publishReport(report)
        // -------------

        activeAlerts.delete(deviceId);


      }

      sendToSpring(json);
    } catch (err) {
      console.error("Error al parsear JSON:", err);
    }
  })();
});
