import React, { useState } from 'react';
import 'styles/OfflineLauncher.css';

/**
 * Pantalla principal del launcher tras el inicio de sesión offline.
 */
const versions = ['1.20.1', '1.19.4', '1.18.2', '1.16.5'];

const OfflineLauncher: React.FC = () => {
  const savedUser = localStorage.getItem('offlineUser') || '';
  const [version, setVersion] = useState('1.20.1');

  const handlePlay = () => {
    window.ipc.send('play-version', { username: savedUser, version });
  };

  return (
    <div className="offline-launcher-container">
      <h2>Bienvenido, {savedUser}</h2>
      <div className="version-selector">
        <label>Versión:</label>
        <select value={version} onChange={(e) => setVersion(e.target.value)}>
          {versions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <button className="play-button" onClick={handlePlay}>
        JUGAR
      </button>
      <div className="news-box">
        <h3>Novedades</h3>
        <p>Próximamente más actualizaciones del launcher.</p>
      </div>
    </div>
  );
};

export default OfflineLauncher;
