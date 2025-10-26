import DeviceController from '../controller/deviceController'
import ComController from '../controller/comController'
import tagNameController from '../controller/tagNameController'
import configHistorical from '../controller/configHistorical.js'
import TagHistorical from '../controller/tagHistorical.js'
import HistoricalValue from '../controller/historicalValueController.js'
import { getAllProtocol } from '../configs/protocol.js';

const handleGetAllProtocol = async (req, res) => {
    try {
        let data = getAllProtocol(); // object protocol

        return res.status(200).json({
            EM: 'Get all protocol successfully',
            EC: 0,
            DT: data,
        });

    } catch (error) {
        console.error("handleGetAllProtocol error:", error);
        return res.status(500).json({
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: '',
        });
    }
};

/* Handle Device */
const handleGetAllDevice = async (req, res) => {
    try {
        let data = await DeviceController.getAllDevice()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleCreateNewDevice = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await DeviceController.createDeviceController(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }

}

const handleUpdateDevice = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await DeviceController.updateDevice(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleDeleteDevice = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await DeviceController.deleteDevice(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

/* Handle COM */
const handleGetAllComs = async (req, res) => {
    try {
        let data = await ComController.getAllCom()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleUpdateCom = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await ComController.updateCom(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

/* Handle Channels */
const handleGetAllChannels = async (req, res) => {
    try {
        let data = await tagNameController.getAllTagName()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleCreateNewTag = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await tagNameController.createTagName(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }

}

const handleUpdateChannel = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await tagNameController.updateTagName(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleDeleteChannel = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await tagNameController.deleteChannel(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleGetDataFormat = async (req, res) => {
    try {
        let data = await tagNameController.getDataFormat()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleGetDataType = async (req, res) => {
    try {
        let data = await tagNameController.getDataType()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleGetFunctionCodeModbus = async (req, res) => {
    try {
        let data = await tagNameController.getFunctionCodeModbus()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

/* Handle Historical */
const handleGetAllHistorical = async (req, res) => {
    try {
        let data = await TagHistorical.getHistorical()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleCreateTagHistorical = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TagHistorical.createHistorical(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }

}

const handleDeleteHistorical = async (req, res) => {
    try {
        // console.log('req.body: ', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TagHistorical.deleteHistorical(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleGetAllConfig = async (req, res) => {
    try {
        let data = await configHistorical.getAllConfig()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleCreateNewConfig = async (req, res) => {
    try {
        // console.log('Check body config Historical:', req.body)
        // if (!req.body) {
        //     return res.status(200).json({
        //         EM: `Không có dữ liệu`,    // Error message
        //         EC: 1,    // Error code
        //         DT: ''
        //     })
        // }

        // let data = await tagNameController.createTagName(req.body)
        // return res.status(200).json({
        //     EM: data.EM,    // Error message
        //     EC: data.EC,    // Error code
        //     DT: data
        // })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }

}

const handleUpdateConfig = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await configHistorical.updateConfig(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleDeleteConfig = async (req, res) => {
    // try {
    //     if (!req.body) {
    //         return res.status(200).json({
    //             EM: `Không có dữ liệu`,    // Error message
    //             EC: 1,    // Error code
    //             DT: ''
    //         })
    //     }

    //     let data = await configHistorical.deleteConfig(req.body)
    //     return res.status(200).json({
    //         EM: data.EM,    // Error message
    //         EC: data.EC,    // Error code
    //         DT: data
    //     })

    // } catch (error) {
    //     return res.status(500).json({
    //         EM: 'Lỗi Server!!!',    // Error message
    //         EC: -2,    // Error code
    //         DT: ''
    //     })
    // }
}
/*Historical Value*/
const handleGetHistoricalValue = async (req, res) => {
    try {
        let data = await HistoricalValue.getAllValueHistorical()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}

const handleGetHistoricalValueTime = async (req, res) => {
    try {
        const data = await HistoricalValue.getValueHistoricalTime(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        });
    }
};

const handleDeleteValueHistorical = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await HistoricalValue.deleteAllValueHistorical(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) {
        return res.status(500).json({
            EM: 'Lỗi Server!!!',    // Error message
            EC: -2,    // Error code
            DT: ''
        })
    }
}


module.exports = {
    handleGetAllProtocol,
    handleCreateNewDevice, handleGetAllDevice, handleUpdateDevice, handleDeleteDevice,
    handleGetAllComs, handleUpdateCom,
    handleGetAllChannels, handleUpdateChannel, handleDeleteChannel, handleCreateNewTag, handleGetDataFormat, handleGetDataType, handleGetFunctionCodeModbus,
    handleGetAllHistorical, handleCreateTagHistorical, handleGetAllConfig, handleUpdateConfig, handleDeleteConfig, handleDeleteHistorical,
    handleGetHistoricalValue, handleGetHistoricalValueTime, handleDeleteValueHistorical
}