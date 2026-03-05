const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAXyi8x14utnVJSgSS8b_X8pjXzQGhIb1E");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("Hola");
    console.log("Success with gemini-1.5-flash-latest:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash-latest:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
  }
}
run();
