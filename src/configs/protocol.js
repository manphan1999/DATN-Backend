const protocol = {
    Protocol: [
        { _id: 1, name: 'Modbus' },
        { _id: 2, name: 'Siemens' },
        { _id: 3, name: 'MQTT Client' },
    ],
    Modbus: [
        { _id: 1, name: 'Modbus RTU Client' },
        { _id: 2, name: 'Modbus TCP Client' },

    ],
    Siemens: [
        { _id: 1, name: 'S7-1200' },
        { _id: 2, name: 'S7-1500' },
    ],
};

const getAllProtocol = () => protocol;

module.exports = { getAllProtocol };