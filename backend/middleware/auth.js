const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  console.log('🔐 Middleware verificarToken ejecutado');
  console.log('📋 Headers recibidos:', req.headers);
  
  try {
    // Obtener token del header Authorization
    const authHeader = req.header('Authorization');
    console.log('🎫 Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('🔑 Token extraído:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
      console.log('❌ No se proporcionó token');
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar y decodificar el token
    console.log('🔍 Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', decoded);
    
    // Buscar el usuario en la base de datos
    console.log('👤 Buscando usuario con ID:', decoded.id);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    console.log('🔍 Usuario encontrado:', usuario ? 'Sí' : 'No');
    
    if (!usuario) {
      console.log('❌ Usuario no existe');
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El usuario no existe'
      });
    }

    if (!usuario.activo) {
      console.log('⚠️ Usuario desactivado');
      return res.status(401).json({
        error: 'Cuenta desactivada',
        message: 'La cuenta de usuario está desactivada'
      });
    }

    console.log('✅ Usuario autenticado:', usuario.nombre, 'Rol:', usuario.rol);
    
    // Agregar usuario a la request
    req.usuario = usuario;
    next();
    
  } catch (error) {
    console.error('💥 Error en verificación de token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, por favor inicie sesión nuevamente'
      });
    }
    
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno en la verificación de autenticación'
    });
  }
};

// Middleware para verificar rol de administrador
const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador para esta acción'
    });
  }
  next();
};

// Middleware para verificar que el usuario puede acceder a sus propios datos
const verificarPropietario = (req, res, next) => {
  const usuarioId = req.params.usuarioId || req.body.paciente;
  
  // Los administradores pueden acceder a cualquier dato
  if (req.usuario.rol === 'administrador') {
    return next();
  }
  
  // Los pacientes solo pueden acceder a sus propios datos
  if (req.usuario._id.toString() !== usuarioId) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tiene permisos para acceder a estos datos'
    });
  }
  
  next();
};

// Función para generar token JWT
const generarToken = (usuarioId) => {
  return jwt.sign(
    { id: usuarioId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 días
  );
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarPropietario,
  generarToken
};