import crypto from 'crypto';
import { ValidationError } from '@packages/error-handler';
import { redis } from '@packages/libs/redis';
import { sendEmail } from './send-mail';

export const sendOtp = async (name: string, email: string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    //sending email with otp
    await sendEmail(email, "Verify Your Email", template, {name, otp});
    //save otp against email in redis db
    await redis.set(`otp:${email}`, otp, 'EX', 300) //EX means expire the key after 300 seconds
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60) //cannot send another otp for 60 seconds, i.e., expiry time of 60 seconds

}

export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError('Invalid or expired OTP');
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0', 10);

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800);
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        'Account locked due to multiple failed attempts! Try again after 30 minutes'
      );
    }
    await redis.set(failedAttemptsKey, String(failedAttempts + 1), 'EX', 300);
    throw new ValidationError(
      `Invalid OTP. Please try again. You have ${2 - failedAttempts} attempts left.`
    );
  }

  await redis.del(`otp:${email}`, failedAttemptsKey);
};