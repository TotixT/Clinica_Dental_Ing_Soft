# TurnosPlus - Sistema de Reservas para Clínica Dental SonriPlus

## Descripción del Proyecto
Sistema de reservas digital para la Clínica Dental SonriPlus que permite a los pacientes registrarse, agendar y cancelar citas, mientras que el personal administrativo puede gestionar todas las citas de manera centralizada con reportes y estadísticas avanzadas.

## Tecnologías Utilizadas

### Frontend
- **React 19.1.1**: Framework de interfaz de usuario
- **React Router DOM**: Navegación entre páginas
- **Axios**: Cliente HTTP para comunicación con API
- **Lucide React**: Biblioteca de iconos
- **React Toastify**: Notificaciones toast
- **Context API**: Gestión de estado global

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js 4.18.2**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose 7.5.0**: ODM para MongoDB
- **JWT**: Autenticación con tokens
- **bcryptjs**: Encriptación de contraseñas
- **Express Validator**: Validación de datos
- **CORS**: Configuración de políticas de origen cruzado

## Características Principales

### Para Pacientes
- ✅ Registro y autenticación segura
- ✅ Agendamiento de citas con validación de disponibilidad
- ✅ Visualización de historial de citas
- ✅ Cancelación de citas programadas
- ✅ Actualización de perfil personal
- ✅ Interfaz responsive para móviles y escritorio

### Para Administradores
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de usuarios y pacientes
- ✅ Autorización de solicitudes de citas pendientes
- ✅ Reportes avanzados y análisis de datos
- ✅ Gestión de horarios y disponibilidad
- ✅ Exportación de datos en múltiples formatos

### Características Técnicas
- ✅ Arquitectura de 3 capas (Presentación, Aplicación, Datos)
- ✅ Autenticación JWT con expiración configurable
- ✅ Validación de datos en frontend y backend
- ✅ Middleware de seguridad y autorización
- ✅ Agregaciones MongoDB para reportes
- ✅ Manejo de errores centralizado

## Estructura del Proyecto
```
Clinica_Dental_Ing_Soft/
├── backend/                 # Servidor Node.js
│   ├── models/             # Modelos de Mongoose (Usuario.js, Cita.js)
│   ├── routes/             # Rutas de la API (auth.js, citas.js, admin.js)
│   ├── middleware/         # Middleware de autenticación (auth.js)
│   ├── config/             # Configuración de BD (database.js)
│   └── server.js           # Archivo principal del servidor
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes React reutilizables
│   │   ├── pages/          # Páginas principales (Login, Dashboard, etc.)
│   │   ├── services/       # Servicios para API (api.js)
│   │   ├── context/        # Context API (AuthContext.js)
│   │   └── App.js          # Componente principal
│   ├── public/
│   └── package.json        # Dependencias del frontend
├── DOCUMENTACION_SISTEMA.md # Documentación técnica completa
└── README.md               # Este archivo
```

## Instalación y Configuración

### Prerrequisitos
- Node.js 16+ instalado
- MongoDB 4.4+ instalado y ejecutándose
- Git para clonar el repositorio

### Configuración del Backend
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd Clinica_Dental_Ing_Soft

# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno (crear archivo .env)
echo "MONGODB_URI=mongodb://localhost:27017/clinica_dental" > .env
echo "JWT_SECRET=tu_clave_secreta_aqui" >> .env
echo "PORT=5000" >> .env

# Iniciar el servidor
npm start
```

### Configuración del Frontend
```bash
# En una nueva terminal, navegar al frontend
cd frontend
npm install

# Iniciar la aplicación React
npm start
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Documentación

### Documentación Técnica
Para información detallada sobre la arquitectura, clases principales, flujos de comunicación y secuencias de ejecución, consulta:
- **[DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md)**: Documentación técnica completa del sistema

### API Endpoints
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Autenticación
- `GET /api/citas` - Obtener citas del usuario
- `POST /api/citas` - Crear nueva cita
- `DELETE /api/citas/:id` - Cancelar cita
- `GET /api/admin/dashboard` - Estadísticas del dashboard
- `GET /api/admin/citas` - Gestión de citas (admin)

## Requisitos del Sistema
- **Node.js**: Versión 16 o superior
- **MongoDB**: Versión 4.4 o superior
- **Navegador**: Chrome, Firefox, Safari o Edge (versiones recientes)
- **Memoria RAM**: Mínimo 4GB recomendado
- **Espacio en disco**: 500MB para dependencias

## Arquitectura del Sistema

El sistema implementa una **arquitectura de 3 capas**:

1. **Capa de Presentación**: React frontend con componentes modulares
2. **Capa de Aplicación**: Express.js con middleware de autenticación y validación
3. **Capa de Datos**: MongoDB con Mongoose ODM

### Patrones de Diseño Utilizados
- **MVC (Model-View-Controller)**: Separación de responsabilidades
- **Repository Pattern**: Abstracción de acceso a datos
- **Middleware Pattern**: Procesamiento de requests
- **Context Pattern**: Gestión de estado global en React

## Actores del Sistema
- **Paciente**: Registra cuenta, agenda y cancela citas, actualiza perfil
- **Administrador**: Gestiona todas las citas, usuarios y genera reportes

## Seguridad
- Autenticación JWT con tokens de expiración
- Encriptación de contraseñas con bcrypt
- Validación de datos en frontend y backend
- Middleware de autorización por roles
- Protección CORS configurada

## Contribución
Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Desarrollado por
Equipo de Ingeniería de Software - Universidad