<p align="center"><img src="./public/assets/logo.png" width="150px" height="150px" alt="logo"></p>

<h1 align="center">React MCLauncher</h1>

Custom launcher for modded minecraft written in Electron with React.

This launcher is based on [Helios Launcher][helioslauncher] and uses [MCLC][mclc]

## Features

- 📂 Minecraft is automatically downloaded. Files are validated before launch. Corrupt or incorrect files will be redownloaded.
- ☕ Java is automatically downloaded and installed if java is not installed.
- 📰 News feed natively built into the launcher.
- ⚙️ Intuitive settings management
- Automatic updates. That's right, the launcher updates itself.
- And more...

## Development

This section details the setup of a basic developmentment environment.

### Getting Started

**System Requirements**

- [Node.js][nodejs] v16

---

**Clone and Install Dependencies**

```console
> git clone https://github.com/dd060606/ReactMCLauncher.git
> cd ReactMCLauncher
> yarn install
```

**Start in Development**

The launcher integrates React with Electron. Use the following command to run the application in development mode and automatically open the desktop window:

```console
> npm start
```

If you only want to run the React development server, execute `npm run react:start`.

---

**Build Installers**

To create a production build for your platform run:

```console
> npm run electron:build
```

---

### Note on Third-Party Usage

You may use this software in your own project so long as the following conditions are met.

- Credit is expressly given to the original authors (dd_06).

We reserve the right to update these conditions at any time, please check back periodically.

---

#### Like the project? Leave a ⭐ star on the repository!

[nodejs]: https://nodejs.org/en/ "Node.js"
[helioslauncher]: https://github.com/dscalzi/HeliosLauncher "Helios Launcher"
[mclc]: https://github.com/Pierce01/MinecraftLauncher-core "MCLC"
