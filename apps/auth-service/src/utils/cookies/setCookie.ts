import { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options?: Partial<typeof COOKIE_OPTIONS>
) => {
  res.cookie(name, value, { ...COOKIE_OPTIONS, ...options });
};
