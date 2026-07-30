import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Malformed token" });
        }

        const secret = String(process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "default_jwt_secret");
        
        const decoded = jwt.verify(token, secret) as any;
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

export const getOptionalUser = (req: Request): { id: string; email: string; name: string } | null => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return null;
        }

        const secret = String(process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "default_jwt_secret");
        
        const decoded = jwt.verify(token, secret) as any;
        return {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
    } catch (error) {
        return null;
    }
};
