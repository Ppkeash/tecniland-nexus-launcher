import { ipcMain as ipc } from "electron";
import * as authManager from "./utils/authmanager";
import { win } from "./main";
import Logger from "./utils/logger";

import type * as ConfigManagerTypes from "./utils/configmanager";
//Global module
const configManager: typeof ConfigManagerTypes = require("./utils/configmanager");

// Encargado de gestionar todo el flujo de autenticación (Microsoft y offline)
const logger = new Logger("[AuthManager]");

/**
 * Inicializa todos los manejadores IPC relacionados con la autenticación de
 * usuarios. Permite iniciar sesión mediante Microsoft o modo offline y
 * gestionar la sesión automática.
 */
export function initAuth() {
  ipc.on("microsoft-login", (event, autoAuth: boolean) => {
    configManager.setAutoAuthEnabled(autoAuth);
    configManager.saveConfig();
    authManager.addMicrosoftAccount();
  });
  ipc.on(
    "offline-login",
    (event, profile: { autoAuth: boolean; username: string }) => {
      configManager.setAutoAuthEnabled(profile.autoAuth);
      configManager.saveConfig();
      authManager.addOfflineAccount(profile.username);
    }
  );
  ipc.on("auto-auth", async () => {
    if (configManager.isAutoAuthEnabled()) {
      const selectedAcc = configManager.getSelectedAccount();
      if (selectedAcc) {
        if (selectedAcc.authType === "offline") {
          logger.log("Sucessfully authenticated!");
          win?.webContents.send("auto-auth-response", true);
        } else {
          const isValid = await authManager.validateAccount(selectedAcc);
          if (!isValid) {
            configManager.removeAuthAccount(selectedAcc.id);
            configManager.saveConfig();
            logger.error("Failed to refresh login!");
            win?.webContents.send("auto-auth-response", false);
          } else {
            logger.log("Sucessfully authenticated!");
            win?.webContents.send("auto-auth-response", true);
          }
        }
      } else {
        logger.error("Failed to refresh login!");
        win?.webContents.send("auto-auth-response", false);
      }
    } else {
      win?.webContents.send("auto-auth-response", false);
    }
  });

  ipc.on("logout", () => {
    configManager.setAutoAuthEnabled(false);
    const uuid = configManager?.getSelectedAccount()?.id;
    if (uuid) {
      configManager.removeAuthAccount(uuid);
    }
    configManager.saveConfig();
  });

  ipc.on("get-player-name", (event) => {
    event.returnValue = configManager.getSelectedAccount()?.name;
  });
  ipc.on("get-player-uuid", (event) => {
    event.returnValue = configManager.getSelectedAccount()?.id;
  });
}
