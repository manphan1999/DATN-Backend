import Datastore from '@seald-io/nedb'
import fileName from '../configs/fileName'
import path from 'path';
// console.log("Database path:", `${fileName.DATABASE_FOLDER_PATH_LOCAL}/coms.db`)
// const dbPath = path.join(__dirname, 'database', 'coms.db');
// console.log(" DB Path:", dbPath);

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
const TagnameModel = new Datastore({
    filename: `${fileName.DATABASE_FOLDER_PATH_LOCAL}/tagnames.db`,
})
    ; (async () => {
        try {
            await TagnameModel.loadDatabaseAsync()
        } catch (error) { }
    })()
export { DeviceModel, ComModel, TagnameModel }

