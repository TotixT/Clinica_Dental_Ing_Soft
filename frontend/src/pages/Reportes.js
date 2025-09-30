import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users, 
  FileText,
  FileSpreadsheet,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar
} from 'lucide-react';
import './Reportes.css';

const Reportes = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalCitas: 0,
    citasCompletadas: 0,
    citasCanceladas: 0,
    citasProgramadas: 0,
    totalPacientes: 0,
    nuevosUsuarios: 0,
    ingresosMes: 0,
    citasPorDia: [],
    citasPorEstado: [],
    pacientesFrecuentes: [],
    horariosPopulares: []
  });

  useEffect(() => {
    cargarReportes();
  }, [dateRange]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      
      // Obtener token de autorización
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No se encontró token de autenticación');
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Construir parámetros de fecha para el filtro
      const dateParams = `inicio=${dateRange.inicio}&fin=${dateRange.fin}`;
      
      // Cargar datos en paralelo usando Promise.all como en el Dashboard
      const [statsRes, estadoRes, diaRes, pacientesRes, horariosRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reportes/dashboard?${dateParams}`, {
          headers
        }),
        fetch(`http://localhost:5000/api/reportes/citas-por-estado?${dateParams}`, {
          headers
        }),
        fetch(`http://localhost:5000/api/reportes/citas-por-dia?${dateParams}`, {
          headers
        }),
        fetch(`http://localhost:5000/api/reportes/pacientes-frecuentes?limit=10&${dateParams}`, {
          headers
        }),
        fetch(`http://localhost:5000/api/reportes/horarios-populares?${dateParams}`, {
          headers
        })
      ]);

      // Procesar respuestas
      let statsData = {};
      let citasPorEstadoData = [];
      let citasPorDiaData = [];
      let pacientesFrecuentesData = [];
      let horariosPopularesData = [];

      if (statsRes.ok) {
        const data = await statsRes.json();
        statsData = data.estadisticas || data || {};
      } else {
        console.error('Error al cargar estadísticas:', await statsRes.text());
      }

      if (estadoRes.ok) {
        const data = await estadoRes.json();
        citasPorEstadoData = data.citasPorEstado || [];
      } else {
        console.error('Error al cargar citas por estado:', await estadoRes.text());
      }

      if (diaRes.ok) {
        const data = await diaRes.json();
        citasPorDiaData = data.citasPorDia || [];
      } else {
        console.error('Error al cargar citas por día:', await diaRes.text());
      }

      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        pacientesFrecuentesData = data.pacientesFrecuentes || [];
      } else {
        console.error('Error al cargar pacientes frecuentes:', await pacientesRes.text());
      }

      if (horariosRes.ok) {
        const data = await horariosRes.json();
        horariosPopularesData = data.horariosPopulares || [];
      } else {
        console.error('Error al cargar horarios populares:', await horariosRes.text());
      }
      
      // Actualizar el estado con todos los datos
      setEstadisticas({
        ...statsData,
        citasPorEstado: citasPorEstadoData,
        citasPorDia: citasPorDiaData,
        pacientesFrecuentes: pacientesFrecuentesData,
        horariosPopulares: horariosPopularesData
      });
      
      toast.success('Reportes actualizados correctamente');
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      
      // Solo mostrar error si es un problema real del servidor (no 404 o datos vacíos)
      if (error.response?.status >= 500 || !error.response) {
        toast.error('Error al conectar con el servidor. Por favor, inténtalo más tarde.');
      } else if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        // Para otros errores (como 404), solo log en consola, no mostrar toast
        console.warn('Respuesta inesperada del servidor:', error.response?.status);
        toast.error('Error al cargar reportes');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato) => {
    try {
      const response = await axios.get(`/citas/estadisticas/exportar?formato=${formato}&tipo=estadisticas&inicio=${dateRange.inicio}&fin=${dateRange.fin}`);

      const data = response.data;
        
        let blob;
        let mimeType;
        
        if (formato === 'pdf') {
          // Para PDF, normalmente se recibiría un ArrayBuffer o Blob directamente del servidor
          // Aquí simulamos la creación de un PDF simple con los datos
          const pdfContent = `
            Reporte de Estadísticas - Clínica Dental SonriPlus
            Período: ${dateRange.inicio} al ${dateRange.fin}
            
            Resumen:
            - Total de Citas: ${estadisticas.totalCitas}
            - Citas Completadas: ${estadisticas.citasCompletadas}
            - Citas Canceladas: ${estadisticas.citasCanceladas}
            - Citas Programadas: ${estadisticas.citasProgramadas}
            - Total de Pacientes: ${estadisticas.totalPacientes}
            - Nuevos Usuarios: ${estadisticas.nuevosUsuarios}
            - Ingresos del Mes: ${estadisticas.ingresosMes}
            
            Generado el: ${new Date().toLocaleString()}
          `;
          blob = new Blob([pdfContent], { type: 'application/pdf' });
          mimeType = 'application/pdf';
        } else if (formato === 'excel') {
          // Para Excel, creamos un CSV que Excel puede abrir
          const headers = 'Métrica,Valor\n';
          const rows = [
            `Total de Citas,${estadisticas.totalCitas}`,
            `Citas Completadas,${estadisticas.citasCompletadas}`,
            `Citas Canceladas,${estadisticas.citasCanceladas}`,
            `Citas Programadas,${estadisticas.citasProgramadas}`,
            `Total de Pacientes,${estadisticas.totalPacientes}`,
            `Nuevos Usuarios,${estadisticas.nuevosUsuarios}`,
            `Ingresos del Mes,${estadisticas.ingresosMes}`
          ].join('\n');
          
          const csvContent = headers + rows;
          blob = new Blob([csvContent], { type: 'text/csv' });
          mimeType = 'text/csv';
        } else {
          // JSON por defecto
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          mimeType = 'application/json';
        }
        
        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_estadisticas_${dateRange.inicio}_${dateRange.fin}.${formato}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Reporte exportado exitosamente en formato ${formato.toUpperCase()}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error al exportar reporte: ${error.message}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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
        return <AlertCircle className="status-icon" />;
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'completada':
        return '#10b981';
      case 'cancelada':
        return '#ef4444';
      case 'programada':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getColorByEstado = (estado) => {
    switch (estado) {
      case 'completada': return '#4CAF50';
      case 'programada': return '#2196F3';
      case 'cancelada': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>Reportes y Estadísticas</h1>
        
        <div className="reportes-actions">
          <div className="date-filter-container">
            <button 
              className="btn-filter" 
              onClick={toggleDateFilter}
            >
              <Filter size={16} />
              <span>Filtrar por fecha</span>
              {showDateFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showDateFilter && (
              <div className="date-range-picker">
                <div className="date-input-group">
                  <label>Desde:</label>
                  <div className="date-input-wrapper">
                    <Calendar size={16} />
                    <input 
                      type="date" 
                      name="inicio" 
                      value={dateRange.inicio} 
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
                <div className="date-input-group">
                  <label>Hasta:</label>
                  <div className="date-input-wrapper">
                    <Calendar size={16} />
                    <input 
                      type="date" 
                      name="fin" 
                      value={dateRange.fin} 
                      onChange={handleDateChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="btn-refresh" 
            onClick={cargarReportes} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>
          
          <div className="export-dropdown">
            <button className="btn-export">
              <FileText size={16} />
              <span>Exportar</span>
              <ChevronDown size={16} />
            </button>
            <div className="export-options">
              <button onClick={() => exportarReporte('pdf')}>
                <FileText size={16} />
                <span>Exportar como PDF</span>
                <Download size={16} />
              </button>
              <button onClick={() => exportarReporte('excel')}>
                <FileSpreadsheet size={16} />
                <span>Exportar como Excel</span>
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon total-citas">
                <BarChart3 size={24} />
              </div>
              <div className="stat-info">
                <h3>TOTAL CITAS</h3>
                <p className="stat-value">{estadisticas.totalCitas || 0}</p>
                <p className="stat-description">En el período seleccionado</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon citas-completadas">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>CITAS COMPLETADAS</h3>
                <p className="stat-value">{estadisticas.citasCompletadas || 0}</p>
                <p className="stat-description">{estadisticas.totalCitas ? `${Math.round((estadisticas.citasCompletadas / estadisticas.totalCitas) * 100)}% del total` : '0% del total'}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon total-pacientes">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <h3>TOTAL PACIENTES</h3>
                <p className="stat-value">{estadisticas.totalPacientes || 0}</p>
                <p className="stat-description">Pacientes activos</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon ingresos-mes">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <h3>INGRESOS ESTIMADOS</h3>
                <p className="stat-value">{formatCurrency(estadisticas.ingresosMes)}</p>
                <p className="stat-description">Basado en citas completadas</p>
              </div>
            </div>
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Citas por Estado</h3>
                <p>Distribución de estados de citas</p>
              </div>
              <div className="chart-content">
                {estadisticas.citasPorEstado && estadisticas.citasPorEstado.length > 0 ? (
                  <div className="estado-chart">
                    {estadisticas.citasPorEstado.map((item, index) => (
                      <div key={index} className="estado-item">
                        <div className="estado-info">
                          <span className="estado-label">{item.estado}</span>
                          <span className="estado-count">{item.cantidad}</span>
                        </div>
                        <div className="estado-bar">
                          <div 
                            className={`estado-fill ${item.estado}`}
                            style={{ width: `${item.porcentaje}%` }}
                          ></div>
                        </div>
                        <span className="estado-percentage">{item.porcentaje}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <BarChart3 size={48} />
                    <p>No hay datos de citas por estado disponibles</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Citas por Día</h3>
                <p>Tendencias diarias de citas</p>
              </div>
              <div className="chart-content">
                {estadisticas.citasPorDia && estadisticas.citasPorDia.length > 0 ? (
                  <div className="dia-chart">
                    {estadisticas.citasPorDia.slice(0, 7).map((item, index) => (
                      <div key={index} className="dia-item">
                        <div className="dia-label">{item.dia.substring(0, 3)}</div>
                        <div className="dia-bar">
                          <div 
                            className="dia-fill"
                            style={{ 
                              height: `${item.total === 0 ? 8 : 
                                       item.total === 1 ? 25 : 
                                       item.total <= 3 ? 35 + (item.total * 8) : 
                                       Math.min(item.total * 12 + 20, 90)}px` 
                            }}
                            title={`${item.total} citas`}
                          ></div>
                        </div>
                        <div className="dia-count">{item.total}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <TrendingUp size={48} />
                    <p>No hay datos de citas por día disponibles</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Pacientes Más Frecuentes</h3>
                <p>Top 10 pacientes con más citas</p>
              </div>
              <div className="chart-content">
                {estadisticas.pacientesFrecuentes && estadisticas.pacientesFrecuentes.length > 0 ? (
                  <div className="pacientes-list">
                    <div className="pacientes-table-header">
                      <div>Rank</div>
                      <div>Paciente</div>
                      <div>Total</div>
                      <div>Completadas</div>
                    </div>
                    {estadisticas.pacientesFrecuentes.map((paciente, index) => (
                      <div key={index} className="paciente-item">
                        <div className={`paciente-rank ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`}>
                          #{index + 1}
                        </div>
                        <div className="paciente-info">
                          <div className="paciente-nombre">{paciente.paciente}</div>
                          <div className="paciente-email">{paciente.email}</div>
                        </div>
                        <span className="total-citas">{paciente.totalCitas}</span>
                        <span className="completadas">{paciente.citasCompletadas || 0}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <Users size={48} />
                    <p>No hay datos de pacientes frecuentes disponibles</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Horarios Más Populares</h3>
                <p>Franjas horarias con mayor demanda</p>
              </div>
              <div className="chart-content">
                {estadisticas.horariosPopulares && estadisticas.horariosPopulares.length > 0 ? (
                  <div className="horarios-list">
                    {estadisticas.horariosPopulares.map((horario, index) => (
                      <div key={index} className="horario-item">
                        <div className="horario-time">{horario.horario}</div>
                        <div className="horario-bar">
                          <div 
                            className="horario-fill"
                            style={{ width: `${(horario.total / Math.max(...estadisticas.horariosPopulares.map(h => h.total))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="horario-total">{horario.total}</span>
                        <span className={`horario-demanda ${horario.demanda ? horario.demanda.toLowerCase() : 'media'}`}>
                          {horario.demanda || 'Media'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <Clock size={48} />
                    <p>No hay datos de horarios populares disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reportes;