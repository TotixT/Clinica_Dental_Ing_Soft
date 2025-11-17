const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Cita = require('./models/Cita');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('📋 Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/turnosplus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB - TurnosPlus');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
});

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/reportes', require('./routes/reportes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'TurnosPlus API - Clínica Dental SonriPlus',
    version: '1.0.0',
    status: 'Funcionando correctamente'
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en la API'
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor TurnosPlus ejecutándose en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  // Tarea automática: marcar como no_asistio las citas vencidas
  const horasGracia = parseInt(process.env.AUTO_NO_ASISTIO_HORAS || '48', 10);
  const marcaNoAsistioSiVencida = async () => {
    try {
      const ahora = new Date();
      const limite = new Date(ahora.getTime() - horasGracia * 60 * 60 * 1000);
      // Buscar candidatas: programadas con fecha hasta hoy (reduce el conjunto)
      const candidatas = await Cita.find({ estado: 'programada', fecha: { $lte: ahora } });
      const ops = [];
      for (const cita of candidatas) {
        const fechaISO = cita.fecha instanceof Date ? cita.fecha.toISOString().split('T')[0] : String(cita.fecha).split('T')[0];
        const fechaHora = cita.hora ? new Date(`${fechaISO}T${cita.hora}`) : new Date(cita.fecha);
        if (fechaHora <= limite) {
          ops.push({
            updateOne: {
              filter: { _id: cita._id },
              update: {
                $set: {
                  estado: 'no_asistio',
                  fechaActualizacion: new Date(),
                  notas: (cita.notas ? `${cita.notas}\n` : '') + `Marcada automáticamente como no asistió (${horasGracia}h de gracia)`
                }
              }
            }
          });
        }
      }
      if (ops.length > 0) {
        const res = await Cita.bulkWrite(ops);
        console.log(`🕒 Auto-marcado no_asistio: ${res.modifiedCount} citas actualizadas`);
      } else {
        console.log('🕒 Auto-marcado no_asistio: ninguna cita para actualizar');
      }
    } catch (e) {
      console.error('⚠️ Error en auto-marcado no_asistio:', e);
    }
  };

  // Ejecutar al iniciar y cada hora
  marcaNoAsistioSiVencida();
  setInterval(marcaNoAsistioSiVencida, 60 * 60 * 1000);
});