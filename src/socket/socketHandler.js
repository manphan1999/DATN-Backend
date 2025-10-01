import GatewayHandler from '../gateway/getwayHandler'
let gateway

    ; (async () => {
        gateway = new GatewayHandler()
        await gateway.connectAll()
        await gateway.readData()
    })()

const connect = (socket) => {
    console.log("Client connected:", socket.id)

    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnect')
    })
}

export default connect
