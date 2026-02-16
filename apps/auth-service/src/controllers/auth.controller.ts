import { NextFunction, Request, Response } from "express";
import { checkOtpRestrictions, sendOtp, trackOtpRequests, validateRegistrationData } from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";
//register a user
export const userRegistration = async(req:Request, res:Response, next:NextFunction) => {
    try{
        validateRegistrationData(req.body, "user");

        const {name, email} = req.body;
        const existinguser = await prisma.users.findUnique({
            where: {
                email: email
            }
        })
        if(existinguser){
            return next (new ValidationError("User already exists with this email"))
        }
    
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);
        await sendOtp(name, email, "user-activation-mail");
        res.status(200).json({
            message: "OTP sent to your email, please verify your account",
        })
    } catch(error){
        return next(error);
    }
}