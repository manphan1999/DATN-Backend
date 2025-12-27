import mqtt from "mqtt";

class MQTTClient {
    constructor() {
        this.client = null;
        this.subCallbacks = {};
    }

    connect() {
        if (this.client) return;

        const options = {
            clientId: `Datalogger_${require('os').hostname()}_${process.pid}`,
            username: 'kythuat',
            password: '123!@#',
            clean: false,
            reconnectPeriod: 3000,
            keepalive: 60
        };

        this.client = mqtt.connect(
            "mqtt://serverkythuat.pingddns.net:1883",
            options
        );

        this.client.on('connect', () => {
            // console.log('[MQTT] Connected');
        });

        this.client.on('reconnect', () => {
            //console.log('[MQTT] Reconnecting...');
        });

        this.client.on('error', (err) => {
            // console.error('[MQTT] Error:', err.code, err.message);
        });

        this.client.on('close', () => {
            // console.warn('[MQTT] Connection closed');
        });

        this.client.on('offline', () => {
            // console.warn('[MQTT] Offline');
        });

        this.client.on('message', (topic, message) => {
            const payload = message.toString();
            if (this.subCallbacks[topic]) {
                this.subCallbacks[topic](payload);
            }
        });
    }

    /**
     * PUBLISH
     */
    publish(topic, payload, qos = 0, retain = false) {
        if (!this.client || !this.client.connected) return;

        this.client.publish(topic, String(payload), { qos, retain });
    }

    /**
     * SUBSCRIBE
     */
    subscribe(topic, qos = 0, callback = null) {
        if (!this.client) this.connect();

        this.client.subscribe(topic, { qos }, (err) => {
            if (err) {
                console.error('[MQTT] Subscribe error:', err);
            } else {
                console.log(`[MQTT] Subscribed: ${topic}`);
                if (callback) {
                    this.subCallbacks[topic] = callback;
                }
            }
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
        }
    }
}

export default new MQTTClient();
