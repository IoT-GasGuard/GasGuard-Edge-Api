import mqtt from "mqtt";
import { sendToSpring } from "./stompClient.js";

const brokerUrl = "mqtt://mosquitto:1883";
const topic = "gg/gas";

const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("Conectado a MQTT");
  client.subscribe(topic, (err) => {
    if (!err) console.log(`Suscrito a: ${topic}`);
  });
});

client.on("message", (topic, message) => {
  const payload = message.toString();
  console.log("Mensaje recibido:", payload);

  try {
    const json = JSON.parse(payload);

    json.deviceId = "ESP32-TEST-001";
    json.timestamp = new Date().toISOString();
    json.status = json.ppm > 1.33 ? "ALERTA" : "NORMAL";

    sendToSpring(json);
  } catch (err) {
    console.error("Error al parsear JSON:", err);
  }
});
