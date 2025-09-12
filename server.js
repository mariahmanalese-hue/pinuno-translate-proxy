import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Primary and fallback LibreTranslate instances (no API key required)
const LIBRE_INSTANCES = [
  "https://translate.fedilab.app/translate"
];




async function translateText(q, source, target) {
  let lastError;
  for (const url of LIBRE_INSTANCES) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          q,
          source,
          target,
          format: "text"
        })
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON, got: ${text.slice(0, 200)}...`);
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data; // { translatedText: "..." }
    } catch (err) {
      console.error(`Error with ${url}:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("All translation attempts failed");
}

app.post("/translate", async (req, res) => {
  try {
    const { q, source = "auto", target = "en" } = req.body;
    if (!q) return res.status(400).json({ error: "Missing 'q' text" });

    const response = await fetch("https://translate.fedilab.app/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ q, source, target, format: "text" })
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response from LibreTranslate:", text.slice(0, 200));
      throw new Error(`Expected JSON, got HTML`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



app.get("/", (req, res) => {
  res.send("✅ LibreTranslate Proxy is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
