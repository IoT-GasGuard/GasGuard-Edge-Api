import mqtt from "mqtt";
import { sendToSpring } from "./stompClient.js";

const brokerUrl = "mqtt://mosquitto:1883";
const topic = "gg/gas";

const client = mqtt.connect(brokerUrl);

const activeAlerts = new Map();

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

    const { deviceId , status, ppm } = json;
    const now = Date.now();

    json.timestamp = new Date(now).toISOString();

    if(status==="ALERT" || status==="WARNING"){
      const value = (ppm*71).toFixed(2)
      if(!activeAlerts.has(deviceId)){
        activeAlerts.set(deviceId,{
          startTime: now,
          peakGasLevel: Number(value),
          protocols: json.protocols
        });
      }else{
        const prevValue = activeAlerts.get(deviceId);

        prevValue.protocols = json.protocols

        const newGasLevel = Number(value);
        if(newGasLevel>prevValue.peakGasLevel){
          prevValue.peakGasLevel = newGasLevel;
        }

        activeAlerts.set(deviceId,prevValue);
      }
    }

    if(status==="NORMAL"){
      if(activeAlerts.has(deviceId)){
        const current = activeAlerts.get(deviceId);

        const protocols = current.protocols;

        const starTime = current.startTime;
        const durationsMs = now - starTime;
        const durationSec = Math.floor(durationsMs/1000);
        const durationMin = Math.floor(durationSec/60);
        const seconds = durationSec % 60;

        const report = {
          date: new Date().toLocaleDateString('es-PE',{timeZone:"America/Lima"}),
          device: deviceId,
          gasLevel: current.peakGasLevel,
          duration: `${durationMin}:${seconds}`,
          actions: protocols,
          resolved: true
        }
        console.log(report);
        
        // save to SQLITE local DB

        // POST to backend

        // -------------

        activeAlerts.delete(deviceId);

      }
    }

    sendToSpring(json);
  } catch (err) {
    console.error("Error al parsear JSON:", err);
  }
});
