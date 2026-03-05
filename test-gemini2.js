const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAXyi8x14utnVJSgSS8b_X8pjXzQGhIb1E");

async function run() {
  const models = [
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-pro-latest"
  ];

  for (const modelId of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent("Hola");
      console.log(`Success with ${modelId}:`, result.response.text());
      return; // Exit on first success
    } catch (e) {
      console.error(`Failed with ${modelId}:`, e.message);
    }
  }
}
run();
