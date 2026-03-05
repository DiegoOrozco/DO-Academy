const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAXyi8x14utnVJSgSS8b_X8pjXzQGhIb1E");

async function run() {
  const models = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite", 
    "gemini-3.1-flash-preview",
    "gemini-2.0-flash-lite-001"
  ];

  for (const modelId of models) {
    try {
      console.log(`Testing ${modelId}...`);
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent("Responde solo 'OK'");
      console.log(`Success with ${modelId}:`, result.response.text().trim());
      return;
    } catch (e) {
      console.error(`Failed with ${modelId}:`, e.message);
    }
  }
}
run();
