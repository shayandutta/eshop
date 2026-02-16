import {Router} from "express";
import { userRegistration, verifyUser } from "../controllers/auth.controller";

const router: Router = Router();

router.post("/register", userRegistration);
router.post('/verify', verifyUser);

export default router;