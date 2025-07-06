import { Client } from "@stomp/stompjs";
import { WebSocket } from "ws";
import { STOMP_TOPICS, WEBSOCKET } from "../config/topics.js";
import { publishLightingCommand } from "../mqtt/mqttClient.js";

const springWsUrl = WEBSOCKET.SPRING_URL;

const client = new Client({
  brokerURL: springWsUrl,
  webSocketFactory: () => new WebSocket(springWsUrl),
  reconnectDelay: 5000,
});

let isConnected = false;
const pendingMessages = [];

// Envío: gas hacia backend
export function sendToSpring(data) {
  const message = {
    destination: STOMP_TOPICS.SEND_TO_BACKEND,
    body: JSON.stringify(data),
  };

  if (!isConnected) {
    console.warn("STOMP no conectado. Cola temporal:", data);
    pendingMessages.push(message);
    return;
  }

  try {
    client.publish(message);
    console.log("Enviado STOMP:", message.body);
  } catch (err) {
    console.error("Error STOMP publish:", err.message);
    pendingMessages.push(message);
  }
}

// Recepción: control de iluminación desde frontend
function onLightingMessage(message) {
  try {
    const destination = message.headers.destination; // /topic/lighting/device2
    const deviceId = destination.split("/").pop();
    const payload = JSON.parse(message.body);

    const automatic = payload.automatic;
    const value = payload.value ?? 0;

    publishLightingCommand(deviceId, automatic, value);
  } catch (err) {
    console.error("Error procesando mensaje STOMP:", err);
  }
}

// Conexión
client.onConnect = () => {
  console.log("Conectado a backend Spring vía STOMP");
  isConnected = true;

  // Suscripción dinámica a iluminación
  client.subscribe("/topic/lighting/*", onLightingMessage);

  // Reenviar mensajes en cola
  while (pendingMessages.length > 0) {
    const msg = pendingMessages.shift();
    client.publish(msg);
    console.log("Mensaje reenviado desde cola:", msg.body);
  }
};

// Manejo de errores STOMP
client.onStompError = (frame) => {
  console.error("STOMP Error:", frame.headers["message"]);
  console.error("Detalles:", frame.body);
};

client.activate();


// const springWsUrl = WEBSOCKET.SPRING_URL;

// const client = new Client({
//   brokerURL: springWsUrl,
//   webSocketFactory: () => new WebSocket(springWsUrl),
//   onConnect: () => console.log("Conectado al backend por STOMP"),
//   onStompError: (frame) => console.error("STOMP error", frame),
// });

// let isConnected = false;
// const pendingMessages = [];


// client.onConnect = () => {
//   console.log("Conectado al backend Spring vía STOMP");
//   isConnected = true;

//   // Enviar mensajes que estaban en cola
//   while (pendingMessages.length > 0) {
//     const msg = pendingMessages.shift();
//     client.publish(msg);
//     console.log("Mensaje reenviado desde cola:", msg.body);
//   }
// };

// client.onStompError = (frame) => {
//   console.error("STOMP Error:", frame.headers["message"]);
//   console.error("Detalles:", frame.body);
// };

// client.activate();

// export function sendToSpring(data) {
//   const message = {
//     destination: STOMP_TOPICS.SEND_TO_BACKEND,
//     body: JSON.stringify(data),
//   }

//   if (!isConnected) {
//     console.warn("STOMP aún no conectado, mensaje en cola:", data);
//     pendingMessages.push(message);
//     return;
//   }
//   try{
//     client.publish(message);
//     console.log("Mensaje enviado vía STOMP:", message.body);
//   }catch(err){
//     console.error("Error al enviar mensaje STOMP:", err.message);
//     pendingMessages.push(message);
//   }
// }
