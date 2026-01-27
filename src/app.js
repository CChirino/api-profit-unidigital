import "dotenv/config";  
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/auth_routes.js";
import uniRoutes from './routes/api_uni_routes.js';
import profitRoutes from './routes/api_profit_routes.js'
import processingRoutes from './routes/api_processing_routes.js';
import logRoutes from './routes/api_log_routes.js';
import batchRoutes from './routes/api_batch_routes.js'; 
import { connectDB } from "./db/db.js";
import logger from "./helpers/logger.js";


const app = express();

// --- Middleware ---
// Usamos los analizadores de cuerpo incorporados en Express en lugar de body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- Rutas ---
// Rutas de autenticación y API principal
app.use("/api/v1/", apiRoutes);
// Rutas de Unidigital
app.use('/api/v1/uni/', uniRoutes);
// Rutas de Profit
app.use('/api/v1/profit/', profitRoutes);
// Rutas de Procesamiento
app.use('/api/v1/processing/', processingRoutes);
// Rutas de Logs
app.use('/api/v1/logs/', logRoutes);
// Rutas de Lotes (Batches)
app.use('/api/v1/batches/', batchRoutes);

// --- Función de Arranque del Servidor ---
// Encapsulamos toda la lógica de inicio en una única función asíncrona.
async function startServer() {
    try {
        // 1. Intentar conectar a la base de datos (con la lógica de reintentos que implementamos)
        await connectDB();

        // 2. Iniciar el servidor Express SÓLO DESPUÉS de que la lógica de DB haya terminado.
        const PORT = process.env.PORT || 5000;
        // Usar '0.0.0.0' permite que el servidor sea accesible desde otras máquinas en la red.
        const SERVER_IP = process.env.SERVER_IP || '0.0.0.0'; 

        const server = app.listen(PORT, SERVER_IP, () => {
            // Obtenemos la dirección real en la que está escuchando el servidor
            const address = server.address();
            logger.info(`Servidor iniciado y escuchando en http://${address.address}:${address.port}`);
        });

    } catch (error) {
        logger.error(`Error fatal durante el arranque del servidor: ${error.message}`);
        process.exit(1); // Si algo falla en el arranque, es mejor detener el proceso.
    }
}

// --- Iniciar la aplicación ---
// Llamamos a la función para que comience todo el proceso.
startServer();