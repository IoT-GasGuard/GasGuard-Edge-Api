import { Client } from "@stomp/stompjs";
import { WebSocket } from "ws";

const springWsUrl = "ws://ggapispring:8080/ws/monitoring";

const client = new Client({
  brokerURL: springWsUrl,
  webSocketFactory: () => new WebSocket(springWsUrl),
  onConnect: () => console.log("Conectado al backend por STOMP"),
  onStompError: (frame) => console.error("STOMP error", frame),
});

let isConnected = false;
const pendingMessages = [];


client.onConnect = () => {
  console.log("Conectado al backend Spring vía STOMP");
  isConnected = true;

  // Enviar mensajes que estaban en cola
  while (pendingMessages.length > 0) {
    const msg = pendingMessages.shift();
    client.publish(msg);
    console.log("Mensaje reenviado desde cola:", msg.body);
  }
};

client.onStompError = (frame) => {
  console.error("STOMP Error:", frame.headers["message"]);
  console.error("Detalles:", frame.body);
};

client.activate();

export function sendToSpring(data) {
  const message = {
    destination: "/app/gas",
    body: JSON.stringify(data),
  }

  if (!isConnected) {
    console.warn("STOMP aún no conectado, mensaje en cola:", data);
    pendingMessages.push(message);
    return;
  }
  try{
    client.publish(message);
    console.log("Mensaje enviado vía STOMP:", message.body);
  }catch(err){
    console.error("Error al enviar mensaje STOMP:", err.message);
    pendingMessages.push(message);
  }
}
