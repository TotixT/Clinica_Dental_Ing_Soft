# Documentación del Sistema TurnosPlus - Clínica Dental SonriPlus

## Índice
1. [Clases Principales del Sistema](#clases-principales)
2. [Estructura Arquitectónica](#estructura-arquitectonica)
3. [Entidades de MongoDB](#entidades-mongodb)
4. [Flujos de Comunicación](#flujos-comunicacion)
5. [Objetos Participantes y Mensajes](#objetos-participantes)
6. [Secuencias de Ejecución](#secuencias-ejecucion)

---

## 1. Clases Principales del Sistema {#clases-principales}

### 1.1 Modelos del Backend (Mongoose)

#### Usuario.js
**Ubicación:** `backend/models/Usuario.js`

**Atributos:**
- `nombre`: String (requerido, 2-50 caracteres)
- `email`: String (requerido, único, validación de email)
- `password`: String (requerido, encriptado con bcrypt)
- `telefono`: String (opcional, validación de formato)
- `rol`: String (enum: 'paciente', 'administrador', default: 'paciente')
- `fechaRegistro`: Date (default: Date.now)
- `activo`: Boolean (default: true)

**Métodos:**
- `encriptarPassword()`: Pre-save middleware para encriptar contraseña
- `compararPassword(password)`: Compara contraseña ingresada con la encriptada
- `obtenerDatosPublicos()`: Retorna datos del usuario sin contraseña

**Relaciones:**
- **Composición** con Cita (un usuario puede tener múltiples citas)

#### Cita.js
**Ubicación:** `backend/models/Cita.js`

**Atributos:**
- `paciente`: ObjectId (referencia a Usuario, requerido)
- `fecha`: Date (requerido, validación de fecha futura)
- `hora`: String (requerido, formato HH:MM)
- `motivo`: String (requerido, 10-500 caracteres)
- `estado`: String (enum: 'pendiente', 'programada', 'completada', 'cancelada')
- `fechaCreacion`: Date (default: Date.now)
- `fechaActualizacion`: Date (default: Date.now)
- `notas`: String (opcional, para uso administrativo)

**Métodos:**
- `cancelar()`: Cambia estado a 'cancelada' y actualiza fecha
- `obtenerInformacionCompleta()`: Retorna cita con datos del paciente poblados

**Relaciones:**
- **Asociación** con Usuario (muchas citas pertenecen a un usuario)

### 1.2 Componentes Principales de React

#### AuthContext.js
**Ubicación:** `frontend/src/context/AuthContext.js`

**Estado:**
- `usuario`: Objeto del usuario autenticado
- `token`: JWT token de autenticación
- `isAuthenticated`: Boolean de estado de autenticación
- `loading`: Boolean de estado de carga
- `error`: String de mensajes de error

**Métodos:**
- `register(userData)`: Registra nuevo usuario
- `login(credentials)`: Inicia sesión
- `logout()`: Cierra sesión
- `loadUser()`: Carga datos del usuario autenticado
- `updateProfile(profileData)`: Actualiza perfil del usuario
- `clearErrors()`: Limpia errores del estado

#### Componentes de Páginas:
- **Dashboard.js**: Panel principal con estadísticas
- **AdminPanel.js**: Panel administrativo con gestión completa
- **Login.js**: Formulario de inicio de sesión
- **Register.js**: Formulario de registro
- **MisCitas.js**: Gestión de citas del paciente
- **GestionUsuarios.js**: Administración de usuarios
- **Reportes.js**: Visualización de reportes y estadísticas

### 1.3 Servicios del Backend (Express Routes)

#### auth.js
**Endpoints:**
- `POST /api/auth/registro`: Registro de nuevos pacientes
- `POST /api/auth/login`: Inicio de sesión
- `GET /api/auth/perfil`: Obtener perfil del usuario
- `PUT /api/auth/perfil`: Actualizar perfil
- `POST /api/auth/verificar-token`: Verificar validez del token

#### citas.js
**Endpoints:**
- `GET /api/citas`: Listar citas (con filtros)
- `POST /api/citas`: Crear nueva solicitud de cita
- `GET /api/citas/:id`: Obtener cita específica
- `PUT /api/citas/:id/completar`: Marcar cita como completada
- `PUT /api/citas/:id/cancelar`: Cancelar cita
- `PUT /api/citas/:id/autorizar`: Autorizar solicitud pendiente

#### usuarios.js
**Endpoints:**
- `GET /api/usuarios`: Listar usuarios (solo admin)
- `POST /api/usuarios`: Crear usuario (solo admin)
- `PUT /api/usuarios/:id`: Actualizar usuario (solo admin)
- `DELETE /api/usuarios/:id`: Eliminar usuario (solo admin)

#### reportes.js
**Endpoints:**
- `GET /api/reportes/dashboard`: Estadísticas del dashboard
- `GET /api/reportes/citas-por-mes`: Citas agrupadas por mes
- `GET /api/reportes/pacientes-frecuentes`: Pacientes más activos
- `GET /api/reportes/horarios-populares`: Horarios con mayor demanda

---

## 2. Estructura Arquitectónica {#estructura-arquitectonica}

### 2.1 Arquitectura por Capas

```
┌─────────────────────────────────────┐
│           CAPA DE PRESENTACIÓN      │
│         (React Frontend)            │
│  - Componentes UI                   │
│  - Páginas                          │
│  - Context API                      │
│  - Hooks personalizados             │
└─────────────────────────────────────┘
                    │
                    │ HTTP/HTTPS
                    │ (Axios)
                    ▼
┌─────────────────────────────────────┐
│           CAPA DE APLICACIÓN        │
│         (Express.js API)            │
│  - Rutas (Routes)                   │
│  - Controladores                    │
│  - Middleware de autenticación      │
│  - Validaciones                     │
└─────────────────────────────────────┘
                    │
                    │ Mongoose ODM
                    │
                    ▼
┌─────────────────────────────────────┐
│           CAPA DE DATOS             │
│         (MongoDB)                   │
│  - Colecciones                      │
│  - Índices                          │
│  - Agregaciones                     │
└─────────────────────────────────────┘
```

### 2.2 Módulos y Componentes

#### Frontend (React)
- **Páginas**: Componentes de nivel superior que representan rutas
- **Componentes**: Elementos reutilizables de UI
- **Context**: Gestión de estado global (AuthContext)
- **Servicios**: Comunicación con API (integrado en AuthContext)

#### Backend (Node.js/Express)
- **Modelos**: Esquemas de Mongoose para MongoDB
- **Rutas**: Definición de endpoints de la API
- **Middleware**: Autenticación, validación, logging
- **Configuración**: Variables de entorno, conexión a BD

### 2.3 Comunicación entre Capas

1. **Frontend → Backend**: Peticiones HTTP usando Axios
2. **Backend → Base de Datos**: Consultas usando Mongoose ODM
3. **Autenticación**: JWT tokens en headers Authorization
4. **Validación**: Express-validator en backend, validación en tiempo real en frontend

---

## 3. Entidades de MongoDB {#entidades-mongodb}

### 3.1 Colección: usuarios

```javascript
{
  _id: ObjectId,
  nombre: String,
  email: String (único),
  password: String (encriptado),
  telefono: String,
  rol: String, // 'paciente' | 'administrador'
  fechaRegistro: Date,
  activo: Boolean
}
```

**Índices:**
- `email`: Único
- `rol`: Para consultas por tipo de usuario

### 3.2 Colección: citas

```javascript
{
  _id: ObjectId,
  paciente: ObjectId, // Referencia a usuarios
  fecha: Date,
  hora: String,
  motivo: String,
  estado: String, // 'pendiente' | 'programada' | 'completada' | 'cancelada'
  fechaCreacion: Date,
  fechaActualizacion: Date,
  notas: String
}
```

**Índices:**
- `paciente`: Para consultas por usuario
- `fecha`: Para consultas por fecha
- `estado`: Para filtros por estado
- `fecha + hora`: Compuesto para evitar duplicados

### 3.3 Relaciones

- **Usuario → Citas**: Relación 1:N (un usuario puede tener múltiples citas)
- **Referencia**: Campo `paciente` en citas apunta a `_id` de usuarios
- **Populate**: Mongoose permite poblar automáticamente los datos del paciente

---

## 4. Flujos de Comunicación {#flujos-comunicacion}

### 4.1 Flujo de Autenticación

```
Cliente (React) → POST /api/auth/login → Servidor (Express)
                                      ↓
                                   Validar credenciales
                                      ↓
                                   MongoDB (usuarios)
                                      ↓
                                   Generar JWT
                                      ↓
Cliente ← Respuesta con token ← Servidor
```

### 4.2 Flujo de Creación de Cita

```
Cliente → POST /api/citas → Servidor
                          ↓
                       Verificar token
                          ↓
                       Validar datos
                          ↓
                       MongoDB (citas)
                          ↓
Cliente ← Confirmación ← Servidor
```

### 4.3 Flujo de Dashboard Administrativo

```
Cliente → GET /api/reportes/dashboard → Servidor
                                     ↓
                                  Verificar admin
                                     ↓
                                  Agregaciones MongoDB
                                     ↓
Cliente ← Estadísticas ← Servidor
```

---

## 5. Objetos Participantes y Mensajes {#objetos-participantes}

### 5.1 Actores del Sistema

#### Paciente
- **Rol**: Usuario final del sistema
- **Acciones**: Registrarse, iniciar sesión, crear citas, ver sus citas, cancelar citas
- **Permisos**: Acceso limitado a sus propios datos

#### Administrador
- **Rol**: Personal de la clínica
- **Acciones**: Gestionar usuarios, autorizar citas, ver reportes, administrar sistema
- **Permisos**: Acceso completo al sistema

### 5.2 Objetos Técnicos

#### AuthContext (React)
- **Función**: Gestión de estado de autenticación
- **Mensajes enviados**: 
  - `LOGIN_SUCCESS`
  - `LOGOUT`
  - `LOAD_USER`
  - `AUTH_ERROR`

#### Middleware de Autenticación
- **Función**: Verificar tokens JWT
- **Mensajes**: 
  - `verificarToken()`
  - `verificarAdmin()`
  - `verificarPropietario()`

#### Modelos Mongoose
- **Función**: Interacción con MongoDB
- **Mensajes**:
  - `save()`
  - `find()`
  - `findById()`
  - `aggregate()`

---

## 6. Secuencias de Ejecución {#secuencias-ejecucion}

### 6.1 Secuencia: Registro de Usuario

```
1. Usuario completa formulario → Register.js
2. Register.js → AuthContext.register()
3. AuthContext → POST /api/auth/registro
4. Servidor → Validar datos (express-validator)
5. Servidor → Usuario.findOne() [verificar email único]
6. Servidor → new Usuario().save()
7. Servidor → generarToken()
8. Servidor → Respuesta con token y usuario
9. AuthContext → Actualizar estado
10. Redirección → Dashboard
```

### 6.2 Secuencia: Creación de Cita

```
1. Paciente → NuevaCita.js (formulario)
2. NuevaCita → POST /api/citas
3. Servidor → verificarToken()
4. Servidor → Validar datos
5. Servidor → new Cita().save() [estado: 'pendiente']
6. Servidor → Respuesta de confirmación
7. Cliente → Actualizar lista de citas
8. Notificación → Toast de éxito
```

### 6.3 Secuencia: Autorización de Cita (Admin)

```
1. Admin → AdminPanel.js
2. AdminPanel → GET /api/citas?estado=pendiente
3. Servidor → verificarAdmin()
4. Servidor → Cita.find({estado: 'pendiente'})
5. Admin selecciona cita → PUT /api/citas/:id/autorizar
6. Servidor → Verificar conflictos de horario
7. Servidor → Cita.findByIdAndUpdate({estado: 'programada'})
8. Servidor → Respuesta de confirmación
9. Cliente → Actualizar vista
```

### 6.4 Secuencia: Dashboard con Estadísticas

```
1. Admin → Dashboard.js
2. Dashboard → GET /api/reportes/dashboard
3. Servidor → verificarAdmin()
4. Servidor → Promise.all([
   - Cita.countDocuments({estado: 'programada'}),
   - Usuario.countDocuments({rol: 'paciente'}),
   - Cita.aggregate([...])
])
5. Servidor → Formatear estadísticas
6. Servidor → Respuesta con datos
7. Dashboard → Renderizar gráficos y métricas
```

---

## Tecnologías Utilizadas

### Frontend
- **React 19.1.1**: Framework de UI
- **React Router DOM**: Navegación
- **Axios**: Cliente HTTP
- **Lucide React**: Iconos
- **React Toastify**: Notificaciones

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticación
- **bcryptjs**: Encriptación de contraseñas
- **Express Validator**: Validación de datos

### Base de Datos
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: Modelado de objetos

### Herramientas de Desarrollo
- **Nodemon**: Desarrollo del backend
- **React Scripts**: Herramientas de React
- **CORS**: Configuración de políticas de origen cruzado

---

## Consideraciones de Seguridad

1. **Autenticación JWT**: Tokens con expiración de 7 días
2. **Encriptación**: Contraseñas hasheadas con bcrypt
3. **Validación**: Datos validados en frontend y backend
4. **Autorización**: Middleware para verificar permisos
5. **CORS**: Configurado para permitir solo orígenes autorizados
6. **Headers de Seguridad**: Authorization Bearer tokens

---

## Escalabilidad y Mantenimiento

### Patrones Implementados
- **MVC**: Separación de modelos, vistas y controladores
- **Context API**: Gestión de estado global
- **Middleware**: Funcionalidades transversales
- **Modularización**: Código organizado en módulos

### Posibles Mejoras
- Implementar caché con Redis
- Añadir logging estructurado
- Implementar tests unitarios e integración
- Configurar CI/CD
- Añadir monitoreo y métricas