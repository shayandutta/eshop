import { Router } from 'express';
import { authController } from '../../controllers';
import { authMiddleware } from '../../middleware';
import isAuthenticated from '@packages/middleware/isAuthenticated';

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
authRouter.post(
  '/login',
  authMiddleware.validateLoginBody,
  authController.loginUser,
);

authRouter.post(
  '/forgot-password',
  authMiddleware.validateForgotPasswordBody,
  authMiddleware.checkOtpRestrictions,
  authMiddleware.trackOtpRequests,
  authController.userForgotPassword,
);

authRouter.post(
  '/reset-password',
  authMiddleware.validateResetPasswordBody,
  authController.resetUserPassword,
);

authRouter.post(
  '/verify-forgot-password-otp',
  authMiddleware.validateVerifyForgotPasswordOTPBody,
  authController.verifyUserForgotPasswordOTP,
);

//refresh token route
authRouter.post('/refresh-token', authController.refreshAccessToken);
export default authRouter;


//protected routes
authRouter.get('/current-user', isAuthenticated, authController.currentUser);