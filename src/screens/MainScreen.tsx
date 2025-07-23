import React from 'react';
// Main launcher entry screen
import 'styles/MainScreen.css';
import { launchLocalGame } from 'utils/launcher';

/**
 * MainScreen renders the first view of the launcher. It contains the
 * application title, a short description and a play button. The play
 * button triggers the launch of the local Minecraft installation via
 * IPC to the Electron main process.
 */
const MainScreen: React.FC = () => {
  const handlePlay = () => {
    // Delegate to the launcher utility
    launchLocalGame();
  };

  return (
    <div className="main-container">
      <h1 className="title">TECNILAND NEXUS</h1>
      <p className="description">Modpack oficial del universo interdimensional de TECNILAND</p>
      <button className="play-button" onClick={handlePlay}>JUGAR</button>
    </div>
  );
};

export default MainScreen;
