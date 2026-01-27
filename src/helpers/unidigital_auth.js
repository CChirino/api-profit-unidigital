import axios from 'axios';
import crypto from 'crypto';
import logger from "./logger.js";

let unidigitalCache = null;

const saveCache = (cacheData) => {
  unidigitalCache = cacheData;
  logger.info('Token, series y templates de Unidigital guardados en la caché.');
};

const loadCache = () => {
  return unidigitalCache;
};

const isTokenExpired = (tokenData) => {
  if (!tokenData || !tokenData.exp) return true;
  const bufferSeconds = 60;
  const expirationTimeInMs = (tokenData.exp - bufferSeconds) * 1000;
  return Date.now() >= expirationTimeInMs;
};

const getUnidigitalToken = async () => {
    const cache = loadCache();

    if (cache && cache.tokenData && !isTokenExpired(cache.tokenData)) {
        logger.info('Usando token de Unidigital almacenado en memoria.');
        return cache.tokenData;
    }

    logger.info('Datos de Unidigital no válidos o expirados. Solicitando nuevos...');
    try {
        const plainPassword = process.env.UNIDIGITAL_PASSWORD;
        const hashedPassword = crypto.createHash('sha512').update(plainPassword).digest('hex');

        const response = await axios.post(`${process.env.UNIDIGITAL_BASE_URL}/user/login`, {
            UserName: process.env.UNIDIGITAL_USER,
            Password: hashedPassword
        });

        const jwt = response.data.accessToken;
        if (!jwt) throw new Error('La respuesta de la API no contenía un token.');

        const series = response.data.series || [];
        const templates = response.data.templates || [];

        const payloadBase64 = jwt.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('ascii');
        const payload = JSON.parse(payloadJson);

        const tokenData = { token: jwt, exp: payload.exp };

        saveCache({
            tokenData: tokenData,
            seriesData: series,
            templatesData: templates 
        });
       
        return tokenData;

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Error al iniciar sesión en Unidigital: ${errorMessage}`);
        throw new Error(`Fallo en la autenticación con Unidigital: ${errorMessage}`);
    }
};

/**
 * Crea una instancia de Axios pre-configurada para hacer llamadas a la API de Unidigital.
 * @returns {Promise<import('axios').AxiosInstance>} Una instancia de Axios lista para usar.
 */
export const createUnidigitalApiInstance = async () => {
  try {
      // Se asegura de que el token exista y sea válido
      const tokenData = await getUnidigitalToken();
      
      // Crea y configura la instancia de Axios
      const api = axios.create({
          baseURL: process.env.UNIDIGITAL_BASE_URL,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.token}`
          }
      });
      // Devuelve la instancia lista para ser usada
      return api;
  } catch (error) {
      logger.error(`No se pudo crear la instancia de la API de Unidigital: ${error.message}`);
      throw error;
  }
};

// --- FUNCIONES EXPORTADAS PARA OBTENER DATOS DE LA CACHÉ ---
const getAuthCache = async () => {
    await getUnidigitalToken(); // Asegura que la sesión esté activa
    return loadCache();
};

export const getUnidigitalSeries = async () => {
    const cache = await getAuthCache();
    return cache ? cache.seriesData : [];
};

export const getUnidigitalTemplates = async () => {
    const cache = await getAuthCache();
    return cache ? cache.templatesData : [];
};