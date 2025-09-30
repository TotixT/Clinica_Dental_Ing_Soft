import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone,
  Calendar,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './Perfil.css';

const Perfil = () => {
  const { usuario, actualizarPerfil } = useAuth();
  const navigate = useNavigate();
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    telefono: usuario?.telefono || '',
    fechaNacimiento: usuario?.fechaNacimiento ? usuario.fechaNacimiento.split('T')[0] : ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
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
      const datosActualizados = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        fechaNacimiento: formData.fechaNacimiento
      };

      await actualizarPerfil(datosActualizados);
      
      toast.success('Perfil actualizado exitosamente');
      setModoEdicion(false);
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setFormData({
      nombre: usuario?.nombre || '',
      telefono: usuario?.telefono || '',
      fechaNacimiento: usuario?.fechaNacimiento ? usuario.fechaNacimiento.split('T')[0] : ''
    });
    setErrors({});
    setModoEdicion(false);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return `${edad} años`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Actualizando perfil..." />;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-back"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <h1>
            <User size={28} />
            Mi Perfil
          </h1>
          <p>Gestiona tu información personal</p>
        </div>
        {!modoEdicion && (
          <button
            onClick={() => setModoEdicion(true)}
            className="btn btn-primary"
          >
            <Edit3 size={20} />
            Editar Perfil
          </button>
        )}
      </div>

      <div className="perfil-content">
        <div className="perfil-card">
          <div className="perfil-avatar">
            <div className="avatar-circle">
              <User size={48} />
            </div>
            <div className="avatar-info">
              <h2>{usuario?.nombre}</h2>
              <div className="rol-badge">
                <Shield size={16} />
                {usuario?.rol === 'administrador' ? 'Administrador' : 'Paciente'}
              </div>
            </div>
          </div>

          {modoEdicion ? (
            <form onSubmit={handleSubmit} className="perfil-form">
              <div className="form-section">
                <h3>Información Personal</h3>
                
                <div className="form-group">
                  <label htmlFor="nombre" className="form-label">
                    <User size={18} />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`form-input ${errors.nombre ? 'error' : ''}`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="telefono" className="form-label">
                    <Phone size={18} />
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
                  />
                  {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="fechaNacimiento" className="form-label">
                    <Calendar size={18} />
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

              <div className="form-section">
                <h3>Información de Cuenta</h3>
                <div className="info-readonly">
                  <div className="info-item">
                    <Mail size={18} />
                    <div>
                      <strong>Correo Electrónico</strong>
                      <p>{usuario?.email}</p>
                      <small>El correo electrónico no se puede modificar</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  <X size={20} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <Save size={20} />
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div className="perfil-info">
              <div className="info-section">
                <h3>Información Personal</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <User size={18} />
                    <div>
                      <strong>Nombre Completo</strong>
                      <p>{usuario?.nombre}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <Mail size={18} />
                    <div>
                      <strong>Correo Electrónico</strong>
                      <p>{usuario?.email}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <Phone size={18} />
                    <div>
                      <strong>Teléfono</strong>
                      <p>{usuario?.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <Calendar size={18} />
                    <div>
                      <strong>Fecha de Nacimiento</strong>
                      <p>{formatearFecha(usuario?.fechaNacimiento)}</p>
                      <small>Edad: {calcularEdad(usuario?.fechaNacimiento)}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Información de Cuenta</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <Shield size={18} />
                    <div>
                      <strong>Rol</strong>
                      <p>{usuario?.rol === 'administrador' ? 'Administrador' : 'Paciente'}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <Calendar size={18} />
                    <div>
                      <strong>Miembro desde</strong>
                      <p>{formatearFecha(usuario?.fechaRegistro)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="info-cards">
          <div className="info-card">
            <h3>Seguridad de la Cuenta</h3>
            <p>
              Tu información personal está protegida con los más altos estándares de seguridad.
              Nunca compartimos tus datos con terceros.
            </p>
          </div>
          
          <div className="info-card">
            <h3>Contacto</h3>
            <p>
              Si necesitas ayuda o tienes alguna pregunta sobre tu cuenta,
              no dudes en contactar con el personal de la clínica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;