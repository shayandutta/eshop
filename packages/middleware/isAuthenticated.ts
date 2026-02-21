import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '@packages/libs/prisma';
import { ValidationError } from '@packages/error-handler';

const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
      const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
  
      if(!token){
        return res.status(401).json({ success: false, message: 'Authentication token missing' });
      }
  
      //verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {id:string, role:"user" | "seller"};
      if(!decoded){
        return res.status(401).json({success: false, message: 'Invalid authentication token' });
      }
      const account = await prisma.users.findUnique({ where: { id: decoded.id } });
  
      if(!account){
        return res.status(404).json({success: false, message: 'User not found'});
      }
  
      req.user = account;
      return next();
  
    }catch(error){
      return next(new ValidationError('Invalid authentication token'));
    }
  }

  export default isAuthenticated;