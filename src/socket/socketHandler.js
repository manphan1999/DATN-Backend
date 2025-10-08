import GatewayHandler from '../gateway/getwayHandler';

let gateway;

; (async () => {
    gateway = new GatewayHandler();
    await gateway.connectAll();
    await gateway.readDataModbus();
})();

const connect = (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    socket.on("CLIENT WRITE TAG", async (payload) => {
        console.log("Nhận yêu cầu ghi:", payload);
        try {
            const result = await gateway.writeDataModbus(payload);
            socket.emit("SERVER WRITE RESULT", result);
        } catch (err) {
            socket.emit("SERVER WRITE RESULT", {
                success: false,
                error: err.message,
            });
        }
    });
};

export default connect;