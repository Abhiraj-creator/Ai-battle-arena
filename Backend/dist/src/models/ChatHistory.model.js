import mongoose from "mongoose";
const ChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: false },
    battleId: { type: String, required: true, index: true },
    turnIndex: { type: Number, required: true, default: 0 },
    problem: { type: String, required: true },
    solution_1: { type: String, required: true },
    solution_2: { type: String, required: true },
    judge_provider: { type: String, required: true },
    judge: {
        solution_1_score: { type: Number, required: true },
        solution_2_score: { type: Number, required: true },
        solution_1_reasoning: { type: String, required: true },
        solution_2_reasoning: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});
// Compound index: fetch all turns of a battle quickly, sorted by turn order
ChatHistorySchema.index({ battleId: 1, turnIndex: 1 });
export const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);
//# sourceMappingURL=ChatHistory.model.js.map