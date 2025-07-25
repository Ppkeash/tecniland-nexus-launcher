import { win } from "./main";

import { Client, Authenticator } from "minecraft-launcher-core";
import { ipcMain as ipc } from "electron";
import * as path from "path";
import fs from "fs";
import axios from "axios";
import AdmZip from "adm-zip";
import crypto from "crypto";
import Logger from "./utils/logger";
import ChildProcess from "child_process";

// Módulo encargado de actualizar y lanzar el juego utilizando
// minecraft-launcher-core y gestionando la descarga de dependencias.

import type * as ConfigManagerTypes from "./utils/configmanager";
//Global module
const configManager: typeof ConfigManagerTypes = require("./utils/configmanager");

type Progress = { type: string; task: number; total: number };

const gameLogger = new Logger("[GameLogger]");
const javaLogger = new Logger("[JavaLogger]");

let jre = "default";

export function isJavaAvailable(): boolean {
  const javaExec = configManager.resolveJavaPath();
  if (!javaExec) return false;
  try {
    const res = ChildProcess.spawnSync(javaExec, ["-version"]);
    if (res.error) return false;
    const output = res.stderr.toString();
    return /version/.test(output) && /64/.test(output);
  } catch (e) {
    return false;
  }
}

/**
 * Registra el manejador IPC para iniciar la secuencia de descarga y
 * posterior lanzamiento del juego.
 */
export function initGame() {
  ipc.on("play", () => play());
  ipc.on("play-version", (event, args: { username: string; version: string }) => {
    playVanilla(args.username, args.version);
  });
}

function setUpdateText(message: string) {
  win?.webContents.send("set-update-text", message);
}
function setUpdateProgress(progress: number) {
  win?.webContents.send("set-update-progress", progress);
}

async function playVanilla(username: string, version: string) {
  const launcher = new Client();
  const auth = await Authenticator.getAuth(username);
  const opts = {
    authorization: auth,
    root: configManager.getGameDirectory(),
    version: { number: version, type: "release" },
    memory: {
      max: configManager.getMaxRAM()
        ? (configManager.getMaxRAM() as string)
        : "2G",
      min: configManager.getMinRAM()
        ? (configManager.getMinRAM() as string)
        : "1G",
    },
  } as any;

  launcher.launch(opts);
  launcher.on("debug", (e) => console.log(e));
  launcher.on("data", (e) => console.log(e));
}

function play() {
  checkJavaInstallation()
    .then(() => {
      updateAndLaunch();
    })
    .catch(() => {
      win?.webContents.send("java-not-found");
    });
}
async function updateAndLaunch() {
  downloadForge().then(async () => {
    const modsDownloaded = await downloadMods();
    if (modsDownloaded) {
      const javaPath =
        jre && jre !== "default"
          ? path.join(
              jre,
              "bin",
              process.platform === "win32" ? "java.exe" : "java"
            )
          : configManager.resolveJavaPath() || undefined;
      const launcher = new Client();
      const opts = {
        clientPackage: undefined,
        authorization: {
          access_token: configManager.getSelectedAccount()?._msmc?.mcToken
            ? (configManager.getSelectedAccount()?._msmc?.mcToken as string)
            : "",
          client_token: configManager.getClientToken()
            ? (configManager.getClientToken() as string)
            : "",
          uuid: configManager.getSelectedAccount()?.id as string,
          name: configManager.getSelectedAccount()?.name as string,
          user_properties: {},
        },
        root: configManager.getGameDirectory(),
        version: {
          number: configManager.MC_VERSION,
          type: "release",
        },
        memory: {
          max: configManager.getMaxRAM()
            ? (configManager.getMaxRAM() as string)
            : "2G",
          min: configManager.getMinRAM()
            ? (configManager.getMinRAM() as string)
            : "1G",
        },
        javaPath: javaPath,
        forge: configManager.FORGE_VERSION
          ? path.join(
              configManager.getGameDirectory(),
              `forge-${configManager.MC_VERSION}-${configManager.FORGE_VERSION}-installer.jar`
            )
          : undefined,
      } as any;

      launcher.launch(opts);
      launcher.on("debug", (e) => {
        console.log(e);
      });
      launcher.on("data", (e) => console.log(e));
      launcher.on("progress", (progress: Progress) => {
        switch (progress.type) {
          case "assets":
            setUpdateText("DownloadingAssets");
            setUpdateProgress(
              parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
            );
            break;
          case "natives":
            setUpdateText("DownloadingNatives");
            setUpdateProgress(
              parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
            );
            break;

          default:
            if (progress.type.includes("classes")) {
              setUpdateText("InstallingForge");
              setUpdateProgress(
                parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
              );
            } else if (progress.type.includes("assets")) {
              setUpdateText("DownloadingAssets");
              setUpdateProgress(
                parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
              );
            }
            break;
        }
      });
      launcher.on("arguments", () => {
        setUpdateProgress(0);
        setUpdateText("LaunchingGame");
        analyseMods();
        setTimeout(() => {
          if (!configManager.isKeepLauncherOpenEnabled()) {
            win?.close();
          } else {
            win?.webContents.send("return-to-launcher");
          }
        }, 10000);
      });
    }
  });
}
function checkJavaInstallation() {
  return new Promise<void>((resolve, reject) => {
    setUpdateText("AnalyzingJava");
    const jrePath = path.join(configManager.getGameDirectory(), "jre");
    let jreInstallationFile = path.join(jrePath, "jre-windows.zip");
    if (process.platform !== "win32") {
      jreInstallationFile = path.join(jrePath, "jre-linux.zip");
    }

    if (
      fs.existsSync(jrePath) &&
      fs.readdirSync(jrePath).length !== 0 &&
      !fs.existsSync(jreInstallationFile)
    ) {
      jre = jrePath;
      return resolve();
    }
    if (fs.existsSync(jreInstallationFile)) {
      fs.unlink(jreInstallationFile, (err) => {
        if (err) {
          console.error(err);
        }
        return reject();
      });
    }

    const execCmd = configManager.resolveJavaPath();
    if (!execCmd) {
      javaLogger.log("No java installation found!");
      return reject();
    }

    const res = ChildProcess.spawnSync(execCmd, ["-version"]);
    if (res.error) {
      javaLogger.log("No java installation found!");
      return reject();
    }
    const output = res.stderr.toString();
    const versionMatch = output.match(/version \"([^\"]+)\"/);
    const is64 = output.includes("64");
    if (versionMatch && is64) {
      javaLogger.log(`Java ${versionMatch[1]} is already installed`);
      jre = "default";
      return resolve();
    }

    if (fs.existsSync(jrePath) && fs.readdirSync(jrePath).length !== 0) {
      jre = jrePath;
      return resolve();
    }

    javaLogger.log("No java installation found!");
    return reject();
  });
}

async function downloadJava(
  fileURL: string,
  targetPath: string,
  jrePath: string
) {
  try {
    gameLogger.log("Downloading Java...");
    setUpdateText("DownloadingJava");

    const { data, headers } = await axios({
      url: fileURL,
      method: "GET",
      responseType: "stream",
    });
    const totalLength = parseInt(headers["content-length"]);
    let receivedBytes = 0;
    const writer = fs.createWriteStream(targetPath);
    data.on("data", (chunk: { length: number }) => {
      receivedBytes += chunk.length;
      setUpdateText("DownloadingJava");
      setUpdateProgress(
        parseInt(((100.0 * receivedBytes) / totalLength).toFixed(0))
      );
    });
    data.pipe(writer);
    writer.on("error", (err) => {
      javaLogger.error(err.message);
      win?.webContents.send("update-error", "JavaError", err.message);
    });
    data.on("end", async function () {
      const res = await axios.head(fileURL);
      if (
        fs.statSync(targetPath).size === parseInt(res.headers["content-length"])
      ) {
        javaLogger.log("Java installation successfully downloaded!");
        const zip = new AdmZip(targetPath);
        javaLogger.log("Extracting java!");
        setUpdateText("ExtractingJava");
        zip.extractAllTo(jrePath, true);
        javaLogger.log("Java was successfully extracted!");
        fs.unlink(targetPath, (err) => {
          if (err) {
            javaLogger.error(err.message);
            return;
          }
          javaLogger.log("Java installation file was successfully removed!");
        });
        jre = jrePath;
        updateAndLaunch();
      } else {
        javaLogger.error("Error while downloading java!");
        win?.webContents.send("update-error", "JavaError", "");
      }
    });
  } catch (err: any) {
    javaLogger.error(err?.message ? err.message : "Unknown error");
    win?.webContents.send(
      "update-error",
      "JavaError",
      err?.message ? err.message : "Unknown error"
    );
  }
}

function downloadForge() {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!configManager.FORGE_VERSION) {
        resolve();
      }
      setUpdateText("DownloadingForge");
      gameLogger.log("Downloading Forge...");
      const forgeInstallerFile = path.join(
        configManager.getGameDirectory(),
        `forge-${configManager.MC_VERSION}-${configManager.FORGE_VERSION}-installer.jar`
      );
      const forgeInstallerURL = `https://maven.minecraftforge.net/net/minecraftforge/forge/${configManager.MC_VERSION}-${configManager.FORGE_VERSION}/forge-${configManager.MC_VERSION}-${configManager.FORGE_VERSION}-installer.jar`;

      let res = await axios.head(forgeInstallerURL);
      if (
        !fs.existsSync(forgeInstallerFile) ||
        fs.statSync(forgeInstallerFile).size !==
          parseInt(res.headers["content-length"])
      ) {
        const { data, headers } = await axios({
          url: forgeInstallerURL,
          method: "GET",
          responseType: "stream",
        });
        const totalLength = parseInt(headers["content-length"]);
        let receivedBytes = 0;
        const writer = fs.createWriteStream(forgeInstallerFile);
        data.on("data", (chunk: { length: number }) => {
          receivedBytes += chunk.length;
          setUpdateText("DownloadingForge");

          setUpdateProgress(
            parseInt(((100.0 * receivedBytes) / totalLength).toFixed(0))
          );
        });
        data.pipe(writer);
        writer.on("error", (err) => {
          gameLogger.error(err.message);
          win?.webContents.send("update-error", "ForgeError", err.message);
          reject();
        });

        data.on("end", async function () {
          if (fs.statSync(forgeInstallerFile).size == totalLength) {
            gameLogger.log("Forge was successfully downloaded!");
            resolve();
          } else {
            reject();
          }
        });
      } else {
        gameLogger.log("Forge installer is already installed");
        resolve();
      }
    } catch (err: any) {
      gameLogger.error(err.message);
      win?.webContents.send("update-error", "ForgeError", err.message);
      reject();
    }
  });
}

let totalModsSize = 0;
let currentModsSize = 0;

async function downloadMods() {
  if (configManager.MODS_URL) {
    try {
      setUpdateText("DownloadingMods");
      gameLogger.log("Downloading Mods...");
      const modsDir = path.join(configManager.getGameDirectory(), "mods");
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir);
      }

      const response = await axios.get(configManager.MODS_URL);

      for (let i = 0; i < response.data.mods.length; i++) {
        const modFile = path.join(modsDir, response.data.mods[i].name);
        if (fs.existsSync(modFile)) {
          const modFileContent = fs.readFileSync(modFile);
          let modSha1 = crypto
            .createHash("sha1")
            .update(modFileContent)
            .digest("hex");
          if (modSha1 !== response.data.mods[i].sha1) {
            fs.unlinkSync(modFile);
            totalModsSize += response.data.mods[i].size;
          } else {
            continue;
          }
        } else {
          totalModsSize += response.data.mods[i].size;
        }
      }

      for (let i = 0; i < response.data.mods.length; i++) {
        const modFile = path.join(modsDir, response.data.mods[i].name);
        if (fs.existsSync(modFile)) {
          const modFileContent = fs.readFileSync(modFile);
          let modSha1 = crypto
            .createHash("sha1")
            .update(modFileContent)
            .digest("hex");
          if (modSha1 !== response.data.mods[i].sha1) {
            fs.unlinkSync(modFile);
            await downloadMod(
              response.data.mods[i].downloadURL,
              modFile,
              response.data.mods[i].size
            );
            gameLogger.log(
              `${response.data.mods[i].name} was successfully downloaded!`
            );
          } else {
            continue;
          }
        } else {
          await downloadMod(
            response.data.mods[i].downloadURL,
            modFile,
            response.data.mods[i].size
          );
          gameLogger.log(
            `${response.data.mods[i].name} was successfully downloaded!`
          );
        }
      }
      return true;
    } catch (err: any) {
      gameLogger.error(err.message);
      win?.webContents.send("update-error", "ModsError", err.message);
      return false;
    }
  } else {
    return true;
  }
}
async function analyseMods() {
  if (configManager.MODS_URL) {
    try {
      const modsDir = path.join(configManager.getGameDirectory(), "mods");
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir);
      }
      const response = await axios.get(configManager.MODS_URL);
      fs.readdirSync(modsDir).forEach((file) => {
        let sha1Array = [];
        for (let i = 0; i < response.data.mods.length; i++) {
          sha1Array.push(response.data.mods[i].sha1);
        }
        const modFileContent = fs.readFileSync(path.join(modsDir, file));
        let modSha1 = crypto
          .createHash("sha1")
          .update(modFileContent)
          .digest("hex");
        if (!sha1Array.includes(modSha1)) {
          fs.unlinkSync(path.join(modsDir, file));
        }
      });
    } catch (err: any) {
      gameLogger.error(err.message);
      win?.webContents.send("update-error", "ModsError", err.message);
    }
  }
}
async function downloadMod(
  fileURL: string,
  targetPath: string,
  modSize: number
) {
  return new Promise<void>(async (resolve, reject) => {
    const { data } = await axios({
      url: fileURL,
      method: "GET",
      responseType: "stream",
    });
    const writer = fs.createWriteStream(targetPath);
    data.on("data", (chunk: { length: number }) => {
      currentModsSize += chunk.length;
      setUpdateText("DownloadingMods");
      setUpdateProgress(
        parseFloat(((100.0 * currentModsSize) / totalModsSize).toFixed(1))
      );
    });
    data.pipe(writer);
    writer.on("error", (err) => {
      gameLogger.error(err.message);
      win?.webContents.send("update-error", "ModsError", err.message);
      reject();
    });

    data.on("end", async function () {
      if (fs.statSync(targetPath).size == modSize) {
        resolve();
      } else {
        reject();
      }
    });
  });
}
