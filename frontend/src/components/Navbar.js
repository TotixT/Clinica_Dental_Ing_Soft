import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Plus, 
  List,
  Settings
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { usuario, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <Calendar className="logo-icon" />
          <span>TurnosPlus</span>
        </Link>

        {/* Menu toggle para móviles */}
        <button 
          className="navbar-toggle"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Menu de navegación */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {!isAuthenticated ? (
            // Menú para usuarios no autenticados
            <div className="navbar-nav">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <Home size={18} />
                <span>Inicio</span>
              </Link>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <User size={18} />
                <span>Iniciar Sesión</span>
              </Link>
              <Link 
                to="/register" 
                className={`nav-link nav-button ${isActive('/register') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span>Registrarse</span>
              </Link>
            </div>
          ) : (
            // Menú para usuarios autenticados
            <div className="navbar-nav">
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              
              {/* Solo mostrar Nueva Cita para pacientes, no para administradores */}
              {usuario?.rol !== 'administrador' && (
                <Link 
                  to="/nueva-cita" 
                  className={`nav-link ${isActive('/nueva-cita') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <Plus size={18} />
                  <span>Nueva Cita</span>
                </Link>
              )}
              
              <Link 
                to="/mis-citas" 
                className={`nav-link ${isActive('/mis-citas') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <List size={18} />
                <span>{usuario?.rol === 'administrador' ? 'Citas' : 'Mis Citas'}</span>
              </Link>

              {/* Menú adicional para administradores */}
              {usuario?.rol === 'administrador' && (
                <Link 
                  to="/admin" 
                  className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <Settings size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* Información del usuario */}
              <div className="user-info">
                <div className="user-avatar">
                  <User size={18} />
                </div>
                <div className="user-details">
                  <span className="user-name">{usuario?.nombre}</span>
                  <span className="user-role">
                    {usuario?.rol === 'administrador' ? 'Administrador' : 'Paciente'}
                  </span>
                </div>
              </div>

              {/* Botón de cerrar sesión */}
              <button 
                className="nav-link logout-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Overlay para cerrar menú en móviles */}
        {isMenuOpen && (
          <div 
            className="navbar-overlay"
            onClick={closeMenu}
          ></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;