import { processGasMessage } from "../../application/ProcessGasMessage.js";

export async function handleMqttMessage(topic, message, publishReport) {
  try {
    const json = JSON.parse(message.toString());
    await processGasMessage(json, publishReport);
  } catch (err) {
    console.error("Error al procesar mensaje MQTT:", err);
  }
}
