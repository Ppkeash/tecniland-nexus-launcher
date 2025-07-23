import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'styles/OfflineLogin.css';

/**
 * Pantalla de inicio de sesión offline. Solicita un nombre de usuario
 * y lo guarda localmente para futuras sesiones.
 */
const OfflineLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim()) {
      localStorage.setItem('offlineUser', username.trim());
      navigate('/home');
    }
  };

  return (
    <div className="offline-login-container">
      <h1>TECNILAND Nexus</h1>
      <input
        type="text"
        placeholder="Nombre o alias"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleLogin}>Iniciar sesión</button>
    </div>
  );
};

export default OfflineLogin;
