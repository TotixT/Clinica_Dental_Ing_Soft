const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Configurar eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose desconectado de MongoDB');
    });

    // Cerrar conexión cuando la aplicación termine
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Conexión MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;