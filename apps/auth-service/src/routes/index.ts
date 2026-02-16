import { Router } from 'express';
import authRouter from './v1/auth.routes';

const v1Router:Router = Router();

v1Router.use('/v1', authRouter);

export default v1Router;