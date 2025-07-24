import React, { useEffect } from 'react';
// Pantalla principal de inicio del launcher
import 'styles/MainScreen.css';
import { launchLocalGame } from 'utils/launcher';

/**
 * Componente que muestra la vista inicial del launcher. Aquí se visualiza
 * el título de la aplicación y un botón para ejecutar el modpack local.
 * Al pulsar "JUGAR" se envía el evento correspondiente al proceso de
 * Electron para que se ejecute el script configurado.
 */
const MainScreen: React.FC = () => {
  const handlePlay = () => {
    // Delegamos la acción al helper encargado de comunicarse con Electron
    launchLocalGame();
  };

  useEffect(() => {
    const listener = (msg: string) => {
      alert(msg);
    };
    // Escuchamos errores al intentar lanzar el juego
    window.ipc.receive('launch-local-error', listener);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    };
  }, []);

  return (
    <div className="main-container">
      <h1 className="title">TECNILAND NEXUS</h1>
      <p className="description">Modpack oficial del universo interdimensional de TECNILAND</p>
      <button className="play-button" onClick={handlePlay}>JUGAR</button>
    </div>
  );
};

export default MainScreen;
