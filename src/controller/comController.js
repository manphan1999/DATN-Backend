import { ComModel } from '../configs/connectDB'

const getAllCom = async () => {
    try {
        const comList = await ComModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'List Com',
            EC: 0,
            DT: comList
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

const updateCom = async (rawData) => {
    try {
        console.log('check rawdata upadate com: ', rawData)
        const { id, baudRate, parity, dataBit, stopBit } = rawData
        if (!id) {
            return {
                EM: `Can't not device`,
                EC: 1,
                DT: ''
            }
        }

        const device = await ComModel.updateAsync(
            {
                _id: id,
            },
            {
                $set: {
                    baudRate: baudRate ? Number(baudRate) : null,
                    parity,
                    dataBit: dataBit ? Number(dataBit) : null,
                    stopBit: stopBit ? Number(stopBit) : null,

                },
            },
            { returnUpdatedDocs: true }
        )

        await ComModel.loadDatabaseAsync()
        return {
            EM: 'Update Com Successfully',
            EC: 0,
            DT: device
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }

}

module.exports = { getAllCom, updateCom }