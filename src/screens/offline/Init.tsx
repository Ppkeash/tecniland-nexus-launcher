import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente inicial que redirige al login o al launcher
 * dependiendo de si existe un usuario almacenado.
 */
const Init: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('offlineUser');
    if (savedUser) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return null;
};

export default Init;
