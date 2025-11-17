const express = require('express');
const { body, validationResult } = require('express-validator');
const Cita = require('../models/Cita');
const { verificarToken, verificarAdmin, verificarPropietario } = require('../middleware/auth');

const router = express.Router();

// Validaciones para crear/actualizar cita
const validacionesCita = [
  body('fecha')
    .isISO8601()
    .withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((fecha) => {
      const fechaCita = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaCita < hoy) {
        throw new Error('La fecha debe ser hoy o en el futuro');
      }
      return true;
    }),
  body('hora')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido (HH:MM)'),
  body('motivo')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El motivo debe tener entre 3 y 200 caracteres')
    .custom((motivo) => {
      const motivosValidos = [
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
      
      // Si es uno de los motivos predefinidos, es válido
      if (motivosValidos.includes(motivo)) {
        return true;
      }
      
      // Si no está en la lista, debe ser un motivo personalizado válido
      // (al menos 5 caracteres para motivos personalizados)
      if (motivo.length >= 5) {
        return true;
      }
      
      throw new Error('Motivo de consulta no válido. Debe seleccionar una opción o escribir al menos 5 caracteres.');
    }),
  body('descripcionAdicional')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('La descripción adicional no puede exceder 300 caracteres')
];

// @route   POST /api/citas
// @desc    Crear nueva cita
// @access  Privado (Pacientes)
router.post('/', [verificarToken, ...validacionesCita], async (req, res) => {
  try {
    // Verificar errores de validación
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor corrija los errores en el formulario',
        errores: errores.array()
      });
    }

    const { fecha, hora, motivo, descripcionAdicional } = req.body;

    // Verificar disponibilidad (no permitir múltiples citas en la misma fecha/hora)
    const citaExistente = await Cita.findOne({
      fecha: new Date(fecha),
      hora,
      estado: { $ne: 'cancelada' }
    });

    if (citaExistente) {
      return res.status(400).json({
        error: 'Horario no disponible',
        message: 'Ya existe una cita programada para esta fecha y hora'
      });
    }

    // Verificar que el paciente no tenga más de 3 citas activas (programadas o pendientes)
    const citasActivas = await Cita.countDocuments({
      paciente: req.usuario._id,
      estado: { $in: ['programada', 'pendiente'] },
      fecha: { $gte: new Date() }
    });

    if (citasActivas >= 3) {
      return res.status(400).json({
        error: 'Límite de citas excedido',
        message: 'No puede tener más de 3 citas programadas o pendientes simultáneamente'
      });
    }

    // Crear nueva cita
    const nuevaCita = new Cita({
      paciente: req.usuario._id,
      fecha: new Date(fecha),
      hora,
      motivo,
      descripcionAdicional
    });

    await nuevaCita.save();
    await nuevaCita.populate('paciente', 'nombre email telefono');

    res.status(201).json({
      message: 'Cita creada exitosamente',
      cita: nuevaCita
    });

  } catch (error) {
    console.error('Error creando cita:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Cita duplicada',
        message: 'Ya tiene una cita programada para esta fecha y hora'
      });
    }
    
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al crear la cita'
    });
  }
});

// @route   GET /api/citas
// @desc    Obtener citas del usuario o todas las citas (admin)
// @access  Privado
router.get('/', verificarToken, async (req, res) => {
  try {
    let filtro = {};
    
    // Si no es administrador, solo mostrar sus propias citas
    if (req.usuario.rol !== 'administrador') {
      filtro.paciente = req.usuario._id;
    }

    // Filtros opcionales
    const { estado, fecha, limite = 50 } = req.query;
    
    if (estado) {
      filtro.estado = estado;
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      
      filtro.fecha = {
        $gte: fechaInicio,
        $lt: fechaFin
      };
    }

    const citas = await Cita.find(filtro)
      .populate('paciente', 'nombre email telefono')
      .sort({ fecha: 1, hora: 1 })
      .limit(parseInt(limite));

    res.json({
      message: 'Citas obtenidas exitosamente',
      citas,
      total: citas.length
    });

  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al obtener las citas'
    });
  }
});

// @route   GET /api/citas/:id
// @desc    Obtener cita específica
// @access  Privado
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('paciente', 'nombre email telefono');

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita solicitada no existe'
      });
    }

    // Verificar permisos (solo el paciente dueño o admin)
    if (req.usuario.rol !== 'administrador' && 
        cita.paciente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para ver esta cita'
      });
    }

    res.json({
      message: 'Cita obtenida exitosamente',
      cita
    });

  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al obtener la cita'
    });
  }
});


// @route   PUT /api/citas/:id/completar
// @desc    Marcar cita como completada (solo admin)
// @access  Privado (Admin)
router.put('/:id/completar', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita solicitada no existe'
      });
    }

    // Verificar que la cita esté programada
    if (cita.estado !== 'programada') {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Solo se pueden completar citas programadas'
      });
    }

    // Actualizar estado a completada
    const citaCompletada = await Cita.findByIdAndUpdate(
      req.params.id,
      { 
        estado: 'completada',
        fechaActualizacion: new Date()
      },
      { new: true, runValidators: true }
    ).populate('paciente', 'nombre email telefono');

    res.json({
      message: 'Cita marcada como completada exitosamente',
      cita: citaCompletada
    });

  } catch (error) {
    console.error('Error completando cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al completar la cita'
    });
  }
});

// @route   PUT /api/citas/:id/cancelar
// @desc    Cancelar cita
// @access  Privado (Solo el paciente dueño o admin)
router.put('/:id/cancelar', verificarToken, async (req, res) => {
  console.log('📝 Ruta /cancelar ejecutada - ID:', req.params.id);
  console.log('👤 Usuario:', req.usuario?.nombre, 'ID:', req.usuario?._id);
  
  try {
    const cita = await Cita.findById(req.params.id);
    console.log('🔍 Cita encontrada:', cita ? 'Sí' : 'No');

    if (!cita) {
      console.log('❌ Cita no encontrada');
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita solicitada no existe'
      });
    }

    console.log('📋 Estado actual de la cita:', cita.estado);
    console.log('👥 Paciente de la cita:', cita.paciente.toString());

    // Verificar permisos
    if (req.usuario.rol !== 'administrador' && 
        cita.paciente.toString() !== req.usuario._id.toString()) {
      console.log('🚫 Acceso denegado - No es el propietario ni admin');
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para cancelar esta cita'
      });
    }

    // Verificar que la cita se pueda cancelar
    if (cita.estado === 'completada') {
      console.log('⚠️ No se puede cancelar - Cita completada');
      return res.status(400).json({
        error: 'Cita no cancelable',
        message: 'No se puede cancelar una cita completada'
      });
    }

    if (cita.estado === 'cancelada') {
      console.log('⚠️ Cita ya cancelada');
      return res.status(400).json({
        error: 'Cita ya cancelada',
        message: 'Esta cita ya está cancelada'
      });
    }

    console.log('✅ Procediendo a cancelar la cita...');

    // Cancelar cita
    const citaCancelada = await Cita.findByIdAndUpdate(
      req.params.id,
      { estado: 'cancelada' },
      { new: true, runValidators: true }
    ).populate('paciente', 'nombre email telefono');

    console.log('🎉 Cita cancelada exitosamente:', citaCancelada.estado);

    res.json({
      message: 'Cita cancelada exitosamente',
      cita: citaCancelada
    });

  } catch (error) {
    console.error('💥 Error cancelando cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al cancelar la cita'
    });
  }
});

// @route   PUT /api/citas/:id
// @desc    Actualizar cita
// @access  Privado (Solo el paciente dueño o admin)
router.put('/:id', [verificarToken, ...validacionesCita], async (req, res) => {
  try {
    // Verificar errores de validación
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Por favor corrija los errores en el formulario',
        errores: errores.array()
      });
    }

    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita solicitada no existe'
      });
    }

    // Verificar permisos
    if (req.usuario.rol !== 'administrador' && 
        cita.paciente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para modificar esta cita'
      });
    }

    // No permitir actualizar citas pasadas o completadas
    if (cita.estado === 'completada' || cita.estado === 'cancelada') {
      return res.status(400).json({
        error: 'Cita no modificable',
        message: 'No se puede modificar una cita completada o cancelada'
      });
    }

    const { fecha, hora, motivo, descripcionAdicional } = req.body;

    // Verificar disponibilidad si se cambia fecha/hora
    if (fecha !== cita.fecha.toISOString().split('T')[0] || hora !== cita.hora) {
      const citaExistente = await Cita.findOne({
        _id: { $ne: cita._id },
        fecha: new Date(fecha),
        hora,
        estado: { $ne: 'cancelada' }
      });

      if (citaExistente) {
        return res.status(400).json({
          error: 'Horario no disponible',
          message: 'Ya existe una cita programada para esta fecha y hora'
        });
      }
    }

    // Actualizar cita
    const citaActualizada = await Cita.findByIdAndUpdate(
      req.params.id,
      {
        fecha: new Date(fecha),
        hora,
        motivo,
        descripcionAdicional
      },
      { new: true, runValidators: true }
    ).populate('paciente', 'nombre email telefono');

    res.json({
      message: 'Cita actualizada exitosamente',
      cita: citaActualizada
    });

  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al actualizar la cita'
    });
  }
});

// @route   DELETE /api/citas/:id
// @desc    Cancelar/Eliminar cita
// @access  Privado
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita solicitada no existe'
      });
    }

    // Verificar permisos
    if (req.usuario.rol !== 'administrador' && 
        cita.paciente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para cancelar esta cita'
      });
    }

    // Los administradores pueden eliminar, los pacientes solo cancelar
    if (req.usuario.rol === 'administrador') {
      await Cita.findByIdAndDelete(req.params.id);
      res.json({
        message: 'Cita eliminada exitosamente'
      });
    } else {
      // Verificar si la cita puede ser cancelada
      if (!cita.puedeSerCancelada()) {
        return res.status(400).json({
          error: 'No se puede cancelar',
          message: 'La cita no puede ser cancelada (muy próxima o ya completada)'
        });
      }

      cita.estado = 'cancelada';
      await cita.save();

      res.json({
        message: 'Cita cancelada exitosamente',
        cita
      });
    }

  } catch (error) {
    console.error('Error cancelando/eliminando cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al procesar la solicitud'
    });
  }
});

// @route   GET /api/citas/solicitudes/pendientes
// @desc    Obtener solicitudes pendientes (solo admin)
// @access  Privado (Admin)
router.get('/solicitudes/pendientes', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const solicitudesPendientes = await Cita.find({ estado: 'pendiente' })
      .populate('paciente', 'nombre email telefono')
      .sort({ fechaCreacion: -1 }); // Más recientes primero

    res.json({
      message: 'Solicitudes pendientes obtenidas exitosamente',
      solicitudes: solicitudesPendientes,
      total: solicitudesPendientes.length
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes pendientes:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al obtener las solicitudes pendientes'
    });
  }
});

// @route   GET /api/citas/estadisticas/resumen
// @desc    Obtener estadísticas de citas (solo admin)
// @access  Privado (Admin)
router.get('/estadisticas/resumen', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const ahora = new Date();
    const inicioHoyUTC = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 0, 0, 0, 0));
    const finHoyUTC = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 23, 59, 59, 999));

    const estadisticas = await Promise.all([
      Cita.countDocuments({ estado: 'pendiente' }),
      Cita.countDocuments({ estado: 'programada', fecha: { $gte: inicioHoyUTC } }),
      Cita.countDocuments({ estado: 'completada' }),
      Cita.countDocuments({ estado: 'cancelada' }),
      Cita.countDocuments({ estado: 'no_asistio' }),
      Cita.countDocuments({ fecha: { $gte: inicioHoyUTC, $lte: finHoyUTC } })
    ]);

    res.json({
      message: 'Estadísticas obtenidas exitosamente',
      estadisticas: {
        solicitudesPendientes: estadisticas[0],
        citasProgramadas: estadisticas[1],
        citasCompletadas: estadisticas[2],
        citasCanceladas: estadisticas[3],
        citasNoAsistio: estadisticas[4],
        citasHoy: estadisticas[5]
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al obtener estadísticas'
    });
  }
});

// @route   PUT /api/citas/:id/autorizar
// @desc    Autorizar una solicitud de cita (cambiar de pendiente a programada)
// @access  Privado (Solo administradores)
router.put('/:id/autorizar', verificarToken, async (req, res) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los administradores pueden autorizar citas'
      });
    }

    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La solicitud de cita no existe'
      });
    }

    // Verificar que la cita esté en estado pendiente
    if (cita.estado !== 'pendiente') {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Solo se pueden autorizar solicitudes pendientes'
      });
    }

    // Verificar que no haya conflictos de horario
    const citaExistente = await Cita.findOne({
      _id: { $ne: req.params.id },
      fecha: cita.fecha,
      hora: cita.hora,
      estado: { $in: ['programada', 'pendiente'] }
    });

    if (citaExistente) {
      return res.status(400).json({
        error: 'Conflicto de horario',
        message: 'Ya existe una cita programada o pendiente para esta fecha y hora'
      });
    }

    // Autorizar la cita (cambiar estado a programada)
    cita.estado = 'programada';
    await cita.save();

    await cita.populate('paciente', 'nombre email telefono');

    res.json({
      message: 'Cita autorizada exitosamente',
      cita: cita
    });

  } catch (error) {
    console.error('Error autorizando cita:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al autorizar la cita'
    });
  }
});

module.exports = router;