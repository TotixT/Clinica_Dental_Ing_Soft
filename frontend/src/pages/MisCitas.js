import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './MisCitas.css';

const MisCitas = () => {
  const [citas, setCitas] = useState([]);
  const [citasFiltradas, setCitasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todas',
    fecha: ''
  });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarCitas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtros]);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      
      // La ruta /api/citas/ maneja ambos casos según el rol del usuario
      const response = await axios.get('/citas/');
      const citasData = response.data.citas || response.data;
      
      // Si citasData es un array, usarlo; si no, inicializar como array vacío
      setCitas(Array.isArray(citasData) ? citasData : []);
      
    } catch (error) {
      console.error('Error al cargar citas:', error);
      
      // Solo mostrar error si es un error real del servidor (no 404 o datos vacíos)
      if (error.response?.status !== 404 && error.response?.status !== 204) {
        toast.error('Error al cargar las citas. Por favor, inténtalo de nuevo.');
      }
      
      // Asegurar que citas sea un array vacío en caso de error
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let citasFiltradas = [...citas];

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      citasFiltradas = citasFiltradas.filter(cita => 
        cita.motivo.toLowerCase().includes(busqueda) ||
        (usuario?.rol === 'administrador' && cita.paciente?.nombre && cita.paciente.nombre.toLowerCase().includes(busqueda)) ||
        (usuario?.rol !== 'administrador' && cita.usuario?.nombre && cita.usuario.nombre.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por estado
    if (filtros.estado !== 'todas') {
      citasFiltradas = citasFiltradas.filter(cita => cita.estado === filtros.estado);
    }

    // Filtro por fecha
    if (filtros.fecha) {
      citasFiltradas = citasFiltradas.filter(cita => 
        cita.fecha.split('T')[0] === filtros.fecha
      );
    }

    // Ordenar por fecha y hora
    citasFiltradas.sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.hora}`);
      const fechaB = new Date(`${b.fecha}T${b.hora}`);
      return fechaB - fechaA; // Más recientes primero
    });

    setCitasFiltradas(citasFiltradas);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const cancelarCita = async (citaId) => {
    try {
      await axios.put(`http://localhost:5000/api/citas/${citaId}/cancelar`);
      
      toast.success('Cita cancelada exitosamente');
      setMostrarConfirmacion(null);
      cargarCitas(); // Recargar datos
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const eliminarCita = async (citaId) => {
    try {
      await axios.delete(`/citas/${citaId}`);
      toast.success('Cita eliminada exitosamente');
      cargarCitas();
      setMostrarConfirmacion(null);
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la cita');
    }
  };

  const completarCita = async (citaId) => {
    try {
      await axios.put(`/citas/${citaId}/completar`);
      toast.success('Cita marcada como completada exitosamente');
      cargarCitas();
      setMostrarConfirmacion(null);
    } catch (error) {
      console.error('Error al completar cita:', error);
      toast.error(error.response?.data?.message || 'Error al completar la cita');
    }
  };

  const autorizarCita = async (citaId) => {
    try {
      await axios.put(`/citas/${citaId}/autorizar`);
      toast.success('Solicitud de cita autorizada exitosamente');
      cargarCitas();
      setMostrarConfirmacion(null);
    } catch (error) {
      console.error('Error al autorizar cita:', error);
      toast.error(error.response?.data?.message || 'Error al autorizar la solicitud');
    }
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
      const fechaCita = new Date(cita.fecha);
      const ahora = new Date();
      const horasHastaLaCita = (fechaCita - ahora) / (1000 * 60 * 60);
      return horasHastaLaCita >= 24;
    }
    
    return false;
  };

  if (loading) {
    return <LoadingSpinner message="Cargando citas..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-title">
                <Calendar size={28} />
                {usuario?.rol === 'administrador' ? 'Todas las Citas' : 'Mis Citas'}
              </h1>
              <p className="dashboard-subtitle">
                {usuario?.rol === 'administrador' 
                  ? 'Gestiona todas las citas de la clínica'
                  : 'Aquí puedes ver y gestionar tus citas médicas'
                }
              </p>
            </div>
          </div>
          <div className="dashboard-actions">
            {usuario?.rol !== 'administrador' && (
              <Link to="/nueva-cita" className="btn btn-primary">
                <Plus size={20} />
                Nueva Cita
              </Link>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Filtros de Búsqueda</h3>
          </div>
          <div className="card-body">
            <div className="filtros-row">
              <div className="filtro-busqueda">
                <Search size={20} />
                <input
                  type="text"
                  placeholder={usuario?.rol === 'administrador' ? 'Buscar por paciente o motivo...' : 'Buscar por motivo...'}
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="filtro-input"
                />
              </div>
              
              <div className="filtro-grupo">
                <Filter size={20} />
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="filtro-select"
                >
                  <option value="todas">Todos los estados</option>
                  <option value="pendiente">Solicitudes Pendientes</option>
                  <option value="programada">Programadas</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                  <option value="no_asistio">No asistió</option>
                </select>
              </div>
              
              <div className="filtro-fecha">
                <input
                  type="date"
                  value={filtros.fecha}
                  onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                  className="filtro-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <Calendar size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.length}</div>
              <div className="stat-label">Total de Citas</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon warning">
                  <AlertCircle size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.filter(c => c.estado === 'pendiente').length}</div>
              <div className="stat-label">Solicitudes Pendientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.filter(c => c.estado === 'programada').length}</div>
              <div className="stat-label">Programadas</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon success">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.filter(c => c.estado === 'completada').length}</div>
              <div className="stat-label">Completadas</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon warning">
                  <XCircle size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.filter(c => c.estado === 'cancelada').length}</div>
              <div className="stat-label">Canceladas</div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <AlertCircle size={24} />
                </div>
              </div>
              <div className="stat-value">{citas.filter(c => c.estado === 'no_asistio').length}</div>
              <div className="stat-label">No asistió</div>
            </div>
          </div>
        </div>

        {/* Lista de citas */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Lista de Citas</h3>
          </div>
          <div className="card-body">
            {citasFiltradas.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>
                  {filtros.busqueda || filtros.estado !== 'todas' || filtros.fecha
                    ? 'No se encontraron citas'
                    : usuario?.rol === 'administrador'
                      ? 'No hay citas registradas'
                      : '¡Bienvenido a SonriPlus!'
                  }
                </h3>
                <p>
                  {filtros.busqueda || filtros.estado !== 'todas' || filtros.fecha
                    ? 'No hay citas que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                    : usuario?.rol === 'administrador'
                      ? 'Aún no hay citas registradas en el sistema. Los pacientes pueden agendar sus citas desde la aplicación.'
                      : 'Parece que aún no has agendado tu primera cita con nosotros. ¡Es muy fácil comenzar! Haz clic en el botón de abajo para agendar tu primera consulta.'
                  }
                </p>
                {!(filtros.busqueda || filtros.estado !== 'todas' || filtros.fecha) && usuario?.rol !== 'administrador' && (
                  <Link to="/nueva-cita" className="btn btn-primary">
                    <Plus size={20} />
                    Agendar Mi Primera Cita
                  </Link>
                )}
                {(filtros.busqueda || filtros.estado !== 'todas' || filtros.fecha) && (
                  <button 
                    onClick={() => setFiltros({ busqueda: '', estado: 'todas', fecha: '' })}
                    className="btn btn-secondary"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="appointments-list">
                {citasFiltradas.map((cita) => (
                  <div key={cita._id} className="appointment-item">
                    <div className="appointment-date">
                      <div className="date-day">{new Date(cita.fecha).getDate()}</div>
                      <div className="date-month">{new Date(cita.fecha).toLocaleDateString('es-CO', { month: 'short' })}</div>
                    </div>
                    
                    <div className="appointment-details">
                      <h4>
                        {usuario?.rol === 'administrador' && cita.paciente?.nombre 
                          ? `${cita.motivo} - ${cita.paciente.nombre}` 
                          : cita.motivo
                        }
                      </h4>
                      <div className="appointment-time">
                        <Clock size={16} />
                        {formatearHora(cita.hora)}
                      </div>
                      
                      {usuario?.rol === 'administrador' && (
                        <div className="appointment-patient">
                          <User size={16} />
                          {cita.paciente?.nombre || 'Paciente'}  
                          <small>{cita.paciente?.email}</small>
                        </div>
                      )}
                      
                      <div className="cita-meta">
                        <small>
                          Creada: {new Date(cita.fechaCreacion).toLocaleDateString('es-CO')}
                        </small>
                      </div>
                    </div>
                    
                    <div className={`appointment-status ${getEstadoColor(cita.estado)}`}>
                      {getEstadoIcon(cita.estado)}
                      <span>{cita.estado}</span>
                    </div>
                    
                    <div className="cita-actions">
                      <Link 
                        to={`/cita/${cita._id}`} 
                        className="btn btn-secondary"
                      >
                        <Eye size={16} />
                        Ver
                      </Link>
                      
                      {puedeModificarCita(cita) && (
                        <button
                          onClick={() => setMostrarConfirmacion({ id: cita._id, accion: 'cancelar' })}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                          Cancelar
                        </button>
                      )}
                      
                      {usuario?.rol === 'administrador' && cita.estado === 'pendiente' && (
                        <button
                          onClick={() => setMostrarConfirmacion({ id: cita._id, accion: 'autorizar' })}
                          className="btn btn-success"
                        >
                          <CheckCircle size={16} />
                          Autorizar
                        </button>
                      )}
                      
                      {usuario?.rol === 'administrador' && cita.estado === 'programada' && (
                        <button
                          onClick={() => setMostrarConfirmacion({ id: cita._id, accion: 'completar' })}
                          className="btn btn-success"
                        >
                          <CheckCircle size={16} />
                          Completar
                        </button>
                      )}
                      
                      {usuario?.rol === 'administrador' && (
                        <button
                          onClick={() => setMostrarConfirmacion({ id: cita._id, accion: 'eliminar' })}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de confirmación */}
        {mostrarConfirmacion && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirmar Acción</h3>
              <p>
                ¿Estás seguro de que deseas {mostrarConfirmacion.accion} esta cita?
                {mostrarConfirmacion.accion === 'eliminar' && 
                  ' Esta acción no se puede deshacer.'
                }
                {mostrarConfirmacion.accion === 'completar' && 
                  ' La cita será marcada como completada.'
                }
                {mostrarConfirmacion.accion === 'autorizar' && 
                  ' La solicitud será autorizada y convertida en una cita programada.'
                }
              </p>
              <div className="modal-actions">
                <button
                  onClick={() => setMostrarConfirmacion(null)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (mostrarConfirmacion.accion === 'cancelar') {
                      cancelarCita(mostrarConfirmacion.id);
                    } else if (mostrarConfirmacion.accion === 'completar') {
                      completarCita(mostrarConfirmacion.id);
                    } else if (mostrarConfirmacion.accion === 'autorizar') {
                      autorizarCita(mostrarConfirmacion.id);
                    } else {
                      eliminarCita(mostrarConfirmacion.id);
                    }
                  }}
                  className={`btn ${
                    mostrarConfirmacion.accion === 'eliminar' ? 'btn-danger' : 
                    mostrarConfirmacion.accion === 'completar' || mostrarConfirmacion.accion === 'autorizar' ? 'btn-success' : 
                    'btn-primary'
                  }`}
                >
                  {mostrarConfirmacion.accion === 'eliminar' ? 'Eliminar' : 
                   mostrarConfirmacion.accion === 'completar' ? 'Completar Cita' :
                   mostrarConfirmacion.accion === 'autorizar' ? 'Autorizar Solicitud' :
                   'Cancelar Cita'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCitas;