const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { verificarToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Middleware para verificar que el usuario sea administrador
const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ 
      mensaje: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// GET /api/usuarios - Obtener todos los usuarios (solo admin)
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', rol = '' } = req.query;
    
    // Construir filtros de búsqueda
    let filtros = {};
    
    if (search) {
      filtros.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (rol && rol !== 'todos') {
      filtros.rol = rol;
    }

    // Calcular paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener usuarios con paginación
    const usuarios = await Usuario.find(filtros)
      .select('-password') // Excluir contraseñas
      .sort({ fechaRegistro: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de usuarios
    const total = await Usuario.countDocuments(filtros);
    
    // Calcular estadísticas
    const estadisticas = {
      totalUsuarios: await Usuario.countDocuments(),
      totalPacientes: await Usuario.countDocuments({ rol: 'paciente' }),
      totalAdministradores: await Usuario.countDocuments({ rol: 'administrador' }),
      usuariosActivos: await Usuario.countDocuments({ activo: true })
    };

    res.json({
      usuarios,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: Math.ceil(total / parseInt(limit)),
        totalUsuarios: total,
        usuariosPorPagina: parseInt(limit)
      },
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/usuarios/:id - Obtener un usuario específico
router.get('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ usuario });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// POST /api/usuarios - Crear nuevo usuario (solo admin)
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, email, telefono, rol, password } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !telefono || !rol || !password) {
      return res.status(400).json({ 
        mensaje: 'Todos los campos son obligatorios' 
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ 
        mensaje: 'Ya existe un usuario con este email' 
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      telefono,
      rol,
      password: passwordEncriptada,
      fechaRegistro: new Date(),
      activo: true
    });

    await nuevoUsuario.save();

    // Devolver usuario sin contraseña
    const usuarioRespuesta = await Usuario.findById(nuevoUsuario._id).select('-password');

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: usuarioRespuesta
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario (solo admin)
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { nombre, email, telefono, rol, activo, password } = req.body;
    const usuarioId = req.params.id;

    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Si se está cambiando el email, verificar que no exista otro usuario con ese email
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ 
        email, 
        _id: { $ne: usuarioId } 
      });
      if (emailExistente) {
        return res.status(400).json({ 
          mensaje: 'Ya existe otro usuario con este email' 
        });
      }
    }

    // Actualizar campos
    const camposActualizar = {};
    if (nombre) camposActualizar.nombre = nombre;
    if (email) camposActualizar.email = email;
    if (telefono) camposActualizar.telefono = telefono;
    if (rol) camposActualizar.rol = rol;
    if (typeof activo === 'boolean') camposActualizar.activo = activo;

    if (typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordEncriptada = await bcrypt.hash(password.trim(), salt);
      camposActualizar.password = passwordEncriptada;
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      usuarioId,
      camposActualizar,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario (solo admin)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // Verificar que no se esté eliminando a sí mismo
    if (usuarioId === req.usuario.id) {
      return res.status(400).json({ 
        mensaje: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    await Usuario.findByIdAndDelete(usuarioId);

    res.json({
      mensaje: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/usuarios/:id/toggle-estado - Activar/Desactivar usuario (solo admin)
router.put('/:id/toggle-estado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // Verificar que no se esté desactivando a sí mismo
    if (usuarioId === req.usuario.id) {
      return res.status(400).json({ 
        mensaje: 'No puedes desactivar tu propia cuenta' 
      });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Cambiar estado
    usuario.activo = !usuario.activo;
    await usuario.save();

    const usuarioActualizado = await Usuario.findById(usuarioId).select('-password');

    res.json({
      mensaje: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;