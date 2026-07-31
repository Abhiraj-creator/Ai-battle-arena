import mongoose from "mongoose";
const ChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: false },
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
export const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);
//# sourceMappingURL=ChatHistory.model.js.map