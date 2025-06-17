export const MQTT_TOPICS = {
  GAS_INPUT: "gg/gas",
  REPORT_OUTPUT: "gg/reports"
};

export const STOMP_TOPICS = {
  SEND_TO_BACKEND: "/app/gas"
};

export const WEBSOCKET = {
  SPRING_URL: process.env.EDGE_WS_URL
};
