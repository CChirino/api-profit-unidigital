import  logger  from "../helpers/logger.js";
import jwt from 'jsonwebtoken';


export const genToken = (Cod_Usuario) => {
    try {
        const expiresIn = process.env.TOKEN_EXPIRE 
        const token = jwt.sign({
            Cod_Usuario: Cod_Usuario
        }, process.env.JWT_SECRET, {expiresIn});
        return {token, expiresIn} 
    } catch (error) {
        logger.error(error)
    }
}