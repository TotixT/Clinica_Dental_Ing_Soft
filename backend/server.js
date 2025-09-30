const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

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
});