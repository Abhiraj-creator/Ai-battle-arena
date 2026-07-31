import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "default_jwt_secret";
const createToken = (user) => jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
const toPublicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email
});
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: "Missing name, email, or password" });
            return;
        }
        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(400).json({ error: "User already exists with this email" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword
        });
        res.status(201).json({
            token: createToken(user),
            user: toPublicUser(user)
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Missing email or password" });
            return;
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(400).json({ error: "Invalid email or password" });
            return;
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(400).json({ error: "Invalid email or password" });
            return;
        }
        res.json({
            token: createToken(user),
            user: toPublicUser(user)
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message });
    }
};
export const getMe = (req, res) => {
    res.json({ user: req.user });
};
//# sourceMappingURL=auth.controller.js.map