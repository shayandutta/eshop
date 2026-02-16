import { Router } from 'express';
import authRoutes from './v1/auth.routes';

const v1routes: Router = Router();
v1routes.use('/v1', authRoutes);

export default v1routes;
