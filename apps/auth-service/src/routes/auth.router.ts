import {Router} from "express";
import { userRegistration } from "../controllers/auth.controller";

const router: Router = Router();

router.post("/register", userRegistration);

export default router;