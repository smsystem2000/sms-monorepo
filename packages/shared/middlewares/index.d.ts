import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        schoolId?: string;
        [key: string]: any;
    };
}

export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;
export type RoleMiddleware = (...allowedRoles: string[]) => AuthMiddleware;

export const checkAuth: AuthMiddleware;
export const Authenticated: AuthMiddleware;
export const authorizeRoles: RoleMiddleware;
export const checkRole: (allowedRoles: string | string[]) => AuthMiddleware;
