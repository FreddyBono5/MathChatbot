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

// Endpoint for worded requests 
app.post("/api/word-solve", async (req, res) => {
  const { input } = req.body;

  
  if (!input || typeof input !== "string" || input.trim().length < 5) {
    return res.status(400).json({
      error: "Please provide a valid word problem."
    });
  }

  const prompt = `
You are a math tutor.

Solve the following word problem step-by-step.
First convert worded question into an equation, then solve it.
Keep explanations simple and step-by-step.

Word Problem:
${input}

Steps:
`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    const solution =
      data.response ||
      data.message?.content ||
      data.output ||
      null;

    if (!solution) {
      throw new Error("No usable response from Ollama");
    }

    
    await Problem.create({
      question: input,
      solution,
      type: "word" // 🔥 ADD THIS (important for future filtering)
    });

    return res.json({ solution });

  } catch (err) {
    console.error("WORD SOLVE ERROR:", err);

    return res.status(500).json({
      error: "Failed to solve word problem"
    });
  }
});

// Shows problems on sidebar
app.get("/api/problems", async (req, res) => {
    try {
        // Orders the problems on the sidebar by most recent
        const problems = await Problem.find().sort({ createdAt: -1 });
    res.json({ problems });
  } catch (err) {
    console.error("Error retrieving past problems...", err);
    res.status(500).json({ error: err.message });
  }
});

// Allows you to view a previous problem from the sidebar
app.get("/api/problem/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) return res.status(404).json({ error: "Not found" });

        res.json(problem);
    } catch (err) {
        console.error("Error retrieving that problem", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/problem/:id", async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);

        if (!problem) return res.status(404).json({ error: "Not found" });

        res.json({ message: "Problem deleted" });
    } catch (err) {
        console.error("Error deleting problem", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint for clearing history
app.delete("/api/problems", async (req, res) => {
    try {
        await Problem.deleteMany({}); // Deletes every document in the problem collection
        res.json( { message: "Histoy Cleared" });
    } catch (err) {
        console.error("Error clearing history", err);
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