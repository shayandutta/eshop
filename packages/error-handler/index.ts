export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(message:string, statusCode:number, isOperational:boolean, details?:any){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this);
    }
}

//not found error
export class NotFoundError extends AppError {
    constructor(message:string = "Resource not found", details?:any){
        super(message, 404, true, details);
    }
}

//validation error
export class ValidationError extends AppError {
    constructor(message:string = "Validation error", details?:any){
        super(message, 400, true, details);
    }
}

//authentication error
export class AuthenticationError extends AppError {
    constructor(message:string = "Authentication error", details?:any){
        super(message, 401, true, details);
    }
}


//forbidden error
export class ForbiddenError extends AppError {
    constructor(message:string = "Forbidden error", details?:any){
        super(message, 403, true, details);
    }
}

//Database error
export class DatabaseError extends AppError {
    constructor(message:string = "Database error", details?:any){
        super(message, 500, true, details);
    }
}

//rate limit error
export class RateLimitError extends AppError {
    constructor(message:string = "Rate limit error", details?:any){
        super(message, 429, true, details);
    }
}