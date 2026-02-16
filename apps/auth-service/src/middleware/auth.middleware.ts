import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@packages/error-handler';
import { redis } from '@packages/libs/redis';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate registration body (name, email, password). Calls next(error) on failure. */
const validateRegistration = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;
  //validate required fields
  if (!name || !email || !password) {
    return next(new ValidationError('Missing required fields for registration'));
  }

  //validate email address
  if (!emailRegex.test(email)) {
    return next(new ValidationError('Invalid email address'));
  }
  next();
};

/** Validate verify body (email, otp, password, name). */
const validateVerifyBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { email, otp, password, name } = req.body;
  if (!email || !otp || !password || !name) {
    return next(new ValidationError('Missing required fields'));
  }
  next();
};

/** Check if email is restricted (lock, spam, cooldown). Calls next(error) if restricted. */
const checkOtpRestrictions = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        'Account locked due to multiple failed attempts! Try again after 30 minutes'
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP requests! Please wait an hour before trying again'
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError('Please wait 60 seconds before requesting another OTP')
    );
  }
  next();
};

/** Track OTP request count. Calls next(error) if over limit. */
const trackOtpRequests = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  const otpRequestKey = `otp_request_count:${email}`;
  const count = parseInt((await redis.get(otpRequestKey)) || '0', 10);

  if (count >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    return next(
      new ValidationError(
        'Too many OTP requests! Please wait an hour before trying again'
      )
    );
  }
  await redis.set(otpRequestKey, String(count + 1), 'EX', 3600);
  next();
};


export default {
  validateRegistration,
  validateVerifyBody,
  checkOtpRestrictions,
  trackOtpRequests,
}