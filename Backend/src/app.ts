import express from 'express';
import runGraph from "./ai/graph.ai.js"
import cors from "cors"

const app = express();

//middleware
app.use(express.json())

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
}))

//routes


app.post("/invoke", async (req, res) => {

    const { input } = req.body
    const result = await runGraph(input)

    res.status(200).json({
        message: "Graph executed successfully",
        success: true,
        result
    })

})



export default app;