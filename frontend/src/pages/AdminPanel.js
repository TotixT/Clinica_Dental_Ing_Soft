import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Settings, 
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import GestionUsuarios from './GestionUsuarios';
import Reportes from './Reportes';
import DashboardCharts from '../components/DashboardCharts';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalUsuarios: 0,
    totalCitas: 0,
    citasHoy: 0,
    citasProgramadas: 0,
    citasCompletadas: 0,
    citasCanceladas: 0,
    nuevosUsuarios: 0,
    ingresosMes: 0
  });
  const [citasRecientes, setCitasRecientes] = useState([]);
  const [usuariosRecientes, setUsuariosRecientes] = useState([]);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      cargarDashboardData();
    }
  }, [activeSection]);

  const cargarDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar estadísticas del dashboard
      const statsResponse = await fetch('http://localhost:5000/api/reportes/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Datos del dashboard:', statsData); // Para debug
        // Mapear los datos de la API a la estructura esperada por el componente
        setEstadisticas({
          totalUsuarios: statsData.estadisticas?.totalUsuarios || 0,
          totalCitas: statsData.estadisticas?.totalCitas || 0,
          citasHoy: statsData.estadisticas?.citasHoy || 0,
          citasProgramadas: statsData.estadisticas?.citasProgramadas || 0,
          citasCompletadas: statsData.estadisticas?.citasCompletadas || 0,
          citasCanceladas: statsData.estadisticas?.citasCanceladas || 0,
          nuevosUsuarios: statsData.estadisticas?.nuevosUsuariosMes || 0,
          ingresosMes: statsData.estadisticas?.ingresosMes || 0
        });
      } else {
        console.error('Error al cargar estadísticas:', statsResponse.status);
        toast.error('Error al cargar estadísticas del dashboard');
      }

      // Cargar citas recientes
      const citasResponse = await fetch('http://localhost:5000/api/citas?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (citasResponse.ok) {
        const citasData = await citasResponse.json();
        console.log('Citas recientes:', citasData); // Para debug
        setCitasRecientes(citasData.citas || citasData || []);
      }

      // Cargar usuarios recientes
      const usuariosResponse = await fetch('http://localhost:5000/api/usuarios?limit=5&sort=fechaRegistro', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usuariosResponse.ok) {
        const usuariosData = await usuariosResponse.json();
        console.log('Usuarios recientes:', usuariosData); // Para debug
        setUsuariosRecientes(usuariosData.usuarios || usuariosData || []);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="status-icon completada" />;
      case 'cancelada':
        return <XCircle className="status-icon cancelada" />;
      case 'programada':
        return <Clock className="status-icon programada" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      );
    }

    return (
      <div className="dashboard-content">
        {/* Estadísticas principales */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon usuarios">
              <Users />
            </div>
            <div className="stat-content">
              <h3>Total Usuarios</h3>
              <p className="stat-number">{estadisticas.totalUsuarios}</p>
              <span className="stat-change">+{estadisticas.nuevosUsuarios} este mes</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon citas">
              <Calendar />
            </div>
            <div className="stat-content">
              <h3>Total Citas</h3>
              <p className="stat-number">{estadisticas.totalCitas}</p>
              <span className="stat-change">{estadisticas.citasHoy} hoy</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon programadas">
              <Clock />
            </div>
            <div className="stat-content">
              <h3>Citas Programadas</h3>
              <p className="stat-number">{estadisticas.citasProgramadas}</p>
              <span className="stat-change">Requieren atención</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon ingresos">
              <TrendingUp />
            </div>
            <div className="stat-content">
              <h3>Ingresos del Mes</h3>
              <p className="stat-number">€{estadisticas.ingresosMes}</p>
              <span className="stat-change">Estimado</span>
            </div>
          </div>
        </div>

        {/* Gráficos y resumen */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Estado de Citas</h3>
              <p>Distribución actual</p>
            </div>
            <div className="chart-content">
              <div className="status-summary">
                <div className="status-item">
                  <CheckCircle className="status-icon completada" />
                  <div className="status-info">
                    <span className="status-label">Completadas:</span>
                    <span className="status-count">{estadisticas.citasCompletadas}</span>
                  </div>
                </div>
                <div className="status-item">
                  <Clock className="status-icon programada" />
                  <div className="status-info">
                    <span className="status-label">Programadas:</span>
                    <span className="status-count">{estadisticas.citasProgramadas}</span>
                  </div>
                </div>
                <div className="status-item">
                  <XCircle className="status-icon cancelada" />
                  <div className="status-info">
                    <span className="status-label">Canceladas:</span>
                    <span className="status-count">{estadisticas.citasCanceladas}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Gráficos detallados */}
        <DashboardCharts />

        {/* Actividad reciente */}
        <div className="recent-activity">
          <div className="activity-card">
            <div className="activity-header">
              <h3>Citas Recientes</h3>
              <button 
                className="view-all-btn"
                onClick={() => setActiveSection('citas')}
              >
                Ver todas
              </button>
            </div>
            <div className="activity-content">
              {citasRecientes.length > 0 ? (
                <div className="activity-list">
                  {citasRecientes.map(cita => (
                    <div key={cita._id} className="activity-item">
                      {getStatusIcon(cita.estado)}
                      <div className="activity-info">
                        <div className="activity-title">
                          {cita.paciente?.nombre || 'Paciente no disponible'}
                        </div>
                        <div className="activity-details">
                          {formatDate(cita.fecha)} - {formatTime(cita.hora)} | {cita.motivo}
                        </div>
                      </div>
                      <span className={`status-badge ${cita.estado}`}>
                        {cita.estado}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No hay citas recientes</p>
                </div>
              )}
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-header">
              <h3>Usuarios Recientes</h3>
              <button 
                className="view-all-btn"
                onClick={() => setActiveSection('usuarios')}
              >
                Ver todos
              </button>
            </div>
            <div className="activity-content">
              {usuariosRecientes.length > 0 ? (
                <div className="activity-list">
                  {usuariosRecientes.map(usuario => (
                    <div key={usuario._id} className="activity-item">
                      <UserCheck className="status-icon usuario" />
                      <div className="activity-info">
                        <div className="activity-title">{usuario.nombre}</div>
                        <div className="activity-details">
                          {usuario.email} | {usuario.rol}
                        </div>
                      </div>
                      <span className="date-badge">
                        {formatDate(usuario.fechaRegistro)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Users size={48} />
                  <p>No hay usuarios recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'usuarios':
        return <GestionUsuarios />;
      case 'citas':
        return (
          <div className="placeholder-content">
            <Calendar size={64} />
            <h3>Gestión de Citas</h3>
            <p>Esta sección está en desarrollo. Por ahora puedes usar la página "Citas" del menú principal.</p>
          </div>
        );
      case 'reportes':
        return <Reportes />;
      case 'configuracion':
        return (
          <div className="placeholder-content">
            <Settings size={64} />
            <h3>Configuración del Sistema</h3>
            <p>Panel de configuración en desarrollo.</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p>Panel de Administración</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveSection('usuarios')}
          >
            <Users size={20} />
            <span>Gestión de Usuarios</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'citas' ? 'active' : ''}`}
            onClick={() => setActiveSection('citas')}
          >
            <Calendar size={20} />
            <span>Gestión de Citas</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'reportes' ? 'active' : ''}`}
            onClick={() => setActiveSection('reportes')}
          >
            <TrendingUp size={20} />
            <span>Reportes</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'configuracion' ? 'active' : ''}`}
            onClick={() => setActiveSection('configuracion')}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </nav>
      </div>

      <div className="admin-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;