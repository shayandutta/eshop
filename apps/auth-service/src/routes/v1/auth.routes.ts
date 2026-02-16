import { Router } from 'express';
import { authController } from '../../controllers';
import { authMiddleware } from '../../middleware';

const authRouter: Router = Router();

authRouter.post(
  '/register',
  authMiddleware.validateRegistration,
  authMiddleware.checkOtpRestrictions,
  authMiddleware.trackOtpRequests,
  authController.userRegistration,
);
authRouter.post(
  '/verify',
  authMiddleware.validateVerifyBody,
  authController.verifyUser,
);
authRouter.post('/login', authMiddleware.validateLoginBody, authController.loginUser);
export default authRouter;
