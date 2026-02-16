import crypto from 'crypto';
import { NextFunction } from 'express';
import { ValidationError } from '@packages/error-handler';
import { redis } from '@packages/libs/redis';
import {sendEmail} from './send-mail';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
    const {name, email, password, phone_number, country} = data;

    if(!name || !email || !password ||(userType === "seller" && (!phone_number || !country))) {
        throw new ValidationError(`Missing required fields for ${userType} registration`)
    }

    if(!emailRegex.test(email)) {
        throw new ValidationError("Invalid email address")
    }
}


//check if the user has been locked out of the system due to multiple failed attempts
//check if the user has been locked out of the system due to too many otp requests
//check if the user is on cooldown period and cannot request another otp
export const checkOtpRestrictions = async (email:string, next:NextFunction) => {
    if(await redis.get(`otp_lock:${email}`)){
        return next(
            new ValidationError(
                "Account locked due to multiple failed attempts! Try again after 30 minutes"
            ),
        )
    }
    if(await redis.get(`otp_spam_lock:${email}`)){
        return next(
            new ValidationError(
                "Too many otp requests! Please wait for an hour before trying again"
            )
        )
    }
    if(await redis.get(`otp_cooldown:${email}`)){
        return next(
            new ValidationError(
                "Please wait for 60 seconds before requesting another OTP"
            )
        )
    }
}

export const trackOtpRequests = async (email:string, next:NextFunction) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');

    if(otpRequests >= 2){
        await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600) //locked for 1 hour
        return next(
            new ValidationError(
                "Too many otp requests! Please wait for an hour before trying again"
            )
        )
    }
    await redis.set(otpRequestKey, otpRequests+1, 'EX', 3600) //tracking requests for 1 hour
}

export const sendOtp = async (name: string, email: string, template:string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    //sending email with otp
    await sendEmail(email, "Verify Your Email", template, {name, otp});
    //save otp against email in redis db
    await redis.set(`otp:${email}`, otp, 'EX', 300) //EX means expire the key after 300 seconds
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60) //cannot send another otp for 60 seconds, i.e., expiry time of 60 seconds
};

export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    throw new ValidationError('Invalid or expired OTP');
  }
  await redis.del(`otp:${email}`);
};