import mqtt from "mqtt";

const testPublish = (topic, value) => {
    const options = {
        clientId: 'Datatlogger',
        username: 'kythuat',
        password: '123!@#',
    };

    let client = mqtt.connect("mqtt://serverkythuat.pingddns.net:1883", options);

    client.on("connect", () => {
        client.subscribe("presence", (err) => {
            if (!err) {
                client.publish(topic, value);
            }
        });
    });

    client.on("message", (topic, message) => {
        // message is Buffer
        console.log(message.toString());
        client.end();
    });
}

export default testPublish;
