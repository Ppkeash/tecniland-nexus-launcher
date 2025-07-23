import { ipcMain as ipc, shell, dialog } from "electron";
import { win } from "./main";

import Logger from "./utils/logger";
import os from "os";
import { isJavaAvailable } from "./game";

import type { DynaConfig } from "./utils/configmanager";
import { ping } from "minecraft-server-ping";

import type * as ConfigManagerTypes from "./utils/configmanager";
//Global module
const configManager: typeof ConfigManagerTypes = require("./utils/configmanager");
const logger = new Logger("[Launcher]");

function initMainIPC() {
  //Async utils
  ipc.on("open-link", (event, args) => shell.openExternal(args));
  // Ejecuta un script local para lanzar el juego. La ruta se obtiene de la
  // variable de entorno LOCAL_GAME_SCRIPT para permitir configuraciones
  // personalizadas en cada máquina.
  ipc.on("launch-local-game", () => {
    const scriptPath = process.env.LOCAL_GAME_SCRIPT;
    if (!scriptPath) {
      logger.error("LOCAL_GAME_SCRIPT no está definida");
      return;
    }
    try {
      const { spawn } = require("child_process");
      const bat = spawn(scriptPath, [], { shell: true });
      bat.stdout.on("data", (data: Buffer) => console.log(data.toString()));
      bat.stderr.on("data", (data: Buffer) => console.error(data.toString()));
      bat.on("error", (err: Error) => console.error("Error launching:", err));
    } catch (err) {
      console.error("Failed to launch game", err);
    }
  });
  ipc.on("ping-server", () => {
    if (configManager?.getDynamicConfig()) {
      ping(
        (configManager.getDynamicConfig() as DynaConfig).serverIP,
        (configManager.getDynamicConfig() as DynaConfig).serverPort
      )
        .then((res) => win?.webContents.send("ping-server-result", res))
        .catch((err) => {
          logger.warn("Unable to refresh server status, assuming offline.");
          logger.debug(err);
          win?.webContents.send("ping-server-result", false);
        });
    }
  });
  ipc.on("set-memory", (event, args) => {
    const memory = args + "G";
    configManager.setMinRAM(memory);
    configManager.setMaxRAM(memory);
    configManager.saveConfig();
  });
  ipc.on("set-auto-auth", (event, args) => {
    configManager.setAutoAuthEnabled(args);
    configManager.saveConfig();
  });
  ipc.on("set-keep-launcher-open", (event, args) => {
    configManager.setKeepLauncherOpenEnabled(args);
    configManager.saveConfig();
  });
  ipc.on("open-game-dir", () =>
    shell.openPath(configManager.getGameDirectory())
  );
  ipc.on("open-java-dialog", async (event) => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ["openFile"],
      filters: [
        {
          name: "Java",
          extensions: [process.platform === "win32" ? "exe" : ""],
        },
      ],
    });
      if (!result.canceled && result.filePaths.length > 0) {
        if (configManager.setJavaExecutable(result.filePaths[0])) {
          configManager.saveConfig();
          event.sender.send("java-path-selected", result.filePaths[0]);
        } else {
          event.sender.send("java-path-invalid");
        }
      }
    });
  ipc.on("set-java-path", (event, args) => {
    const res = configManager.setJavaExecutable(args);
    if (res) {
      configManager.saveConfig();
    }
    event.returnValue = res;
  });
  ipc.on("get-java-path", (event) => {
    event.returnValue = configManager.getJavaExecutable() || "";
  });
  ipc.on("is-java-valid", (event) => {
    event.returnValue = isJavaAvailable();
  });

  //Sync utils
  ipc.on("get-launcher-name", (event) => {
    event.returnValue = configManager.LAUNCHER_NAME;
  });
  ipc.on("get-platform-name", (event) => {
    event.returnValue = process.platform;
  });
  ipc.on("get-dynamic-config", (event) => {
    event.returnValue = configManager.getDynamicConfig();
  });
  ipc.on("available-memory", (event) => {
    const mem = os.totalmem() / 1000000000;
    event.returnValue = +mem.toFixed(0) - 1;
  });
  ipc.on("get-memory", (event) => {
    if (configManager && configManager.getMinRAM()) {
      event.returnValue = parseInt(
        (configManager.getMinRAM() as string).replace("G", "")
      );
    } else {
      event.returnValue = 0;
    }
  });

  ipc.on("is-keep-launcher-open", (event) => {
    event.returnValue = configManager.isKeepLauncherOpenEnabled();
  });
  ipc.on("is-auto-auth", (event) => {
    event.returnValue = configManager.isAutoAuthEnabled();
  });

  //Frame buttons
  ipc.on("close-app", () => {
    win?.close();
  });
  ipc.on("minimize-app", () => {
    win?.minimize();
  });
  ipc.on("maximize-app", () => {
    if (win?.isMaximized()) {
      win?.unmaximize();
    } else {
      win?.maximize();
    }
  });
}

export { initMainIPC };
