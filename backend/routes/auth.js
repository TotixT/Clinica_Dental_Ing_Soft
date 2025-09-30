const express = require('express');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { verificarToken, generarToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones para registro
const validacionesRegistro = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Formato de teléfono inválido')
];

// Validaciones para login
const validacionesLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

// @route   POST /api/auth/registro
// @desc    Registrar nuevo paciente
// @access  Público
router.post('/registro', validacionesRegistro, async (req, res) => {
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

    const { nombre, email, password, telefono } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password,
      telefono,
      rol: 'paciente'
    });

    await nuevoUsuario.save();

    // Generar token
    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario.obtenerDatosPublicos()
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al registrar usuario'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Público
router.post('/login', validacionesLogin, async (req, res) => {
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

    const { email, password } = req.body;

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(400).json({
        error: 'Cuenta desactivada',
        message: 'Su cuenta ha sido desactivada. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = generarToken(usuario._id);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: usuario.obtenerDatosPublicos()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al iniciar sesión'
    });
  }
});

// @route   GET /api/auth/perfil
// @desc    Obtener perfil del usuario autenticado
// @access  Privado
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    res.json({
      message: 'Perfil obtenido exitosamente',
      usuario: req.usuario
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al obtener perfil'
    });
  }
});

// @route   PUT /api/auth/perfil
// @desc    Actualizar perfil del usuario
// @access  Privado
router.put('/perfil', [
  verificarToken,
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('telefono')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Formato de teléfono inválido')
], async (req, res) => {
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

    const { nombre, telefono } = req.body;
    const actualizaciones = {};

    if (nombre) actualizaciones.nombre = nombre;
    if (telefono) actualizaciones.telefono = telefono;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      actualizaciones,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno al actualizar perfil'
    });
  }
});

// @route   POST /api/auth/verificar-token
// @desc    Verificar si el token es válido
// @access  Privado
router.post('/verificar-token', verificarToken, (req, res) => {
  res.json({
    message: 'Token válido',
    usuario: req.usuario
  });
});

module.exports = router;