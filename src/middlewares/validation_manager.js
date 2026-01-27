import { validationResult, body, param } from "express-validator";

export const validationResultExpress = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
		 // --- INICIO DEL CÓDIGO DE DIAGNÓSTICO ---
        const receivedUser = req.body.user || '';
        console.log(`[DIAGNÓSTICO] Validación fallida. Usuario recibido: "${receivedUser}", Longitud: ${receivedUser.length}`);
        // --- FIN DEL CÓDIGO DE DIAGNÓSTICO ---

		
        return res.status(400). json({ 
            validate: false,
            msg: errors.errors[0].msg 
        })
    }

    next();
};
export const bodyLoginValidator = [
    
    body('user', "El código del usuario debe contener menos de 12 carácteres")
    .trim()
    .notEmpty()
    .isLength({ max: 12 }),
    body('pass', "Formato de password invalido")
    .trim()
    .notEmpty()
    .isLength({ min: 1 }),
    validationResultExpress
]; 