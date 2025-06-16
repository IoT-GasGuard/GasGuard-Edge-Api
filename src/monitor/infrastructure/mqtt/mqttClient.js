import mqtt from "mqtt";
import { handleMqttMessage } from "../../interface/listeners/mqttGasListeners.js"
import { MQTT_TOPICS } from "../config/topics.js";

const brokerUrl = "mqtt://mosquitto:1883";
const topic = MQTT_TOPICS.GAS_INPUT;
const publishReportsTopic = MQTT_TOPICS.REPORT_OUTPUT;

const client = mqtt.connect(brokerUrl);

export function publishReport(report) {
  client.publish(publishReportsTopic, JSON.stringify(report), { qos: 1 }, err => {
    if (err) console.error("Error al publicar el reporte:", err);
    else console.log("Reporte publicado:", publishReportsTopic);
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
