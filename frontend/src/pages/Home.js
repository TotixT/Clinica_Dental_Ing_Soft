import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  Smartphone, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const { isAuthenticated, usuario } = useAuth();

  const features = [
    {
      icon: <Calendar className="feature-icon" />,
      title: 'Agenda Digital',
      description: 'Programa tus citas de manera fácil y rápida desde cualquier dispositivo.'
    },
    {
      icon: <Clock className="feature-icon" />,
      title: 'Disponibilidad 24/7',
      description: 'Accede al sistema en cualquier momento para gestionar tus citas.'
    },
    {
      icon: <Users className="feature-icon" />,
      title: 'Gestión Centralizada',
      description: 'El personal de la clínica puede ver y gestionar todas las citas desde un panel.'
    },
    {
      icon: <Shield className="feature-icon" />,
      title: 'Datos Seguros',
      description: 'Tu información personal está protegida con los más altos estándares de seguridad.'
    },
    {
      icon: <Smartphone className="feature-icon" />,
      title: 'Responsive',
      description: 'Funciona perfectamente en computadoras, tablets y teléfonos móviles.'
    },
    {
      icon: <CheckCircle className="feature-icon" />,
      title: 'Fácil de Usar',
      description: 'Interfaz intuitiva diseñada para que cualquier persona pueda usarla sin problemas.'
    }
  ];

  const services = [
    'Consulta general',
    'Limpieza dental',
    'Extracción',
    'Endodoncia',
    'Ortodoncia',
    'Implantes',
    'Blanqueamiento',
    'Urgencia dental'
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Bienvenido a <span className="brand-name">TurnosPlus</span>
            </h1>
            <p className="hero-subtitle">
              Sistema de Reservas Digital para Clínica Dental SonriPlus
            </p>
            <p className="hero-description">
              Agenda tus citas dentales de manera fácil, rápida y segura. 
              Olvídate de las llamadas telefónicas y gestiona tus turnos desde cualquier dispositivo.
            </p>
            
            {!isAuthenticated ? (
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary">
                  Crear Cuenta
                  <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Iniciar Sesión
                </Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link to="/dashboard" className="btn btn-primary">
                  Ir al Dashboard
                  <ArrowRight size={20} />
                </Link>
                <Link to="/nueva-cita" className="btn btn-secondary">
                  Agendar Cita
                </Link>
              </div>
            )}
          </div>
          
          <div className="hero-image">
            <div className="hero-card">
              <Calendar size={64} className="hero-icon" />
              <h3>Tu Sonrisa, Nuestra Prioridad</h3>
              <p>Clínica Dental SonriPlus - Bucaramanga, Santander</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>¿Por qué elegir TurnosPlus?</h2>
            <p>Descubre las ventajas de nuestro sistema de reservas digital</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                {feature.icon}
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="container">
          <div className="section-header">
            <h2>Nuestros Servicios</h2>
            <p>Agenda citas para cualquiera de nuestros servicios odontológicos</p>
          </div>
          
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-item">
                <CheckCircle className="service-icon" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>¿Listo para comenzar?</h2>
              <p>
                Únete a TurnosPlus y experimenta una nueva forma de agendar tus citas dentales. 
                Rápido, fácil y seguro.
              </p>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Registrarse Ahora
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="info">
        <div className="container">
          <div className="info-content">
            <div className="info-text">
              <h2>Clínica Dental SonriPlus</h2>
              <p>
                Somos un consultorio dental privado ubicado en Bucaramanga, Santander, 
                comprometidos con brindar la mejor atención odontológica a nuestros pacientes.
              </p>
              <p>
                Con TurnosPlus, hemos digitalizado nuestro sistema de citas para ofrecerte 
                una experiencia más cómoda y eficiente.
              </p>
            </div>
            
            <div className="info-stats">
              <div className="stat">
                <h3>100+</h3>
                <p>Pacientes Satisfechos</p>
              </div>
              <div className="stat">
                <h3>24/7</h3>
                <p>Disponibilidad Online</p>
              </div>
              <div className="stat">
                <h3>5★</h3>
                <p>Calificación Promedio</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;