import { NextFunction, Request, Response } from 'express';
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


export default {
  userRegistration,
  verifyUser,
  loginUser
}