const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAXyi8x14utnVJSgSS8b_X8pjXzQGhIb1E");

async function run() {
  try {
    const list = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + (process.env.GOOGLE_AI_API_KEY || "AIzaSyAXyi8x14utnVJSgSS8b_X8pjXzQGhIb1E")).then(r => r.json());
    console.log("Available models:", list.models?.map(m => m.name).join(", "));
  } catch (e) {
    console.error("Failed to list models:", e);
  }
}
run();
