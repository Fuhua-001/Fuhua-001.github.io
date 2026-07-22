/**
 * @file ai.js
 * @description กำหนดค่า (Config) และเรียกใช้งาน Google Gemini API
 */

require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

let ai;
try {
  if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your_api_key_here"
  ) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.log("Gemini API key not configured properly.");
}

/**
 * Instance ของ Google GenAI
 * หากไม่พบ API Key จะมีค่าเป็น undefined
 */
module.exports = ai;
