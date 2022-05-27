import reportWebVitals from "reportWebVitals";

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Frame from "components/Frame";
import Auth from "screens/Auth";
import Launcher from "screens/Launcher";
import Updater from "screens/Updater";
import Settings from "screens/Settings";

import LauncherUpdater from "screens/LauncherUpdater";
import "index.css";
import "fontawesome.css";
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LauncherUpdater />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/launcher" element={<Launcher />} />
          <Route path="/updater" element={<Updater />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
