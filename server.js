// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// ✅ Allow both GitHub Pages and local dev
app.use(cors({
  origin: [
    "https://mariahmanalese-hue.github.io", // GitHub Pages
    "http://127.0.0.1:5500",                // local dev
    "http://localhost:5500"                 // optional local dev
  ]
}));

app.use(express.json());

// LibreTranslate instance (no API key required)
const LIBRE_INSTANCE = "https://translate.fedilab.app/translate";

// Translation proxy route
app.post("/translate", async (req, res) => {
  try {
    const { q, source = "auto", target = "en" } = req.body;
    if (!q) {
      return res.status(400).json({ error: "Missing 'q' text" });
    }

    const response = await fetch(LIBRE_INSTANCE, {
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
      throw new Error("Expected JSON, got HTML");
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
