import mqtt from "mqtt";
import { handleMqttMessage } from "../../interface/listeners/mqttGasListeners.js"
import { MQTT_TOPICS } from "../config/topics.js";

const brokerUrl = process.env.EDGE_BROKER_URL;
const options = {
  username: process.env.EDGE_BROKER_USERNAME,
  password: process.env.EDGE_BROKER_PASSWORD
}
const topic = MQTT_TOPICS.GAS_INPUT;
const publishReportsTopic = MQTT_TOPICS.REPORT_OUTPUT;

const client = mqtt.connect(brokerUrl, options);

export function publishReport(report) {
  client.publish(publishReportsTopic, JSON.stringify(report), { qos: 1 }, err => {
    if (err) console.error("Error al publicar el reporte:", err);
    else console.log("Reporte publicado:", publishReportsTopic);
  });
}

export function publishLightingCommand(deviceId, automatic, value = 0) {
  const payload = automatic
    ? { auto: 1 }
    : { auto: 0, value: value };

  const topic = `gg/led/${deviceId}/light`;

  client.publish(topic, JSON.stringify(payload), { qos: 1 }, err => {
    if (err) console.error("Error al enviar comando de luz:", err);
    else console.log(`Comando de luz publicado a ${topic}:`, payload);
  });
}

client.on("connect", () => {
  console.log("Conectado a MQTT");
  client.subscribe(topic, err => {
    if (!err) console.log(`Suscrito a: ${topic}`);
  });
});

client.on("message", async (topic, message) => {
  await handleMqttMessage(topic, message, publishReport);
});
