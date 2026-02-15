import crypto from 'crypto';
import { ValidationError } from '../../../../packages/error-handler';

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