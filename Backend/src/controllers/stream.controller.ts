import type { Response } from "express";
import runGraph from "../ai/graph.ai.js";
import { ChatHistory } from "../models/ChatHistory.model.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const streamBattleTurn = async (req: AuthenticatedRequest, res: Response) => {
    const { input, judge_provider, battleId, turnIndex } = req.body;

    if (!battleId) {
        res.status(400).json({ error: "battleId is required" });
        return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let solution1 = "";
    let solution2 = "";
    let judgeResult: any = null;

    try {
        const stream = await runGraph(input, judge_provider);

        for await (const event of stream) {
            if (event.event === "on_chain_end") {
                const output = event.data?.output;
                if (output?.solution_1) {
                    solution1 = output.solution_1;
                    solution2 = output.solution_2;
                }
                if (output?.judge) {
                    judgeResult = output.judge;
                }
            }
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        try {
            if (solution1 && solution2) {
                await ChatHistory.create({
                    userId: req.user!.id,
                    battleId,
                    turnIndex: turnIndex ?? 0,
                    problem: input,
                    solution_1: solution1,
                    solution_2: solution2,
                    judge_provider,
                    judge: judgeResult || {
                        solution_1_score: 0,
                        solution_2_score: 0,
                        solution_1_reasoning: "N/A",
                        solution_2_reasoning: "N/A"
                    }
                });
            }
        } catch (dbErr) {
            console.error("Error saving chat history to DB:", dbErr);
        }
    } catch (error: any) {
        console.error("Stream error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
        res.end();
    }
};
