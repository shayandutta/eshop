import { AuthenticationError, ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import { sendOtp, verifyOtp } from '../utils/auth.helper';
import { userRepository } from '../repositories';
import jwt from 'jsonwebtoken';

const authinitiateRegistrationService = 
  /** Initiate registration: check user doesn't exist, send OTP. Middleware handles validation & OTP restrictions. */
  async (
    name: string,
    email: string,
    _password: string,
  ) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User already exists with this email');
    }
    await sendOtp(name, email, 'user-activation-mail');
    return { message: 'OTP sent to your email, please verify your account' };
  }

  /** Complete registration: verify OTP, hash password, create user. */
  const completeRegistration = async (
    email: string,
    otp: string,
    password: string,
    name: string,
  ) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User already exists with this email');
    }

    await verifyOtp(email, otp);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  const loginUser = async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError(
        'User not found with this email. Please register first.',
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password!);
    // console.log(isPasswordCorrect);
    // console.log(password);
    // console.log(user.password);
    if (!isPasswordCorrect) {
      throw new AuthenticationError('Invalid password');
    }

    //generate access token 
    const accessToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '7d' },
    );

    //generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' },
    );

    //store refresh and access tokens in an http only cookie
    // -> in controller

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    };
  }

export default {
  authinitiateRegistrationService,
  completeRegistration,
  loginUser,
};
