import { NextFunction, Request, Response } from 'express';
import { authService } from '../services';

const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.initiateRegistration(name, email, password);
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
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      response,
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