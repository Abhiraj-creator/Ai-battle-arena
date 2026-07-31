import type { Response } from "express";
import { ChatHistory } from "../models/ChatHistory.model.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getBattleList = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const battles = await ChatHistory.aggregate([
            { $match: { userId: req.user!.id } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$battleId",
                    firstProblem: { $first: "$problem" },
                    turnCount: { $sum: 1 },
                    lastActivity: { $max: "$createdAt" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            { $sort: { lastActivity: -1 } },
            {
                $project: {
                    _id: 0,
                    battleId: "$_id",
                    firstProblem: 1,
                    turnCount: 1,
                    lastActivity: 1,
                    createdAt: 1
                }
            }
        ]);
        res.json(battles);
    } catch (error: any) {
        console.error("Error fetching battle history:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getBattleTurns = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const battleId = String(req.params.battleId);
        const turns = await ChatHistory.find({
            battleId,
            userId: req.user!.id
        }).sort({ turnIndex: 1 });
        res.json(turns);
    } catch (error: any) {
        console.error("Error fetching battle turns:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteBattle = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const battleId = String(req.params.battleId);
        await ChatHistory.deleteMany({ battleId, userId: req.user!.id });
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting battle:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteHistoryItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const historyId = String(req.params.id);
        await ChatHistory.deleteOne({ _id: historyId, userId: req.user!.id });
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting history item:", error);
        res.status(500).json({ error: error.message });
    }
};
