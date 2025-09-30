import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});


  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: formData.email, password: formData.password });
      
      // El contexto ya maneja la redirección y las notificaciones
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
    } catch (error) {
      // El error ya es manejado por el contexto
      console.error('Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return <LoadingSpinner message="Iniciando sesión..." />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header Section */}
        <div className="login-header">
          <div className="brand-section">
            <div className="brand-icon">
              <LogIn size={28} />
            </div>
            <h1 className="brand-title">TurnosPlus</h1>
          </div>
          <p className="login-subtitle">Bienvenido de vuelta</p>
        </div>

        {/* Main Login Card */}
        <div className="login-card">
          <div className="card-header">
            <h2>Iniciar Sesión</h2>
            <p>Accede a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="input-group">
              <div className="input-wrapper">
                <div className="input-icon">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="Correo electrónico"
                  autoComplete="email"
                />
              </div>
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="input-wrapper">
                <div className="input-icon">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'input-error' : ''}`}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="card-footer">
            <p className="register-link">
              ¿No tienes cuenta? 
              <Link to="/register" className="link-primary">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;