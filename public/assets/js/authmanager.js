/**
 * AuthManager
 * 
 * This module aims to abstract login procedures. Results from Mojang's REST api
 * are retrieved through our Mojang module. These results are processed and stored,
 * if applicable, in the config using the ConfigManager. All login procedures should
 * be made through this module.
 * 
 * @module authmanager
 */
// Requirements
const ConfigManager = require('./configmanager')
const LoggerUtil = require('./logger')
const Mojang = require('./auth/mojang')
const Microsoft = require("./auth/microsoft")
const logger = LoggerUtil('%c[AuthManager]', 'color: #a02d2a; font-weight: bold')
const { BrowserWindow } = require("electron")
const main = require("../../../main")

const loggerSuccess = LoggerUtil('%c[AuthManager]', 'color: #209b07; font-weight: bold')

// Functions

/**
 * Add an account. This will authenticate the given credentials with Mojang's
 * authserver. The resultant data will be stored as an auth account in the
 * configuration database.
 * 
 * @param {string} username The account username (email if migrated).
 * @param {string} password The account password.
 * @returns {Promise.<Object>} Promise which resolves the resolved authenticated account object.
 */
exports.addAccount = async function (username, password, autoAuth) {
    try {
        const session = await Mojang.authenticate(username, password, ConfigManager.getClientToken())
        if (session.selectedProfile != null) {
            const ret = ConfigManager.addAuthAccount(session.selectedProfile.id, session.accessToken, username, session.selectedProfile.name, "mojang")
            if (ConfigManager.getClientToken() == null) {
                ConfigManager.setClientToken(session.clientToken)
            }
            ConfigManager.saveConfig()
            return ret
        } else {
            throw new Error('NotPaidAccount')
        }

    } catch (err) {
        return Promise.reject(err)
    }
}

/**
 * Add an microsoft account. This will authenticate the given credentials with Microsoft's
 * authserver. The resultant data will be stored as an auth account in the
 * configuration database.
 * 
 * @returns {Promise.<Object>} Promise which resolves the resolved authenticated account object.
 */
exports.addMicrosoftAccount = async function () {

    let authWin = new BrowserWindow({
        width: 460,
        height: 580,
        modal: true,
        parent: main.win,
        resizable: false,
    })

    authWin.removeMenu()
    authWin.on("closed", () => { authWin = null })
    authWin.loadURL(`${Microsoft.MICROSOFT_OAUTH2_URL}?client_id=${Microsoft.MICROSOFT_CLIENT_ID}&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf`)
    authWin.removeMenu()
    authWin.webContents.on("did-navigate", (event, url) => {

        if (url.startsWith(Microsoft.MICROSOFT_OAUTH2_DESKTOP + "?code=")) {
            const authCode = url.substring(url.indexOf("=") + 1, url.indexOf("&"))
            authWin.hide()
            Microsoft.authenticate(authCode).then(session => setTimeout(() => {
                const ret = ConfigManager.addAuthAccount(session.id, session.accessToken, session.username, "microsoft")
                ConfigManager.saveConfig()
                main.win.webContents.send("auth-success")
                authWin.close()

            }, 1000)).catch(err => {
                main.win.webContents.send("microsoft-auth-err", err.message);
                require("./logger")("%c[Login]", "color: #000668; font-weight: bold").error("Error while logging in.", err)
                authWin.close()
            })


        }

    })


}


/**
 * Remove an account. This will invalidate the access token associated
 * with the account and then remove it from the database.
 * 
 * @param {string} uuid The UUID of the account to be removed.
 * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
 */
exports.removeAccount = async function (uuid) {
    try {
        const authAcc = ConfigManager.getAuthAccount(uuid)
        await Mojang.invalidate(authAcc.accessToken, ConfigManager.getClientToken())
        ConfigManager.removeAuthAccount(uuid)
        ConfigManager.saveConfig()
        return Promise.resolve()
    } catch (err) {
        return Promise.reject(err)
    }
}

/**
 * Validate the selected account with Mojang's authserver. If the account is not valid,
 * we will attempt to refresh the access token and update that value. If that fails, a
 * new login will be required.
 * 
 * **Function is WIP**
 * 
 * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
 * otherwise false.
 */
exports.validateSelected = async function () {
    const current = ConfigManager.getSelectedAccount()
    const isValid = await Mojang.validate(current.accessToken, ConfigManager.getClientToken())
    if (!isValid) {
        try {
            const session = await Mojang.refresh(current.accessToken, ConfigManager.getClientToken())
            ConfigManager.updateAuthAccount(current.uuid, session.accessToken)
            ConfigManager.saveConfig()
        } catch (err) {
            logger.debug('Error while validating selected profile:', err)
            if (err && err.error === 'ForbiddenOperationException') {
                // What do we do?
            }
            logger.log('Account access token is invalid.')
            return false
        }
        loggerSuccess.log('Account access token validated.')
        return true
    } else {
        loggerSuccess.log('Account access token validated.')
        return true
    }
}

