import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { setCookie } from '../utils/cookies/setCookie';
const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.authinitiateRegistrationService(name, email, password);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    const user = await authService.completeRegistration(
      email,
      otp,
      password,
      name
    );
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async(req: Request, res: Response, next: NextFunction) => {
  try{
    const {email, password} = req.body;
    const response = await authService.loginUser(email, password);
    setCookie(res, 'accessToken', response.accessToken);
    setCookie(res, 'refreshToken', response.refreshToken);
    res
    .status(200)
    .json({
      success: true,
      message: "User logged in successfully",
      user: response.id, email: response.email, name: response.name,
    })
  }catch(error){
    next(error);
  }
}

const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const verifyUserForgotPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyForgotPasswordOTP(email, otp);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetUserPassword(email, otp, newPassword);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async(
  req:Request, 
  res:Response, 
  next: NextFunction
) => {
  try{
    const response = await authService.refreshAccessToken(req.cookies.refresh_token);
    setCookie(res, 'accessToken', response.accessToken);
    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    })
  }catch(error){
    next(error);
  }
}


const currentUser = async(req: Request, res: Response, next: NextFunction) => {
  try{
    const user = req.user;
    res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      user,
    })
  }catch(error){
    next(error);
  }
}

export default {
  userRegistration,
  verifyUser,
  loginUser,
  userForgotPassword,
  resetUserPassword,
  verifyUserForgotPasswordOTP,
  refreshAccessToken,
  currentUser
};