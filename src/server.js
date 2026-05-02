const path = require("path");
const express = require("express");
const connectDB = require("./config/database");
const Problem = require("./models/problem.model");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post("/api/solve", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { problem } = req.body;

    if (!problem || typeof problem !== "string") {
      return res.status(400).json({ error: "Problem is required." });
    }

    const prompt = `
You are an algebra tutor for early learners.
Explain the solution step-by-step in simple language.

Problem: ${problem}
`;
const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}: ${rawText}`);
    }
    const data = JSON.parse(rawText);
    const solution =
      data.response ||
      data.message?.content ||
      data.output ||
      null;

    if (!solution) {
      throw new Error("No usable response from Ollama");
    }

    await Problem.create({
      question: problem,
      solution
    });

    res.json({ solution });
  } catch (err) {
    console.error("SOLVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
async function warmUpOllama() {
  try {
    await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: "Warm up",
        stream: false
      })
    });
    
  } catch {
    console.log("Ollama skipped");
  }
}
async function startServer() {
  await connectDB();
  await warmUpOllama();
  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}

startServer();