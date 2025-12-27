import mqtt from "mqtt";

const testPublish = (brokerConfig, topic, message) => {

    const {
        ipAddress,
        port,
        username,
        password,
        controlQoS,
        controlRetain
    } = brokerConfig;

    const options = {
        clientId: `Datalogger_${Date.now()}`,
        username,
        password,
        clean: true,
        reconnectPeriod: 0
    };

    const url = `mqtt://${ipAddress}:${port}`;

    const client = mqtt.connect(url, options);

    client.on("connect", () => {
        client.publish(
            topic,
            message,
            {
                qos: Number(controlQoS),
                retain: controlRetain === true || controlRetain === "true"
            },
            () => {
                client.end();
            }
        );
    });

    client.on("error", (err) => {
        console.error("MQTT publish error:", err.message);
        client.end();
    });
};

export default testPublish;
