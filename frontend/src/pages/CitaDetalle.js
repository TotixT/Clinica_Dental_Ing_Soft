import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './CitaDetalle.css';

const CitaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);

  useEffect(() => {
    cargarCita();
  }, [id]);

  const cargarCita = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/citas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCita(response.data.cita);
    } catch (error) {
      console.error('Error cargando cita:', error);
      if (error.response?.status === 404) {
        toast.error('Cita no encontrada');
        navigate('/mis-citas');
      } else if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver esta cita');
        navigate('/mis-citas');
      } else {
        toast.error('Error al cargar los detalles de la cita');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    const [horas, minutos] = hora.split(':');
    const fecha = new Date();
    fecha.setHours(parseInt(horas), parseInt(minutos));
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'status-pendiente';
      case 'programada': return 'status-programada';
      case 'completada': return 'status-completada';
      case 'cancelada': return 'status-cancelada';
      case 'no_asistio': return 'status-no-asistio';
      default: return 'status-programada';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente': return <AlertCircle size={20} />;
      case 'programada': return <Clock size={20} />;
      case 'completada': return <CheckCircle size={20} />;
      case 'cancelada': return <XCircle size={20} />;
      case 'no_asistio': return <AlertCircle size={20} />;
      default: return <Clock size={20} />;
    }
  };

  const puedeModificarCita = () => {
    // No mostrar botón de cancelar si la cita ya está cancelada o completada
    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      return false;
    }
    
    // Los administradores pueden cancelar citas programadas y pendientes
    if (usuario?.rol === 'administrador') {
      return cita.estado === 'programada' || cita.estado === 'pendiente';
    }
    
    // Para pacientes, pueden cancelar citas programadas con tiempo suficiente o citas pendientes
    if (cita.estado === 'pendiente') {
      return true; // Los pacientes pueden cancelar sus solicitudes pendientes
    }
    
    if (cita.estado === 'programada') {
      const fechaCita = new Date(`${cita.fecha}T${cita.hora}`);
      const ahora = new Date();
      const horasRestantes = (fechaCita - ahora) / (1000 * 60 * 60);
      return horasRestantes > 2;
    }
    
    return false;
  };

  const cancelarCita = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/citas/${id}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cita cancelada exitosamente');
      navigate('/mis-citas');
    } catch (error) {
      console.error('Error cancelando cita:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la cita');
    }
  };

  const completarCita = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/citas/${id}/completar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cita completada exitosamente');
      setMostrarConfirmacion(null);
      cargarCita(); // Recargar los datos de la cita
    } catch (error) {
      console.error('Error al completar cita:', error);
      toast.error(error.response?.data?.message || 'Error al completar la cita');
    }
  };

  const autorizarCita = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/citas/${id}/autorizar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cita autorizada exitosamente');
      setMostrarConfirmacion(null);
      cargarCita(); // Recargar los datos de la cita
    } catch (error) {
      console.error('Error al autorizar cita:', error);
      toast.error(error.response?.data?.message || 'Error al autorizar la cita');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando detalles de la cita..." />;
  }

  if (!cita) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="error-state">
            <AlertCircle size={64} />
            <h2>Cita no encontrada</h2>
            <p>La cita que buscas no existe o no tienes permisos para verla.</p>
            <Link to="/mis-citas" className="btn btn-primary">
              <ArrowLeft size={20} />
              Volver a Mis Citas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button 
            onClick={() => navigate('/mis-citas')} 
            className="btn-back"
            aria-label="Volver a mis citas"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <div className="dashboard-welcome">
            <h1>
              <Calendar size={28} />
              Detalles de la Cita
            </h1>
            <p>Información completa de tu cita médica</p>
          </div>
        </div>

        <div className="cita-detalle-container">
          <div className="cita-detalle-card">
            <div className="card-header">
              <div className="cita-status-header">
                <div className={`status-badge ${getEstadoColor(cita.estado)}`}>
                  {getEstadoIcon(cita.estado)}
                  <span>{cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}</span>
                </div>
                {(puedeModificarCita() || (usuario?.rol === 'administrador' && (cita.estado === 'programada' || cita.estado === 'pendiente'))) && (
                  <div className="cita-actions">
                    {puedeModificarCita() && (
                      <button
                        onClick={() => setMostrarConfirmacion({ accion: 'cancelar' })}
                        className="btn btn-danger"
                      >
                        <Trash2 size={16} />
                        Cancelar Cita
                      </button>
                    )}
                    {usuario?.rol === 'administrador' && cita.estado === 'pendiente' && (
                      <button
                        onClick={() => setMostrarConfirmacion({ accion: 'autorizar' })}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} />
                        Autorizar Cita
                      </button>
                    )}
                    {usuario?.rol === 'administrador' && cita.estado === 'programada' && (
                      <button
                        onClick={() => setMostrarConfirmacion({ accion: 'completar' })}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} />
                        Completar Cita
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="cita-info-grid">
                <div className="info-section">
                  <div className="info-header">
                    <Calendar size={24} />
                    <h3>Fecha y Hora</h3>
                  </div>
                  <div className="info-content">
                    <div className="info-item">
                      <strong>Fecha:</strong>
                      <span>{formatearFecha(cita.fecha)}</span>
                    </div>
                    <div className="info-item">
                      <strong>Hora:</strong>
                      <span>{formatearHora(cita.hora)}</span>
                    </div>
                  </div>
                </div>

                {usuario?.rol === 'administrador' && cita.paciente && (
                  <div className="info-section">
                    <div className="info-header">
                      <User size={24} />
                      <h3>Información del Paciente</h3>
                    </div>
                    <div className="info-content">
                      <div className="info-item">
                        <strong>Nombre:</strong>
                        <span>{cita.paciente.nombre}</span>
                      </div>
                      <div className="info-item">
                        <strong>Email:</strong>
                        <span>{cita.paciente.email}</span>
                      </div>
                      {cita.paciente.telefono && (
                        <div className="info-item">
                          <strong>Teléfono:</strong>
                          <span>{cita.paciente.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="info-section">
                  <div className="info-header">
                    <FileText size={24} />
                    <h3>Motivo de Consulta</h3>
                  </div>
                  <div className="info-content">
                    <div className="motivo-consulta">
                      {cita.motivo}
                    </div>
                  </div>
                </div>

                {cita.descripcionAdicional && (
                  <div className="info-section">
                    <div className="info-header">
                      <FileText size={24} />
                      <h3>Descripción Adicional</h3>
                    </div>
                    <div className="info-content">
                      <div className="descripcion-adicional">
                        {cita.descripcionAdicional}
                      </div>
                    </div>
                  </div>
                )}

                <div className="info-section">
                  <div className="info-header">
                    <MapPin size={24} />
                    <h3>Ubicación</h3>
                  </div>
                  <div className="info-content">
                    <div className="ubicacion">
                      <strong>Clínica Dental SonriPlus</strong><br />
                      Calle Principal #123<br />
                      Ciudad, País<br />
                      Teléfono: (123) 456-7890
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-header">
                    <Clock size={24} />
                    <h3>Información Adicional</h3>
                  </div>
                  <div className="info-content">
                    <div className="info-item">
                      <strong>Creada:</strong>
                      <span>{new Date(cita.fechaCreacion).toLocaleDateString('es-ES')}</span>
                    </div>
                    {cita.fechaActualizacion !== cita.fechaCreacion && (
                      <div className="info-item">
                        <strong>Última actualización:</strong>
                        <span>{new Date(cita.fechaActualizacion).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de confirmación */}
        {mostrarConfirmacion && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                 <h3>
                   {mostrarConfirmacion.accion === 'cancelar' ? 'Confirmar Cancelación' : 
                    mostrarConfirmacion.accion === 'autorizar' ? 'Confirmar Autorización' : 
                    'Confirmar Completar Cita'}
                 </h3>
               </div>
               <div className="modal-body">
                 <p>
                   {mostrarConfirmacion.accion === 'cancelar' 
                     ? '¿Estás seguro de que deseas cancelar esta cita?' 
                     : mostrarConfirmacion.accion === 'autorizar'
                     ? '¿Estás seguro de que deseas autorizar esta cita? La cita pasará al estado "programada".'
                     : '¿Estás seguro de que deseas marcar esta cita como completada?'
                   }
                 </p>
                 {mostrarConfirmacion.accion === 'cancelar' && (
                   <p className="warning-text">Esta acción no se puede deshacer.</p>
                 )}
               </div>
               <div className="modal-actions">
                 <button 
                   onClick={() => setMostrarConfirmacion(null)}
                   className="btn btn-secondary"
                 >
                   {mostrarConfirmacion.accion === 'cancelar' ? 'No, mantener cita' : 'Cancelar'}
                 </button>
                 <button 
                   onClick={
                     mostrarConfirmacion.accion === 'cancelar' ? cancelarCita : 
                     mostrarConfirmacion.accion === 'autorizar' ? autorizarCita :
                     completarCita
                   }
                   className={`btn ${mostrarConfirmacion.accion === 'cancelar' ? 'btn-danger' : 'btn-success'}`}
                 >
                   {mostrarConfirmacion.accion === 'cancelar' ? 'Sí, cancelar cita' : 
                    mostrarConfirmacion.accion === 'autorizar' ? 'Sí, autorizar cita' :
                    'Sí, completar cita'}
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default CitaDetalle;