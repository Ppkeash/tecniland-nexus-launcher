import React, { useEffect, useState } from 'react';
// Componente experimental para nuevas funcionalidades del launcher.

const TecnilandScreen = () => {
  const [currentPage, setCurrentPage] = useState<'splash' | 'login' | 'main'>('splash');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedModpack, setSelectedModpack] = useState('tecniland-rpg');

  const modpacks = [
    { id: 'tecniland-rpg', name: 'Tecniland RPG' },
    { id: 'tecniland-og', name: 'Tecniland OG' },
    { id: 'tecniland-skyblock', name: 'Tecniland Skyblock' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage('login'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    alert('Iniciando sesión... (Simulado)');
    setCurrentPage('main');
  };

  const handleRegister = () => alert('Registrando usuario... (Simulado)');
  const handlePlay = () => alert(`Lanzando modpack: ${selectedModpack}`);
  const handleUpdate = () => alert('Actualizando modpack... (Simulado)');
  const handleSettings = () => alert('Configuración abierta...');
  const handleLogout = () => setCurrentPage('login');

  if (currentPage === 'splash') {
    return (
      <div className="splash-screen">
        <div className="splash-overlay" />
        <div className="splash-content">
          <h1>TECNILAND Nexus</h1>
          <p>Iniciando secuencia de lanzamiento...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <div className="login-screen">
        <div className="login-panel">
          <h2>Acceso al Nexus</h2>
          <input
            type="text"
            placeholder="Nombre de Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Iniciar Sesión</button>
          <button onClick={handleRegister}>Registrarse</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-screen">
      <div className="main-header">
        <h1>TECNILAND Nexus</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      <div className="main-content">
        <div className="modpack-panel">
          <h2>Modpacks Disponibles</h2>
          <select value={selectedModpack} onChange={(e) => setSelectedModpack(e.target.value)}>
            {modpacks.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button onClick={handlePlay}>Jugar</button>
          <button onClick={handleUpdate}>Actualizar</button>
          <button onClick={handleSettings}>Configuración</button>
        </div>

        <div className="main-news">
          <img
            src="https://via.placeholder.com/800x400?text=TECNILAND+Nexus+News"
            alt="Banner Noticias"
          />
        </div>
      </div>
    </div>
  );
};

export default TecnilandScreen;
