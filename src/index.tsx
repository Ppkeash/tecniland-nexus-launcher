import reportWebVitals from "reportWebVitals";

import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route } from "react-router-dom";
import Frame from "components/Frame";
import Auth from "screens/Auth";
import Launcher from "screens/Launcher";
import Updater from "screens/Updater";
import Settings from "screens/Settings";
import TecnilandScreen from "screens/TecnilandScreen";
import LauncherUpdater from "screens/LauncherUpdater";
import MainScreen from "screens/MainScreen";
import Init from "screens/offline/Init";
import OfflineLogin from "screens/offline/OfflineLogin";
import OfflineLauncher from "screens/offline/OfflineLauncher";
// Global application styles
import "styles/index.css";
// Font Awesome icons
import "styles/fontawesome.css";
declare global {
  interface Window {
    ipc: {
      send: (channel: string, data?: any) => void;
      sendSync: (channel: string, data?: any) => any;
      receive: (channel: string, func: (...datas: any) => void) => void;
    };
  }
}

ReactDOM.render(
  <React.StrictMode>
    <div
      id="main"
      style={{
        backgroundImage: `url("assets/background.png")`,
      }}
    >
      <Frame />
      <HashRouter>
        <Routes>
          {/* Flujo de inicio offline */}
          <Route path="/" element={<Init />} />
          <Route path="/login" element={<OfflineLogin />} />
          <Route path="/home" element={<OfflineLauncher />} />

          {/* Rutas originales */}
          <Route path="/update" element={<LauncherUpdater />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/launcher" element={<Launcher />} />
          <Route path="/updater" element={<Updater />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tecniland" element={<TecnilandScreen />} />
        </Routes>
      </HashRouter>
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
