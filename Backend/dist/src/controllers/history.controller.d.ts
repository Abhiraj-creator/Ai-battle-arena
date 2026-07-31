import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
export declare const getBattleList: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getBattleTurns: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteBattle: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteHistoryItem: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=history.controller.d.ts.map