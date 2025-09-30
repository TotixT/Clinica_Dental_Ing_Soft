import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Save,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './NuevaCita.css';

const NuevaCita = () => {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    motivo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Opciones de motivos de consulta
  const motivosConsulta = [
    'Consulta general',
    'Limpieza dental',
    'Extracción',
    'Endodoncia',
    'Ortodoncia',
    'Implantes',
    'Blanqueamiento',
    'Urgencia dental',
    'Control post-tratamiento',
    'Otro'
  ];

  // Horarios disponibles
  const horariosDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const validateForm = () => {
    const newErrors = {};

    // Validar fecha
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      const fechaSeleccionada = new Date(formData.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        newErrors.fecha = 'No puedes solicitar citas en fechas pasadas';
      }
      
      // No permitir domingos
      if (fechaSeleccionada.getDay() === 0) {
        newErrors.fecha = 'No se pueden solicitar citas los domingos';
      }
    }

    // Validar hora
    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida';
    }

    // Validar motivo
    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo de la consulta es requerido';
    } else if (formData.motivo.trim().length < 5) {
      newErrors.motivo = 'El motivo debe tener al menos 5 caracteres';
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
      const citaData = {
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo.trim()
      };

      await axios.post('/citas', citaData);
      
      toast.success('¡Solicitud de cita enviada exitosamente! Espera la confirmación del administrador.');
      navigate('/mis-citas');
      
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error al enviar la solicitud. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener fecha mínima (mañana)
  const getFechaMinima = () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    return mañana.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (3 meses adelante)
  const getFechaMaxima = () => {
    const maxFecha = new Date();
    maxFecha.setMonth(maxFecha.getMonth() + 3);
    return maxFecha.toISOString().split('T')[0];
  };

  if (isLoading) {
    return <LoadingSpinner message="Enviando tu solicitud..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button 
            onClick={() => navigate(-1)} 
            className="btn-back"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <div className="dashboard-welcome">
            <h1>
              <Calendar size={28} />
              Solicitar Nueva Cita
            </h1>
            <p>Solicita tu cita en la Clínica Dental SonriPlus</p>
          </div>
        </div>

      <div className="dashboard-card">
          <div className="card-header">
            <h2>Información de la Solicitud</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="cita-form">
              <div className="form-section">
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fecha" className="form-label">
                      <Calendar size={18} />
                      Fecha Deseada
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      className={`form-input ${errors.fecha ? 'error' : ''}`}
                      min={getFechaMinima()}
                      max={getFechaMaxima()}
                    />
                    {errors.fecha && <span className="error-message">{errors.fecha}</span>}
                    <small className="form-help">
                      Puedes solicitar citas de lunes a sábado, hasta 3 meses adelante
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hora" className="form-label">
                      <Clock size={18} />
                      Hora Deseada
                    </label>
                    <select
                      id="hora"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                      className={`form-input ${errors.hora ? 'error' : ''}`}
                    >
                      <option value="">Selecciona una hora</option>
                      {horariosDisponibles.map(hora => (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      ))}
                    </select>
                    {errors.hora && <span className="error-message">{errors.hora}</span>}
                    <small className="form-help">
                      Horarios de atención: 8:00 AM - 12:00 PM y 2:00 PM - 6:00 PM
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="motivo" className="form-label">
                    <FileText size={18} />
                    Motivo de la Consulta
                  </label>
                  <select
                    id="motivoSelect"
                    value={motivosConsulta.includes(formData.motivo) ? formData.motivo : 'Otro'}
                    onChange={(e) => {
                      if (e.target.value === 'Otro') {
                        setFormData(prev => ({ ...prev, motivo: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, motivo: e.target.value }));
                      }
                    }}
                    className="form-input"
                  >
                    <option value="">Selecciona el motivo</option>
                    {motivosConsulta.map(motivo => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                  
                  {(formData.motivo === '' || !motivosConsulta.includes(formData.motivo)) && (
                    <textarea
                      id="motivo"
                      name="motivo"
                      value={formData.motivo}
                      onChange={handleChange}
                      className={`form-input form-textarea ${errors.motivo ? 'error' : ''}`}
                      placeholder="Describe el motivo de tu consulta..."
                      rows="3"
                    />
                  )}
                  
                  {errors.motivo && <span className="error-message">{errors.motivo}</span>}
                  <small className="form-help">
                    Describe brevemente el motivo de tu consulta para que podamos prepararnos mejor
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h3>Información del Paciente</h3>
                <div className="patient-info">
                  <div className="info-item">
                    <strong>Nombre:</strong> {usuario?.nombre}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {usuario?.email}
                  </div>
                  <div className="info-item">
                    <strong>Teléfono:</strong> {usuario?.telefono}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <Save size={20} />
                  {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>

      <div className="dashboard-card">
          <div className="card-header">
            <h2>Información Importante</h2>
          </div>
          <div className="card-body">
            <ul>
              <li>Las solicitudes de cita serán revisadas por el administrador</li>
              <li>Recibirás confirmación una vez que tu cita sea aprobada</li>
              <li>Si necesitas cancelar una solicitud, hazlo con al menos 2 horas de anticipación</li>
              <li>Llega 10 minutos antes de tu cita confirmada</li>
              <li>Trae tu documento de identidad</li>
              <li>Para urgencias, llama directamente a la clínica</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaCita;