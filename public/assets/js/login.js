
const loggerLogin = require('./logger')('%c[Login]', 'color: #000668; font-weight: bold')
const ipc = require("electron").ipcMain
const main = require("../../../main")
const AuthManager = require("./authmanager")
const ConfigManager = require("./configmanager")
const { BrowserWindow, nativeImage } = require("electron")
const axios = require("axios")




exports.init = () => {
    ipc.on("mojang-login", (event, args) => {
        ConfigManager.setAutoAuthEnabled(args.autoAuth)
        ConfigManager.saveConfig()
        mojangLogin(args.username, args.password)
    })
    ipc.on("microsoft-login", (event, args) => {
        ConfigManager.setAutoAuthEnabled(args.autoAuth)
        ConfigManager.saveConfig()
        AuthManager.addMicrosoftAccount()
    })
    ipc.on("auto-auth", async () => {

        if (ConfigManager.isAutoAuthEnabled()) {
            const selectedAcc = ConfigManager.getSelectedAccount()
            if (selectedAcc != null) {
                const val = await AuthManager.validateSelected()
                if (!val) {
                    ConfigManager.removeAuthAccount(selectedAcc.uuid)
                    ConfigManager.saveConfig()
                    loggerLogin.error("Failed to refresh login!")
                    main.win.webContents.send("auto-auth-response", false)
                } else {
                    loggerLogin.log("Sucessfully authenticated!")
                    main.win.webContents.send("auto-auth-response", true)
                }
            } else {
                loggerLogin.error("Failed to refresh login!")
                main.win.webContents.send("auto-auth-response", false)
            }
        }
        else {
            main.win.webContents.send("auto-auth-response", false)
        }
    })

    ipc.on("logout", (event, args) => {
        ConfigManager.setAutoAuthEnabled(false)
        ConfigManager.saveConfig()
        AuthManager.removeAccount(ConfigManager.getSelectedAccount().uuid).then().catch(err => loggerLogin.error(err))
    })


    ipc.on("get-player-name", event => {
        event.returnValue = ConfigManager.getSelectedAccount().displayName
    })
    ipc.on("get-player-uuid", event => {
        event.returnValue = ConfigManager.getSelectedAccount().uuid
    })



}


function mojangLogin(username, password) {
    AuthManager.addAccount(username, password).then((value) => {
        setTimeout(() => {
            main.win.webContents.send("auth-success")
        }, 1000)
    }).catch((err) => {
        main.win.webContents.send("mojang-auth-err", err)
        loggerLogin.log('Error while logging in.', err)
    })
}