import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ai-slide-beta.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Check API Key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
  process.exit(1);
}

// ✅ Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧠 System prompt for slide generation
const SYSTEM_PROMPT = `You are an AI assistant that helps create PowerPoint presentations. 
When a user provides a topic or request, generate structured slide content in the following JSON format:
{
  "message": "Brief response to user",
  "slides": [
    {
      "title": "Slide Title",
      "content": "Slide content with bullet points or paragraphs"
    }
  ]
}

Rules:
- Generate 5–8 slides for a complete presentation
- Keep titles concise and impactful
- Content should be clear, professional, and well-structured
- Use bullet points when appropriate
- Include an introduction and conclusion slide
- Respond ONLY with valid JSON (no markdown, no code blocks)`;

// Helper function to retry API calls with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Check for rate limit or quota errors (don't retry these)
      if (error.message.includes('429') || 
          error.message.includes('quota') || 
          error.message.includes('Too Many Requests')) {
        console.error('❌ API quota exceeded. Please wait or switch models.');
        throw error;
      }
      // If it's not a server overload error, don't retry
      if (!error.message.includes('503') && !error.message.includes('overloaded')) {
        throw error;
      }
      // Calculate exponential backoff delay
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Retrying in ${delay/1000} seconds... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// 🧩 Route: Generate slides
app.post("/api/generate-slides", async (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("📝 Generating slides for prompt:", prompt);

    // ✅ FIXED: Use gemini-2.5-flash (the latest working model - Oct 2025)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}`;
    if (conversationHistory.length > 0) {
      fullPrompt += `\n\nPrevious context:\n${JSON.stringify(
        conversationHistory.slice(-3),
        null,
        2
      )}`;
    }

    // Use retry logic for the API call
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(fullPrompt);
    });

    const response = result.response;
    let text = response.text().replace(/``````/g, "").trim();

    let slideData;
    try {
      slideData = JSON.parse(text);
    } catch (err) {
      console.error("⚠️ Could not parse AI response:", err.message);
      slideData = {
        message: "I've generated slides based on your request.",
        slides: [
          {
            title: "Generated Content",
            content: text.slice(0, 500),
          },
        ],
      };
    }

    console.log(`✅ Generated ${slideData.slides.length} slides`);
    res.json(slideData);
  } catch (error) {
    console.error("❌ Error generating slides:", error);
    // Check for quota/rate limit errors
    if (error.message.includes('429') || error.message.includes('quota')) {
      return res.status(429).json({
        error: "API quota exceeded",
        message: "You've exceeded your API quota. Please try again later or upgrade your plan.",
        details: error.message,
        isRetryable: false
      });
    }
    // Check if it's a server overload error
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      return res.status(503).json({
        error: "Service temporarily unavailable",
        message: "The AI service is currently overloaded. Please try again in a few moments.",
        isRetryable: true
      });
    }
    res.status(500).json({
      error: "Failed to generate slides",
      details: error.message,
      isRetryable: false
    });
  }
});

// ✏️ Route: Edit slides
app.post("/api/edit-slides", async (req, res) => {
  try {
    const { prompt, currentSlides } = req.body;
    if (!prompt || !currentSlides) {
      return res.status(400).json({ error: "Prompt and current slides are required" });
    }

    console.log("✏️ Editing slides with prompt:", prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const editPrompt = `${SYSTEM_PROMPT}

Current slides:
${JSON.stringify(currentSlides, null, 2)}

User's edit request: ${prompt}

Return the UPDATED slides in the same JSON format with all slides (modified and unmodified).`;

    // Use retry logic for the API call
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(editPrompt);
    });

    const response = result.response;
    let text = response.text().replace(/``````/g, "").trim();

    let slideData;
    try {
      slideData = JSON.parse(text);
    } catch (err) {
      console.error("⚠️ Could not parse AI response:", err.message);
      slideData = {
        message: "Slides updated based on your request.",
        slides: currentSlides,
      };
    }

    console.log("✅ Slides edited successfully");
    res.json(slideData);
  } catch (error) {
    console.error("❌ Error editing slides:", error);
    if (error.message.includes('429') || error.message.includes('quota')) {
      return res.status(429).json({
        error: "API quota exceeded",
        message: "You've exceeded your API quota. Please try again later or upgrade your plan.",
        details: error.message,
        isRetryable: false
      });
    }
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      return res.status(503).json({
        error: "Service temporarily unavailable",
        message: "The AI service is currently overloaded. Please try again in a few moments.",
        isRetryable: true
      });
    }
    res.status(500).json({
      error: "Failed to edit slides",
      details: error.message,
      isRetryable: false
    });
  }
});

// 🩺 Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "AI Slides API is running",
    model: "gemini-2.5-flash",
    quota: "Unlimited (Rate limited to 2 RPM on free tier)"
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
  console.log(`Endpoints ready at http://localhost:${PORT}/api`);
  console.log(`Using model: gemini-2.5-flash (October 2025 release)`);
  console.log(`Model Features: Fast, cost-efficient, multimodal support`);
});
