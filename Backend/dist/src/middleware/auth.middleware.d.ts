import type { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const getOptionalUser: (req: Request) => {
    id: string;
    email: string;
    name: string;
} | null;
//# sourceMappingURL=auth.middleware.d.ts.map