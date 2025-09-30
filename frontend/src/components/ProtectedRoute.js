import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, usuario, loading } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se carga la autenticación
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Verificar permisos de administrador si es requerido
  if (adminOnly && usuario?.rol !== 'administrador') {
    return (
      <Navigate 
        to="/dashboard" 
        replace 
      />
    );
  }

  // Renderizar el componente hijo si todas las validaciones pasan
  return children;
};

export default ProtectedRoute;