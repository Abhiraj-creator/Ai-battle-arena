import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import historyRoutes from "./routes/history.routes.js";
import streamRoutes from "./routes/stream.routes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/stream", streamRoutes);
app.get("*splat", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/stream")) {
        next();
        return;
    }
    res.sendFile(path.join(__dirname, "../public/index.html"));
});
export default app;
//# sourceMappingURL=app.js.map