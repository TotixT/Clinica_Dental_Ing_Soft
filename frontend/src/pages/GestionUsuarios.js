import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'paciente',
    password: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // La API devuelve un objeto con usuarios, paginacion y estadisticas
        // Necesitamos extraer solo el array de usuarios
        setUsuarios(data.usuarios || []);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? `/api/usuarios/${editingUser._id}` : '/api/usuarios';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          rol: 'paciente',
          password: ''
        });
        cargarUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      password: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Usuario eliminado');
        cargarUsuarios();
      } else {
        toast.error('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || usuario.rol === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <Users className="header-icon" />
            <div>
              <h1>Gestión de Usuarios</h1>
              <p>Administra los usuarios del sistema</p>
            </div>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingUser(null);
              setFormData({
                nombre: '',
                email: '',
                telefono: '',
                rol: 'paciente',
                password: ''
              });
              setShowModal(true);
            }}
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <Filter className="filter-icon" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="administrador">Administradores</option>
          </select>
        </div>
      </div>

      <div className="usuarios-grid">
        {filteredUsuarios.map(usuario => (
          <div key={usuario._id} className="usuario-card">
            <div className="usuario-header">
              <div className="usuario-avatar">
                {usuario.rol === 'administrador' ? (
                  <UserCheck className="avatar-icon admin" />
                ) : (
                  <UserX className="avatar-icon paciente" />
                )}
              </div>
              <div className="usuario-info">
                <h3>{usuario.nombre}</h3>
                <span className={`role-badge ${usuario.rol}`}>
                  {usuario.rol === 'administrador' ? 'Administrador' : 'Paciente'}
                </span>
              </div>
            </div>

            <div className="usuario-details">
              <div className="detail-item">
                <Mail size={16} />
                <span>{usuario.email}</span>
              </div>
              {usuario.telefono && (
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{usuario.telefono}</span>
                </div>
              )}
              <div className="detail-item">
                <Calendar size={16} />
                <span>Registrado: {formatDate(usuario.fechaRegistro)}</span>
              </div>
            </div>

            <div className="usuario-actions">
              <button 
                className="btn-edit"
                onClick={() => handleEdit(usuario)}
              >
                <Edit size={16} />
                Editar
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(usuario._id)}
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsuarios.length === 0 && (
        <div className="empty-state">
          <Users size={64} />
          <h3>No se encontraron usuarios</h3>
          <p>No hay usuarios que coincidan con los filtros aplicados</p>
        </div>
      )}

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  required
                >
                  <option value="paciente">Paciente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {editingUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;