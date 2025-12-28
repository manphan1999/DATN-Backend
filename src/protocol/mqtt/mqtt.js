import mqtt from "mqtt";

const mqttClients = new Map(); // brokerId -> client

export const getMqttClient = (broker) => {
    const brokerId = broker._id;

    if (mqttClients.has(brokerId)) {
        return mqttClients.get(brokerId);
    }

    const url = `mqtt://${broker.ipAddress}:${broker.port}`;

    const client = mqtt.connect(url, {
        clientId: `Datalogger_${brokerId}`,
        username: broker.username,
        password: broker.password,
        clean: false,
        keepalive: 60,
        reconnectPeriod: 5000
    });

    client.on("connect", () => {
        console.log(`[MQTT] Connected: ${broker.ipAddress}:${broker.port}`);
    });

    client.on("reconnect", () => {
        console.log(`[MQTT] Reconnecting: ${broker.ipAddress}`);
    });

    client.on("error", (err) => {
        console.error(`[MQTT] Error ${broker.ipAddress}:`, err.message);
    });

    mqttClients.set(brokerId, client);
    return client;
};

export const publishMQTT = (broker, topic, message) => {
    const client = getMqttClient(broker);

    if (!client.connected) {
        console.warn(`[MQTT] Not connected yet: ${broker.ipAddress}`);
        return;
    }

    client.publish(topic, message, {
        qos: Number(broker.controlQoS),
        retain: broker.controlRetain === true || broker.controlRetain === "true"
    });
};
