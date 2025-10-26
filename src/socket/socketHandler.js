import GatewayHandler from '../gateway/getwayHandler';

let gateway;

; (async () => {
    gateway = new GatewayHandler();
    await gateway.connectAll();
    await gateway.readDataModbus();
    gateway.saveDataToDb();
})();

const connect = (socket) => {
    //console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    socket.on("CLIENT WRITE TAG", async (payload) => {
        try {
            const result = await gateway.writeDataModbus(payload);
            socket.emit("SERVER WRITE RESULT", result);
        } catch (err) {
        }
    });

    socket.on("CREATE TAG", async () => {
        console.log("CREATE TAG");
        await gateway.connectAll();
    });

    socket.on("CHANGE HISTORICAL TYPE", async () => {
        await gateway.saveDataToDb();
    });

};

export default connect;