import fetch from "node-fetch";
import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ storage: multer.memoryStorage() });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// OpenRouter endpoint (works inside HF Spaces)
const API_URL = "https://openrouter.ai/api/v1";
const MODEL = "lobehub/gemini-2.0-flash-exp";

// Helper: call OpenRouter chat/completions
async function callOpenRouter(body) {
  const response = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Non-JSON response: " + text.slice(0, 200));
  }

  if (json.error) {
    throw new Error(json.error.message || "Unknown OpenRouter error");
  }

  return json;
}

// ----------------------------
// IMAGE GENERATION
// ----------------------------
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await callOpenRouter({
      model: MODEL,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const parts = result.choices?.[0]?.message?.content || [];
    const imagePart = parts.find(p => p.type === "output_image");

    if (!imagePart?.image_url) {
      return res.status(500).json({
        error: "No image returned",
        details: result,
      });
    }

    const base64 = imagePart.image_url.replace("data:image/png;base64,", "");
    const buffer = Buffer.from(base64, "base64");

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err) {
    res.status(500).json({
      error: "Image generation failed",
      details: err.message,
    });
  }
});

// ----------------------------
// IMAGE EDITING
// ----------------------------
app.post("/edit-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBuffer = req.file.buffer;

    const result = await callOpenRouter({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${imageBuffer.toString("base64")}`
            }
          ]
        }
      ]
    });

    const parts = result.choices?.[0]?.message?.content || [];
    const imagePart = parts.find(p => p.type === "output_image");

    if (!imagePart?.image_url) {
      return res.status(500).json({
        error: "No edited image returned",
        details: result,
      });
    }

    const base64 = imagePart.image_url.replace("data:image/png;base64,", "");
    const buffer = Buffer.from(base64, "base64");

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err) {
    res.status(500).json({
      error: "Image editing failed",
      details: err.message,
    });
  }
});

app.listen(7860, () => {
  console.log("Server running on port 7860");
});
