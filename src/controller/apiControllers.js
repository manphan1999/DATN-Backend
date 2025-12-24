import DeviceController from '../controller/deviceController';
import ComController from '../controller/comController';
import tagNameController from '../controller/tagNameController';
import configHistorical from './configHistoricalController.js';
import TagHistorical from '../controller/tagHistoricalController.js';
import HistoricalValue from '../controller/historicalValueController.js';
import TagAlarm from '../controller/tagAlarmController.js';
import AlarmValue from '../controller/alarmValueController.js';
import AppNotify from '../controller/configAppNotifyController.js';
import FTP from '../controller/ftpController.js';
import MySQLServer from '../controller/mySQLController.js';
import SQLServer from '../controller/sqlController.js';
import UserManagement from '../controller/userController.js';
import PublishMQTT from '../controller/publishController.js';
import RTUServer from '../controller/RTUServerController.js';
import TCPServer from '../controller/TCPServerController.js';
import SettingController from '../controller/settingController.js';
import { getAllProtocol } from '../configs/protocol.js';
import { getAllFunction } from '../configs/convertData.js';
import { connectToMySQL, generateTableFromTags } from '../ultils/mysqlHandler.js'
import { connectToSQLServer, generateTableFromTagsSQL } from '../ultils/sqlHandler.js'

const handleGetAllProtocol = async (req, res) => {
    try {
        let data = getAllProtocol(); // object protocol

        return res.status(200).json({
            EM: 'Danh sách Protocol là: ',
            EC: 0,
            DT: data,
        });

    } catch (error) {
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

const handleGetFunctionCode = async (req, res) => {
    try {
        let data = getAllFunction();
        return res.status(200).json({
            EM: 'Danh sách Function là: ',
            EC: 0,
            DT: data,
        });

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

const handleSearchHistorical = async (req, res) => {
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

/* Handle Alarm */
const handleGetAllTagAlarm = async (req, res) => {
    try {
        let data = await TagAlarm.getAllTagAlarm()
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

const handleCreateTagAlarm = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TagAlarm.createTagAlarm(req.body)
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

const handleUpdateTagAlarm = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TagAlarm.updateTagAlarm(req.body)
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

const handleDeleteTagAlarm = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TagAlarm.deleteTagAlarm(req.body)
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

const handleGetAllApp = async (req, res) => {
    try {
        let data = await AppNotify.getAllApp()
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

const handleCreateApp = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await AppNotify.createApp(req.body)
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

const handleUpdateApp = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await AppNotify.updateApp(req.body)
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

/*Alarm Value*/
const handleGetAllAlarmValue = async (req, res) => {
    try {
        let data = await AlarmValue.getAllValueAlarm()
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

const handleSearchAlarmValue = async (req, res) => {
    try {
        const data = await AlarmValue.getValueAlarmTime(req.body);
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

const handleDeleteValueAlarm = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await AlarmValue.deleteAllValueAlarm(req.body)
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

/* Handle FTP */
const handleGetAllFTPServer = async (req, res) => {
    try {
        let data = await FTP.getAllFTPServer()
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

const handleCreateFTPServer = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await FTP.createFTPServer(req.body)
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

const handleUpdateFTPServer = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await FTP.updateFTPServer(req.body)
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

const handleDeleteFTPServer = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await FTP.deleteFTPServer(req.body)
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

/* Handle MySQL */
const handleConnectMySQLServer = async (req, res) => {
    try {
        let data = await connectToMySQL(req.body)
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
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

const handleCreateTableMySQL = async (req, res) => {
    try {
        const { mySQLServer, tags } = req.body;

        if (!mySQLServer || !tags) {
            return res.status(200).json({
                EM: `Thiếu dữ liệu gửi xuống`,
                EC: -1,
                DT: ''
            });
        }
        const servers = Array.isArray(mySQLServer) ? mySQLServer : [mySQLServer];
        const results = await Promise.all(servers.map(async config => {
            try {
                const result = await generateTableFromTags(config, tags);
                return { server: config.name, ...result };
            } catch (e) {
                return { server: config.name, EM: e.message, EC: -2, DT: [] };
            }
        }));

        if (results.some(r => r.EC === -2)) {
            return res.status(200).json({
                EM: "Một số server tạo bảng thất bại",
                EC: -2,
                DT: results
            });
        }

        if (results.some(r => r.EC === 1)) {
            const existedTagsSummary = results
                .filter(r => r.EC === 1)
                .map(r => ({ server: r.server, existedTags: r.DT }))
                .filter(r => r.existedTags.length > 0);
            return res.status(200).json({
                EM: "Một số tag đã tồn tại trên MySQL",
                EC: 1,
                DT: existedTagsSummary
            });
        }

        return res.status(200).json({
            EM: "Tất cả server tạo bảng thành công",
            EC: 0,
            DT: results
        });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleGetAllMySQLServer = async (req, res) => {
    try {
        let data = await MySQLServer.getAllMySQL()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateMySQLServer = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await MySQLServer.createMySQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleUpdateMySQLServer = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await MySQLServer.updateMySQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeleteMySQLServer = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await MySQLServer.deleteMySQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle SQL */
const handleConnectSQLServer = async (req, res) => {
    try {
        let data = await connectToSQLServer(req.body)
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateTableSQL = async (req, res) => {
    try {
        const { SQLServer, tags } = req.body;

        if (!SQLServer || !tags) {
            return res.status(200).json({
                EM: `Thiếu dữ liệu gửi xuống`,
                EC: -1,
                DT: ''
            });
        }
        const servers = Array.isArray(SQLServer) ? SQLServer : [SQLServer];
        const results = await Promise.all(servers.map(async config => {
            try {
                const result = await generateTableFromTagsSQL(config, tags);
                return { server: config.name, ...result };
            } catch (e) {
                return { server: config.name, EM: e.message, EC: -2, DT: [] };
            }
        }));

        if (results.some(r => r.EC === -2)) {
            return res.status(200).json({
                EM: "Một số server tạo bảng thất bại",
                EC: -2,
                DT: results
            });
        }

        if (results.some(r => r.EC === 1)) {
            const existedTagsSummary = results
                .filter(r => r.EC === 1)
                .map(r => ({ server: r.server, existedTags: r.DT }))
                .filter(r => r.existedTags.length > 0);
            return res.status(200).json({
                EM: "Một số tag đã tồn tại trên MySQL",
                EC: 1,
                DT: existedTagsSummary
            });
        }

        return res.status(200).json({
            EM: "Tất cả server tạo bảng thành công",
            EC: 0,
            DT: results
        });
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleGetAllSQLServer = async (req, res) => {
    try {
        let data = await SQLServer.getAllSQL()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateSQLServer = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await SQLServer.createSQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleUpdateSQLServer = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await SQLServer.updateSQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeleteSQLServer = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await SQLServer.deleteSQL(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle Publish */
const handleGetAllPublish = async (req, res) => {
    try {
        let data = await PublishMQTT.getAllPublish()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreatePublish = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await PublishMQTT.createPublish(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleUpdatePublish = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await PublishMQTT.updatePublish(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeletePublish = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await PublishMQTT.deletePublish(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle RTU Server */
const handleGetAllRTUServer = async (req, res) => {
    try {
        let data = await RTUServer.getAllRTUServer()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateRTUServer = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await RTUServer.createRTUServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }

}

const handleUpdateRTUServer = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await RTUServer.updateRTUServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeleteRTUServer = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await RTUServer.deleteRTUServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle TCP Server */
const handleGetAllTCPServer = async (req, res) => {
    try {
        let data = await TCPServer.getAllTCPServer()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateTCPServer = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TCPServer.createTCPServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }

}

const handleUpdateTCPServer = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TCPServer.updateTCPServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeleteTCPServer = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await TCPServer.deleteTCPServer(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })
    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle User */
const handleGetAllUser = async (req, res) => {
    try {
        let data = await UserManagement.getAllUser()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleCreateUser = async (req, res) => {
    try {
        // console.log('Check body tag Historical:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await UserManagement.createUser(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }

}

const handleUpdateUser = async (req, res) => {
    try {
        // console.log('Check body:', req.body)
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await UserManagement.updateUser(req.body)
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleDeleteUser = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({
                EM: `Không có dữ liệu`,    // Error message
                EC: 1,    // Error code
                DT: ''
            })
        }

        let data = await UserManagement.deleteUser(req.body);
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

/* Handle Login */
const handleLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        let data = await UserManagement.handleUserLogin({ username, password });
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data.DT
        })

    } catch (error) { return res.status(401).json({ EM: 'Đăng nhập thất bại', EC: 1 }); }
}

/* Handle Setting */
const handleGetAllNetwork = async (req, res) => {
    try {
        let data = await SettingController.getAllNetwork()
        return res.status(200).json({
            EM: data.EM,    // Error message
            EC: data.EC,    // Error code
            DT: data
        })

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
}

const handleGetContentHeader = async (req, res) => {
    try {
        let data = await SettingController.getContentHeader();
        return res.status(200).json({ EM: data.EM, EC: 0, DT: data, });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleCreateContentHeader = async (req, res) => {
    try {
        let data = await SettingController.createContentHeader(req.body);
        return res.status(200).json({ EM: data.EM, EC: 0, DT: data, });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleUpdateContentHeader = async (req, res) => {
    try {
        let data = await SettingController.updateContentHeader(req.body);
        return res.status(200).json({ EM: data.EM, EC: 0, DT: data, });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleUpdateNetwork = async (req, res) => {
    try {
        let data = await SettingController.setIpAddress(req.body);
        return res.status(200).json({ EM: data.EM, EC: 0, DT: data, });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

const handleReboot = (req, res) => {
    try {
        const data = SettingController.confirmReboot();
        return res.status(200).json({ EM: data.EM, EC: 0, DT: data, });

    } catch (error) { return res.status(500).json({ EM: 'Lỗi Server!!!', EC: -2, DT: '', }); }
};

module.exports = {
    handleGetAllProtocol,
    handleCreateNewDevice, handleGetAllDevice, handleUpdateDevice, handleDeleteDevice,
    handleGetAllComs, handleUpdateCom,
    handleGetAllChannels, handleUpdateChannel, handleDeleteChannel, handleCreateNewTag, handleGetDataFormat, handleGetDataType, handleGetFunctionCode,
    handleGetAllHistorical, handleCreateTagHistorical, handleGetAllConfig, handleUpdateConfig, handleDeleteConfig, handleDeleteHistorical,
    handleGetHistoricalValue, handleSearchHistorical, handleDeleteValueHistorical,
    handleGetAllTagAlarm, handleCreateTagAlarm, handleUpdateTagAlarm, handleDeleteTagAlarm,
    handleGetAllAlarmValue, handleSearchAlarmValue, handleDeleteValueAlarm,
    handleGetAllApp, handleCreateApp, handleUpdateApp,
    handleGetAllFTPServer, handleCreateFTPServer, handleUpdateFTPServer, handleDeleteFTPServer,
    handleCreateTableMySQL, handleConnectMySQLServer,
    handleGetAllMySQLServer, handleCreateMySQLServer, handleUpdateMySQLServer, handleDeleteMySQLServer,
    handleConnectSQLServer, handleCreateTableSQL,
    handleGetAllSQLServer, handleCreateSQLServer, handleUpdateSQLServer, handleDeleteSQLServer,
    handleGetAllPublish, handleCreatePublish, handleUpdatePublish, handleDeletePublish,
    handleGetAllRTUServer, handleCreateRTUServer, handleUpdateRTUServer, handleDeleteRTUServer,
    handleGetAllTCPServer, handleCreateTCPServer, handleUpdateTCPServer, handleDeleteTCPServer,
    handleGetAllUser, handleCreateUser, handleUpdateUser, handleDeleteUser, handleLogin,
    handleGetAllNetwork, handleUpdateNetwork, handleReboot,
    handleGetContentHeader, handleCreateContentHeader, handleUpdateContentHeader
}