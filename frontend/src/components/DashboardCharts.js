import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import './DashboardCharts.css';

const DashboardCharts = () => {
  const [citasPorEstado, setCitasPorEstado] = useState([]);
  const [citasPorDia, setCitasPorDia] = useState([]);
  const [pacientesFrecuentes, setPacientesFrecuentes] = useState([]);
  const [horariosPopulares, setHorariosPopulares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosGraficos();
  }, []);

  const cargarDatosGraficos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar datos en paralelo
      const [estadoRes, diaRes, pacientesRes, horariosRes] = await Promise.all([
        fetch('http://localhost:5000/api/reportes/citas-por-estado', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/reportes/citas-por-dia', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/reportes/pacientes-frecuentes?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/reportes/horarios-populares', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (estadoRes.ok) {
        const estadoData = await estadoRes.json();
        setCitasPorEstado(estadoData.citasPorEstado || []);
      }

      if (diaRes.ok) {
        const diaData = await diaRes.json();
        console.log('Datos recibidos del backend:', diaData.citasPorDia);
        // Usar los datos del backend directamente tal como vienen
        setCitasPorDia(diaData.citasPorDia || []);
      }

      if (pacientesRes.ok) {
        const pacientesData = await pacientesRes.json();
        setPacientesFrecuentes(pacientesData.pacientesFrecuentes || []);
      }

      if (horariosRes.ok) {
        const horariosData = await horariosRes.json();
        setHorariosPopulares(horariosData.horariosPopulares || []);
      }

    } catch (error) {
      console.error('Error al cargar datos de gráficos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="charts-loading">
        <div className="loading-spinner"></div>
        <p>Cargando gráficos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-charts">
      {/* Citas por Estado */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Citas por Estado</h3>
          <p>Distribución de estados de citas</p>
        </div>
        <div className="chart-content">
          {citasPorEstado.length > 0 ? (
            <div className="estado-chart">
              {citasPorEstado.map((item, index) => (
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

      {/* Citas por Día */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Citas por Día</h3>
          <p>Tendencias diarias de citas</p>
        </div>
        <div className="chart-content">
          <div className="dia-chart">
            {citasPorDia && citasPorDia.length > 0 ? (
              citasPorDia.map((item, index) => (
                <div key={index} className="dia-item">
                  <div className="dia-label">{item.dia?.substring(0, 3).toUpperCase() || 'N/A'}</div>
                  <div className="dia-bar">
                    <div 
                      className="dia-fill"
                      style={{ height: `${Math.max((item.total || 0) * 10, 5)}px` }}
                      title={`${item.total || 0} citas`}
                    ></div>
                  </div>
                  <div className="dia-count">{item.total || 0}</div>
                </div>
              ))
            ) : (
              <div className="empty-chart">
                <BarChart3 size={48} />
                <p>Cargando datos de citas por día...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pacientes Más Frecuentes */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>👥 Pacientes Más Frecuentes</h3>
          <p>Top 5 pacientes con más citas</p>
        </div>
        <div className="chart-content">
          {pacientesFrecuentes.length > 0 ? (
            <div className="patients-table-container">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Puesto</th>
                    <th>Paciente</th>
                    <th>Total Citas</th>
                    <th>Todas las Citas</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientesFrecuentes.slice(0, 5).map((paciente, index) => {
                    const position = index + 1;
                    const medals = ['🥇', '🥈', '🥉', '', ''];
                    // Calcular el total de todas las citas (completadas + programadas + canceladas)
                    const todasLasCitas = (paciente.citasCompletadas || 0) + 
                                         (paciente.citasProgramadas || 0) + 
                                         (paciente.citasCanceladas || 0);
                    return (
                      <tr key={paciente._id || index} className={`table-row rank-${position}`}>
                        <td className="rank-cell">
                          <div className="rank-content">
                            <span className="rank-number">#{position}</span>
                            {medals[index] && <span className="rank-medal">{medals[index]}</span>}
                          </div>
                        </td>
                        <td className="patient-cell">
                          <div className="patient-info">
                            <div className="patient-name">{paciente.nombre || 'Paciente desconocido'}</div>
                          </div>
                        </td>
                        <td className="citas-cell">
                          <span className="citas-total">{paciente.totalCitas || 0}</span>
                        </td>
                        <td className="completadas-cell">
                          <span className="citas-completadas">{todasLasCitas}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-chart">
              <Users size={48} />
              <p>No hay datos de pacientes frecuentes disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Horarios Más Populares */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Horarios Más Populares</h3>
          <p>Franjas horarias con mayor demanda</p>
        </div>
        <div className="chart-content">
          {horariosPopulares.length > 0 ? (
            <div className="horarios-list-container">
              <div className="horarios-list">
                {horariosPopulares.map((horario, index) => (
                  <div key={index} className="horario-item">
                    <div className="horario-time">{horario.horario || 'N/A'}</div>
                    <div className="horario-bar">
                      <div 
                        className="horario-fill"
                        style={{ 
                          width: horariosPopulares.length > 0 && Math.max(...horariosPopulares.map(h => h.total || 0)) > 0
                            ? `${((horario.total || 0) / Math.max(...horariosPopulares.map(h => h.total || 0))) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <div className="horario-stats">
                      <span className="horario-total">{horario.total || 0} citas</span>
                      <span className={`horario-demanda ${(horario.demanda || 'baja').toLowerCase()}`}>
                        {horario.demanda || 'Baja'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
  );
};

export default DashboardCharts;