import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gen AI lazily as per Guidelines to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Chat Completion API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { contactName, contactPersonality, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const client = getGeminiClient();
    if (!client) {
      // Graceful fallback for local development or if key is missing
      const lastMsg = messages[messages.length - 1]?.text || "";
      return res.json({
        text: `[Offline Simulation Mode - Please configure GEMINI_API_KEY in Secrets]
I received your message: "${lastMsg}". Because there is no active API key, I am answering in fallback mode! You are chatting with ${contactName}.`,
      });
    }

    // Format chat history to feed into Gemini API.
    // Filter messages to avoid empty parts and format as standard parts.
    // Standardize Gemini's system instruction for personality coaching.
    const systemInstruction = `You are simulated inside a WhatsApp chat web application.
Your name is ${contactName}. You are a contact on WhatsApp.
Your personality profile is: ${contactPersonality}.
Strict rules:
1. Respond exactly in character with the profile.
2. Keep your replies concise, natural, and friendly (usually 1-3 sentences), simulating typing on a real chat app like WhatsApp.
3. Use emojis occasionally to feel human, but do not overdo it.
4. Respond directly to the messages without prefixes. Do not say things like "${contactName}:" or "Assistant:". Represent yourself naturally!`;

    // map historical messages to contents parameter, supporting optional inline image attachments
    const formattedContents = messages.map((m: any) => {
      const parts: any[] = [];
      
      if (m.image) {
        // Parse data URL (e.g. "data:image/png;base64,iVBORw...")
        const match = m.image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      
      // Always add text, even if fallback "See attached image."
      parts.push({ text: m.text || "See attached image." });

      return {
        role: m.sender === "me" ? "user" : "model",
        parts,
      };
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || "No response generated.";
    res.json({ text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

// 2. Avatar Generation API Endpoint using gemini-2.5-flash-image
app.post("/api/generate-avatar", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required to generate an avatar." });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.status(400).json({
        error: "IMAGE GENERATION REQUIRED: GEMINI_API_KEY is not defined. Please add your key in the Secrets panel."
      });
    }

    console.log(`Generating avatar for prompt: "${prompt}"`);

    const result = await client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: `Design a high-quality, neat profile picture icon for: ${prompt}. Clean background, modern, beautiful digital illustration or vector art portrait fit for a chat application.`,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Find the inlineData output chunk representing the image
    let base64Data: string | null = null;
    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Data) {
      return res.status(500).json({ error: "The model returned text but failed to generate an image base64 chunk." });
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
  } catch (error: any) {
    console.error("Error in /api/generate-avatar:", error);
    res.status(500).json({ error: error.message || "Avatar generation failed." });
  }
});

// Setup Vite Development and Static Production middlewares
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
