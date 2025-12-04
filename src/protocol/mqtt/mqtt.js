import mqtt from 'mqtt';
import { DeviceModel } from '../../configs/connectDB';

class MQTTManager {
    constructor() {
        this.clients = new Map();
        this.reconnectTimers = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = new Map();
    }

    async connectAllMQTTClients() {
        try {
            const devices = await DeviceModel.findAsync({ driverName: 'MQTT Client' });

            if (devices.length === 0) {
                return [];
            }
            const connectionPromises = devices.map(device =>
                this.connectMQTTClient(device._id)  // Kết nối từng device
            );

            // Chờ tất cả kết nối hoàn thành (thành công hoặc thất bại)
            const results = await Promise.allSettled(connectionPromises);

            // Thống kê kết quả
            const successfulConnections = results.filter(r => r.status === 'fulfilled').length;
            const failedConnections = results.filter(r => r.status === 'rejected').length;

            console.log(`Kết nối MQTT hoàn tất: ${successfulConnections} thành công, ${failedConnections} thất bại`);

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Kết nối thất bại với ${devices[index].name}:`, result.reason.message);
                }
            });

            return results;

        } catch (error) {
            return [];
        }
    }

    async connectMQTTClient(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId, driverName: 'MQTT Client' });

            if (!device) {
                throw new Error(`Không tìm thấy MQTT device với ID: ${deviceId}`);
            }

            if (!device.ipAddress) {
                throw new Error('IP Address là bắt buộc');
            }

            if (this.clients.has(deviceId)) {
                await this.disconnectClient(deviceId);
            }

            const port = device.port || (device.ssl ? 8883 : 1883);
            const protocol = device.ssl ? 'mqtts' : 'mqtt';
            const brokerUrl = `${protocol}://${device.ipAddress}:${port}`;

            const options = {
                clientId: device.clientId || `mqtt_${deviceId}_${Math.random().toString(16).substr(2, 8)}`,
                keepalive: device.keepalive || 60,
                clean: device.cleanSession !== false,
                reconnectPeriod: 1000,
                connectTimeout: device.connectTimeout || 30 * 1000,
                username: device.username || undefined,
                password: device.password || undefined,
                rejectUnauthorized: device.rejectUnauthorized !== false
            };

            // Tạo kết nối mới
            const client = mqtt.connect(brokerUrl, options);

            // Lưu thông tin client
            this.clients.set(deviceId, {
                client,
                isConnected: false,
                subscriptions: new Map(),
                options,
                device: device
            });

            this.reconnectAttempts.set(deviceId, 0);

            // Đợi kết nối thành công hoặc thất bại
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this._cleanupClient(deviceId);
                    reject(new Error(`Timeout khi kết nối đến MQTT broker: ${device.name}`));
                }, options.connectTimeout);

                client.on('connect', (connack) => {
                    clearTimeout(timeout);
                    const clientInfo = this.clients.get(deviceId);
                    if (clientInfo) {
                        clientInfo.isConnected = true;
                    }
                    this.reconnectAttempts.set(deviceId, 0);

                    console.log(`MQTT đã kết nối thành công: ${device.name}`);

                    // Đăng ký lại các subscription nếu có
                    this._resubscribeAll(deviceId);
                    resolve({
                        deviceId,
                        deviceName: device.name,
                        connack
                    });
                });

                client.on('error', (err) => {
                    clearTimeout(timeout);
                    console.error(`MQTT lỗi kết nối (${device.name}):`, err.message);
                    this._handleConnectionError(deviceId, err);
                    reject(err);
                });

                client.on('offline', () => {
                    const clientInfo = this.clients.get(deviceId);
                    if (clientInfo) {
                        clientInfo.isConnected = false;
                    }
                    console.log(`MQTT offline: ${device.name}`);
                });

                client.on('close', () => {
                    const clientInfo = this.clients.get(deviceId);
                    if (clientInfo) {
                        clientInfo.isConnected = false;
                    }
                    console.log(`MQTT đã ngắt kết nối: ${device.name}`);
                });

                client.on('reconnect', () => {
                    console.log(`MQTT đang reconnect: ${device.name}`);
                });

                // Xử lý tin nhắn đến
                client.on('message', (topic, message, packet) => {
                    this._handleMessage(deviceId, topic, message, packet);
                });
            });

        } catch (error) {
            console.error(`Lỗi khi kết nối MQTT client ${deviceId}:`, error.message);
            throw error;
        }
    }

    _handleConnectionError(deviceId, error) {
        const clientInfo = this.clients.get(deviceId);
        if (!clientInfo) return;

        clientInfo.isConnected = false;

        const attempts = this.reconnectAttempts.get(deviceId) || 0;

        if (attempts < this.maxReconnectAttempts) {
            const nextAttempt = attempts + 1;
            this.reconnectAttempts.set(deviceId, nextAttempt);

            const delay = Math.min(1000 * Math.pow(2, attempts), 30000);

            const timer = setTimeout(() => {
                this.connectMQTTClient(deviceId).catch(err => {
                    console.error(`Reconnect thất bại cho ${clientInfo.device.name}:`, err.message);
                });
            }, delay);

            this.reconnectTimers.set(deviceId, timer);
        } else {
            this._cleanupClient(deviceId);
        }
    }

    _cleanupClient(deviceId) {
        if (this.reconnectTimers.has(deviceId)) {
            clearTimeout(this.reconnectTimers.get(deviceId));
            this.reconnectTimers.delete(deviceId);
        }

        this.reconnectAttempts.delete(deviceId);
        this.clients.delete(deviceId);
    }

    async publish(deviceId, topic, data, qos = 0, retain = false) {
        try {
            const clientInfo = this.clients.get(deviceId);
            if (!clientInfo || !clientInfo.isConnected) {
                throw new Error(`MQTT client ${deviceId} chưa kết nối`);
            }

            if (!topic) throw new Error('Topic là bắt buộc');

            // CHỈNH SỬA PHẦN NÀY
            let payload;
            if (Buffer.isBuffer(data)) {
                payload = data;
            } else if (typeof data === 'object') {
                payload = Buffer.from(JSON.stringify(data), 'utf8');
            } else {
                // Luôn chuyển đổi thành string rồi thành Buffer
                payload = Buffer.from(String(data), 'utf8');
            }

            return new Promise((resolve, reject) => {
                clientInfo.client.publish(topic, payload, { qos, retain }, (err, packet) => {
                    if (err) {
                        console.error(`Lỗi publish ${clientInfo.device.name}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`Đã publish đến ${clientInfo.device.name} topic "${topic}":`,
                            typeof data === 'object' ? JSON.stringify(data) : String(data));
                        resolve(packet);
                    }
                });
            });
        } catch (error) {
            console.error(`Lỗi publish đến ${deviceId}:`, error.message);
            throw error;
        }
    }

    async publishToAll(topic, data, qos = 0, retain = false) {
        const results = [];
        for (const [deviceId, clientInfo] of this.clients.entries()) {
            if (clientInfo.isConnected) {
                try {
                    const result = await this.publish(deviceId, topic, data, qos, retain);
                    results.push({ deviceId, deviceName: clientInfo.device.name, success: true, result });
                } catch (error) {
                    results.push({ deviceId, deviceName: clientInfo.device.name, success: false, error: error.message });
                }
            }
        }
        return results;
    }


    /**
     * Subscribe một topic trên broker cụ thể
     */
    async subscribe(deviceId, topics, callback, qos = 0, parseJson = true) {
        try {
            const clientInfo = this.clients.get(deviceId);
            if (!clientInfo || !clientInfo.isConnected) {
                throw new Error(`MQTT client ${deviceId} chưa kết nối`);
            }

            if (!topics) {
                throw new Error('Topic là bắt buộc');
            }

            if (typeof callback !== 'function') {
                throw new Error('Callback phải là một function');
            }

            // Chuyển single topic thành array
            const topicArray = Array.isArray(topics) ? topics : [topics];

            // Subscribe các topics
            return new Promise((resolve, reject) => {
                clientInfo.client.subscribe(topicArray, { qos }, (err, granted) => {
                    if (err) {
                        console.error(`Lỗi khi subscribe trên ${clientInfo.device.name}:`, err.message);
                        reject(err);
                    } else {
                        // Lưu callback cho mỗi topic
                        topicArray.forEach((topic) => {
                            clientInfo.subscriptions.set(topic, {
                                callback,
                                parseJson,
                                qos
                            });
                        });

                        console.log(`Đã subscribe thành công trên ${clientInfo.device.name}:`);
                        granted.forEach(g => {
                            console.log(`  - Topic: ${g.topic}, QoS: ${g.qos}`);
                        });
                        resolve(granted);
                    }
                });
            });

        } catch (error) {
            console.error(`Lỗi subscribe trên ${deviceId}:`, error.message);
            throw error;
        }
    }

    /**
     * Subscribe cùng topic trên tất cả brokers
     */
    async subscribeAll(topics, callback, qos = 0, parseJson = true) {
        const results = [];

        for (const [deviceId, clientInfo] of this.clients.entries()) {
            if (clientInfo.isConnected) {
                try {
                    const result = await this.subscribe(deviceId, topics, callback, qos, parseJson);
                    results.push({
                        deviceId,
                        deviceName: clientInfo.device.name,
                        success: true,
                        result
                    });
                } catch (error) {
                    results.push({
                        deviceId,
                        deviceName: clientInfo.device.name,
                        success: false,
                        error: error.message
                    });
                }
            }
        }

        return results;
    }

    /**
     * Unsubscribe khỏi topic
     */
    async unsubscribe(deviceId, topics) {
        try {
            const clientInfo = this.clients.get(deviceId);
            if (!clientInfo || !clientInfo.isConnected) {
                throw new Error(`MQTT client ${deviceId} chưa kết nối`);
            }

            const topicArray = Array.isArray(topics) ? topics : [topics];

            return new Promise((resolve, reject) => {
                clientInfo.client.unsubscribe(topicArray, (err) => {
                    if (err) {
                        console.error(`Lỗi khi unsubscribe trên ${clientInfo.device.name}:`, err.message);
                        reject(err);
                    } else {
                        // Xóa callbacks
                        topicArray.forEach(topic => {
                            clientInfo.subscriptions.delete(topic);
                        });
                        console.log(`Đã unsubscribe trên ${clientInfo.device.name}:`, topicArray);
                        resolve(true);
                    }
                });
            });

        } catch (error) {
            console.error(`Lỗi unsubscribe trên ${deviceId}:`, error.message);
            throw error;
        }
    }

    /**
     * Ngắt kết nối MQTT client cụ thể
     */
    async disconnectClient(deviceId) {
        const clientInfo = this.clients.get(deviceId);
        if (clientInfo) {
            return new Promise((resolve, reject) => {
                clientInfo.client.end(false, (err) => {
                    if (err) {
                        console.error(`Lỗi khi ngắt kết nối ${clientInfo.device.name}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`Đã ngắt kết nối MQTT: ${clientInfo.device.name}`);
                        this._cleanupClient(deviceId);
                        resolve();
                    }
                });
            });
        }
        return Promise.resolve();
    }

    /**
     * Ngắt kết nối tất cả clients
     */
    async disconnectAll() {
        const disconnectPromises = [];

        for (const [deviceId] of this.clients.entries()) {
            disconnectPromises.push(this.disconnectClient(deviceId));
        }

        await Promise.allSettled(disconnectPromises);
        console.log('Đã ngắt kết nối tất cả MQTT clients');
    }

    /**
     * Kiểm tra trạng thái kết nối của client
     */
    isClientConnected(deviceId) {
        const clientInfo = this.clients.get(deviceId);
        return clientInfo && clientInfo.isConnected;
    }

    /**
     * Lấy danh sách tất cả clients
     */
    getAllClients() {
        const clients = [];
        for (const [deviceId, clientInfo] of this.clients.entries()) {
            clients.push({
                deviceId,
                deviceName: clientInfo.device.name,
                isConnected: clientInfo.isConnected,
                subscriptions: clientInfo.subscriptions.size,
                options: clientInfo.options
            });
        }
        return clients;
    }

    /**
     * Lấy trạng thái kết nối
     */
    getConnectionStatus() {
        const allClients = this.getAllClients();
        const connectedCount = allClients.filter(c => c.isConnected).length;

        return {
            totalClients: allClients.length,
            connectedClients: connectedCount,
            clients: allClients
        };
    }

    /**
     * Xử lý tin nhắn nhận được (internal)
     */
    _handleMessage(deviceId, topic, message, packet) {
        const clientInfo = this.clients.get(deviceId);
        if (!clientInfo) return;

        console.log(`Nhận MQTT từ ${clientInfo.device.name} topic "${topic}":`, message.toString());

        // Tìm callback handler cho topic
        const subscription = clientInfo.subscriptions.get(topic);

        if (!subscription) {
            console.warn(`Không có handler cho topic: ${topic} trên ${clientInfo.device.name}`);
            return;
        }

        try {
            let data = message.toString();

            // Parse JSON nếu được yêu cầu
            if (subscription.parseJson) {
                try {
                    data = JSON.parse(data);
                } catch (parseErr) {
                    console.error(`Lỗi khi parse JSON từ ${clientInfo.device.name}:`, parseErr.message);
                    console.log('Dữ liệu gốc:', data);
                }
            }

            // Gọi callback với dữ liệu đã xử lý, bao gồm deviceId
            subscription.callback(data, topic, packet, deviceId);

        } catch (error) {
            console.error(`Lỗi khi xử lý message từ ${clientInfo.device.name}:`, error.message);
        }
    }

    /**
     * Đăng ký lại tất cả subscriptions (sau reconnect)
     */
    async _resubscribeAll(deviceId) {
        const clientInfo = this.clients.get(deviceId);
        if (!clientInfo || clientInfo.subscriptions.size === 0) return;

        console.log(`Đang đăng ký lại các subscriptions trên ${clientInfo.device.name}...`);

        const subscriptions = Array.from(clientInfo.subscriptions.entries());
        const subscribePromises = subscriptions.map(([topic, sub]) => {
            return new Promise((resolve) => {
                clientInfo.client.subscribe(topic, { qos: sub.qos }, (err) => {
                    if (err) {
                        console.error(`Lỗi khi resubscribe "${topic}" trên ${clientInfo.device.name}:`, err.message);
                        resolve(false);
                    } else {
                        console.log(`Đã resubscribe trên ${clientInfo.device.name}: ${topic}`);
                        resolve(true);
                    }
                });
            });
        });

        try {
            const results = await Promise.all(subscribePromises);
            const successCount = results.filter(Boolean).length;
            console.log(`Resubscribe hoàn tất trên ${clientInfo.device.name}: ${successCount}/${subscriptions.length} topic thành công`);
        } catch (error) {
            console.error(`Lỗi trong quá trình resubscribe trên ${clientInfo.device.name}:`, error.message);
        }
    }
}

export default MQTTManager;