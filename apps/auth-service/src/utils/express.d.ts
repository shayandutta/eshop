import "express-serve-static-core";

/** Matches Prisma users model so req.user can hold the full account. */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      name: string;
      email: string;
      password: string | null;
      following: string[];
      createdAt: Date;
      updatedAt: Date;
    };
  }
}

export {};