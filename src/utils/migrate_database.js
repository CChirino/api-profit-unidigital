import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'; 
import { fileURLToPath } from 'url'; // <-- AÑADIR ESTA LÍNEA
import { getPool, connectDB } from '../db/db.js';

// Definimos __dirname para que funcione con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
    try {
        console.log('Iniciando conexión a la base de datos...');
        await connectDB();
        const pool = getPool();
        
        // Ahora __dirname está definido y esta ruta será correcta
        const migrationsDir = path.join(__dirname, '../db/migrations');
        const files = await fs.readdir(migrationsDir);

        // Ordenar los archivos numéricamente
        files.sort();

        console.log('Iniciando ejecución de migraciones...');
        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`- Ejecutando ${file}...`);
                const script = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
                // SQL Server puede ejecutar múltiples lotes separados por GO
                const batches = script.split(/\n\s*GO\s*/i);
                for (const batch of batches) {
                    if (batch.trim()) {
                        await pool.request().batch(batch);
                    }
                }
                console.log(`  ... ${file} completado.`);
            }
        }
        console.log('¡Todas las migraciones se han ejecutado exitosamente!');

    } catch (error) {
        console.error('¡ERROR DURANTE LA MIGRACIÓN!', error);
        process.exit(1);
    } finally {
        // Cierra el pool si es necesario, o deja que la app principal lo gestione
        // Para un script de migración, es buena idea cerrar el pool al final.
        const pool = getPool();
        if (pool) {
            await pool.close();
            console.log('Pool de conexiones cerrado.');
        }
    }
}

runMigrations();