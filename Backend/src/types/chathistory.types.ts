export default interface ChatHistory {
    userId?: string;
    problem: string;
    solution_1: string;
    solution_2: string;
    judge_provider: string;
    judge: {
        solution_1_score: number;
        solution_2_score: number;
        solution_1_reasoning: string;
        solution_2_reasoning: string;
    };
    createdAt?: Date;
}