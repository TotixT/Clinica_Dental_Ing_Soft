import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NuevaCita from './pages/NuevaCita';
import MisCitas from './pages/MisCitas';
import CitaDetalle from './pages/CitaDetalle';
import Perfil from './pages/Perfil';
import AdminPanel from './pages/AdminPanel';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rutas protegidas */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/nueva-cita" 
                element={
                  <ProtectedRoute>
                    <NuevaCita />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mis-citas" 
                element={
                  <ProtectedRoute>
                    <MisCitas />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cita/:id" 
                element={
                  <ProtectedRoute>
                    <CitaDetalle />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/perfil" 
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="administrador">
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Notificaciones Toast */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
