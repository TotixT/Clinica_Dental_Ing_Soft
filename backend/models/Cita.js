const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El paciente es obligatorio']
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es obligatoria'],
    validate: {
      validator: function(fecha) {
        // La fecha debe ser futura (al menos el día siguiente)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fecha >= hoy;
      },
      message: 'La fecha de la cita debe ser hoy o en el futuro'
    }
  },
  hora: {
    type: String,
    required: [true, 'La hora es obligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  motivo: {
    type: String,
    required: [true, 'El motivo de la consulta es obligatorio'],
    trim: true,
    minlength: [5, 'El motivo debe tener al menos 5 caracteres'],
    maxlength: [200, 'El motivo no puede exceder 200 caracteres'],
    validate: {
      validator: function(motivo) {
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
        
        // Si no es un motivo predefinido, debe tener al menos 5 caracteres (texto libre)
        return motivo.length >= 5;
      },
      message: 'Motivo de consulta no válido'
    }
  },
  descripcionAdicional: {
    type: String,
    trim: true,
    maxlength: [300, 'La descripción adicional no puede exceder 300 caracteres']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'programada', 'completada', 'cancelada', 'no_asistio'],
    default: 'pendiente'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  notas: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }
}, {
  timestamps: true
});

// Middleware para actualizar fechaActualizacion
citaSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  next();
});

// Método para verificar si la cita puede ser cancelada
citaSchema.methods.puedeSerCancelada = function() {
  const ahora = new Date();
  const fechaCita = new Date(this.fecha);
  
  // Permitir cancelación hasta 2 horas antes de la cita
  const dosHorasAntes = new Date(fechaCita.getTime() - (2 * 60 * 60 * 1000));
  
  return ahora < dosHorasAntes && (this.estado === 'programada' || this.estado === 'pendiente');
};

// Método para obtener información completa de la cita
citaSchema.methods.obtenerInformacionCompleta = function() {
  return this.populate('paciente', 'nombre email telefono');
};

// Índices para optimizar consultas
citaSchema.index({ paciente: 1 });
citaSchema.index({ fecha: 1 });
citaSchema.index({ estado: 1 });
citaSchema.index({ fecha: 1, hora: 1 }); // Índice compuesto para evitar citas duplicadas

// Índice único para evitar que un paciente tenga múltiples citas el mismo día y hora
citaSchema.index(
  { paciente: 1, fecha: 1, hora: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { estado: { $ne: 'cancelada' } }
  }
);

module.exports = mongoose.model('Cita', citaSchema);