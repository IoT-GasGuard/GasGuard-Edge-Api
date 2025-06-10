import { Client } from "@stomp/stompjs";
import { WebSocket } from "ws";

const springWsUrl = "ws://ggapispring:8080/ws/monitoring";

const client = new Client({
  brokerURL: springWsUrl,
  connectHeaders: {
    login: "guest",
    passcode: "guest",
  },
  webSocketFactory: () => new WebSocket(springWsUrl),
  onConnect: () => console.log("Conectado al backend por STOMP"),
  onStompError: (frame) => console.error("STOMP error", frame),
});

client.activate();

export function sendToSpring(data) {
  client.publish({
    destination: "/app/gas",
    body: JSON.stringify(data),
  });
}
