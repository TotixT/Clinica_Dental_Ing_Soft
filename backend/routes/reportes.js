const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');
const Usuario = require('../models/Usuario');
const { verificarToken } = require('../middleware/auth');

// Middleware para verificar que el usuario sea administrador
const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ 
      mensaje: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// GET /api/reportes/dashboard - Estadísticas generales del dashboard
router.get('/dashboard', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    // Estadísticas básicas
    const estadisticas = {
      // Citas
      totalCitas: await Cita.countDocuments(),
      citasProgramadas: await Cita.countDocuments({ estado: 'programada' }),
      citasCompletadas: await Cita.countDocuments({ estado: 'completada' }),
      citasCanceladas: await Cita.countDocuments({ estado: 'cancelada' }),
      citasHoy: await Cita.countDocuments({
        fecha: {
          $gte: new Date(hoy.setHours(0, 0, 0, 0)),
          $lt: new Date(hoy.setHours(23, 59, 59, 999))
        }
      }),
      citasMes: await Cita.countDocuments({
        fecha: { $gte: inicioMes, $lte: finMes }
      }),
      
      // Usuarios
      totalUsuarios: await Usuario.countDocuments(),
      totalPacientes: await Usuario.countDocuments({ rol: 'paciente' }),
      usuariosActivos: await Usuario.countDocuments({ activo: true }),
      
      // Nuevos registros este mes
      nuevosUsuariosMes: await Usuario.countDocuments({
        fechaRegistro: { $gte: inicioMes, $lte: finMes }
      })
    };

    res.json({ estadisticas });

  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});



// GET /api/reportes/citas-por-mes - Citas agrupadas por mes
router.get('/citas-por-mes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const citasPorMes = await Cita.aggregate([
      {
        $match: {
          fecha: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$fecha' },
          total: { $sum: 1 },
          programadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          completadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          canceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Formatear datos para el frontend
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const datosFormateados = meses.map((mes, index) => {
      const datosMes = citasPorMes.find(item => item._id === index + 1);
      return {
        mes,
        total: datosMes?.total || 0,
        programadas: datosMes?.programadas || 0,
        completadas: datosMes?.completadas || 0,
        canceladas: datosMes?.canceladas || 0
      };
    });

    res.json({ citasPorMes: datosFormateados });

  } catch (error) {
    console.error('Error al obtener citas por mes:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/citas-por-estado - Distribución de citas por estado
router.get('/citas-por-estado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const citasPorEstado = await Cita.aggregate([
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    const estadosFormateados = citasPorEstado.map(item => ({
      estado: item._id,
      cantidad: item.cantidad,
      porcentaje: 0 // Se calculará en el frontend
    }));

    // Calcular porcentajes
    const total = estadosFormateados.reduce((sum, item) => sum + item.cantidad, 0);
    estadosFormateados.forEach(item => {
      item.porcentaje = total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : 0;
    });

    res.json({ citasPorEstado: estadosFormateados });

  } catch (error) {
    console.error('Error al obtener citas por estado:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/citas-por-dia - Citas agrupadas por día
// GET /api/reportes/pacientes-frecuentes - Pacientes más frecuentes
router.get('/pacientes-frecuentes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const pacientesFrecuentes = await Cita.aggregate([
      {
        $group: {
          _id: '$paciente',
          totalCitas: { $sum: 1 },
          citasCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          citasProgramadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          citasCanceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'pacienteInfo'
        }
      },
      {
        $unwind: '$pacienteInfo'
      },
      {
        $project: {
          _id: 1,
          nombre: '$pacienteInfo.nombre',
          email: '$pacienteInfo.email',
          telefono: '$pacienteInfo.telefono',
          totalCitas: 1,
          citasCompletadas: 1,
          citasProgramadas: 1,
          citasCanceladas: 1
        }
      },
      {
        $sort: { totalCitas: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({ pacientesFrecuentes });

  } catch (error) {
    console.error('Error al obtener pacientes frecuentes:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/horarios-populares - Horarios más populares
router.get('/horarios-populares', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const horariosPopulares = await Cita.aggregate([
      {
        $group: {
          _id: '$hora',
          total: { $sum: 1 },
          programadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          completadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const datosFormateados = horariosPopulares.map(item => ({
      horario: item._id,
      total: item.total,
      programadas: item.programadas,
      completadas: item.completadas,
      demanda: item.total > 5 ? 'Alta' : item.total > 2 ? 'Media' : 'Baja'
    }));

    res.json({ horariosPopulares: datosFormateados });

  } catch (error) {
    console.error('Error al obtener horarios populares:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/usuarios-registros - Registros de usuarios por mes
router.get('/usuarios-registros', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const usuariosPorMes = await Usuario.aggregate([
      {
        $match: {
          fechaRegistro: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$fechaRegistro' },
          total: { $sum: 1 },
          pacientes: {
            $sum: { $cond: [{ $eq: ['$rol', 'paciente'] }, 1, 0] }
          },
          administradores: {
            $sum: { $cond: [{ $eq: ['$rol', 'administrador'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Formatear datos
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const datosFormateados = meses.map((mes, index) => {
      const datosMes = usuariosPorMes.find(item => item._id === index + 1);
      return {
        mes,
        total: datosMes?.total || 0,
        pacientes: datosMes?.pacientes || 0,
        administradores: datosMes?.administradores || 0
      };
    });

    res.json({ usuariosPorMes: datosFormateados });

  } catch (error) {
    console.error('Error al obtener registros de usuarios:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/citas-recientes - Últimas citas del sistema
router.get('/citas-recientes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const citasRecientes = await Cita.find()
      .populate('paciente', 'nombre email telefono')
      .sort({ fechaCreacion: -1 })
      .limit(parseInt(limit));

    res.json({ citasRecientes });

  } catch (error) {
    console.error('Error al obtener citas recientes:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/pacientes-activos - Pacientes más activos
router.get('/pacientes-activos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const pacientesActivos = await Cita.aggregate([
      {
        $group: {
          _id: '$paciente',
          totalCitas: { $sum: 1 },
          citasCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          citasProgramadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          ultimaCita: { $max: '$fecha' }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'pacienteInfo'
        }
      },
      {
        $unwind: '$pacienteInfo'
      },
      {
        $project: {
          nombre: '$pacienteInfo.nombre',
          email: '$pacienteInfo.email',
          telefono: '$pacienteInfo.telefono',
          totalCitas: 1,
          citasCompletadas: 1,
          citasProgramadas: 1,
          ultimaCita: 1
        }
      },
      {
        $sort: { totalCitas: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ pacientesActivos });

  } catch (error) {
    console.error('Error al obtener pacientes activos:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/exportar - Exportar datos en diferentes formatos
router.get('/exportar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { tipo = 'citas', formato = 'json' } = req.query;
    
    let datos = {};
    
    switch (tipo) {
      case 'citas':
        datos = await Cita.find()
          .populate('paciente', 'nombre email telefono')
          .sort({ fecha: -1 });
        break;
        
      case 'usuarios':
        datos = await Usuario.find({ rol: 'paciente' })
          .select('-password')
          .sort({ fechaRegistro: -1 });
        break;
        
      case 'estadisticas':
        // Obtener estadísticas completas
        datos = {
          resumen: {
            totalCitas: await Cita.countDocuments(),
            totalUsuarios: await Usuario.countDocuments(),
            citasCompletadas: await Cita.countDocuments({ estado: 'completada' }),
            citasProgramadas: await Cita.countDocuments({ estado: 'programada' })
          },
          fechaGeneracion: new Date()
        };
        break;
        
      default:
        return res.status(400).json({ mensaje: 'Tipo de exportación no válido' });
    }

    // Simular diferentes formatos
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}_${Date.now()}.csv"`);
      res.json({ 
        mensaje: 'Exportación CSV simulada',
        datos: `Funcionalidad de exportación CSV para ${tipo}`,
        formato: 'csv'
      });
    } else {
      res.json({
        mensaje: 'Datos exportados exitosamente',
        tipo,
        formato,
        cantidad: Array.isArray(datos) ? datos.length : 1,
        datos
      });
    }

  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/citas-por-dia - Citas por día de la semana
router.get('/citas-por-dia', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const citasPorDia = await Cita.aggregate([
      {
        $addFields: {
          diaSemana: { $dayOfWeek: '$fecha' }
        }
      },
      {
        $group: {
          _id: '$diaSemana',
          total: { $sum: 1 },
          programadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          completadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          canceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Mapear días de la semana (1=Domingo, 2=Lunes, etc.)
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const datosFormateados = diasSemana.map((dia, index) => {
      const datosDia = citasPorDia.find(item => item._id === index + 1);
      return {
        dia,
        total: datosDia?.total || 0,
        programadas: datosDia?.programadas || 0,
        completadas: datosDia?.completadas || 0,
        canceladas: datosDia?.canceladas || 0
      };
    });

    res.json({ citasPorDia: datosFormateados });

  } catch (error) {
    console.error('Error al obtener citas por día:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/pacientes-frecuentes - Pacientes más frecuentes
router.get('/pacientes-frecuentes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const pacientesFrecuentes = await Cita.aggregate([
      {
        $group: {
          _id: '$paciente',
          totalCitas: { $sum: 1 },
          citasCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          citasProgramadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'programada'] }, 1, 0] }
          },
          ultimaCita: { $max: '$fecha' }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'pacienteInfo'
        }
      },
      {
        $unwind: '$pacienteInfo'
      },
      {
        $project: {
          paciente: '$pacienteInfo.nombre',
          email: '$pacienteInfo.email',
          totalCitas: 1,
          citasCompletadas: 1,
          citasProgramadas: 1,
          ultimaCita: 1
        }
      },
      {
        $sort: { totalCitas: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({ pacientesFrecuentes });

  } catch (error) {
    console.error('Error al obtener pacientes frecuentes:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;