import fs from 'fs'
import Datastore from '@seald-io/nedb'
import fileName from '../configs/fileName'
import path from 'path';
// console.log("Database path:", `${fileName.DATABASE_FOLDER_PATH_LOCAL}/coms.db`)
// const dbPath = path.join(__dirname, 'database', 'coms.db');
// console.log(" DB Path:", dbPath);
// console.log("Database path:", path.join(fileName.DATABASE_FOLDER_PATH_LOCAL, 'coms.db'))

const DeviceModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/devices.db`,
    autoload: true
})
    // load database ngay khi start
    ; (async () => {
        try {
            await DeviceModel.loadDatabaseAsync()
        } catch (error) {
            console.error('Failed to load devices.db:', error)
        }
    })()
//////////////////////////////////////////////////////////////////////////////
const ComModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/coms.db`,
})
    ; (async () => {
        try {
            await ComModel.loadDatabaseAsync()
        } catch (error) {
            console.error('Failed to load coms.db:', error)
        }
    })()
//////////////////////////////////////////////////////////////////////////////
const TagnameModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/tagnames.db`,
})
    ; (async () => {
        try {
            await TagnameModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const TagHistorical = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/tagHistorical.db`,
    autoload: true
})
    // load database ngay khi start
    ; (async () => {
        try {
            await TagHistorical.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const ConfigHistorical = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/configHistorical.db`,
    autoload: true
})
    // load database ngay khi start
    ; (async () => {
        try {
            await ConfigHistorical.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const HistoricalValueModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db`,
    autoload: true
})
    ; (async () => {
        try {
            await HistoricalValueModel.loadDatabaseAsync()
        } catch (error) {
            fs.unlink(`${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db`, (err) => {
                if (err) fileName.log(err)
                fs.copyFile(
                    `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db.backup`,
                    `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db`,
                    function (err) {
                        if (err) console.log(err)
                    }
                )
            })
            await HistoricalValueModel.loadDatabaseAsync()
        }
    })()
//////////////////////////////////////////////////////////////////////////////
const TagAlarmModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/tagAlarm.db`,
    autoload: true
})
    ; (async () => {
        try {
            await TagAlarmModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const AlarmValueModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db`,
    autoload: true
})
    ; (async () => {
        try {
            await AlarmValueModel.loadDatabaseAsync()
        } catch (error) {
            fs.unlink(`${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db`, (err) => {
                if (err) fileName.log(err)
                fs.copyFile(
                    `${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db.backup`,
                    `${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db`,
                    function (err) {
                        if (err) console.log(err)
                    }
                )
            })
            await AlarmValueModel.loadDatabaseAsync()
        }
    })()
//////////////////////////////////////////////////////////////////////////////
const AppNotifyModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/configNotify.db`,
    autoload: true
})
    ; (async () => {
        try {
            await AppNotifyModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const FTPServerModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/ftpServer.db`,
    autoload: true
})
    ; (async () => {
        try {
            await FTPServerModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const MySQLServerModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/mysqlServer.db`,
    autoload: true
})
    ; (async () => {
        try {
            await MySQLServerModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const SQLServerModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/sqlServer.db`,
    autoload: true
})
    ; (async () => {
        try {
            await SQLServerModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const UserModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/users.db`,
    autoload: true
})
    ; (async () => {
        try {
            await UserModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const PublishModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/publish.db`,
    autoload: true
})
    ; (async () => {
        try {
            await UserModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const RTUServerModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/rtuServer.db`,
    autoload: true
})
    ; (async () => {
        try {
            await UserModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const TCPServerModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/tcpServer.db`,
    autoload: true
})
    ; (async () => {
        try {
            await UserModel.loadDatabaseAsync()
        } catch (error) { }
    })()
//////////////////////////////////////////////////////////////////////////////
const HeaderModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/contentHeader.db`,
    autoload: true
})
    ; (async () => {
        try {
            await UserModel.loadDatabaseAsync()
        } catch (error) { }
    })()
export {
    DeviceModel, ComModel, TagnameModel, TagHistorical, ConfigHistorical,
    HistoricalValueModel, TagAlarmModel, AppNotifyModel, AlarmValueModel,
    FTPServerModel, MySQLServerModel, SQLServerModel, UserModel,
    PublishModel, RTUServerModel, TCPServerModel, HeaderModel
}

