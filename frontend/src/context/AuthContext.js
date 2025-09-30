import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Configuración base de Axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

// Estados iniciales
const initialState = {
  usuario: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Tipos de acciones
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAIL: 'REGISTER_FAIL',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        usuario: action.payload.usuario,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        usuario: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAIL:
    case AUTH_ACTIONS.REGISTER_FAIL:
    case AUTH_ACTIONS.AUTH_ERROR:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        usuario: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        usuario: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Exportar el contexto
export { AuthContext };

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configurar interceptor de Axios para incluir token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Función para configurar token en headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Cargar usuario autenticado
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get('/auth/perfil');
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: res.data.usuario
        });
      } catch (error) {
        console.error('Error cargando usuario:', error);
        dispatch({
          type: AUTH_ACTIONS.AUTH_ERROR,
          payload: error.response?.data?.message || 'Error de autenticación'
        });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Registrar usuario
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await axios.post('/auth/registro', userData);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: res.data
      });

      setAuthToken(res.data.token);
      toast.success('¡Registro exitoso! Bienvenido a TurnosPlus');
      
      return { success: true, data: res.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error en el registro';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAIL,
        payload: errorMessage
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Iniciar sesión
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await axios.post('/auth/login', credentials);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data
      });

      setAuthToken(res.data.token);
      toast.success(`¡Bienvenido, ${res.data.usuario.nombre}!`);
      
      return { success: true, data: res.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: errorMessage
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Cerrar sesión
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    setAuthToken(null);
    toast.info('Sesión cerrada correctamente');
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/auth/perfil', profileData);
      
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: res.data.usuario
      });

      toast.success('Perfil actualizado exitosamente');
      return { success: true, data: res.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error actualizando perfil';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Limpiar errores
  const clearErrors = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERRORS });
  };

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    ...state,
    register,
    login,
    logout,
    loadUser,
    updateProfile,
    clearErrors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};