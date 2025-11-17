import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus, 
  User, 
  Settings,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Eye,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { usuario } = useContext(AuthContext);
  const [citas, setCitas] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar citas (la ruta /api/citas/ maneja ambos casos según el rol)
      const citasResponse = await axios.get('/citas/');
      const citasData = citasResponse.data.citas || citasResponse.data || [];
      setCitas(citasData);

      // Cargar estadísticas si es administrador
      if (usuario?.rol === 'administrador') {
        // Cargar solicitudes pendientes para administradores
        try {
          const solicitudesResponse = await axios.get('/citas/solicitudes/pendientes');
          const solicitudesData = solicitudesResponse.data.solicitudes || [];
          setSolicitudesPendientes(solicitudesData);
        } catch (error) {
          console.error('Error al cargar solicitudes pendientes:', error);
          setSolicitudesPendientes([]);
        }

        const statsResponse = await axios.get('/citas/estadisticas/resumen');
        const statsData = statsResponse.data.estadisticas || statsResponse.data || {};
        setEstadisticas(statsData);
      } else {
        // Calcular estadísticas para pacientes basándose en las citas cargadas
        const totalCitas = citasData.length;
        const citasCompletadas = citasData.filter(cita => cita.estado === 'completada').length;
        const citasProgramadas = citasData.filter(cita => cita.estado === 'programada').length;
        const citasPendientes = citasData.filter(cita => cita.estado === 'pendiente').length;
        const citasCanceladas = citasData.filter(cita => cita.estado === 'cancelada').length;
        const citasNoAsistio = citasData.filter(cita => cita.estado === 'no_asistio').length;
        
        setEstadisticas({
          totalCitas,
          citasCompletadas,
          citasProgramadas,
          citasPendientes,
          citasCanceladas,
          citasNoAsistio
        });
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      
      // Solo mostrar error si es un problema real del servidor (no 404 o datos vacíos)
      if (error.response?.status >= 500 || !error.response) {
        toast.error('Error al conectar con el servidor. Por favor, inténtalo más tarde.');
      } else if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        // Para otros errores (como 404), solo log en consola, no mostrar toast
        console.warn('Respuesta inesperada del servidor:', error.response?.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const fechaHoraCita = (cita) => {
    if (!cita) return null;
    const fechaStr = typeof cita.fecha === 'string'
      ? cita.fecha.split('T')[0]
      : new Date(cita.fecha).toISOString().split('T')[0];
    return cita.hora ? new Date(`${fechaStr}T${cita.hora}`) : new Date(cita.fecha);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return hora;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'status-pendiente';
      case 'programada':
        return 'status-programada';
      case 'completada':
        return 'status-completada';
      case 'cancelada':
        return 'status-cancelada';
      case 'no_asistio':
        return 'status-noasistio';
      default:
        return 'status-programada';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'programada':
        return <Clock size={16} className="text-blue-500" />;
      case 'completada':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelada':
        return <XCircle size={16} className="text-red-500" />;
      case 'no_asistio':
        return <AlertCircle size={16} className="text-purple-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const puedeModificarCita = (cita) => {
    if (!cita) return false;
    
    // No permitir modificar citas canceladas o completadas
    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      return false;
    }
    
    // Los administradores pueden cancelar citas programadas y pendientes
    if (usuario?.rol === 'administrador') {
      return cita.estado === 'programada' || cita.estado === 'pendiente';
    }
    
    // Para pacientes, pueden cancelar solicitudes pendientes
    if (cita.estado === 'pendiente') {
      return true;
    }
    
    // Para citas programadas, verificar tiempo restante
    if (cita.estado === 'programada') {
      const fechaCita = fechaHoraCita(cita);
      const ahora = new Date();
      const horasHastaLaCita = (fechaCita - ahora) / (1000 * 60 * 60);
      return horasHastaLaCita >= 24;
    }
    
    return false;
  };

  const cancelarCita = async (citaId) => {
    try {
      await axios.put(`http://localhost:5000/api/citas/${citaId}/cancelar`);
      
      toast.success('Cita cancelada exitosamente');
      setMostrarConfirmacion(null);
      cargarDatos(); // Recargar datos
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const citasProximas = citas
    .filter(cita => {
      const fechaCita = fechaHoraCita(cita);
      const ahora = new Date();
      return fechaCita >= ahora && cita.estado === 'programada';
    })
    .sort((a, b) => fechaHoraCita(a) - fechaHoraCita(b))
    .slice(0, 5);

  if (loading) {
    return <LoadingSpinner message="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-title">
                Bienvenido{usuario?.rol === 'administrador' ? ' Administrador' : ''}, {usuario?.nombre}
              </h1>
              <p className="dashboard-subtitle">
                {usuario?.rol === 'administrador' 
                  ? 'Gestiona todas las citas y pacientes de la clínica'
                  : 'Aquí puedes ver y gestionar tus citas médicas'
                }
              </p>
            </div>
            <div className="dashboard-date">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="dashboard-actions">
            {/* Solo mostrar botón de Nueva Cita para pacientes, no para administradores */}
            {usuario?.rol !== 'administrador' && (
              <Link to="/nueva-cita" className="btn btn-primary">
                <Plus size={20} />
                Nueva Cita
              </Link>
            )}
            <Link to="/mis-citas" className="btn btn-secondary">
              <Calendar size={20} />
              {usuario?.rol === 'administrador' ? 'Todas las Citas' : 'Mis Citas'}
            </Link>
          </div>
        </div>

        {/* Estadísticas para Administrador */}
        {usuario?.rol === 'administrador' && (
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon warning">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.solicitudesPendientes || 0}</div>
                <div className="stat-label">Solicitudes Pendientes</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasProgramadas || 0}</div>
                <div className="stat-label">Citas Programadas</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon success">
                    <CheckCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasCompletadas || 0}</div>
                <div className="stat-label">Citas Completadas</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon warning">
                    <Clock size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasCanceladas || 0}</div>
                <div className="stat-label">Citas Canceladas</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasNoAsistio || 0}</div>
                <div className="stat-label">No asistió</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Activity size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasHoy || 0}</div>
                <div className="stat-label">Citas Hoy</div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas para Paciente */}
        {usuario?.rol === 'paciente' && (
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.totalCitas || 0}</div>
                <div className="stat-label">Total de Citas</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon warning">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasPendientes || 0}</div>
                <div className="stat-label">Solicitudes Pendientes</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasProgramadas || 0}</div>
                <div className="stat-label">Citas Programadas</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon success">
                    <CheckCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasCompletadas || 0}</div>
                <div className="stat-label">Citas Completadas</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon danger">
                    <XCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasCanceladas || 0}</div>
                <div className="stat-label">Citas Canceladas</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <AlertCircle size={24} />
                  </div>
                </div>
                <div className="stat-value">{estadisticas.citasNoAsistio || 0}</div>
                <div className="stat-label">No asistió</div>
              </div>
            </div>
          </div>
        )}

        {/* Próximas Citas */}
        <div className="dashboard-content">
          <div className="main-content">
            {/* Solicitudes Pendientes - Solo para Administradores */}
            {usuario?.rol === 'administrador' && solicitudesPendientes.length > 0 && (
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>
                    <AlertCircle size={24} />
                    Solicitudes Pendientes ({solicitudesPendientes.length})
                  </h2>
                  <Link to="/mis-citas?estado=pendiente" className="view-all-link">
                    Ver todas
                  </Link>
                </div>
                
                <div className="card-body">
                  <div className="appointments-list">
                    {solicitudesPendientes.slice(0, 5).map((solicitud) => {
                      const fecha = new Date(solicitud.fecha);
                      const dia = fecha.getDate();
                      const mes = fecha.toLocaleDateString('es-CO', { month: 'short' });
                      
                      return (
                        <div key={solicitud._id} className="appointment-item solicitud-pendiente">
                          <div className="appointment-date">
                            <div className="date-day">{dia}</div>
                            <div className="date-month">{mes}</div>
                          </div>
                          
                          <div className="appointment-details">
                            <h4>Solicitud de {solicitud.paciente?.nombre || 'Paciente'}</h4>
                            <div className="appointment-time">
                              <Clock size={16} />
                              {formatearHora(solicitud.hora)}
                            </div>
                            <div className="appointment-time">
                              <User size={16} />
                              {solicitud.paciente?.email || 'Sin email'}
                            </div>
                            <div className="appointment-time">
                              <strong>Motivo:</strong> {solicitud.motivo}
                            </div>
                            {solicitud.descripcionAdicional && (
                              <div className="appointment-description">
                                <strong>Descripción:</strong> {solicitud.descripcionAdicional}
                              </div>
                            )}
                          </div>
                          
                          <div className="appointment-actions">
                            <Link 
                              to={`/cita/${solicitud._id}`} 
                              className="btn btn-sm btn-secondary"
                            >
                              <Eye size={16} />
                              Ver detalles
                            </Link>
                          </div>
                          
                          <div className="appointment-status status-pendiente">
                            Pendiente
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-card">
              <div className="card-header">
                <h2>
                  <Calendar size={24} />
                  {usuario?.rol === 'administrador' ? 'Próximas Citas' : 'Mis Próximas Citas'}
                </h2>
                <Link to="/mis-citas" className="view-all-link">
                  Ver todas
                </Link>
              </div>
              
              <div className="card-body">
                {citasProximas.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={48} />
                    <h3>
                      {citas.length === 0 
                        ? (usuario?.rol === 'administrador' 
                            ? 'Aún no se han registrado citas en el sistema. Las citas aparecerán aquí cuando los pacientes las agenden.'
                            : 'Parece que eres nuevo aquí. ¡Agenda tu primera cita para comenzar!'
                          )
                        : (usuario?.rol === 'administrador' 
                            ? 'No hay citas programadas próximamente'
                            : 'No tienes citas programadas próximamente'
                          )
                      }
                    </h3>
                    <p>
                      {citas.length === 0 
                        ? (usuario?.rol === 'administrador' 
                            ? 'Aún no se han registrado citas en el sistema. Las citas aparecerán aquí cuando los pacientes las agenden.'
                            : 'Parece que eres nuevo aquí. ¡Agenda tu primera cita para comenzar!'
                          )
                        : (usuario?.rol === 'administrador' 
                            ? 'No hay citas programadas próximamente'
                            : 'No tienes citas programadas próximamente'
                          )
                      }
                    </p>
                    {/* Solo mostrar botón de Nueva Cita para pacientes, no para administradores */}
                    {usuario?.rol !== 'administrador' && (
                      <Link to="/nueva-cita" className="btn btn-primary">
                        <Plus size={20} />
                        {citas.length === 0 ? 'Agendar Primera Cita' : 'Agendar Nueva Cita'}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="appointments-list">
                    {citasProximas.map((cita) => {
                      const fecha = new Date(cita.fecha);
                      const dia = fecha.getDate();
                      const mes = fecha.toLocaleDateString('es-CO', { month: 'short' });
                      
                      return (
                        <div key={cita._id} className="appointment-item">
                          <div className="appointment-date">
                            <div className="date-day">{dia}</div>
                            <div className="date-month">{mes}</div>
                          </div>
                          
                          <div className="appointment-details">
                            <h4>
                              {usuario?.rol === 'administrador' && cita.paciente?.nombre 
                                ? `Cita con ${cita.paciente.nombre}` 
                                : 'Mi Cita'
                              }
                            </h4>
                            <div className="appointment-time">
                              <Clock size={16} />
                              {formatearHora(cita.hora)}
                            </div>
                            {usuario?.rol === 'administrador' && (
                              <div className="appointment-time">
                                <User size={16} />
                                {cita.paciente?.nombre || 'Paciente'}
                              </div>
                            )}
                            <div className="appointment-time">
                              <strong>Motivo:</strong> {cita.motivo}
                            </div>
                          </div>
                          
                          <div className="appointment-actions">
                            <Link 
                              to={`/cita/${cita._id}`} 
                              className="btn btn-sm btn-secondary"
                            >
                              <Eye size={16} />
                              Ver detalles
                            </Link>
                            {puedeModificarCita(cita) && (
                              <button
                                onClick={() => setMostrarConfirmacion(cita._id)}
                                className="btn btn-sm btn-danger"
                                title="Cancelar cita"
                              >
                                <Trash2 size={16} />
                                Cancelar
                              </button>
                            )}
                          </div>
                          
                          <div className={`appointment-status ${getEstadoColor(cita.estado)}`}>
                            {cita.estado}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="sidebar-content">
            {/* Acciones Rápidas */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>
                  <Activity size={24} />
                  Acciones Rápidas
                </h3>
              </div>
              
              <div className="card-body">
                <div className="quick-actions">
                  {/* Solo mostrar "Agendar Cita" para pacientes, no para administradores */}
                  {usuario?.rol !== 'administrador' && (
                    <Link to="/nueva-cita" className="quick-action-item">
                      <div className="action-icon">
                        <Plus size={24} />
                      </div>
                      <div className="action-content">
                        <h4>Agendar Cita</h4>
                        <p>Programa una nueva cita médica</p>
                      </div>
                    </Link>
                  )}
                  
                  <Link to="/mis-citas" className="quick-action-item">
                    <div className="action-icon">
                      <Calendar size={24} />
                    </div>
                    <div className="action-content">
                      <h4>{usuario?.rol === 'administrador' ? 'Gestionar Citas' : 'Mis Citas'}</h4>
                      <p>Ver y gestionar citas</p>
                    </div>
                  </Link>
                  
                  <Link to="/perfil" className="quick-action-item">
                    <div className="action-icon">
                      <User size={24} />
                    </div>
                    <div className="action-content">
                      <h4>Mi Perfil</h4>
                      <p>Actualizar información personal</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Cancelación */}
      {mostrarConfirmacion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Cancelación</h3>
            <p>
              ¿Estás seguro de que deseas cancelar esta cita?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setMostrarConfirmacion(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => cancelarCita(mostrarConfirmacion)}
                className="btn btn-danger"
              >
                Cancelar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;