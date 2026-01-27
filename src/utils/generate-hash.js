import crypto from 'crypto';

// --- COLOCA AQUÍ LA CONTRASEÑA QUE QUIERES USAR ---
const myPassword = '!!C.COMM!!AMPI@2023**';

// 1. Generar una "sal" aleatoria y segura
const salt = crypto.randomBytes(16).toString('hex');

// 2. Crear el hash de la contraseña usando la sal
// Usamos HMAC para combinar la sal y la contraseña de forma segura
const hash = crypto.createHmac('sha512', salt).update(myPassword).digest('hex');

console.log('Copia estas líneas en tu archivo .env:\n');
console.log(`API_PASSWORD_SALT=${salt}`);
console.log(`API_PASSWORD_HASH=${hash}`);