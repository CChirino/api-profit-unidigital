import { Router } from "express";
import { requireToken } from "../middlewares/require_token.js";
import { bodyLoginValidator } from "../middlewares/validation_manager.js";
import { index, login } from "../controllers/auth_controller.js";

const router = Router();

router.get("/", index);
router.post("/login", bodyLoginValidator, login);


export default router;