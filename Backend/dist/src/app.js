import express from 'express';
import runGraph from "./ai/graph.ai.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import { ChatHistory } from "./models/ChatHistory.model.js";
import { User } from "./models/User.model.js";
import { authMiddleware, getOptionalUser } from "./middleware/auth.middleware.js";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "default_jwt_secret";
// Auth API Routes
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing name, email, or password" });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
// Stream endpoint with custom JWT support
app.post("/stream", authMiddleware, async (req, res) => {
    const { input, judge_provider } = req.body;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    let solution1 = "";
    let solution2 = "";
    let judgeResult = null;
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
        // Save history to MongoDB linked to user
        try {
            if (solution1 && solution2) {
                const historyData = {
                    userId: req.user.id,
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
                };
                await ChatHistory.create(historyData);
            }
        }
        catch (dbErr) {
            console.error("Error saving chat history to DB:", dbErr);
        }
    }
    catch (error) {
        console.error("Stream error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
    finally {
        res.end();
    }
});
// History API Routes with authMiddleware protection
app.get("/api/history", authMiddleware, async (req, res) => {
    try {
        const history = await ChatHistory.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    }
    catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: error.message });
    }
});
app.delete("/api/history/:id", authMiddleware, async (req, res) => {
    try {
        await ChatHistory.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error deleting history item:", error);
        res.status(500).json({ error: error.message });
    }
});
// Catch-all route to serve the built frontend app
app.get('*splat', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/stream')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
export default app;
//# sourceMappingURL=app.js.map