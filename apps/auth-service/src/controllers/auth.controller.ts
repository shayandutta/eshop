import { NextFunction, Request, Response } from "express";
import { checkOtpRestrictions, sendOtp, trackOtpRequests, validateRegistrationData, verifyOtp } from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
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

//verify user with otp
export const verifyUser = async(req:Request, res:Response, next:NextFunction) => {
    try{
        const {email, otp, password, name} =req.body;
        if(!email || !otp || !password || !name) {
            return next(new ValidationError("Missing required fields"))
        }
        const existingUser = await prisma.users.findUnique({
            where: {
                email: email
            }
        })
        if(existingUser){
            return next(new ValidationError("User already exists with this email"))
        }

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
                data: {
                    name: name,
                    email: email,
                    password: hashedPassword
            }
        })

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })

    }catch(error){

    }
}