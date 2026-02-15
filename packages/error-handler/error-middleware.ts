import { NextFunction, Request, Response } from "express";
import { AppError } from ".";

export const errorMiddlware = (err: Error, req:Request, res:Response, next:NextFunction) => {
    if(err instanceof AppError){
        console.log(`Error: ${req.method} ${req.url} - ${err.message}`)

        return res.status(err.statusCode).json({
            message: err.message,
            statusCode: err.statusCode,
            ...(err.details && {details: err.details}) //include details only if they exist
        })
    }
    console.log("Unhandled error:", err);
    return res.status(500).json({
        message: "Internal server error",
        statusCode: 500,
        isOperational: false
    })
}