import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowLeft, User, Mail, Phone, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Validar teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    // Validar fecha de nacimiento
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.fechaNacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 120) {
        newErrors.fechaNacimiento = 'La edad debe estar entre 5 y 120 años';
      }
    }

    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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

    if (name === 'password') {
      const len = value.length;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSymbol = /[^A-Za-z0-9]/.test(value);
      const score =
        (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
      if (!value) setPasswordStrength('');
      else if (score <= 2) setPasswordStrength('Contraseña muy débil');
      else if (score <= 4) setPasswordStrength('Contraseña débil');
      else if (score <= 5) setPasswordStrength('Contraseña aceptable');
      else setPasswordStrength('Contraseña fuerte');
    }

    if (name === 'confirmPassword') {
      setPasswordMatch(value && value === formData.password);
    } else if (name === 'password') {
      setPasswordMatch(formData.confirmPassword && formData.confirmPassword === value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        password: formData.password
      };

      await register(userData);
      
      // El contexto ya maneja la redirección y las notificaciones
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      // El error ya es manejado por el contexto
      console.error('Error en registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Creando tu cuenta..." />;
  }

  return (
    <div className="register-page">
      {/* Main Content */}
      <main className="register-main">
        <div className="register-container">
          {/* Left Side - Form */}
          <div className="register-card">
            <div className="card-header">
              <div className="header-icon">
                <UserPlus size={32} />
              </div>
              <h1 className="card-title">Crear Cuenta</h1>
              <p className="card-subtitle">
                Únete a TurnosPlus y comienza a gestionar tus citas médicas de forma inteligente
              </p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {/* Personal Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <User size={18} />
                  Información Personal
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="nombre" className="form-label">
                      <User size={16} />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className={`form-input ${errors.nombre ? 'error' : ''}`}
                      placeholder="Ingresa tu nombre completo"
                      autoComplete="name"
                    />
                    {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="fechaNacimiento" className="form-label">
                      <Calendar size={16} />
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleChange}
                      className={`form-input ${errors.fechaNacimiento ? 'error' : ''}`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.fechaNacimiento && <span className="error-message">{errors.fechaNacimiento}</span>}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <Mail size={18} />
                  Información de Contacto
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <Mail size={16} />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="tu@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="telefono" className="form-label">
                      <Phone size={16} />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className={`form-input ${errors.telefono ? 'error' : ''}`}
                      placeholder="3001234567"
                      autoComplete="tel"
                    />
                    {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <Lock size={18} />
                  Seguridad de la Cuenta
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      <Lock size={16} />
                      Contraseña
                    </label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                        placeholder="Mínimo 6"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('password')}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                    {!errors.password && passwordStrength && (
                      <small className={`strength-hint ${passwordStrength.toLowerCase().includes('fuerte') ? 'ok' : ''}`}>
                        {passwordStrength}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      <Lock size={16} />
                      Confirmar Contraseña
                    </label>
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Repite"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('confirm')}
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    {!errors.confirmPassword && formData.confirmPassword && (
                      <small className={`match-hint ${passwordMatch ? 'ok' : 'warn'}`}>
                        {passwordMatch ? 'Las contraseñas coinciden' : 'La contraseña no coincide'}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Crear Mi Cuenta
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="card-footer">
              <p className="footer-text">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="footer-link">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="benefits-section">
            <div className="benefits-content">
              <h2 className="benefits-title">¿Por qué elegir TurnosPlus?</h2>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Calendar size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Gestión Inteligente</h4>
                    <p>Agenda, modifica y cancela tus citas médicas desde cualquier lugar</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <User size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Perfil Personalizado</h4>
                    <p>Mantén tu historial médico y preferencias siempre actualizadas</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Phone size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Recordatorios Automáticos</h4>
                    <p>Nunca olvides una cita con nuestras notificaciones inteligentes</p>
                  </div>
                </div>
              </div>

              <div className="security-badge">
                <Lock size={20} />
                <span>Tus datos están protegidos con encriptación de nivel bancario</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;