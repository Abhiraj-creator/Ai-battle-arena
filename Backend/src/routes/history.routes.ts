import { Router } from "express";
import {
    deleteBattle,
    deleteHistoryItem,
    getBattleList,
    getBattleTurns
} from "../controllers/history.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getBattleList);
router.get("/battle/:battleId", getBattleTurns);
router.delete("/battle/:battleId", deleteBattle);
router.delete("/:id", deleteHistoryItem);

export default router;
