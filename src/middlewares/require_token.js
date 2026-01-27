import jwt from "jsonwebtoken"
import logger from "../helpers/logger.js";


export const requireToken = (req, res, next) => {
    try {
        let token = req.headers?.authorization;
        if(!token)
            throw new Error("Formato de token inválido")
        token = token.split(" ")[1];
        const user_id = jwt.verify(token, process.env.JWT_SECRET);
        req.user_id = user_id.Cod_Usuario;
        next();
    } catch (error) {
        console.log(error.message);
        logger.error('Auth: ' + error.message)
        return res.status(401).json({
            validate: false,
            msg: error.message,
        })
    }
}