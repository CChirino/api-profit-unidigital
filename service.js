import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual (compatible con ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del servicio
const svc = new Service({
    name: 'ProfitUnidigitalAPI',
    description: 'API de integración entre Profit Plus y Unidigital.',
    // Ruta al script principal de tu aplicación
    script: path.join(__dirname, 'src', 'app.js'),
    // Opciones de Node.js (¡IMPORTANTE para la compatibilidad con SQL Server 2014!)
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096',
        '--tls-min-v1.0' // Flag crucial para la conexión a SQL Server 2014
    ]
});

// --- Lógica para Instalar o Desinstalar ---

// Leer el argumento de la línea de comandos (ej: 'install' o 'uninstall')
const action = process.argv[2];

// Escuchar eventos para dar feedback al usuario
svc.on('install', function () {
    console.log('Servicio instalado correctamente.');
    console.log('Iniciando el servicio...');
    svc.start();
    console.log('El servicio debería estar en ejecución.');
});

svc.on('uninstall', function () {
    console.log('Servicio desinstalado correctamente.');
    console.log('El servicio ya no existe en el sistema.');
});

svc.on('alreadyinstalled', function() {
    console.log('Este servicio ya está instalado.');
});

svc.on('invalidinstallation', function() {
    console.log('Instalación de servicio no válida. Intente desinstalar y volver a instalar.');
});

// Decidir qué acción tomar basado en el flag
switch (action) {
    case 'install':
        console.log('Iniciando proceso de instalación del servicio...');
        svc.install();
        break;

    case 'uninstall':
        console.log('Iniciando proceso de desinstalación del servicio...');
        svc.uninstall();
        break;

    default:
        console.log('Comando no reconocido. Use "install" o "uninstall".');
        console.log('Ejemplo: node .\\install-service.js install');
}